import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TreeModule } from 'primeng/tree';
import { TreeTableModule } from 'primeng/treetable';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { TreeNode } from 'primeng/api';
import { PayrollPreview } from '../services/salary-calculation.service';
import { SalaryCalculationService } from '../services/salary-calculation.service';

@Component({
  selector: 'app-payroll-preview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TreeModule,
    TreeTableModule,
    ButtonModule,
    DialogModule,
    TagModule
  ],
  template: `
    <p-dialog 
      header="Vista Previa de Nómina" 
      [(visible)]="visible" 
      [modal]="true" 
      [closable]="true"
      [style]="{ width: '90vw', height: '80vh' }"
      [maximizable]="true">
      
      <div class="grid">
        <!-- Resumen General -->
        <div class="col-12">
          <div class="card">
            <h5>Resumen General</h5>
            <div class="grid">
              <div class="col-3">
                <div class="text-center">
                  <div class="text-2xl font-bold text-primary">{{ totalEmployees }}</div>
                  <div class="text-sm text-600">Empleados</div>
                </div>
              </div>
              <div class="col-3">
                <div class="text-center">
                  <div class="text-2xl font-bold text-green-600">${{ totalAmount | number:'1.2-2' }}</div>
                  <div class="text-sm text-600">Total a Pagar</div>
                </div>
              </div>
              <div class="col-3">
                <div class="text-center">
                  <div class="text-2xl font-bold text-orange-600">${{ totalBaseSalary | number:'1.2-2' }}</div>
                  <div class="text-sm text-600">Salarios Base</div>
                </div>
              </div>
              <div class="col-3">
                <div class="text-center">
                  <div class="text-2xl font-bold text-blue-600">${{ totalWorkOrders | number:'1.2-2' }}</div>
                  <div class="text-sm text-600">Órdenes de Trabajo</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Detalle por Empleado -->
        <div class="col-12">
          <div class="card">
            <h5>Detalle por Empleado</h5>
            <p-treetable 
              [value]="treeData" 
              [columns]="columns" 
              dataKey="key"
              [scrollable]="true" 
              [tableStyle]="{ 'min-width': '100%' }"
              [expandedKeys]="expandedKeys"
              [selectionKeys]="selectedKeys"
              selectionMode="checkbox">
              
              <ng-template #header let-columns>
                <tr>
                  <th *ngFor="let col of columns" [style]="col.style">
                    {{ col.header }}
                  </th>
                </tr>
              </ng-template>
              
              <ng-template #body let-rowNode let-rowData="rowData" let-columns="columns">
                <tr [ttRow]="rowNode" [ttSelectableRow]="rowNode">
                  <td *ngFor="let col of columns; let i = index" [style]="col.style">
                    <span class="flex items-center gap-2">
                      <p-treeTableToggler [rowNode]="rowNode" *ngIf="i === 0" />
                      <p-treeTableCheckbox [value]="rowNode" *ngIf="i === 0" />
                      <span [ngSwitch]="col.field">
                        <span *ngSwitchCase="'employeeName'">
                          <div class="font-semibold">{{ rowData[col.field] }}</div>
                          <div class="text-sm text-600">{{ rowData.position }}</div>
                        </span>
                        <span *ngSwitchCase="'paymentPeriod'">
                          <p-tag 
                            [value]="salaryCalculationService.getPaymentPeriodDescription(rowData[col.field])"
                            [severity]="getPeriodSeverity(rowData[col.field])">
                          </p-tag>
                        </span>
                        <span *ngSwitchCase="'baseSalary'">
                          ${{ rowData[col.field] | number:'1.2-2' }}
                        </span>
                        <span *ngSwitchCase="'calculatedAmount'">
                          ${{ rowData[col.field] | number:'1.2-2' }}
                        </span>
                        <span *ngSwitchCase="'workOrdersTotal'">
                          ${{ rowData[col.field] | number:'1.2-2' }}
                        </span>
                        <span *ngSwitchCase="'totalAmount'">
                          <div class="font-bold text-lg">${{ rowData[col.field] | number:'1.2-2' }}</div>
                        </span>
                        <span *ngSwitchCase="'periodDays'">
                          {{ rowData[col.field] }} días
                        </span>
                        <span *ngSwitchCase="'dailyRate'">
                          ${{ rowData[col.field] | number:'1.2-2' }}/día
                        </span>
                        <span *ngSwitchDefault>
                          {{ rowData[col.field] }}
                        </span>
                      </span>
                    </span>
                  </td>
                </tr>
              </ng-template>
            </p-treetable>
          </div>
        </div>
      </div>

      <ng-template #footer>
        <div class="flex justify-content-end gap-2">
          <p-button 
            label="Cancelar" 
            icon="pi pi-times" 
            [text]="true" 
            (onClick)="onCancel()">
          </p-button>
          <p-button 
            label="Guardar Nómina" 
            icon="pi pi-check" 
            (onClick)="onSave()"
            [disabled]="selectedEmployees.length === 0">
          </p-button>
        </div>
      </ng-template>
    </p-dialog>
  `
})
export class PayrollPreviewComponent implements OnInit {
  @Input() visible = signal(false);
  @Input() payrollData: PayrollPreview[] = [];
  @Input() startDate: Date = new Date();
  @Input() endDate: Date = new Date();
  @Input() notes: string = '';

  @Output() save = new EventEmitter<PayrollPreview[]>();
  @Output() cancel = new EventEmitter<void>();

  treeData: TreeNode[] = [];
  columns: any[] = [];
  expandedKeys: { [key: string]: boolean } = {};
  selectedKeys: { [key: string]: boolean } = {};

  selectedEmployees: PayrollPreview[] = [];

  constructor(public salaryCalculationService: SalaryCalculationService) {}

  ngOnInit() {
    this.setupColumns();
    this.buildTreeData();
    this.calculateTotals();
  }

  private setupColumns() {
    this.columns = [
      { field: 'employeeName', header: 'Empleado', style: { 'min-width': '200px' } },
      { field: 'paymentPeriod', header: 'Período', style: { 'min-width': '120px' } },
      { field: 'baseSalary', header: 'Salario Base', style: { 'min-width': '120px' } },
      { field: 'calculatedAmount', header: 'Calculado', style: { 'min-width': '120px' } },
      { field: 'workOrdersTotal', header: 'Órdenes', style: { 'min-width': '120px' } },
      { field: 'totalAmount', header: 'Total', style: { 'min-width': '120px' } },
      { field: 'periodDays', header: 'Días', style: { 'min-width': '80px' } },
      { field: 'dailyRate', header: 'Tasa Diaria', style: { 'min-width': '120px' } }
    ];
  }

  private buildTreeData() {
    this.treeData = this.payrollData.map((payroll, index) => ({
      key: 'employee-' + payroll.employeeId,
      data: {
        employeeName: payroll.employeeName,
        position: payroll.position,
        paymentPeriod: payroll.paymentPeriod,
        baseSalary: payroll.baseSalary,
        calculatedAmount: payroll.calculatedAmount,
        workOrdersTotal: payroll.workOrdersTotal,
        totalAmount: payroll.totalAmount,
        periodDays: payroll.periodDays,
        dailyRate: payroll.dailyRate
      },
      children: this.buildEmployeeDetails(payroll)
    }));

    // Expandir todos los nodos por defecto
    this.expandedKeys = {};
    this.treeData.forEach(node => {
      this.expandedKeys[node.key!] = true;
    });
  }

  private buildEmployeeDetails(payroll: PayrollPreview): TreeNode[] {
    return [
      {
        key: 'details-' + payroll.employeeId,
        data: {
          employeeName: 'Detalles del Cálculo',
          position: '',
          paymentPeriod: '',
          baseSalary: 0,
          calculatedAmount: 0,
          workOrdersTotal: 0,
          totalAmount: 0,
          periodDays: 0,
          dailyRate: 0
        },
        children: [
          {
            key: 'calculation-' + payroll.employeeId,
            data: {
              employeeName: 'Período: ' + this.salaryCalculationService.getPaymentPeriodDescription(payroll.paymentPeriod),
              position: '',
              paymentPeriod: '',
              baseSalary: 0,
              calculatedAmount: 0,
              workOrdersTotal: 0,
              totalAmount: 0,
              periodDays: 0,
              dailyRate: 0
            }
          },
          {
            key: 'formula-' + payroll.employeeId,
            data: {
              employeeName: `Fórmula: $${payroll.baseSalary} ÷ ${this.getPeriodDays(payroll.paymentPeriod)} × ${payroll.periodDays} días`,
              position: '',
              paymentPeriod: '',
              baseSalary: 0,
              calculatedAmount: 0,
              workOrdersTotal: 0,
              totalAmount: 0,
              periodDays: 0,
              dailyRate: 0
            }
          }
        ]
      }
    ];
  }

  private getPeriodDays(paymentPeriod: string): number {
    const days = {
      'Daily': 1,
      'Weekly': 7,
      'Biweekly': 14,
      'Monthly': 30,
      'Quarterly': 90,
      'Annually': 365
    };
    return days[paymentPeriod as keyof typeof days] || 30;
  }

  private calculateTotals() {
    this.totalEmployees = this.payrollData.length;
    this.totalAmount = this.payrollData.reduce((sum, payroll) => sum + payroll.totalAmount, 0);
    this.totalBaseSalary = this.payrollData.reduce((sum, payroll) => sum + payroll.baseSalary, 0);
    this.totalWorkOrders = this.payrollData.reduce((sum, payroll) => sum + payroll.workOrdersTotal, 0);
  }

  getPeriodSeverity(paymentPeriod: string): string {
    const severities = {
      'Daily': 'info',
      'Weekly': 'success',
      'Biweekly': 'warning',
      'Monthly': 'primary',
      'Quarterly': 'secondary',
      'Annually': 'danger'
    };
    return severities[paymentPeriod as keyof typeof severities] || 'primary';
  }

  onSave() {
    this.save.emit(this.payrollData);
  }

  onCancel() {
    this.cancel.emit();
  }

  // Getters para el template
  get totalEmployees(): number {
    return this.payrollData.length;
  }

  get totalAmount(): number {
    return this.payrollData.reduce((sum, payroll) => sum + payroll.totalAmount, 0);
  }

  get totalBaseSalary(): number {
    return this.payrollData.reduce((sum, payroll) => sum + payroll.baseSalary, 0);
  }

  get totalWorkOrders(): number {
    return this.payrollData.reduce((sum, payroll) => sum + payroll.workOrdersTotal, 0);
  }
}
