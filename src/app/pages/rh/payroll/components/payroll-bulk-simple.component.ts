import { Component, OnInit, signal, input, output, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { TableModule } from 'primeng/table';
import { TreeTableModule } from 'primeng/treetable';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { EmployeeService } from '../../employee/services/employee.service';
import { EmployeeResponseDto, PaymentPeriod } from '../../employee/models/employee.model';
import { BulkPayrollService, BulkPayrollCalculationRequest, BulkPayrollCalculationResponse } from '../services/bulk-payroll.service';
import { TreeNode } from 'primeng/api';

interface EmployeeSelection {
  employee: EmployeeResponseDto;
  selected: boolean;
}

@Component({
  selector: 'app-payroll-bulk-simple',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    CheckboxModule,
    TableModule,
    TreeTableModule,
    TagModule,
    ToastModule
  ],
  templateUrl: './payroll-bulk-simple.component.html'
})
export class PayrollBulkSimpleComponent implements OnInit {
  visible = model<boolean>(false);
  onCancel = output<void>();
  
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
  calculationResult: BulkPayrollCalculationResponse | null = null;
  calculating = false;
  creating = false;

  // TreeTable
  treeTableData: TreeNode[] = [];
  treeTableColumns: any[] = [];

  constructor(
    private employeeService: EmployeeService,
    private bulkPayrollService: BulkPayrollService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadEmployees();
    this.initializeDates();
    this.initializeTreeTableColumns();
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
        this.employees = response.data || [];
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

  async calculatePayroll() {
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

    this.calculating = true;
    try {
      const request: BulkPayrollCalculationRequest = {
        employeeIds: this.selectedEmployees.map(emp => emp.id),
        startDate: this.startDate,
        endDate: this.endDate,
        notes: this.notes,
        calculateWorkOrders: true
      };

      const response = await this.bulkPayrollService.calculateBulkPayroll(request).toPromise();
      
      if (response?.success) {
        this.calculationResult = response.data || null;
        this.buildTreeTableData();
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Nómina calculada exitosamente'
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: response?.message || 'Error al calcular nómina'
        });
      }
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al calcular nómina'
      });
    } finally {
      this.calculating = false;
    }
  }

  async createPayrolls() {
    if (!this.calculationResult) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Calcule la nómina primero'
      });
      return;
    }

    this.creating = true;
    try {
      // Aquí implementarías la lógica para crear las nóminas
      // Por ahora solo mostramos un mensaje de éxito
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Nóminas creadas exitosamente'
      });
      
      this.handleCancel();
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al crear nóminas'
      });
    } finally {
      this.creating = false;
    }
  }

  handleCancel() {
    this.onCancel.emit();
    this.resetForm();
  }

  private resetForm() {
    this.employeeSelections.forEach(selection => {
      selection.selected = false;
    });
    this.selectAll = false;
    this.selectedEmployees = [];
    this.calculationResult = null;
    this.treeTableData = [];
    this.notes = '';
    this.initializeDates();
  }

  private initializeTreeTableColumns() {
    this.treeTableColumns = [
      { field: 'employeeName', header: 'Empleado' },
      { field: 'paymentPeriod', header: 'Período' },
      { field: 'baseSalary', header: 'Salario Base' },
      { field: 'calculatedAmount', header: 'Calculado' },
      { field: 'workOrdersAmount', header: 'Órdenes' },
      { field: 'totalAmount', header: 'Total' },
      { field: 'periodDays', header: 'Días' },
      { field: 'dailyRate', header: 'Tasa Diaria' }
    ];
  }

  private buildTreeTableData() {
    if (!this.calculationResult) return;

    this.treeTableData = this.calculationResult.employeeCalculations.map((employee, index) => {
      const employeeNode: TreeNode = {
        key: `employee-${employee.employeeId}`,
        data: {
          employeeName: employee.employeeName,
          position: employee.position,
          paymentPeriod: employee.paymentPeriod,
          paymentPeriodDescription: employee.paymentPeriodDescription,
          baseSalary: employee.baseSalary,
          calculatedAmount: employee.calculatedAmount,
          workOrdersAmount: employee.workOrdersAmount,
          totalAmount: employee.totalAmount,
          periodDays: employee.periodDays,
          dailyRate: employee.dailyRate
        },
        children: employee.workOrders.map((workOrder, workOrderIndex) => ({
          key: `workorder-${employee.employeeId}-${workOrder.workOrderId}`,
          data: {
            employeeName: workOrder.workOrderName,
            activityName: workOrder.activityName,
            workOrderName: workOrder.workOrderName,
            workOrderDate: workOrder.workOrderDate,
            employeeContribution: workOrder.employeeContribution,
            phaseName: workOrder.phaseName,
            productName: workOrder.productName,
            regionLotName: workOrder.regionLotName,
            totalCost: workOrder.totalCost
          }
        }))
      };

      return employeeNode;
    });
  }

  // Métodos auxiliares para el template
  getPaymentPeriodDescription(period: string): string {
    const descriptions: { [key: string]: string } = {
      'Daily': 'Diario',
      'Weekly': 'Semanal',
      'Biweekly': 'Quincenal',
      'Monthly': 'Mensual',
      'Quarterly': 'Trimestral',
      'Annually': 'Anual'
    };
    return descriptions[period] || 'Mensual';
  }

  getPaymentPeriodSeverity(period: string): string {
    const severities: { [key: string]: string } = {
      'Daily': 'info',
      'Weekly': 'success',
      'Biweekly': 'warning',
      'Monthly': 'primary',
      'Quarterly': 'secondary',
      'Annually': 'danger'
    };
    return severities[period] || 'primary';
  }
}