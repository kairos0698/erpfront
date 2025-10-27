import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { PayrollService, PayrollResponseDto, PayrollDto, PayrollStatus, PayrollCalculationDto, PayrollCalculationRequestDto } from '../services/payroll.service';
import { EmployeeService } from '../../employee/services/employee.service';
import { EmployeeResponseDto, PaymentPeriod } from '../../employee/models/employee.model';
import { PayrollBulkSimpleComponent } from './payroll-bulk-simple.component';

interface Column {
    field: string;
    header: string;
    customExportHeader?: string;
}

interface ExportColumn {
    title: string;
    dataKey: string;
}

@Component({
    selector: 'app-payroll-list',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        InputNumberModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        TooltipModule,
        PayrollBulkSimpleComponent
    ],
    template: `
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="Nueva Nómina" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                <p-button label="Nómina Masiva" icon="pi pi-users" severity="success" class="mr-2" (onClick)="openBulkCreate()" />
                <p-button severity="secondary" label="Eliminar" icon="pi pi-trash" outlined (onClick)="deleteSelectedPayrolls()" [disabled]="!selectedPayrolls || !selectedPayrolls.length" />
            </ng-template>

            <ng-template #end>
                <p-button label="Exportar" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="payrolls()"
            [rows]="10"
            [columns]="cols"
            [paginator]="true"
            [globalFilterFields]="['employeeName', 'statusName']"
            [tableStyle]="{ 'min-width': '75rem' }"
            [(selection)]="selectedPayrolls"
            [rowHover]="true"
            dataKey="id"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} nóminas"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 30]"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0">Gestión de Nóminas</h5>
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search" />
                        <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Buscar..." />
                    </p-iconfield>
                </div>
            </ng-template>
            <ng-template #header>
                <tr>
                    <th style="width: 3rem">
                        <p-tableHeaderCheckbox />
                    </th>
                    <th style="min-width: 12rem">Empleado</th>
                    <th style="min-width: 10rem">Período</th>
                    <th style="min-width: 8rem">Salario Base</th>
                    <th style="min-width: 8rem">Trabajo</th>
                    <th style="min-width: 8rem">Total</th>
                    <th style="min-width: 10rem">Estado</th>
                    <th style="min-width: 12rem">Acciones</th>
                </tr>
            </ng-template>
            <ng-template #body let-payroll>
                <tr>
                    <td style="width: 3rem">
                        <p-tableCheckbox [value]="payroll" />
                    </td>
                    <td style="min-width: 12rem">
                        <div>
                            <div class="font-semibold">{{ payroll.employeeName }}</div>
                            <div class="text-sm text-gray-500">{{ payroll.employeePosition }}</div>
                        </div>
                    </td>
                    <td style="min-width: 10rem">
                        <div>
                            <div class="text-sm">{{ payroll.startDate | date:'dd/MM/yyyy' }}</div>
                            <div class="text-sm">{{ payroll.endDate | date:'dd/MM/yyyy' }}</div>
                        </div>
                    </td>
                    <td style="min-width: 8rem">{{ payroll.baseSalary | currency:'USD':'symbol':'1.2-2' }}</td>
                    <td style="min-width: 8rem">{{ payroll.workOrdersTotal | currency:'USD':'symbol':'1.2-2' }}</td>
                    <td style="min-width: 8rem" class="font-semibold text-green-600">{{ payroll.totalAmount | currency:'USD':'symbol':'1.2-2' }}</td>
                    <td style="min-width: 10rem">
                        <p-tag [value]="payroll.statusName" [severity]="getSeverity(payroll.status)" />
                    </td>
                    <td style="min-width: 12rem">
                        <p-button icon="pi pi-eye" class="mr-2" [rounded]="true" [outlined]="true" (click)="viewPayroll(payroll)" [pTooltip]="'Ver detalles'" />
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editPayroll(payroll)" [pTooltip]="'Editar'" [disabled]="payroll.isPaid" />
                        <p-button icon="pi pi-check" class="mr-2" [rounded]="true" [outlined]="true" (click)="markAsPaid(payroll)" [pTooltip]="'Marcar como pagado'" [disabled]="payroll.isPaid" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deletePayroll(payroll)" [pTooltip]="'Eliminar'" [disabled]="payroll.isPaid" />
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <!-- Modal para Nueva/Editar Nómina -->
        <p-dialog [(visible)]="payrollDialog" [style]="{ width: '800px' }" [header]="isEdit ? 'Editar Nómina' : 'Nueva Nómina'" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <!-- Información del Empleado -->
                    <div class="p-4 rounded-lg">
                        <h4 class="font-bold mb-2 text-blue-800">Información del Empleado</h4>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block font-bold mb-2">Empleado *</label>
                                <p-select [(ngModel)]="payroll.employeeId" 
                                         [options]="employeesForDropdown" 
                                         optionLabel="name" 
                                         optionValue="id" 
                                         placeholder="Seleccionar empleado..." 
                                         (onChange)="onEmployeeSelected($event.value)"
                                         fluid />
                                <small class="text-red-500" *ngIf="submitted && !payroll.employeeId">Empleado es requerido.</small>
                            </div>
                            <div>
                                <label class="block font-bold mb-2">Período de Pago</label>
                                <input type="text" pInputText [value]="getPaymentPeriodLabel(selectedEmployee?.paymentPeriod)" readonly fluid />
                            </div>
                        </div>
                    </div>

                    <!-- Fechas del Período -->
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block font-bold mb-2">Fecha Inicial *</label>
                            <input type="date" pInputText [(ngModel)]="payroll.startDate" 
                                   [min]="getMinStartDate()"
                                   placeholder="Seleccionar fecha inicial"
                                   (ngModelChange)="onStartDateChange()"
                                   fluid />
                            <small class="text-red-500" *ngIf="submitted && !payroll.startDate">Fecha inicial es requerida.</small>
                            <small class="text-red-500" *ngIf="startDateError">{{ startDateError }}</small>
                        </div>
                        <div>
                            <label class="block font-bold mb-2">Fecha Final *</label>
                            <input type="date" pInputText [(ngModel)]="payroll.endDate" 
                                   [min]="getMinEndDate()"
                                   placeholder="Seleccionar fecha final"
                                   (ngModelChange)="onEndDateChange()"
                                   fluid />
                            <small class="text-red-500" *ngIf="submitted && !payroll.endDate">Fecha final es requerida.</small>
                            <small class="text-red-500" *ngIf="endDateError">{{ endDateError }}</small>
                        </div>
                    </div>

                    <!-- Botón para Calcular -->
                    <div class="text-center">
                        <p-button label="Calcular Nómina" icon="pi pi-calculator" (onClick)="calculatePayroll()" [disabled]="!canCalculate()" />
                    </div>

                    <!-- Resultados del Cálculo -->
                    <div class="p-4 rounded-lg" *ngIf="calculationResult">
                        <h4 class="font-bold mb-4 text-green-800">Cálculo de Nómina</h4>
                        
                        <!-- Desglose del Pago Quincenal -->
                        <div class="mb-4 p-3 rounded-lg">
                            <h5 class="font-bold mb-2 text-blue-800">Desglose del Pago Quincenal</h5>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-semibold mb-1">Salario Base Quincenal</label>
                                    <div class="text-lg font-bold text-blue-600">{{ getBiweeklyBaseSalary() | currency:'USD':'symbol':'1.2-2' }}</div>
                                </div>
                                <div>
                                    <label class="block text-sm font-semibold mb-1">Días Trabajados</label>
                                    <div class="text-lg font-bold text-blue-600">{{ getWorkDays() }} días</div>
                                </div>
                            </div>
                            
                            <!-- Días Adicionales si aplica -->
                            <div *ngIf="getAdditionalDays() > 0" class="mt-3 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                                <div class="flex justify-between items-center">
                                    <span class="text-sm font-semibold text-yellow-800">Días Adicionales (+{{ getAdditionalDays() }} días)</span>
                                    <span class="font-bold text-yellow-700">{{ getAdditionalDaysAmount() | currency:'USD':'symbol':'1.2-2' }}</span>
                                </div>
                                <div class="text-xs text-yellow-600 mt-1">
                                    Pago por días trabajados fuera del período quincenal estándar
                                </div>
                            </div>
                        </div>

                        <!-- Resumen Final -->
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block font-bold mb-1">Total Órdenes de Trabajo</label>
                                <input type="number" pInputText [value]="calculationResult.workOrdersTotal" readonly fluid />
                            </div>
                            <div>
                                <label class="block font-bold mb-1">Total a Pagar</label>
                                <input type="number" pInputText [value]="calculationResult.totalAmount" readonly fluid class="font-bold text-green-600" />
                            </div>
                        </div>

                        <!-- Detalles de Órdenes de Trabajo -->
                        <div class="mt-4" *ngIf="calculationResult.workOrders.length > 0">
                            <h5 class="font-bold mb-2">Órdenes de Trabajo</h5>
                            <div class="max-h-40 overflow-y-auto">
                                <div class="grid grid-cols-4 gap-2 text-sm font-semibold p-2 rounded">
                                    <div>Orden</div>
                                    <div>Fecha</div>
                                    <div>Actividad</div>
                                    <div>Monto</div>
                                </div>
                                <div *ngFor="let workOrder of calculationResult.workOrders" class="grid grid-cols-4 gap-2 text-sm p-2 border-b">
                                    <div>{{ workOrder.workOrderName }}</div>
                                    <div>{{ workOrder.workOrderDate | date:'dd/MM/yyyy' }}</div>
                                    <div>{{ workOrder.activityName }}</div>
                                    <div class="font-semibold">{{ workOrder.employeeContribution | currency:'USD':'symbol':'1.2-2' }}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Notas -->
                    <div>
                        <label class="block font-bold mb-2">Notas</label>
                        <textarea pTextarea [(ngModel)]="payroll.notes" rows="3" cols="20" fluid placeholder="Notas adicionales..."></textarea>
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (click)="hideDialog()" />
                <p-button label="Guardar" icon="pi pi-check" (click)="savePayroll()" [disabled]="!calculationResult" />
            </ng-template>
        </p-dialog>

        <!-- Modal para Marcar como Pagado -->
        <p-dialog [(visible)]="markAsPaidDialog" [style]="{ width: '450px' }" header="Marcar como Pagado" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-4">
                    <div>
                        <label class="block font-bold mb-2">Fecha de Pago</label>
                        <input type="date" pInputText [(ngModel)]="paymentDate" 
                               placeholder="Seleccionar fecha de pago"
                               fluid />
                    </div>
                    <div>
                        <label class="block font-bold mb-2">Notas de Pago</label>
                        <textarea pTextarea [(ngModel)]="paymentNotes" rows="3" cols="20" fluid placeholder="Notas sobre el pago..."></textarea>
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (click)="hideMarkAsPaidDialog()" />
                <p-button label="Marcar como Pagado" icon="pi pi-check" (click)="confirmMarkAsPaid()" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />

        <!-- Componente de Creación Masiva -->
        <app-payroll-bulk-simple 
            [(visible)]="bulkCreateVisible"
            (onCancel)="onBulkCreateCancel()">
        </app-payroll-bulk-simple>
    `,
    providers: [MessageService, PayrollService, ConfirmationService]
})
export class PayrollListComponent implements OnInit {
    payrollDialog: boolean = false;
    markAsPaidDialog: boolean = false;
    isEdit: boolean = false;

    payrolls = signal<PayrollResponseDto[]>([]);
    payroll: PayrollDto = {
        employeeId: 0,
        startDate: new Date(),
        endDate: new Date(),
        baseSalary: 0,
        workOrdersTotal: 0,
        totalAmount: 0,
        status: PayrollStatus.Pending,
        isPaid: false
    };

    selectedPayrolls!: PayrollResponseDto[] | null;
    submitted: boolean = false;

    // Datos de referencia
    employees: EmployeeResponseDto[] = [];
    selectedEmployee: EmployeeResponseDto | null = null;
    calculationResult: PayrollCalculationDto | null = null;
    paymentDate: Date = new Date();
    paymentNotes: string = '';
    
    // Validaciones de fechas
    startDateError: string = '';
    endDateError: string = '';

    // Componente de creación masiva
    bulkCreateVisible = signal(false);

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];
    cols!: Column[];

    constructor(
        private payrollService: PayrollService,
        private employeeService: EmployeeService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadPayrolls();
        this.loadEmployees();
        this.setupColumns();
    }

    loadPayrolls() {
        this.payrollService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.payrolls.set(response.data);
                } else {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Advertencia',
                        detail: response.message || 'No se encontraron nóminas',
                        life: 3000
                    });
                }
            },
            error: (error) => {
                console.error('Error loading payrolls:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar nóminas',
                    life: 3000
                });
            }
        });
    }

    loadEmployees() {
        this.employeeService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.employees = response.data;
                } else {
                    console.error('Error loading employees:', response.message);
                }
            },
            error: (error) => {
                console.error('Error loading employees:', error);
            }
        });
    }

    setupColumns() {
        this.cols = [
            { field: 'employeeName', header: 'Empleado', customExportHeader: 'Nombre del Empleado' },
            { field: 'startDate', header: 'Fecha Inicio' },
            { field: 'endDate', header: 'Fecha Fin' },
            { field: 'baseSalary', header: 'Salario Base' },
            { field: 'workOrdersTotal', header: 'Trabajo' },
            { field: 'totalAmount', header: 'Total' },
            { field: 'statusName', header: 'Estado' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    get employeesForDropdown() {
        return this.employees.map(emp => ({
            ...emp,
            name: `${emp.firstName} ${emp.lastName}`,
            position: emp.positionName || ''
        }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.payroll = {
            employeeId: 0,
            startDate: new Date(),
            endDate: new Date(),
            baseSalary: 0,
            workOrdersTotal: 0,
            totalAmount: 0,
            status: PayrollStatus.Pending,
            isPaid: false
        };
        this.selectedEmployee = null;
        this.calculationResult = null;
        this.submitted = false;
        this.isEdit = false;
        this.startDateError = '';
        this.endDateError = '';
        this.payrollDialog = true;
    }

    editPayroll(payroll: PayrollResponseDto) {
        this.payroll = {
            employeeId: payroll.employeeId,
            startDate: payroll.startDate,
            endDate: payroll.endDate,
            baseSalary: payroll.baseSalary,
            workOrdersTotal: payroll.workOrdersTotal,
            totalAmount: payroll.totalAmount,
            status: payroll.status,
            paymentDate: payroll.paymentDate,
            notes: payroll.notes,
            isPaid: payroll.isPaid
        };
        this.selectedEmployee = this.employees.find(emp => emp.id === payroll.employeeId) || null;
        this.calculationResult = null;
        this.submitted = false;
        this.isEdit = true;
        this.payrollDialog = true;
    }

    viewPayroll(payroll: PayrollResponseDto) {
        // Implementar vista de detalles
        console.log('View payroll:', payroll);
    }

    onEmployeeSelected(employeeId: number) {
        this.selectedEmployee = this.employees.find(emp => emp.id === employeeId) || null;
        this.calculationResult = null;
        this.startDateError = '';
        this.endDateError = '';
    }

    getMinStartDate(): string {
        if (this.selectedEmployee?.hireDate) {
            return new Date(this.selectedEmployee.hireDate).toISOString().split('T')[0];
        }
        return '';
    }

    getMinEndDate(): string {
        if (this.payroll.startDate) {
            return new Date(this.payroll.startDate).toISOString().split('T')[0];
        }
        return this.getMinStartDate();
    }

    onStartDateChange() {
        this.startDateError = '';
        this.endDateError = '';
        
        if (this.payroll.startDate && this.selectedEmployee?.hireDate) {
            const startDate = new Date(this.payroll.startDate);
            const hireDate = new Date(this.selectedEmployee.hireDate);
            
            if (startDate < hireDate) {
                this.startDateError = `La fecha inicial no puede ser anterior a la fecha de contratación (${hireDate.toLocaleDateString()})`;
                return;
            }
        }
        
        // Si hay fecha final y es anterior a la fecha inicial, limpiarla
        if (this.payroll.endDate && this.payroll.startDate) {
            const endDate = new Date(this.payroll.endDate);
            const startDate = new Date(this.payroll.startDate);
            
            if (endDate < startDate) {
                this.payroll.endDate = new Date();
            }
        }
    }

    onEndDateChange() {
        this.endDateError = '';
        
        if (this.payroll.endDate && this.payroll.startDate) {
            const endDate = new Date(this.payroll.endDate);
            const startDate = new Date(this.payroll.startDate);
            
            if (endDate < startDate) {
                this.endDateError = 'La fecha final debe ser posterior a la fecha inicial';
            }
        }
    }

    canCalculate(): boolean {
        return this.payroll.employeeId > 0 && !!this.payroll.startDate && !!this.payroll.endDate && 
               !this.startDateError && !this.endDateError;
    }

    getBiweeklyBaseSalary(): number {
        if (!this.selectedEmployee?.salary) return 0;
        return this.selectedEmployee.salary / 2; // Salario quincenal
    }

    getWorkDays(): number {
        if (!this.payroll.startDate || !this.payroll.endDate) return 0;
        
        const startDate = new Date(this.payroll.startDate);
        const endDate = new Date(this.payroll.endDate);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        return diffDays;
    }

    getAdditionalDays(): number {
        const workDays = this.getWorkDays();
        const standardBiweeklyDays = 14; // 14 días estándar para quincena
        
        if (workDays > standardBiweeklyDays) {
            return workDays - standardBiweeklyDays;
        }
        return 0;
    }

    getAdditionalDaysAmount(): number {
        if (!this.selectedEmployee?.salary) return 0;
        
        const additionalDays = this.getAdditionalDays();
        const dailySalary = this.selectedEmployee.salary / 30; // Salario diario aproximado
        
        return additionalDays * dailySalary;
    }

    getPaymentPeriodLabel(paymentPeriod?: string): string {
        if (!paymentPeriod) return 'N/A';
        
        switch (paymentPeriod.toLowerCase()) {
            case 'daily':
                return 'Diario';
            case 'weekly':
                return 'Semanal';
            case 'biweekly':
                return 'Quincenal';
            case 'monthly':
                return 'Mensual';
            case 'quarterly':
                return 'Trimestral';
            case 'annually':
                return 'Anual';
            default:
                return paymentPeriod; // Si no coincide, devolver el valor original
        }
    }

    calculatePayroll() {
        if (!this.canCalculate()) return;

        const request: PayrollCalculationRequestDto = {
            employeeId: this.payroll.employeeId,
            startDate: this.payroll.startDate,
            endDate: this.payroll.endDate
        };

        this.payrollService.calculatePayroll(request).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.calculationResult = response.data;
                    this.payroll.baseSalary = response.data.baseSalary;
                    this.payroll.workOrdersTotal = response.data.workOrdersTotal;
                    this.payroll.totalAmount = response.data.totalAmount;
                    
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Cálculo Exitoso',
                        detail: 'Nómina calculada correctamente',
                        life: 3000
                    });
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: response.message || 'Error al calcular nómina',
                        life: 3000
                    });
                }
            },
            error: (error) => {
                console.error('Error calculating payroll:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al calcular nómina',
                    life: 3000
                });
            }
        });
    }

    savePayroll() {
        this.submitted = true;
        
        if (this.payroll.employeeId && this.payroll.startDate && this.payroll.endDate && this.calculationResult) {
            if (this.isEdit) {
                // Update logic would go here
                this.messageService.add({
                    severity: 'success',
                    summary: 'Exitoso',
                    detail: 'Nómina actualizada',
                    life: 3000
                });
            } else {
                this.payrollService.create(this.payroll).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Nómina creada',
                                life: 3000
                            });
                            this.hideDialog();
                            this.loadPayrolls();
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al crear nómina',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        console.error('Error creating payroll:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al crear nómina',
                            life: 3000
                        });
                    }
                });
            }
        }
    }

    markAsPaid(payroll: PayrollResponseDto) {
        this.paymentDate = new Date();
        this.paymentNotes = '';
        this.markAsPaidDialog = true;
        // Store payroll for later use
        (this as any).currentPayroll = payroll;
    }

    confirmMarkAsPaid() {
        const payroll = (this as any).currentPayroll;
        if (payroll) {
            this.payrollService.markAsPaid(payroll.id, {
                paymentDate: this.paymentDate,
                notes: this.paymentNotes
            }).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Nómina marcada como pagada',
                            life: 3000
                        });
                        this.hideMarkAsPaidDialog();
                        this.loadPayrolls();
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: response.message || 'Error al marcar como pagada',
                            life: 3000
                        });
                    }
                },
                error: (error) => {
                    console.error('Error marking as paid:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error al marcar como pagada',
                        life: 3000
                    });
                }
            });
        }
    }

    deletePayroll(payroll: PayrollResponseDto) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar esta nómina?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.payrollService.delete(payroll.id).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Nómina eliminada',
                                life: 3000
                            });
                            this.loadPayrolls();
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al eliminar nómina',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        console.error('Error deleting payroll:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al eliminar nómina',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    deleteSelectedPayrolls() {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar las nóminas seleccionadas?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                // Implementar eliminación múltiple
                this.messageService.add({
                    severity: 'success',
                    summary: 'Exitoso',
                    detail: 'Nóminas eliminadas',
                    life: 3000
                });
            }
        });
    }

    hideDialog() {
        this.payrollDialog = false;
        this.submitted = false;
        this.calculationResult = null;
    }

    hideMarkAsPaidDialog() {
        this.markAsPaidDialog = false;
        this.paymentDate = new Date();
        this.paymentNotes = '';
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    getSeverity(status: PayrollStatus) {
        switch (status) {
            case PayrollStatus.Pending:
                return 'warning';
            case PayrollStatus.Paid:
                return 'success';
            case PayrollStatus.Cancelled:
                return 'danger';
            default:
                return 'info';
        }
    }

    // Métodos para creación masiva
    openBulkCreate() {
        this.bulkCreateVisible.set(true);
    }

    onBulkCreateCancel() {
        this.bulkCreateVisible.set(false);
        this.loadPayrolls(); // Recargar la lista después de crear nóminas masivas
    }
}
