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
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { EmployeeService } from '../services/employee.service';
import { EmployeeResponseDto, EmployeeDto, PAYMENT_PERIOD_OPTIONS } from '../models/employee.model';
import { PositionService } from '../services/position.service';
import { EmployeeTypeService } from '../services/employee-type.service';
import { PositionDto, PositionResponseDto } from '../models/position.model';
import { EmployeeTypeDto, EmployeeTypeResponseDto } from '../models/employee-type.model';

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
    selector: 'app-employee-list',
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
        CheckboxModule,
        InputNumberModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule
    ],
    template: `
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="Nuevo Empleado" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                <p-button severity="secondary" label="Eliminar Seleccionados" icon="pi pi-trash" outlined (onClick)="deleteSelectedEmployees()" [disabled]="!selectedEmployees || !selectedEmployees.length" />
            </ng-template>

            <ng-template #end>
                <p-button label="Exportar" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="employees()"
            [rows]="10"
            [columns]="cols"
            [paginator]="true"
            [globalFilterFields]="['firstName', 'lastName', 'email', 'phoneNumber', 'employeeNumber']"
            [tableStyle]="{ 'min-width': '75rem' }"
            [(selection)]="selectedEmployees"
            [rowHover]="true"
            dataKey="id"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} empleados"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 30]"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0">Gestionar Empleados</h5>
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
                    <th style="min-width: 8rem">Número</th>
                    <th pSortableColumn="firstName" style="min-width: 12rem">
                        Nombre
                        <p-sortIcon field="firstName" />
                    </th>
                    <th pSortableColumn="email" style="min-width: 16rem">
                        Email
                        <p-sortIcon field="email" />
                    </th>
                    <th style="min-width: 10rem">Teléfono</th>
                    <th pSortableColumn="positionName" style="min-width: 12rem">
                        Posición
                        <p-sortIcon field="positionName" />
                    </th>
                    <th pSortableColumn="salary" style="min-width: 8rem">
                        Salario
                        <p-sortIcon field="salary" />
                    </th>
                    <th pSortableColumn="hireDate" style="min-width: 10rem">
                        Fecha Contratación
                        <p-sortIcon field="hireDate" />
                    </th>
                    <th style="min-width: 8rem">Cliente</th>
                    <th style="min-width: 12rem"></th>
                </tr>
            </ng-template>
            <ng-template #body let-employee>
                <tr>
                    <td style="width: 3rem">
                        <p-tableCheckbox [value]="employee" />
                    </td>
                    <td style="min-width: 8rem">{{ employee.employeeNumber }}</td>
                    <td style="min-width: 12rem">{{ employee.firstName }} {{ employee.lastName }}</td>
                    <td style="min-width: 16rem">{{ employee.email }}</td>
                    <td style="min-width: 10rem">{{ employee.phoneNumber }}</td>
                    <td style="min-width: 12rem">{{ employee.positionName || 'Sin posición' }}</td>
                    <td style="min-width: 8rem">{{ employee.salary | currency:'USD':'symbol':'1.2-2' }}</td>
                    <td style="min-width: 10rem">{{ employee.hireDate | date:'dd/MM/yyyy' }}</td>
                    <td style="min-width: 8rem">
                        <p-tag [value]="employee.isAlsoClient ? 'Sí' : 'No'" [severity]="getSeverity(employee.isAlsoClient)" />
                    </td>
                    <td>
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editEmployee(employee)" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteEmployee(employee)" />
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="employeeDialog" [style]="{ width: '800px' }" header="Detalles del Empleado" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <!-- Información Personal -->
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-6">
                            <label for="firstName" class="block font-bold mb-3">Nombre</label>
                            <input type="text" pInputText id="firstName" [(ngModel)]="employee.firstName" required autofocus fluid />
                            <small class="text-red-500" *ngIf="submitted && !employee.firstName">Nombre es requerido.</small>
                        </div>
                        <div class="col-span-6">
                            <label for="lastName" class="block font-bold mb-3">Apellido</label>
                            <input type="text" pInputText id="lastName" [(ngModel)]="employee.lastName" required fluid />
                            <small class="text-red-500" *ngIf="submitted && !employee.lastName">Apellido es requerido.</small>
                        </div>
                    </div>

                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-6">
                            <label for="email" class="block font-bold mb-3">Email</label>
                            <input type="email" pInputText id="email" [(ngModel)]="employee.email" required fluid />
                            <small class="text-red-500" *ngIf="submitted && !employee.email">Email es requerido.</small>
                        </div>
                        <div class="col-span-6">
                            <label for="phoneNumber" class="block font-bold mb-3">Teléfono</label>
                            <input type="text" pInputText id="phoneNumber" [(ngModel)]="employee.phoneNumber" fluid />
                        </div>
                    </div>

                    <!-- Información Laboral -->
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-6">
                            <label for="employeeNumber" class="block font-bold mb-3">Número de Empleado</label>
                            <input type="text" pInputText id="employeeNumber" [(ngModel)]="employee.employeeNumber" required fluid />
                            <small class="text-red-500" *ngIf="submitted && !employee.employeeNumber">Número de empleado es requerido.</small>
                        </div>
                        <div class="col-span-6">
                            <label for="rfc" class="block font-bold mb-3">RFC</label>
                            <input type="text" pInputText id="rfc" [(ngModel)]="employee.rfc" fluid />
                        </div>
                    </div>

                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-6">
                            <label for="positionId" class="block font-bold mb-3">Posición</label>
                            <div class="flex gap-2">
                                <p-select [(ngModel)]="employee.positionId" inputId="positionId" [options]="positions" optionLabel="name" optionValue="id" placeholder="Seleccionar Posición" fluid class="flex-1" (onChange)="onPositionChange()" />
                                <p-button icon="pi pi-plus" severity="secondary" size="small" (onClick)="openNewPosition()" pTooltip="Agregar nueva posición" />
                            </div>
                        </div>
                        <div class="col-span-6">
                            <label for="employeeTypeId" class="block font-bold mb-3">Tipo de Empleado</label>
                            <div class="flex gap-2">
                                <p-select [(ngModel)]="employee.employeeTypeId" inputId="employeeTypeId" [options]="employeeTypes" optionLabel="name" optionValue="id" placeholder="Seleccionar Tipo" fluid class="flex-1" />
                                <p-button icon="pi pi-plus" severity="secondary" size="small" (onClick)="openNewEmployeeType()" pTooltip="Agregar nuevo tipo de empleado" />
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-6">
                            <label for="salary" class="block font-bold mb-3">Salario</label>
                            <p-inputnumber id="salary" [(ngModel)]="employee.salary" mode="currency" currency="USD" locale="en-US" fluid />
                        </div>
                        <div class="col-span-6">
                            <label for="paymentPeriod" class="block font-bold mb-3">Período de Pago</label>
                            <p-select [(ngModel)]="employee.paymentPeriod" inputId="paymentPeriod" [options]="paymentPeriodOptions" optionLabel="label" optionValue="value" placeholder="Seleccionar Período" fluid />
                        </div>
                    </div>

                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-6">
                            <label for="hireDate" class="block font-bold mb-3">Fecha de Contratación</label>
                            <input type="date" pInputText id="hireDate" [(ngModel)]="employee.hireDate" fluid />
                        </div>
                        <div class="col-span-6">
                            <div class="flex items-center gap-2 mt-6">
                                <p-checkbox [(ngModel)]="employee.isAlsoClient" id="isAlsoClient" binary />
                                <label for="isAlsoClient">También es Cliente</label>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label for="address" class="block font-bold mb-3">Dirección</label>
                        <textarea id="address" pTextarea [(ngModel)]="employee.address" rows="3" cols="20" fluid></textarea>
                    </div>

                    <!-- Información de Cliente (si aplica) -->
                    <div *ngIf="employee.isAlsoClient" class="border-t pt-4">
                        <h6 class="font-bold mb-4">Información de Cliente</h6>
                        <div class="grid grid-cols-12 gap-4">
                            <div class="col-span-6">
                                <label for="commercialName" class="block font-bold mb-3">Nombre Comercial</label>
                                <input type="text" pInputText id="commercialName" [(ngModel)]="employee.commercialName" fluid />
                            </div>
                            <div class="col-span-6">
                                <label for="clientEmail" class="block font-bold mb-3">Email del Cliente</label>
                                <input type="email" pInputText id="clientEmail" [(ngModel)]="employee.clientEmail" fluid />
                            </div>
                        </div>
                        <div class="grid grid-cols-12 gap-4">
                            <div class="col-span-6">
                                <label for="clientPhone" class="block font-bold mb-3">Teléfono del Cliente</label>
                                <input type="text" pInputText id="clientPhone" [(ngModel)]="employee.clientPhone" fluid />
                            </div>
                            <div class="col-span-6">
                                <label for="clientRfc" class="block font-bold mb-3">RFC del Cliente</label>
                                <input type="text" pInputText id="clientRfc" [(ngModel)]="employee.clientRfc" fluid />
                            </div>
                        </div>
                        <div>
                            <label for="clientAddress" class="block font-bold mb-3">Dirección del Cliente</label>
                            <textarea id="clientAddress" pTextarea [(ngModel)]="employee.clientAddress" rows="2" cols="20" fluid></textarea>
                        </div>
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (click)="hideDialog()" />
                <p-button label="Guardar" icon="pi pi-check" (click)="saveEmployee()" />
            </ng-template>
        </p-dialog>

        <!-- Position Dialog -->
        <p-dialog header="{{editingPosition ? 'Editar Posición' : 'Nueva Posición'}}" [(visible)]="positionDialog" [style]="{ width: '450px' }" [modal]="true" [closable]="true">
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-12">
                    <label for="positionName" class="block font-bold mb-3">Nombre *</label>
                    <input type="text" pInputText id="positionName" [(ngModel)]="position.name" placeholder="Nombre del puesto" fluid />
                </div>
                <div class="col-span-12">
                    <label for="suggestedSalary" class="block font-bold mb-3">Salario Sugerido</label>
                    <p-inputnumber [(ngModel)]="position.suggestedSalary" inputId="suggestedSalary" mode="currency" currency="USD" locale="en-US" fluid />
                </div>
                <div class="col-span-12">
                    <label for="positionDescription" class="block font-bold mb-3">Descripción</label>
                    <textarea pInputTextarea id="positionDescription" [(ngModel)]="position.description" placeholder="Descripción del puesto..." rows="3" fluid></textarea>
                </div>
            </div>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (click)="positionDialog = false" />
                <p-button label="{{editingPosition ? 'Actualizar' : 'Crear'}}" icon="pi pi-check" (click)="savePosition()" />
            </ng-template>
        </p-dialog>

        <!-- Employee Type Dialog -->
        <p-dialog header="{{editingEmployeeType ? 'Editar Tipo de Empleado' : 'Nuevo Tipo de Empleado'}}" [(visible)]="employeeTypeDialog" [style]="{ width: '450px' }" [modal]="true" [closable]="true">
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-12">
                    <label for="employeeTypeName" class="block font-bold mb-3">Nombre *</label>
                    <input type="text" pInputText id="employeeTypeName" [(ngModel)]="employeeType.name" placeholder="Nombre del tipo" fluid />
                </div>
                <div class="col-span-12">
                    <label for="employeeTypeDescription" class="block font-bold mb-3">Descripción</label>
                    <textarea pInputTextarea id="employeeTypeDescription" [(ngModel)]="employeeType.description" placeholder="Descripción del tipo..." rows="3" fluid></textarea>
                </div>
            </div>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (click)="employeeTypeDialog = false" />
                <p-button label="{{editingEmployeeType ? 'Actualizar' : 'Crear'}}" icon="pi pi-check" (click)="saveEmployeeType()" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `,
    providers: [MessageService, EmployeeService, ConfirmationService]
})
export class EmployeeListComponent implements OnInit {
    employeeDialog: boolean = false;
    employees = signal<EmployeeResponseDto[]>([]);
    employee: EmployeeResponseDto = {} as EmployeeResponseDto;
    selectedEmployees!: EmployeeResponseDto[] | null;
    submitted: boolean = false;
    paymentPeriodOptions = PAYMENT_PERIOD_OPTIONS;
    positions: PositionResponseDto[] = [];
    employeeTypes: EmployeeTypeResponseDto[] = [];
    
    // Mini-CRUD properties
    positionDialog: boolean = false;
    employeeTypeDialog: boolean = false;
    position: PositionDto = {} as PositionDto;
    employeeType: EmployeeTypeDto = {} as EmployeeTypeDto;
    editingPosition: PositionResponseDto | null = null;
    editingEmployeeType: EmployeeTypeResponseDto | null = null;

    @ViewChild('dt') dt!: Table;
    exportColumns!: ExportColumn[];
    cols!: Column[];

    constructor(
        private employeeService: EmployeeService,
        private positionService: PositionService,
        private employeeTypeService: EmployeeTypeService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadEmployees();
        this.setupColumns();
        this.loadReferenceData();
    }

    loadEmployees() {
        this.employeeService.getAll().subscribe({
            next: (data) => this.employees.set(data),
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar empleados',
                    life: 3000
                });
                console.error('Error loading employees:', error);
            }
        });
    }

    loadReferenceData() {
        // Cargar posiciones
        this.positionService.getAll().subscribe({
            next: (data) => this.positions = data,
            error: (error) => {
                console.error('Error loading positions:', error);
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Advertencia',
                    detail: 'Error al cargar posiciones'
                });
            }
        });

        // Cargar tipos de empleado
        this.employeeTypeService.getAll().subscribe({
            next: (data) => this.employeeTypes = data,
            error: (error) => {
                console.error('Error loading employee types:', error);
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Advertencia',
                    detail: 'Error al cargar tipos de empleado'
                });
            }
        });
    }

    setupColumns() {
        this.cols = [
            { field: 'employeeNumber', header: 'Número', customExportHeader: 'Número de Empleado' },
            { field: 'firstName', header: 'Nombre' },
            { field: 'lastName', header: 'Apellido' },
            { field: 'email', header: 'Email' },
            { field: 'phoneNumber', header: 'Teléfono' },
            { field: 'positionName', header: 'Posición' },
            { field: 'salary', header: 'Salario' },
            { field: 'hireDate', header: 'Fecha Contratación' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.employee = {} as EmployeeResponseDto;
        this.submitted = false;
        this.employeeDialog = true;
    }

    editEmployee(employee: EmployeeResponseDto) {
        this.employee = { ...employee };
        this.employeeDialog = true;
    }

    deleteSelectedEmployees() {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar los empleados seleccionados?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.employees.set(this.employees().filter((val) => !this.selectedEmployees?.includes(val)));
                this.selectedEmployees = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Exitoso',
                    detail: 'Empleados Eliminados',
                    life: 3000
                });
            }
        });
    }

    hideDialog() {
        this.employeeDialog = false;
        this.submitted = false;
    }

    deleteEmployee(employee: EmployeeResponseDto) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar ' + employee.firstName + ' ' + employee.lastName + '?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.employeeService.delete(employee.id).subscribe({
                    next: () => {
                        this.employees.set(this.employees().filter((val) => val.id !== employee.id));
                        this.employee = {} as EmployeeResponseDto;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Empleado Eliminado',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al eliminar empleado',
                            life: 3000
                        });
                        console.error('Error deleting employee:', error);
                    }
                });
            }
        });
    }

    getSeverity(isAlsoClient: boolean) {
        return isAlsoClient ? 'success' : 'danger';
    }

    onPositionChange() {
        if (this.employee.positionId) {
            const selectedPosition = this.positions.find(p => p.id === this.employee.positionId);
            if (selectedPosition && selectedPosition.suggestedSalary) {
                this.employee.salary = selectedPosition.suggestedSalary;
            }
        }
    }

    saveEmployee() {
        this.submitted = true;
        
        if (this.employee.firstName?.trim() && this.employee.lastName?.trim() && this.employee.email?.trim() && this.employee.employeeNumber?.trim()) {
            const employeeData: EmployeeDto = {
                firstName: this.employee.firstName,
                lastName: this.employee.lastName,
                email: this.employee.email,
                phoneNumber: this.employee.phoneNumber,
                employeeNumber: this.employee.employeeNumber,
                positionId: this.employee.positionId,
                employeeTypeId: this.employee.employeeTypeId,
                paymentPeriod: this.employee.paymentPeriod,
                salary: this.employee.salary,
                hireDate: this.employee.hireDate,
                rfc: this.employee.rfc,
                address: this.employee.address,
                isAlsoClient: this.employee.isAlsoClient,
                commercialName: this.employee.commercialName,
                clientEmail: this.employee.clientEmail,
                clientPhone: this.employee.clientPhone,
                clientRfc: this.employee.clientRfc,
                clientAddress: this.employee.clientAddress
            };

            if (this.employee.id) {
                // Actualizar
                this.employeeService.update(this.employee.id, employeeData).subscribe({
                    next: () => {
                        this.loadEmployees(); // Recargar la lista
                        this.employeeDialog = false;
                        this.employee = {} as EmployeeResponseDto;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Empleado Actualizado',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al actualizar empleado',
                            life: 3000
                        });
                        console.error('Error updating employee:', error);
                    }
                });
            } else {
                // Crear
                this.employeeService.create(employeeData).subscribe({
                    next: () => {
                        this.loadEmployees(); // Recargar la lista
                        this.employeeDialog = false;
                        this.employee = {} as EmployeeResponseDto;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Empleado Creado',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al crear empleado',
                            life: 3000
                        });
                        console.error('Error creating employee:', error);
                    }
                });
            }
        }
    }

    exportCSV() {
        this.employeeService.export('csv').subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `empleados_${new Date().toISOString().slice(0, 10)}.csv`;
                link.click();
                window.URL.revokeObjectURL(url);
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al exportar empleados',
                    life: 3000
                });
                console.error('Error exporting employees:', error);
            }
        });
    }

    // ========== MINI-CRUD METHODS ==========

    // Position methods
    openNewPosition() {
        this.position = {} as PositionDto;
        this.editingPosition = null;
        this.positionDialog = true;
    }

    editPosition(position: PositionResponseDto) {
        this.position = {
            name: position.name,
            suggestedSalary: position.suggestedSalary,
            description: position.description
        };
        this.editingPosition = position;
        this.positionDialog = true;
    }

    deletePosition(position: PositionResponseDto) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de que quieres eliminar la posición "${position.name}"?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.positionService.delete(position.id).subscribe({
                    next: () => {
                        this.loadReferenceData();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Posición eliminada correctamente',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al eliminar posición',
                            life: 3000
                        });
                        console.error('Error deleting position:', error);
                    }
                });
            }
        });
    }

    savePosition() {
        if (this.editingPosition) {
            // Update existing position
            this.positionService.update(this.editingPosition.id, this.position).subscribe({
                next: () => {
                    this.loadReferenceData();
                    this.positionDialog = false;
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Posición actualizada correctamente',
                        life: 3000
                    });
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error al actualizar posición',
                        life: 3000
                    });
                    console.error('Error updating position:', error);
                }
            });
        } else {
            // Create new position
            this.positionService.create(this.position).subscribe({
                next: () => {
                    this.loadReferenceData();
                    this.positionDialog = false;
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Posición creada correctamente',
                        life: 3000
                    });
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error al crear posición',
                        life: 3000
                    });
                    console.error('Error creating position:', error);
                }
            });
        }
    }

    // Employee Type methods
    openNewEmployeeType() {
        this.employeeType = {} as EmployeeTypeDto;
        this.editingEmployeeType = null;
        this.employeeTypeDialog = true;
    }

    editEmployeeType(employeeType: EmployeeTypeResponseDto) {
        this.employeeType = {
            name: employeeType.name,
            description: employeeType.description
        };
        this.editingEmployeeType = employeeType;
        this.employeeTypeDialog = true;
    }

    deleteEmployeeType(employeeType: EmployeeTypeResponseDto) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de que quieres eliminar el tipo de empleado "${employeeType.name}"?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.employeeTypeService.delete(employeeType.id).subscribe({
                    next: () => {
                        this.loadReferenceData();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Tipo de empleado eliminado correctamente',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al eliminar tipo de empleado',
                            life: 3000
                        });
                        console.error('Error deleting employee type:', error);
                    }
                });
            }
        });
    }

    saveEmployeeType() {
        if (this.editingEmployeeType) {
            // Update existing employee type
            this.employeeTypeService.update(this.editingEmployeeType.id, this.employeeType).subscribe({
                next: () => {
                    this.loadReferenceData();
                    this.employeeTypeDialog = false;
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Tipo de empleado actualizado correctamente',
                        life: 3000
                    });
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error al actualizar tipo de empleado',
                        life: 3000
                    });
                    console.error('Error updating employee type:', error);
                }
            });
        } else {
            // Create new employee type
            this.employeeTypeService.create(this.employeeType).subscribe({
                next: () => {
                    this.loadReferenceData();
                    this.employeeTypeDialog = false;
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Tipo de empleado creado correctamente',
                        life: 3000
                    });
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error al crear tipo de empleado',
                        life: 3000
                    });
                    console.error('Error creating employee type:', error);
                }
            });
        }
    }
}
