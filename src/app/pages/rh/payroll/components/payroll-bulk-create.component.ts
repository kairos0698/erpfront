import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
// import { CalendarModule } from 'primeng/calendar'; // No disponible en esta versión
import { CheckboxModule } from 'primeng/checkbox';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { EmployeeService } from '../../employee/services/employee.service';
import { EmployeeResponseDto, PaymentPeriod, PAYMENT_PERIOD_OPTIONS } from '../../employee/models/employee.model';
import { SalaryCalculationService, PayrollPreview } from '../services/salary-calculation.service';
import { PayrollPreviewComponent } from './payroll-preview.component';
import { PayrollService } from '../services/payroll.service';

interface EmployeeSelection {
  employee: EmployeeResponseDto;
  selected: boolean;
}

@Component({
  selector: 'app-payroll-bulk-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    // CalendarModule, // No disponible en esta versión
    CheckboxModule,
    TableModule,
    TagModule,
    ToastModule,
    PayrollPreviewComponent
  ],
  template: `
    <p-toast></p-toast>
    
    <p-dialog 
      header="Crear Nómina Masiva" 
      [(visible)]="visible" 
      [modal]="true" 
      [closable]="true"
      [style]="{ width: '95vw', height: '90vh' }"
      [maximizable]="true">
      
      <div class="grid">
        <!-- Configuración del Período -->
        <div class="col-12">
          <div class="card">
            <h5>Configuración del Período de Pago</h5>
            <div class="grid">
              <div class="col-6">
                <label class="block font-bold mb-2">Fecha Inicial *</label>
                <input 
                  type="date" 
                  pInputText 
                  [(ngModel)]="startDate" 
                  placeholder="Seleccionar fecha inicial"
                  fluid>
              </div>
              <div class="col-6">
                <label class="block font-bold mb-2">Fecha Final *</label>
                <input 
                  type="date" 
                  pInputText 
                  [(ngModel)]="endDate" 
                  placeholder="Seleccionar fecha final"
                  fluid>
              </div>
            </div>
            <div class="mt-3">
              <label class="block font-bold mb-2">Notas</label>
              <textarea 
                pTextarea 
                [(ngModel)]="notes" 
                rows="3" 
                placeholder="Notas adicionales sobre la nómina..."
                fluid>
              </textarea>
            </div>
          </div>
        </div>

        <!-- Selección de Empleados -->
        <div class="col-12">
          <div class="card">
            <div class="flex justify-content-between align-items-center mb-3">
              <h5>Selección de Empleados</h5>
              <div class="flex gap-2">
                <p-button 
                  label="Seleccionar Todos" 
                  icon="pi pi-check" 
                  size="small"
                  (onClick)="selectAllEmployees()">
                </p-button>
                <p-button 
                  label="Deseleccionar Todos" 
                  icon="pi pi-times" 
                  size="small"
                  severity="secondary"
                  (onClick)="deselectAllEmployees()">
                </p-button>
                <p-button 
                  label="Calcular Nómina" 
                  icon="pi pi-calculator" 
                  size="small"
                  severity="success"
                  (onClick)="calculatePayroll()"
                  [disabled]="selectedEmployees.length === 0">
                </p-button>
              </div>
            </div>

            <p-table 
              [value]="employeeSelections" 
              [paginator]="true" 
              [rows]="10"
              [showCurrentPageReport]="true"
              currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} empleados"
              [rowsPerPageOptions]="[5,10,25]"
              [tableStyle]="{ 'min-width': '50rem' }">
              
              <ng-template #header>
                <tr>
                  <th style="width: 3rem">
                    <p-checkbox 
                      [(ngModel)]="selectAll" 
                      (onChange)="toggleSelectAll($event)"
                      [binary]="true">
                    </p-checkbox>
                  </th>
                  <th>Empleado</th>
                  <th>Posición</th>
                  <th>Salario</th>
                  <th>Período de Pago</th>
                  <th>Fecha de Contratación</th>
                </tr>
              </ng-template>
              
              <ng-template #body let-employeeSelection>
                <tr>
                  <td>
                    <p-checkbox 
                      [(ngModel)]="employeeSelection.selected" 
                      (onChange)="onEmployeeSelectionChange()"
                      [binary]="true">
                    </p-checkbox>
                  </td>
                  <td>
                    <div class="font-semibold">{{ employeeSelection.employee.firstName }} {{ employeeSelection.employee.lastName }}</div>
                    <div class="text-sm text-600">{{ employeeSelection.employee.email }}</div>
                  </td>
                  <td>{{ employeeSelection.employee.positionName || 'Sin posición' }}</td>
                  <td class="font-semibold">${{ employeeSelection.employee.salary | number:'1.2-2' }}</td>
                  <td>
                    <p-tag 
                      [value]="getPaymentPeriodDescription(employeeSelection.employee.paymentPeriod)"
                      [severity]="getPaymentPeriodSeverity(employeeSelection.employee.paymentPeriod)">
                    </p-tag>
                  </td>
                  <td>{{ employeeSelection.employee.hireDate | date:'dd/MM/yyyy' }}</td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </div>

        <!-- Resumen de Selección -->
        <div class="col-12" *ngIf="selectedEmployees.length > 0">
          <div class="card">
            <h5>Resumen de Selección</h5>
            <div class="grid">
              <div class="col-3">
                <div class="text-center">
                  <div class="text-2xl font-bold text-primary">{{ selectedEmployees.length }}</div>
                  <div class="text-sm text-600">Empleados Seleccionados</div>
                </div>
              </div>
              <div class="col-3">
                <div class="text-center">
                  <div class="text-2xl font-bold text-green-600">${{ getTotalBaseSalary() | number:'1.2-2' }}</div>
                  <div class="text-sm text-600">Salario Base Total</div>
                </div>
              </div>
              <div class="col-3">
                <div class="text-center">
                  <div class="text-2xl font-bold text-orange-600">{{ getPeriodDays() }}</div>
                  <div class="text-sm text-600">Días del Período</div>
                </div>
              </div>
              <div class="col-3">
                <div class="text-center">
                  <div class="text-2xl font-bold text-blue-600">${{ getEstimatedTotal() | number:'1.2-2' }}</div>
                  <div class="text-sm text-600">Total Estimado</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ng-template #footer>
        <div class="flex justify-content-between">
          <p-button 
            label="Cancelar" 
            icon="pi pi-times" 
            [text]="true" 
            (onClick)="onCancel()">
          </p-button>
          <div class="flex gap-2">
            <p-button 
              label="Vista Previa" 
              icon="pi pi-eye" 
              severity="info"
              (onClick)="showPreview()"
              [disabled]="payrollPreviews.length === 0">
            </p-button>
            <p-button 
              label="Crear Nóminas" 
              icon="pi pi-check" 
              severity="success"
              (onClick)="createPayrolls()"
              [disabled]="payrollPreviews.length === 0">
            </p-button>
          </div>
        </div>
      </ng-template>
    </p-dialog>

    <!-- Componente de Vista Previa -->
    <app-payroll-preview 
      [(visible)]="previewVisible"
      [payrollData]="payrollPreviews"
      [startDate]="startDate"
      [endDate]="endDate"
      [notes]="notes"
      (save)="onPreviewSave($event)"
      (cancel)="onPreviewCancel()">
    </app-payroll-preview>
  `
})
export class PayrollBulkCreateComponent implements OnInit {
  visible = signal(false);
  
  // Configuración del período
  startDate: Date = new Date();
  endDate: Date = new Date();
  notes: string = '';

  // Empleados
  employees: EmployeeResponseDto[] = [];
  employeeSelections: EmployeeSelection[] = [];
  selectedEmployees: EmployeeResponseDto[] = [];
  selectAll: boolean = false;

  // Cálculos
  payrollPreviews: PayrollPreview[] = [];
  previewVisible = signal(false);

  constructor(
    private employeeService: EmployeeService,
    private salaryCalculationService: SalaryCalculationService,
    private payrollService: PayrollService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadEmployees();
    this.initializeDates();
  }

  private initializeDates() {
    const today = new Date();
    this.startDate = new Date(today.getFullYear(), today.getMonth(), 1); // Primer día del mes
    this.endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Último día del mes
  }

  private async loadEmployees() {
    try {
      const response = await this.employeeService.getAll().toPromise();
      if (response?.success) {
        this.employees = response.data;
        this.employeeSelections = this.employees.map(employee => ({
          employee,
          selected: false
        }));
      }
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar empleados'
      });
    }
  }

  selectAllEmployees() {
    this.employeeSelections.forEach(selection => {
      selection.selected = true;
    });
    this.selectAll = true;
    this.updateSelectedEmployees();
  }

  deselectAllEmployees() {
    this.employeeSelections.forEach(selection => {
      selection.selected = false;
    });
    this.selectAll = false;
    this.updateSelectedEmployees();
  }

  toggleSelectAll(event: any) {
    const isChecked = event.checked;
    this.employeeSelections.forEach(selection => {
      selection.selected = isChecked;
    });
    this.updateSelectedEmployees();
  }

  onEmployeeSelectionChange() {
    this.updateSelectedEmployees();
    this.selectAll = this.employeeSelections.every(selection => selection.selected);
  }

  private updateSelectedEmployees() {
    this.selectedEmployees = this.employeeSelections
      .filter(selection => selection.selected)
      .map(selection => selection.employee);
  }

  calculatePayroll() {
    if (this.selectedEmployees.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Seleccione al menos un empleado'
      });
      return;
    }

    if (!this.startDate || !this.endDate) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Seleccione las fechas del período'
      });
      return;
    }

    this.payrollPreviews = this.selectedEmployees.map(employee => 
      this.salaryCalculationService.calculatePayroll(
        employee.id,
        employee.firstName + ' ' + employee.lastName,
        employee.positionName || 'Sin posición',
        employee.salary,
        employee.paymentPeriod as PaymentPeriod,
        this.startDate,
        this.endDate,
        0 // Work orders total - se puede calcular después
      )
    );

    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Nómina calculada para ' + this.selectedEmployees.length + ' empleados'
    });
  }

  showPreview() {
    if (this.payrollPreviews.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Calcule la nómina primero'
      });
      return;
    }
    this.previewVisible.set(true);
  }

  async createPayrolls() {
    if (this.payrollPreviews.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Calcule la nómina primero'
      });
      return;
    }

    try {
      // Crear nóminas individuales
      for (const preview of this.payrollPreviews) {
        const payrollDto = {
          employeeId: preview.employeeId,
          startDate: preview.startDate,
          endDate: preview.endDate,
          baseSalary: preview.baseSalary,
          workOrdersTotal: preview.workOrdersTotal,
          totalAmount: preview.totalAmount,
          status: 'Pending' as any,
          isPaid: false,
          notes: this.notes
        };

        await this.payrollService.create(payrollDto).toPromise();
      }

      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Se crearon ' + this.payrollPreviews.length + ' nóminas exitosamente'
      });

      this.onCancel();
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al crear las nóminas'
      });
    }
  }

  onPreviewSave(payrollData: PayrollPreview[]) {
    this.payrollPreviews = payrollData;
    this.previewVisible.set(false);
  }

  onPreviewCancel() {
    this.previewVisible.set(false);
  }

  onCancel() {
    this.visible.set(false);
    this.resetForm();
  }

  private resetForm() {
    this.employeeSelections.forEach(selection => {
      selection.selected = false;
    });
    this.selectAll = false;
    this.selectedEmployees = [];
    this.payrollPreviews = [];
    this.notes = '';
    this.initializeDates();
  }

  // Métodos auxiliares para el template
  getPaymentPeriodDescription(period: string): string {
    return this.salaryCalculationService.getPaymentPeriodDescription(period as PaymentPeriod);
  }

  getPaymentPeriodSeverity(period: string): string {
    const severities = {
      'Daily': 'info',
      'Weekly': 'success',
      'Biweekly': 'warning',
      'Monthly': 'primary',
      'Quarterly': 'secondary',
      'Annually': 'danger'
    };
    return severities[period as keyof typeof severities] || 'primary';
  }

  getTotalBaseSalary(): number {
    return this.selectedEmployees.reduce((sum, employee) => sum + employee.salary, 0);
  }

  getPeriodDays(): number {
    if (!this.startDate || !this.endDate) return 0;
    const timeDiff = this.endDate.getTime() - this.startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  }

  getEstimatedTotal(): number {
    return this.payrollPreviews.reduce((sum, preview) => sum + preview.totalAmount, 0);
  }
}
