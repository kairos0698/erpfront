import { Component, OnInit, OnChanges, SimpleChanges, signal, input, output, model, effect } from '@angular/core';
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
import { BulkPayrollService, BulkPayrollCalculationRequest, BulkPayrollCalculationResponse, PayrollResponse } from '../services/bulk-payroll.service';
import { PayrollService, PayrollResponseDto, PayrollEmployeeResponseDto } from '../services/payroll.service';
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
  
  // Modos de operación
  payrollId = input<number | null>(null); // ID de la nómina para edición
  viewMode = input<boolean>(false); // Solo lectura
  
  // Configuración del período
  startDate: Date | string = new Date();
  endDate: Date | string = new Date();
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
  loading = false;

  // TreeTable
  treeTableData: TreeNode[] = [];
  treeTableColumns: any[] = [];

  constructor(
    private employeeService: EmployeeService,
    private bulkPayrollService: BulkPayrollService,
    private payrollService: PayrollService,
    private messageService: MessageService
  ) {
    // Efecto para cargar datos cuando cambia el payrollId y el componente es visible
    effect(() => {
      if (this.visible() && this.payrollId() !== null && this.employees.length > 0) {
        // Esperar a que los empleados estén cargados antes de cargar los datos de la nómina
        this.loadPayrollData(this.payrollId()!);
      }
    });
  }

  ngOnInit() {
    this.loadEmployees();
    this.initializeDates();
    this.initializeTreeTableColumns();
  }
  
  private async loadPayrollData(payrollId: number) {
    this.loading = true;
    try {
      const response = await this.payrollService.getById(payrollId).toPromise();
      if (response?.success && response.data) {
        const payroll = response.data;
        
        // Cargar fechas y notas - convertir a formato ISO para inputs type="date"
        const startDateObj = new Date(payroll.startDate);
        const endDateObj = new Date(payroll.endDate);
        this.startDate = this.formatDateForInput(startDateObj);
        this.endDate = this.formatDateForInput(endDateObj);
        this.notes = payroll.notes || '';
        
        // Convertir PayrollEmployees a EmployeePayrollCalculation
        if (payroll.payrollEmployees && payroll.payrollEmployees.length > 0) {
          // Seleccionar empleados correspondientes
          const employeeIds = payroll.payrollEmployees.map(pe => pe.employeeId);
          this.employeeSelections.forEach(selection => {
            selection.selected = employeeIds.includes(selection.employee.id);
          });
          this.updateSelectedEmployees();
          
          // Construir el calculationResult desde los datos guardados
          this.calculationResult = {
            totalEmployees: payroll.totalEmployees || payroll.payrollEmployees.length,
            totalBaseSalary: payroll.totalBaseSalary || 0,
            totalWorkOrdersAmount: payroll.totalWorkOrdersAmount || 0,
            totalAmount: payroll.totalAmount || 0,
            periodDays: payroll.periodDays || 0,
            startDate: new Date(payroll.startDate),
            endDate: new Date(payroll.endDate),
            notes: payroll.notes,
            employeeCalculations: payroll.payrollEmployees.map(pe => {
              // Verificar que las órdenes de trabajo estén disponibles
              const workOrders = (pe.payrollWorkOrders && pe.payrollWorkOrders.length > 0)
                ? pe.payrollWorkOrders.map(pwo => ({
                    workOrderId: pwo.workOrderId,
                    workOrderName: pwo.workOrderName || `Orden #${pwo.workOrderId}`,
                    workOrderDate: new Date(pwo.workOrderDate),
                    activityName: pwo.activityName || '',
                    employeeContribution: pwo.employeeContribution,
                    totalCost: pwo.totalCost,
                    phaseName: pwo.phaseName || '',
                    productName: pwo.productName || '',
                    regionLotName: pwo.regionLotName || ''
                  }))
                : [];
              
              console.log(`Empleado ${pe.employeeName}: ${workOrders.length} órdenes de trabajo`, workOrders);
              
              return {
                employeeId: pe.employeeId,
                employeeName: pe.employeeName,
                position: pe.position,
                baseSalary: pe.baseSalary,
                paymentPeriod: pe.paymentPeriod,
                paymentPeriodDescription: this.getPaymentPeriodDescription(pe.paymentPeriod),
                dailyRate: pe.dailyRate,
                calculatedAmount: pe.calculatedAmount,
                workOrdersAmount: pe.workOrdersAmount,
                totalAmount: pe.totalAmount,
                periodDays: pe.periodDays,
                workOrders: workOrders
              };
            })
          };
          
          console.log('CalculationResult construido:', this.calculationResult);
          this.buildTreeTableData();
        }
      }
    } catch (error) {
      console.error('Error loading payroll:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar la nómina',
        life: 3000
      });
    } finally {
      this.loading = false;
    }
  }

  private initializeDates() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1); // Primer día del mes
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Último día del mes
    this.startDate = this.formatDateForInput(firstDay);
    this.endDate = this.formatDateForInput(lastDay);
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
        
        // Si hay un payrollId después de cargar empleados, cargar los datos de la nómina
        if (this.visible() && this.payrollId() !== null) {
          this.loadPayrollData(this.payrollId()!);
        }
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
      // Convertir fechas a Date si vienen como string
      const startDateObj = this.toDate(this.startDate);
      const endDateObj = this.toDate(this.endDate);

      const request: BulkPayrollCalculationRequest = {
        employeeIds: this.selectedEmployees.map(emp => emp.id),
        startDate: startDateObj,
        endDate: endDateObj,
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
    // Prevenir múltiples clics simultáneos
    if (this.creating) {
      return;
    }

    // Asegurar que el componente esté visible antes de crear
    if (!this.visible()) {
      return;
    }

    if (!this.calculationResult) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Calcule la nómina primero'
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

    this.creating = true;
    try {
      // Convertir strings a Date si es necesario
      const startDateObj = this.toDate(this.startDate);
      const endDateObj = this.toDate(this.endDate);

      // Generar nombre automático para la nómina
      const payrollName = `Nómina Masiva ${this.formatDate(startDateObj)} - ${this.formatDate(endDateObj)}`;

      const request = {
        name: payrollName,
        startDate: startDateObj,
        endDate: endDateObj,
        notes: this.notes,
        calculationResult: this.calculationResult
      };

      const response = await this.bulkPayrollService.createBulkPayroll(request).toPromise();
      
      if (response?.success) {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: response.message || 'Nóminas creadas exitosamente',
          life: 5000
        });
        
        this.handleCancel();
      } else {
        // Respuesta exitosa HTTP pero con success: false (error de validación del backend)
        // El backend siempre devuelve HTTP 200 con success: false para errores de validación
        // MOSTRAR EL MENSAJE SOLO UNA VEZ - verificar que el componente esté visible
        const errorMessage = response?.message || 'Error al crear nóminas';
        
        // Solo mostrar el mensaje si el componente está visible (evitar duplicados)
        if (this.visible()) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error de Validación',
            detail: errorMessage,
            life: 10000,
            sticky: true,
            key: 'bulk-payroll-error' // Key única para evitar duplicados
          });
        }
      }
    } catch (error: any) {
      // Manejo de errores HTTP excepcionales (red, timeout, servidor, etc.)
      // NOTA: El backend devuelve HTTP 200 incluso con errores de validación,
      // por lo que este catch solo debería ejecutarse para errores de red o servidor reales
      console.error('Error creating payroll:', error);
      
      // Extraer mensaje del error si está disponible
      let errorMessage = 'Error al crear nóminas. Por favor, intente nuevamente.';
      
      if (error?.error?.message) {
        errorMessage = error.error.message;
      } else if (error?.error?.data?.message) {
        errorMessage = error.error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error?.error === 'string') {
        errorMessage = error.error;
      }
      
      // Mostrar solo si es un error real de red/servidor y el componente está visible
      // (no error de validación que ya se manejó en el else)
      if (this.visible()) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 10000,
          sticky: true,
          key: 'bulk-payroll-error' // Key única para evitar duplicados
        });
      }
    } finally {
      this.creating = false;
    }
  }

  private toDate(value: Date | string): Date {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string') {
      return new Date(value);
    }
    throw new Error('Invalid date value');
  }

  private formatDate(date: Date): string {
    if (!date) return '';
    
    // Asegurarse de que es un objeto Date
    const dateObj = date instanceof Date ? date : new Date(date);
    
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private formatDateForInput(date: Date | string): string {
    if (!date) return '';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Formato ISO para inputs type="date": YYYY-MM-DD
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
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
      // Crear hijos (órdenes de trabajo) solo si existen
      const workOrderChildren: TreeNode[] = employee.workOrders && employee.workOrders.length > 0
        ? employee.workOrders.map((workOrder, workOrderIndex) => ({
            key: `workorder-${employee.employeeId}-${workOrder.workOrderId}`,
            data: {
              employeeName: workOrder.workOrderName || `Orden #${workOrder.workOrderId}`,
              activityName: workOrder.activityName || '',
              workOrderName: workOrder.workOrderName || `Orden #${workOrder.workOrderId}`,
              workOrderDate: workOrder.workOrderDate,
              employeeContribution: workOrder.employeeContribution,
              phaseName: workOrder.phaseName || '',
              productName: workOrder.productName || '',
              regionLotName: workOrder.regionLotName || '',
              totalCost: workOrder.totalCost || 0
            },
            // Los hijos de órdenes de trabajo no tienen hijos
            children: undefined
          }))
        : [];

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
        children: workOrderChildren.length > 0 ? workOrderChildren : undefined
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

  getDialogHeader(): string {
    if (this.viewMode()) {
      return 'Ver Nómina Masiva';
    } else if (this.payrollId() !== null) {
      return 'Editar Nómina Masiva';
    } else {
      return 'Crear Nómina Masiva';
    }
  }
}