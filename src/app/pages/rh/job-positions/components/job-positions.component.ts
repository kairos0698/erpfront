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
import { JobPositionService } from '../services/job-position.service';
import { AreaService } from '../services/area.service';
import { HierarchicalLevelService } from '../services/hierarchical-level.service';
import { ContractTypeService } from '../services/contract-type.service';
import { WorkShiftService } from '../services/work-shift.service';
import { LaborRiskService } from '../services/labor-risk.service';
import { ShiftService } from '../services/shift.service';
import { PaymentPeriodService } from '../services/payment-period.service';
import { PaymentUnitService } from '../services/payment-unit.service';
import { AuthService } from '../../../../auth.service';
import { 
  JobPositionDto, 
  CreateJobPositionDto, 
  UpdateJobPositionDto,
  AreaDto,
  HierarchicalLevelDto,
  ContractTypeDto,
  WorkShiftDto,
  LaborRiskDto,
  ShiftDto,
  PaymentPeriodDto,
  PaymentUnitDto
} from '../models/job-position.model';

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
  selector: 'app-job-positions',
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
            <p-button label="Nuevo" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
            <!-- <p-button severity="secondary" label="Eliminar" icon="pi pi-trash" outlined (onClick)="deleteSelectedJobPositions()" [disabled]="!selectedJobPositions || !selectedJobPositions.length" /> -->
        </ng-template>

        <ng-template #end>
            <p-button label="Exportar" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
        </ng-template>
    </p-toolbar>

    <div class="card">
    <p-table
        #dt
        [value]="jobPositions()"
        [rows]="10"
        [columns]="cols"
        [paginator]="true"
        [globalFilterFields]="['name', 'areaName', 'hierarchicalLevelName', 'contractTypeName']"
        [tableStyle]="{ 'min-width': '75rem' }"
        [(selection)]="selectedJobPositions"
        [rowHover]="true"
        dataKey="id"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} puestos de trabajo"
        [showCurrentPageReport]="true"
        [rowsPerPageOptions]="[10, 20, 30]"
    >
        <ng-template #caption>
            <div class="flex items-center justify-between">
                <h5 class="m-0">Gestión de Puestos de Trabajo</h5>
                <p-iconfield>
                    <p-inputicon styleClass="pi pi-search" />
                    <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Buscar..." />
                </p-iconfield>
            </div>
        </ng-template>
        <ng-template #header>
            <tr>
                <!-- <th style="width: 3rem">
                    <p-tableHeaderCheckbox />
                </th> -->
                <th pSortableColumn="name" style="min-width:16rem">
                    Nombre del Puesto
                    <p-sortIcon field="name" />
                </th>
                <th pSortableColumn="areaName" style="min-width:12rem">
                    Área/Departamento
                    <p-sortIcon field="areaName" />
                </th>
                <th pSortableColumn="hierarchicalLevelName" style="min-width:12rem">
                    Nivel Jerárquico
                    <p-sortIcon field="hierarchicalLevelName" />
                </th>
                <th pSortableColumn="contractTypeName" style="min-width:12rem">
                    Tipo de Contrato
                    <p-sortIcon field="contractTypeName" />
                </th>
                <th pSortableColumn="baseSalary" style="min-width: 8rem">
                    Salario Base
                    <p-sortIcon field="baseSalary" />
                </th>
                <th pSortableColumn="isActive" style="min-width: 8rem">
                    Estado
                    <p-sortIcon field="isActive" />
                </th>
                <th style="min-width: 12rem"></th>
            </tr>
        </ng-template>
        <ng-template #body let-jobPosition>
            <tr>
                <!-- <td style="width: 3rem">
                    <p-tableCheckbox [value]="jobPosition" />
                </td> -->
                <td style="min-width: 16rem">{{ jobPosition.name }}</td>
                <td style="min-width: 12rem">{{ jobPosition.areaName }}</td>
                <td style="min-width: 12rem">{{ jobPosition.hierarchicalLevelName }}</td>
                <td style="min-width: 12rem">{{ jobPosition.contractTypeName }}</td>
                <td>{{ jobPosition.baseSalary | currency:'USD':'symbol':'1.2-2' }}</td>
                <td>
                    <p-tag [value]="jobPosition.isActive ? 'Activo' : 'Inactivo'" [severity]="getSeverity(jobPosition.isActive)" />
                </td>
                <td>
                    <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editJobPosition(jobPosition)" />
                    <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteJobPosition(jobPosition)" />
                </td>
            </tr>
        </ng-template>
    </p-table>

    </div>
    <p-dialog [(visible)]="jobPositionDialog" [style]="{ width: '800px' }" header="Detalles del Puesto de Trabajo" [modal]="true">
        <ng-template #content>
            <div class="flex flex-col gap-6">
                <!-- Información Básica -->
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12">
                        <label for="name" class="block font-bold mb-3">Nombre del Puesto *</label>
                        <input type="text" pInputText id="name" [(ngModel)]="jobPosition.name" required autofocus fluid />
                        <small class="text-red-500" *ngIf="submitted && !jobPosition.name">El nombre es requerido.</small>
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="areaId" class="block font-bold mb-3">Área/Departamento *</label>
                        <div class="flex gap-2">
                            <p-select 
                                [(ngModel)]="jobPosition.areaId" 
                                inputId="areaId" 
                                [options]="areas()" 
                                optionLabel="name" 
                                optionValue="id" 
                                placeholder="Seleccionar área" 
                                fluid 
                                class="flex-1">
                                <ng-template let-area pTemplate="item">
                                    <div class="flex items-center justify-between w-full">
                                        <span>{{area.name}}</span>
                                        <div class="flex gap-1" *ngIf="canEditItem(area.organizationId)">
                                            <p-button 
                                                icon="pi pi-pencil" 
                                                [text]="true" 
                                                [rounded]="true" 
                                                size="small" 
                                                (onClick)="quickEditArea($event, area)" 
                                                pTooltip="Editar área"
                                                severity="info" />
                                            <p-button 
                                                icon="pi pi-trash" 
                                                [text]="true" 
                                                [rounded]="true" 
                                                size="small" 
                                                (onClick)="quickDeleteArea($event, area)" 
                                                pTooltip="Eliminar área"
                                                severity="danger" />
                                        </div>
                                    </div>
                                </ng-template>
                            </p-select>
                            <p-button icon="pi pi-plus" severity="secondary" size="small" (onClick)="openNewArea()" pTooltip="Agregar nueva área" />
                        </div>
                        <small class="text-red-500" *ngIf="submitted && !jobPosition.areaId">El área es requerida.</small>
                    </div>
                    
                    <div class="col-span-6">
                        <label for="hierarchicalLevelId" class="block font-bold mb-3">Nivel Jerárquico *</label>
                        <div class="flex gap-2">
                            <p-select 
                                [(ngModel)]="jobPosition.hierarchicalLevelId" 
                                inputId="hierarchicalLevelId" 
                                [options]="hierarchicalLevels()" 
                                optionLabel="name" 
                                optionValue="id" 
                                placeholder="Seleccionar nivel" 
                                fluid 
                                class="flex-1">
                                <ng-template let-level pTemplate="item">
                                    <div class="flex items-center justify-between w-full">
                                        <span>{{level.name}}</span>
                                        <div class="flex gap-1" *ngIf="canEditItem(level.organizationId)">
                                            <p-button 
                                                icon="pi pi-pencil" 
                                                [text]="true" 
                                                [rounded]="true" 
                                                size="small" 
                                                (onClick)="quickEditHierarchicalLevel($event, level)" 
                                                pTooltip="Editar nivel"
                                                severity="info" />
                                            <p-button 
                                                icon="pi pi-trash" 
                                                [text]="true" 
                                                [rounded]="true" 
                                                size="small" 
                                                (onClick)="quickDeleteHierarchicalLevel($event, level)" 
                                                pTooltip="Eliminar nivel"
                                                severity="danger" />
                                        </div>
                                    </div>
                                </ng-template>
                            </p-select>
                            <p-button icon="pi pi-plus" severity="secondary" size="small" (onClick)="openNewHierarchicalLevel()" pTooltip="Agregar nuevo nivel" />
                        </div>
                        <small class="text-red-500" *ngIf="submitted && !jobPosition.hierarchicalLevelId">El nivel jerárquico es requerido.</small>
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="contractTypeId" class="block font-bold mb-3">Tipo de Contrato *</label>
                        <div class="flex gap-2">
                            <p-select 
                                [(ngModel)]="jobPosition.contractTypeId" 
                                inputId="contractTypeId" 
                                [options]="contractTypes()" 
                                optionLabel="name" 
                                optionValue="id" 
                                placeholder="Seleccionar tipo" 
                                fluid 
                                class="flex-1">
                                <ng-template let-contractType pTemplate="item">
                                    <div class="flex items-center justify-between w-full">
                                        <span>{{contractType.name}}</span>
                                        <div class="flex gap-1" *ngIf="canEditItem(contractType.organizationId)">
                                            <p-button 
                                                icon="pi pi-pencil" 
                                                [text]="true" 
                                                [rounded]="true" 
                                                size="small" 
                                                (onClick)="quickEditContractType($event, contractType)" 
                                                pTooltip="Editar tipo de contrato"
                                                severity="info" />
                                            <p-button 
                                                icon="pi pi-trash" 
                                                [text]="true" 
                                                [rounded]="true" 
                                                size="small" 
                                                (onClick)="quickDeleteContractType($event, contractType)" 
                                                pTooltip="Eliminar tipo de contrato"
                                                severity="danger" />
                                        </div>
                                    </div>
                                </ng-template>
                            </p-select>
                            <p-button icon="pi pi-plus" severity="secondary" size="small" (onClick)="openNewContractType()" pTooltip="Agregar nuevo tipo" />
                        </div>
                        <small class="text-red-500" *ngIf="submitted && !jobPosition.contractTypeId">El tipo de contrato es requerido.</small>
                    </div>
                    
                    <div class="col-span-6">
                        <label for="workShiftId" class="block font-bold mb-3">Tipo de Jornada *</label>
                        <div class="flex gap-2">
                            <p-select 
                                [(ngModel)]="jobPosition.workShiftId" 
                                inputId="workShiftId" 
                                [options]="workShifts()" 
                                optionLabel="name" 
                                optionValue="id" 
                                placeholder="Seleccionar jornada" 
                                fluid 
                                class="flex-1">
                                <ng-template let-workShift pTemplate="item">
                                    <div class="flex items-center justify-between w-full">
                                        <span>{{workShift.name}}</span>
                                        <div class="flex gap-1" *ngIf="canEditItem(workShift.organizationId)">
                                            <p-button 
                                                icon="pi pi-pencil" 
                                                [text]="true" 
                                                [rounded]="true" 
                                                size="small" 
                                                (onClick)="quickEditWorkShift($event, workShift)" 
                                                pTooltip="Editar jornada"
                                                severity="info" />
                                            <p-button 
                                                icon="pi pi-trash" 
                                                [text]="true" 
                                                [rounded]="true" 
                                                size="small" 
                                                (onClick)="quickDeleteWorkShift($event, workShift)" 
                                                pTooltip="Eliminar jornada"
                                                severity="danger" />
                                        </div>
                                    </div>
                                </ng-template>
                            </p-select>
                            <p-button icon="pi pi-plus" severity="secondary" size="small" (onClick)="openNewWorkShift()" pTooltip="Agregar nueva jornada" />
                        </div>
                        <small class="text-red-500" *ngIf="submitted && !jobPosition.workShiftId">El tipo de jornada es requerido.</small>
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="laborRiskId" class="block font-bold mb-3">Riesgo Laboral *</label>
                        <div class="flex gap-2">
                            <p-select 
                                [(ngModel)]="jobPosition.laborRiskId" 
                                inputId="laborRiskId" 
                                [options]="laborRisks()" 
                                optionLabel="name" 
                                optionValue="id" 
                                placeholder="Seleccionar riesgo" 
                                fluid 
                                class="flex-1">
                                <ng-template let-laborRisk pTemplate="item">
                                    <div class="flex items-center justify-between w-full">
                                        <span>{{laborRisk.name}}</span>
                                        <div class="flex gap-1" *ngIf="canEditItem(laborRisk.organizationId)">
                                            <p-button 
                                                icon="pi pi-pencil" 
                                                [text]="true" 
                                                [rounded]="true" 
                                                size="small" 
                                                (onClick)="quickEditLaborRisk($event, laborRisk)" 
                                                pTooltip="Editar riesgo"
                                                severity="info" />
                                            <p-button 
                                                icon="pi pi-trash" 
                                                [text]="true" 
                                                [rounded]="true" 
                                                size="small" 
                                                (onClick)="quickDeleteLaborRisk($event, laborRisk)" 
                                                pTooltip="Eliminar riesgo"
                                                severity="danger" />
                                        </div>
                                    </div>
                                </ng-template>
                            </p-select>
                            <p-button icon="pi pi-plus" severity="secondary" size="small" (onClick)="openNewLaborRisk()" pTooltip="Agregar nuevo riesgo" />
                        </div>
                        <small class="text-red-500" *ngIf="submitted && !jobPosition.laborRiskId">El riesgo laboral es requerido.</small>
                    </div>
                    
                    <div class="col-span-6">
                        <label for="shiftId" class="block font-bold mb-3">Turno *</label>
                        <div class="flex gap-2">
                            <p-select 
                                [(ngModel)]="jobPosition.shiftId" 
                                inputId="shiftId" 
                                [options]="shifts()" 
                                optionLabel="name" 
                                optionValue="id" 
                                placeholder="Seleccionar turno" 
                                fluid 
                                class="flex-1">
                                <ng-template let-shift pTemplate="item">
                                    <div class="flex items-center justify-between w-full">
                                        <span>{{shift.name}}</span>
                                        <div class="flex gap-1" *ngIf="canEditItem(shift.organizationId)">
                                            <p-button 
                                                icon="pi pi-pencil" 
                                                [text]="true" 
                                                [rounded]="true" 
                                                size="small" 
                                                (onClick)="quickEditShift($event, shift)" 
                                                pTooltip="Editar turno"
                                                severity="info" />
                                            <p-button 
                                                icon="pi pi-trash" 
                                                [text]="true" 
                                                [rounded]="true" 
                                                size="small" 
                                                (onClick)="quickDeleteShift($event, shift)" 
                                                pTooltip="Eliminar turno"
                                                severity="danger" />
                                        </div>
                                    </div>
                                </ng-template>
                            </p-select>
                            <p-button icon="pi pi-plus" severity="secondary" size="small" (onClick)="openNewShift()" pTooltip="Agregar nuevo turno" />
                        </div>
                        <small class="text-red-500" *ngIf="submitted && !jobPosition.shiftId">El turno es requerido.</small>
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="paymentPeriodId" class="block font-bold mb-3">Período de Pago *</label>
                        <div class="flex gap-2">
                            <p-select 
                                [(ngModel)]="jobPosition.paymentPeriodId" 
                                inputId="paymentPeriodId" 
                                [options]="paymentPeriods()" 
                                optionLabel="name" 
                                optionValue="id" 
                                placeholder="Seleccionar período" 
                                fluid 
                                class="flex-1">
                                <ng-template let-paymentPeriod pTemplate="item">
                                    <div class="flex items-center justify-between w-full">
                                        <span>{{paymentPeriod.name}}</span>
                                        <div class="flex gap-1" *ngIf="canEditItem(paymentPeriod.organizationId)">
                                            <p-button 
                                                icon="pi pi-pencil" 
                                                [text]="true" 
                                                [rounded]="true" 
                                                size="small" 
                                                (onClick)="quickEditPaymentPeriod($event, paymentPeriod)" 
                                                pTooltip="Editar período"
                                                severity="info" />
                                            <p-button 
                                                icon="pi pi-trash" 
                                                [text]="true" 
                                                [rounded]="true" 
                                                size="small" 
                                                (onClick)="quickDeletePaymentPeriod($event, paymentPeriod)" 
                                                pTooltip="Eliminar período"
                                                severity="danger" />
                                        </div>
                                    </div>
                                </ng-template>
                            </p-select>
                            <p-button icon="pi pi-plus" severity="secondary" size="small" (onClick)="openNewPaymentPeriod()" pTooltip="Agregar nuevo período" />
                        </div>
                        <small class="text-red-500" *ngIf="submitted && !jobPosition.paymentPeriodId">El período de pago es requerido.</small>
                    </div>
                    
                    <div class="col-span-6">
                        <label for="paymentUnitId" class="block font-bold mb-3">Unidad de Pago *</label>
                        <div class="flex gap-2">
                            <p-select 
                                [(ngModel)]="jobPosition.paymentUnitId" 
                                inputId="paymentUnitId" 
                                [options]="paymentUnits()" 
                                optionLabel="name" 
                                optionValue="id" 
                                placeholder="Seleccionar unidad" 
                                fluid 
                                class="flex-1">
                                <ng-template let-paymentUnit pTemplate="item">
                                    <div class="flex items-center justify-between w-full">
                                        <span>{{paymentUnit.name}}</span>
                                        <div class="flex gap-1" *ngIf="canEditItem(paymentUnit.organizationId)">
                                            <p-button 
                                                icon="pi pi-pencil" 
                                                [text]="true" 
                                                [rounded]="true" 
                                                size="small" 
                                                (onClick)="quickEditPaymentUnit($event, paymentUnit)" 
                                                pTooltip="Editar unidad"
                                                severity="info" />
                                            <p-button 
                                                icon="pi pi-trash" 
                                                [text]="true" 
                                                [rounded]="true" 
                                                size="small" 
                                                (onClick)="quickDeletePaymentUnit($event, paymentUnit)" 
                                                pTooltip="Eliminar unidad"
                                                severity="danger" />
                                        </div>
                                    </div>
                                </ng-template>
                            </p-select>
                            <p-button icon="pi pi-plus" severity="secondary" size="small" (onClick)="openNewPaymentUnit()" pTooltip="Agregar nueva unidad" />
                        </div>
                        <small class="text-red-500" *ngIf="submitted && !jobPosition.paymentUnitId">La unidad de pago es requerida.</small>
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="baseSalary" class="block font-bold mb-3">Salario Base Sugerido</label>
                        <p-inputnumber id="baseSalary" [(ngModel)]="jobPosition.baseSalary" mode="currency" currency="USD" locale="en-US" fluid />
                    </div>
                    
                    <div class="col-span-6">
                        <div class="field-checkbox">
                            <p-checkbox [(ngModel)]="jobPosition.isActive" inputId="isActive" />
                            <label for="isActive">Activo</label>
                        </div>
                    </div>
                </div>

                <div class="col-span-12">
                    <label for="description" class="block font-bold mb-3">Descripción General</label>
                    <textarea id="description" pTextarea [(ngModel)]="jobPosition.description" rows="3" cols="20" fluid></textarea>
                </div>
            </div>
        </ng-template>

        <ng-template #footer>
            <p-button label="Cancelar" icon="pi pi-times" text (click)="hideDialog()" />
            <p-button label="Guardar" icon="pi pi-check" (click)="saveJobPosition()" />
        </ng-template>
    </p-dialog>

    <!-- Mini CRUD Modals -->
    <!-- Area Modal -->
    <p-dialog [(visible)]="areaDialog" [style]="{ width: '450px' }" header="Detalles del Área" [modal]="true">
        <ng-template #content>
            <div class="flex flex-col gap-6">
                <div>
                    <label for="areaName" class="block font-bold mb-3">Nombre *</label>
                    <input type="text" pInputText id="areaName" [(ngModel)]="area.name" required autofocus fluid />
                    <small class="text-red-500" *ngIf="areaSubmitted && !area.name">El nombre es requerido.</small>
                </div>
                <div>
                    <label for="areaDescription" class="block font-bold mb-3">Descripción</label>
                    <textarea id="areaDescription" pTextarea [(ngModel)]="area.description" rows="3" cols="20" fluid></textarea>
                </div>
                <div class="field-checkbox">
                            <p-checkbox [(ngModel)]="area.isActive" inputId="areaIsActive" [binary]="true" />
                    <label for="areaIsActive">Activo</label>
                </div>
            </div>
        </ng-template>
        <ng-template #footer>
            <p-button label="Cancelar" icon="pi pi-times" text (click)="hideAreaDialog()" />
            <p-button label="Guardar" icon="pi pi-check" (click)="saveArea()" />
        </ng-template>
    </p-dialog>

    <!-- Hierarchical Level Modal -->
    <p-dialog [(visible)]="hierarchicalLevelDialog" [style]="{ width: '450px' }" header="Detalles del Nivel Jerárquico" [modal]="true">
        <ng-template #content>
            <div class="flex flex-col gap-6">
                <div>
                    <label for="hierarchicalLevelName" class="block font-bold mb-3">Nombre *</label>
                    <input type="text" pInputText id="hierarchicalLevelName" [(ngModel)]="hierarchicalLevel.name" required autofocus fluid />
                    <small class="text-red-500" *ngIf="hierarchicalLevelSubmitted && !hierarchicalLevel.name">El nombre es requerido.</small>
                </div>
                <div>
                    <label for="hierarchicalLevelLevel" class="block font-bold mb-3">Nivel Jerárquico *</label>
                    <p-inputNumber id="hierarchicalLevelLevel" [(ngModel)]="hierarchicalLevel.level" placeholder="Nivel jerárquico" fluid />
                    <small class="text-red-500" *ngIf="hierarchicalLevelSubmitted && !hierarchicalLevel.level">El nivel es requerido.</small>
                </div>
                <div>
                    <label for="hierarchicalLevelDescription" class="block font-bold mb-3">Descripción</label>
                    <textarea id="hierarchicalLevelDescription" pTextarea [(ngModel)]="hierarchicalLevel.description" rows="3" cols="20" fluid></textarea>
                </div>
                <div class="field-checkbox">
                    <p-checkbox [(ngModel)]="hierarchicalLevel.isActive" inputId="hierarchicalLevelIsActive" [binary]="true" />
                    <label for="hierarchicalLevelIsActive">Activo</label>
                </div>
            </div>
        </ng-template>
        <ng-template #footer>
            <p-button label="Cancelar" icon="pi pi-times" text (click)="hideHierarchicalLevelDialog()" />
            <p-button label="Guardar" icon="pi pi-check" (click)="saveHierarchicalLevel()" />
        </ng-template>
    </p-dialog>

    <!-- Contract Type Modal -->
    <p-dialog [(visible)]="contractTypeDialog" [style]="{ width: '450px' }" header="Detalles del Tipo de Contrato" [modal]="true">
        <ng-template #content>
            <div class="flex flex-col gap-6">
                <div>
                    <label for="contractTypeName" class="block font-bold mb-3">Nombre *</label>
                    <input type="text" pInputText id="contractTypeName" [(ngModel)]="contractType.name" required autofocus fluid />
                    <small class="text-red-500" *ngIf="contractTypeSubmitted && !contractType.name">El nombre es requerido.</small>
                </div>
                <div>
                    <label for="contractTypeDescription" class="block font-bold mb-3">Descripción</label>
                    <textarea id="contractTypeDescription" pTextarea [(ngModel)]="contractType.description" rows="3" cols="20" fluid></textarea>
                </div>
                <div class="field-checkbox">
                    <p-checkbox [(ngModel)]="contractType.isActive" inputId="contractTypeIsActive" [binary]="true" />
                    <label for="contractTypeIsActive">Activo</label>
                </div>
            </div>
        </ng-template>
        <ng-template #footer>
            <p-button label="Cancelar" icon="pi pi-times" text (click)="hideContractTypeDialog()" />
            <p-button label="Guardar" icon="pi pi-check" (click)="saveContractType()" />
        </ng-template>
    </p-dialog>

    <!-- Work Shift Modal -->
    <p-dialog [(visible)]="workShiftDialog" [style]="{ width: '450px' }" header="Detalles del Tipo de Jornada" [modal]="true">
        <ng-template #content>
            <div class="flex flex-col gap-6">
                <div>
                    <label for="workShiftName" class="block font-bold mb-3">Nombre *</label>
                    <input type="text" pInputText id="workShiftName" [(ngModel)]="workShift.name" required autofocus fluid />
                    <small class="text-red-500" *ngIf="workShiftSubmitted && !workShift.name">El nombre es requerido.</small>
                </div>
                <div>
                    <label for="workShiftDescription" class="block font-bold mb-3">Descripción</label>
                    <textarea id="workShiftDescription" pTextarea [(ngModel)]="workShift.description" rows="3" cols="20" fluid></textarea>
                </div>
                <div class="field-checkbox">
                    <p-checkbox [(ngModel)]="workShift.isActive" inputId="workShiftIsActive" [binary]="true" />
                    <label for="workShiftIsActive">Activo</label>
                </div>
            </div>
        </ng-template>
        <ng-template #footer>
            <p-button label="Cancelar" icon="pi pi-times" text (click)="hideWorkShiftDialog()" />
            <p-button label="Guardar" icon="pi pi-check" (click)="saveWorkShift()" />
        </ng-template>
    </p-dialog>

    <!-- Labor Risk Modal -->
    <p-dialog [(visible)]="laborRiskDialog" [style]="{ width: '450px' }" header="Detalles del Riesgo Laboral" [modal]="true">
        <ng-template #content>
            <div class="flex flex-col gap-6">
                <div>
                    <label for="laborRiskName" class="block font-bold mb-3">Nombre *</label>
                    <input type="text" pInputText id="laborRiskName" [(ngModel)]="laborRisk.name" required autofocus fluid />
                    <small class="text-red-500" *ngIf="laborRiskSubmitted && !laborRisk.name">El nombre es requerido.</small>
                </div>
                <div>
                    <label for="laborRiskLevel" class="block font-bold mb-3">Nivel de Riesgo *</label>
                    <p-select [(ngModel)]="laborRisk.riskLevel" inputId="laborRiskLevel" [options]="riskLevelOptions" optionLabel="label" optionValue="value" placeholder="Seleccionar nivel" fluid />
                    <small class="text-red-500" *ngIf="laborRiskSubmitted && !laborRisk.riskLevel">El nivel de riesgo es requerido.</small>
                </div>
                <div>
                    <label for="laborRiskDescription" class="block font-bold mb-3">Descripción</label>
                    <textarea id="laborRiskDescription" pTextarea [(ngModel)]="laborRisk.description" rows="3" cols="20" fluid></textarea>
                </div>
                <div class="field-checkbox">
                    <p-checkbox [(ngModel)]="laborRisk.isActive" inputId="laborRiskIsActive" [binary]="true" />
                    <label for="laborRiskIsActive">Activo</label>
                </div>
            </div>
        </ng-template>
        <ng-template #footer>
            <p-button label="Cancelar" icon="pi pi-times" text (click)="hideLaborRiskDialog()" />
            <p-button label="Guardar" icon="pi pi-check" (click)="saveLaborRisk()" />
        </ng-template>
    </p-dialog>

    <!-- Shift Modal -->
    <p-dialog [(visible)]="shiftDialog" [style]="{ width: '450px' }" header="Detalles del Turno" [modal]="true">
        <ng-template #content>
            <div class="flex flex-col gap-6">
                <div>
                    <label for="shiftName" class="block font-bold mb-3">Nombre *</label>
                    <input type="text" pInputText id="shiftName" [(ngModel)]="shift.name" required autofocus fluid />
                    <small class="text-red-500" *ngIf="shiftSubmitted && !shift.name">El nombre es requerido.</small>
                </div>
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="shiftStartTime" class="block font-bold mb-3">Hora de Inicio *</label>
                        <input type="time" pInputText id="shiftStartTime" [(ngModel)]="shift.startTime" required fluid />
                        <small class="text-red-500" *ngIf="shiftSubmitted && !shift.startTime">La hora de inicio es requerida.</small>
                    </div>
                    <div class="col-span-6">
                        <label for="shiftEndTime" class="block font-bold mb-3">Hora de Fin *</label>
                        <input type="time" pInputText id="shiftEndTime" [(ngModel)]="shift.endTime" required fluid />
                        <small class="text-red-500" *ngIf="shiftSubmitted && !shift.endTime">La hora de fin es requerida.</small>
                    </div>
                </div>
                <div>
                    <label for="shiftDescription" class="block font-bold mb-3">Descripción</label>
                    <textarea id="shiftDescription" pTextarea [(ngModel)]="shift.description" rows="3" cols="20" fluid></textarea>
                </div>
                <div class="field-checkbox">
                    <p-checkbox [(ngModel)]="shift.isActive" inputId="shiftIsActive" [binary]="true" />
                    <label for="shiftIsActive">Activo</label>
                </div>
            </div>
        </ng-template>
        <ng-template #footer>
            <p-button label="Cancelar" icon="pi pi-times" text (click)="hideShiftDialog()" />
            <p-button label="Guardar" icon="pi pi-check" (click)="saveShift()" />
        </ng-template>
    </p-dialog>

    <!-- Payment Period Modal -->
    <p-dialog [(visible)]="paymentPeriodDialog" [style]="{ width: '450px' }" header="Detalles del Período de Pago" [modal]="true">
        <ng-template #content>
            <div class="flex flex-col gap-6">
                <div>
                    <label for="paymentPeriodName" class="block font-bold mb-3">Nombre *</label>
                    <input type="text" pInputText id="paymentPeriodName" [(ngModel)]="paymentPeriod.name" required autofocus fluid />
                    <small class="text-red-500" *ngIf="paymentPeriodSubmitted && !paymentPeriod.name">El nombre es requerido.</small>
                </div>
                <div>
                    <label for="paymentPeriodDays" class="block font-bold mb-3">Días *</label>
                    <p-inputNumber id="paymentPeriodDays" [(ngModel)]="paymentPeriod.days" placeholder="Número de días" fluid />
                    <small class="text-red-500" *ngIf="paymentPeriodSubmitted && !paymentPeriod.days">Los días son requeridos.</small>
                </div>
                <div>
                    <label for="paymentPeriodDescription" class="block font-bold mb-3">Descripción</label>
                    <textarea id="paymentPeriodDescription" pTextarea [(ngModel)]="paymentPeriod.description" rows="3" cols="20" fluid></textarea>
                </div>
                <div class="field-checkbox">
                    <p-checkbox [(ngModel)]="paymentPeriod.isActive" inputId="paymentPeriodIsActive" [binary]="true" />
                    <label for="paymentPeriodIsActive">Activo</label>
                </div>
            </div>
        </ng-template>
        <ng-template #footer>
            <p-button label="Cancelar" icon="pi pi-times" text (click)="hidePaymentPeriodDialog()" />
            <p-button label="Guardar" icon="pi pi-check" (click)="savePaymentPeriod()" />
        </ng-template>
    </p-dialog>

    <!-- Payment Unit Modal -->
    <p-dialog [(visible)]="paymentUnitDialog" [style]="{ width: '450px' }" header="Detalles de la Unidad de Pago" [modal]="true">
        <ng-template #content>
            <div class="flex flex-col gap-6">
                <div>
                    <label for="paymentUnitName" class="block font-bold mb-3">Nombre *</label>
                    <input type="text" pInputText id="paymentUnitName" [(ngModel)]="paymentUnit.name" required autofocus fluid />
                    <small class="text-red-500" *ngIf="paymentUnitSubmitted && !paymentUnit.name">El nombre es requerido.</small>
                </div>
                <div>
                    <label for="paymentUnitSymbol" class="block font-bold mb-3">Símbolo *</label>
                    <input type="text" pInputText id="paymentUnitSymbol" [(ngModel)]="paymentUnit.symbol" placeholder="Ej: $, €, kg, hrs" required fluid />
                    <small class="text-red-500" *ngIf="paymentUnitSubmitted && !paymentUnit.symbol">El símbolo es requerido.</small>
                </div>
                <div>
                    <label for="paymentUnitDescription" class="block font-bold mb-3">Descripción</label>
                    <textarea id="paymentUnitDescription" pTextarea [(ngModel)]="paymentUnit.description" rows="3" cols="20" fluid></textarea>
                </div>
                <div class="field-checkbox">
                    <p-checkbox [(ngModel)]="paymentUnit.isActive" inputId="paymentUnitIsActive" [binary]="true" />
                    <label for="paymentUnitIsActive">Activo</label>
                </div>
            </div>
        </ng-template>
        <ng-template #footer>
            <p-button label="Cancelar" icon="pi pi-times" text (click)="hidePaymentUnitDialog()" />
            <p-button label="Guardar" icon="pi pi-check" (click)="savePaymentUnit()" />
        </ng-template>
    </p-dialog>

    <p-confirmdialog [style]="{ width: '450px' }" />
  `,
  providers: [MessageService, ConfirmationService]
})
export class JobPositionsComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  jobPositionDialog: boolean = false;
  jobPosition!: JobPositionDto;
  selectedJobPositions!: JobPositionDto[] | null;
  submitted: boolean = false;

  // Reference data
  jobPositions = signal<JobPositionDto[]>([]);
  areas = signal<AreaDto[]>([]);
  hierarchicalLevels = signal<HierarchicalLevelDto[]>([]);
  contractTypes = signal<ContractTypeDto[]>([]);
  workShifts = signal<WorkShiftDto[]>([]);
  laborRisks = signal<LaborRiskDto[]>([]);
  shifts = signal<ShiftDto[]>([]);
  paymentPeriods = signal<PaymentPeriodDto[]>([]);
  paymentUnits = signal<PaymentUnitDto[]>([]);

  // Mini CRUD modals
  areaDialog: boolean = false;
  area!: AreaDto;
  areaSubmitted: boolean = false;

  hierarchicalLevelDialog: boolean = false;
  hierarchicalLevel!: HierarchicalLevelDto;
  hierarchicalLevelSubmitted: boolean = false;

  contractTypeDialog: boolean = false;
  contractType!: ContractTypeDto;
  contractTypeSubmitted: boolean = false;

  workShiftDialog: boolean = false;
  workShift!: WorkShiftDto;
  workShiftSubmitted: boolean = false;

  laborRiskDialog: boolean = false;
  laborRisk!: LaborRiskDto;
  laborRiskSubmitted: boolean = false;

  shiftDialog: boolean = false;
  shift!: ShiftDto;
  shiftSubmitted: boolean = false;

  paymentPeriodDialog: boolean = false;
  paymentPeriod!: PaymentPeriodDto;
  paymentPeriodSubmitted: boolean = false;

  paymentUnitDialog: boolean = false;
  paymentUnit!: PaymentUnitDto;
  paymentUnitSubmitted: boolean = false;

  exportColumns!: ExportColumn[];
  cols!: Column[];

  // Options for dropdowns
  riskLevelOptions = [
    { label: 'Bajo', value: 'Bajo' },
    { label: 'Medio', value: 'Medio' },
    { label: 'Alto', value: 'Alto' }
  ];

  // User organization info
  private readonly systemOrganizationId = '00000000-0000-0000-0000-000000000001';
  currentUserOrganizationId: string | null = null;

  constructor(
    private jobPositionService: JobPositionService,
    private areaService: AreaService,
    private hierarchicalLevelService: HierarchicalLevelService,
    private contractTypeService: ContractTypeService,
    private workShiftService: WorkShiftService,
    private laborRiskService: LaborRiskService,
    private shiftService: ShiftService,
    private paymentPeriodService: PaymentPeriodService,
    private paymentUnitService: PaymentUnitService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private authService: AuthService
  ) {
    const currentUser = this.authService.getCurrentUser();
    this.currentUserOrganizationId = currentUser?.organizationId || null;
  }

  ngOnInit() {
    this.loadData();
    this.setupColumns();
  }

  loadData() {
    // Load job positions
    this.jobPositionService.getAll().subscribe({
      next: (response) => {
        this.jobPositions.set(response);
      },
      error: (error) => {
        console.error('Error loading job positions:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar puestos de trabajo'
        });
      }
    });

    // Load reference data
    this.loadReferenceData();
  }

  loadReferenceData() {
    // Load areas
    this.areaService.getAll().subscribe({
      next: (response) => {
        this.areas.set(response);
      },
      error: (error) => console.error('Error loading areas:', error)
    });

    // Load hierarchical levels
    this.hierarchicalLevelService.getAll().subscribe({
      next: (response) => {
        this.hierarchicalLevels.set(response);
      },
      error: (error) => console.error('Error loading hierarchical levels:', error)
    });

    // Load contract types
    this.contractTypeService.getAll().subscribe({
      next: (response) => {
        this.contractTypes.set(response);
      },
      error: (error) => console.error('Error loading contract types:', error)
    });

    // Load work shifts
    this.workShiftService.getAll().subscribe({
      next: (response) => {
        this.workShifts.set(response);
      },
      error: (error) => console.error('Error loading work shifts:', error)
    });

    // Load labor risks
    this.laborRiskService.getAll().subscribe({
      next: (response) => {
        this.laborRisks.set(response);
      },
      error: (error) => console.error('Error loading labor risks:', error)
    });

    // Load shifts
    this.shiftService.getAll().subscribe({
      next: (response) => {
        this.shifts.set(response);
      },
      error: (error) => console.error('Error loading shifts:', error)
    });

    // Load payment periods
    this.paymentPeriodService.getAll().subscribe({
      next: (response) => {
        this.paymentPeriods.set(response);
      },
      error: (error) => console.error('Error loading payment periods:', error)
    });

    // Load payment units
    this.paymentUnitService.getAll().subscribe({
      next: (response) => {
        this.paymentUnits.set(response);
      },
      error: (error) => console.error('Error loading payment units:', error)
    });
  }

  setupColumns() {
    this.cols = [
      { field: 'name', header: 'Nombre del Puesto' },
      { field: 'areaName', header: 'Área/Departamento' },
      { field: 'hierarchicalLevelName', header: 'Nivel Jerárquico' },
      { field: 'contractTypeName', header: 'Tipo de Contrato' },
      { field: 'baseSalary', header: 'Salario Base' }
    ];

    this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
  }

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  exportCSV() {
    this.dt.exportCSV();
  }

  openNew() {
    this.jobPosition = {} as JobPositionDto;
    this.submitted = false;
    this.jobPositionDialog = true;
  }

  editJobPosition(jobPosition: JobPositionDto) {
    this.jobPosition = { ...jobPosition };
    this.jobPositionDialog = true;
  }

  deleteSelectedJobPositions() {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres eliminar los puestos de trabajo seleccionados?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.jobPositions.set(this.jobPositions().filter((val) => !this.selectedJobPositions?.includes(val)));
        this.selectedJobPositions = null;
        this.messageService.add({
          severity: 'success',
          summary: 'Exitoso',
          detail: 'Puestos de trabajo eliminados',
          life: 3000
        });
      }
    });
  }

  hideDialog() {
    this.jobPositionDialog = false;
    this.submitted = false;
  }

  deleteJobPosition(jobPosition: JobPositionDto) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres eliminar ' + jobPosition.name + '?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.jobPositionService.delete(jobPosition.id).subscribe({
          next: () => {
            this.jobPositions.set(this.jobPositions().filter((val) => val.id !== jobPosition.id));
            this.messageService.add({
              severity: 'success',
              summary: 'Exitoso',
              detail: 'Puesto de trabajo eliminado',
              life: 3000
            });
          },
          error: (error) => {
            console.error('Error deleting job position:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al eliminar puesto de trabajo'
            });
          }
        });
      }
    });
  }

  saveJobPosition() {
    this.submitted = true;

    if (this.jobPosition.name?.trim()) {
      if (this.jobPosition.id) {
        // Update
        const updateDto: UpdateJobPositionDto = {
          id: this.jobPosition.id,
          name: this.jobPosition.name,
          description: this.jobPosition.description,
          areaId: this.jobPosition.areaId,
          hierarchicalLevelId: this.jobPosition.hierarchicalLevelId,
          contractTypeId: this.jobPosition.contractTypeId,
          workShiftId: this.jobPosition.workShiftId,
          laborRiskId: this.jobPosition.laborRiskId,
          shiftId: this.jobPosition.shiftId,
          paymentPeriodId: this.jobPosition.paymentPeriodId,
          baseSalary: this.jobPosition.baseSalary,
          paymentUnitId: this.jobPosition.paymentUnitId,
          isActive: this.jobPosition.isActive
        };

        this.jobPositionService.update(this.jobPosition.id, updateDto).subscribe({
          next: (updatedJobPosition) => {
            this.jobPositions.set(this.jobPositions().map(jp => jp.id === this.jobPosition.id ? updatedJobPosition : jp));
            this.messageService.add({
              severity: 'success',
              summary: 'Exitoso',
              detail: 'Puesto de trabajo actualizado',
              life: 3000
            });
            this.jobPositionDialog = false;
            this.jobPosition = {} as JobPositionDto;
          },
          error: (error) => {
            console.error('Error updating job position:', error);
            const errorMessage = error.error?.message || error.error?.error || error.message || 'Error al actualizar puesto de trabajo';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: errorMessage
            });
          }
        });
      } else {
        // Create
        const createDto: CreateJobPositionDto = {
          name: this.jobPosition.name,
          description: this.jobPosition.description,
          areaId: this.jobPosition.areaId,
          hierarchicalLevelId: this.jobPosition.hierarchicalLevelId,
          contractTypeId: this.jobPosition.contractTypeId,
          workShiftId: this.jobPosition.workShiftId,
          laborRiskId: this.jobPosition.laborRiskId,
          shiftId: this.jobPosition.shiftId,
          paymentPeriodId: this.jobPosition.paymentPeriodId,
          baseSalary: this.jobPosition.baseSalary || 0,
          paymentUnitId: this.jobPosition.paymentUnitId,
          isActive: this.jobPosition.isActive !== undefined ? this.jobPosition.isActive : true
        };

        console.log('Creating job position with data:', createDto);

        this.jobPositionService.create(createDto).subscribe({
          next: (newJobPosition) => {
            this.jobPositions.set([...this.jobPositions(), newJobPosition]);
            this.messageService.add({
              severity: 'success',
              summary: 'Exitoso',
              detail: 'Puesto de trabajo creado',
              life: 3000
            });
            this.jobPositionDialog = false;
            this.jobPosition = {} as JobPositionDto;
          },
          error: (error) => {
            console.error('Error creating job position:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al crear puesto de trabajo'
            });
          }
        });
      }
    }
  }

  getSeverity(isActive: boolean) {
    return isActive ? 'success' : 'danger';
  }

  // Helper method to check if an item can be edited/deleted (belongs to user's organization, not system)
  canEditItem(organizationId: string | undefined): boolean {
    if (!organizationId || !this.currentUserOrganizationId) return false;
    return organizationId !== this.systemOrganizationId && organizationId === this.currentUserOrganizationId;
  }

  // Quick edit/delete methods for dropdown items
  quickEditArea(event: Event, area: AreaDto) {
    event.stopPropagation();
    this.editArea(area);
  }

  quickDeleteArea(event: Event, area: AreaDto) {
    event.stopPropagation();
    this.deleteArea(area);
  }

  quickEditHierarchicalLevel(event: Event, level: HierarchicalLevelDto) {
    event.stopPropagation();
    this.editHierarchicalLevel(level);
  }

  quickDeleteHierarchicalLevel(event: Event, level: HierarchicalLevelDto) {
    event.stopPropagation();
    this.deleteHierarchicalLevel(level);
  }

  quickEditContractType(event: Event, contractType: ContractTypeDto) {
    event.stopPropagation();
    this.editContractType(contractType);
  }

  quickDeleteContractType(event: Event, contractType: ContractTypeDto) {
    event.stopPropagation();
    this.deleteContractType(contractType);
  }

  quickEditWorkShift(event: Event, workShift: WorkShiftDto) {
    event.stopPropagation();
    this.editWorkShift(workShift);
  }

  quickDeleteWorkShift(event: Event, workShift: WorkShiftDto) {
    event.stopPropagation();
    this.deleteWorkShift(workShift);
  }

  quickEditLaborRisk(event: Event, laborRisk: LaborRiskDto) {
    event.stopPropagation();
    this.editLaborRisk(laborRisk);
  }

  quickDeleteLaborRisk(event: Event, laborRisk: LaborRiskDto) {
    event.stopPropagation();
    this.deleteLaborRisk(laborRisk);
  }

  quickEditShift(event: Event, shift: ShiftDto) {
    event.stopPropagation();
    this.editShift(shift);
  }

  quickDeleteShift(event: Event, shift: ShiftDto) {
    event.stopPropagation();
    this.deleteShift(shift);
  }

  quickEditPaymentPeriod(event: Event, paymentPeriod: PaymentPeriodDto) {
    event.stopPropagation();
    this.editPaymentPeriod(paymentPeriod);
  }

  quickDeletePaymentPeriod(event: Event, paymentPeriod: PaymentPeriodDto) {
    event.stopPropagation();
    this.deletePaymentPeriod(paymentPeriod);
  }

  quickEditPaymentUnit(event: Event, paymentUnit: PaymentUnitDto) {
    event.stopPropagation();
    this.editPaymentUnit(paymentUnit);
  }

  quickDeletePaymentUnit(event: Event, paymentUnit: PaymentUnitDto) {
    event.stopPropagation();
    this.deletePaymentUnit(paymentUnit);
  }

  // Mini CRUD methods for Area
  openNewArea() {
    this.area = {} as AreaDto;
    this.areaSubmitted = false;
    this.areaDialog = true;
  }

  editArea(area: AreaDto) {
    this.area = { ...area };
    this.areaSubmitted = false;
    this.areaDialog = true;
  }

  hideAreaDialog() {
    this.areaDialog = false;
    this.areaSubmitted = false;
  }

  saveArea() {
    this.areaSubmitted = true;

    if (this.area.name?.trim()) {
      if (this.area.id) {
        // Update
        const updateDto = {
          id: this.area.id,
          name: this.area.name,
          description: this.area.description,
          isActive: !!this.area.isActive
        };

        this.areaService.update(this.area.id, updateDto).subscribe({
          next: (updatedArea) => {
            this.areas.set(this.areas().map(a => a.id === this.area.id ? updatedArea : a));
            this.messageService.add({
              severity: 'success',
              summary: 'Exitoso',
              detail: 'Área actualizada',
              life: 3000
            });
            this.areaDialog = false;
            this.area = {} as AreaDto;
          },
          error: (error) => {
            console.error('Error updating area:', error);
            const errorMessage = error.error?.message || error.error?.error || error.message || 'Error al actualizar área';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: errorMessage
            });
          }
        });
      } else {
        // Create
        const createDto = {
          name: this.area.name,
          description: this.area.description,
          isActive: !!this.area.isActive
        };

        this.areaService.create(createDto).subscribe({
          next: (newArea) => {
            this.areas.set([...this.areas(), newArea]);
            this.messageService.add({
              severity: 'success',
              summary: 'Exitoso',
              detail: 'Área creada',
              life: 3000
            });
            this.areaDialog = false;
            this.area = {} as AreaDto;
          },
          error: (error) => {
            console.error('Error creating area:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al crear área'
            });
          }
        });
      }
    }
  }

  deleteArea(area: AreaDto) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres eliminar ' + area.name + '?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.areaService.delete(area.id).subscribe({
          next: () => {
            this.areas.set(this.areas().filter(a => a.id !== area.id));
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Exitoso', 
              detail: 'Área eliminada', 
              life: 3000 
            });
            // Clear selection if deleted area was selected
            if (this.jobPosition.areaId === area.id) {
              this.jobPosition.areaId = undefined;
            }
          },
          error: (error) => {
            console.error('Error deleting area:', error);
            this.messageService.add({ 
              severity: 'error', 
              summary: 'Error', 
              detail: error.error?.message || 'Error al eliminar área' 
            });
          }
        });
      }
    });
  }

  // Mini CRUD methods for Hierarchical Level
  openNewHierarchicalLevel() {
    this.hierarchicalLevel = {} as HierarchicalLevelDto;
    this.hierarchicalLevelSubmitted = false;
    this.hierarchicalLevelDialog = true;
  }

  editHierarchicalLevel(level: HierarchicalLevelDto) {
    this.hierarchicalLevel = { ...level };
    this.hierarchicalLevelSubmitted = false;
    this.hierarchicalLevelDialog = true;
  }

  hideHierarchicalLevelDialog() {
    this.hierarchicalLevelDialog = false;
    this.hierarchicalLevelSubmitted = false;
  }

  saveHierarchicalLevel() {
    this.hierarchicalLevelSubmitted = true;

    if (this.hierarchicalLevel.name?.trim()) {
      if (this.hierarchicalLevel.id) {
        // Update
        const updateDto = {
          id: this.hierarchicalLevel.id,
          name: this.hierarchicalLevel.name,
          description: this.hierarchicalLevel.description,
          level: this.hierarchicalLevel.level,
          isActive: this.hierarchicalLevel.isActive
        };

        this.hierarchicalLevelService.update(this.hierarchicalLevel.id, updateDto).subscribe({
          next: (updatedLevel) => {
            this.hierarchicalLevels.set(this.hierarchicalLevels().map(hl => hl.id === this.hierarchicalLevel.id ? updatedLevel : hl));
            this.messageService.add({
              severity: 'success',
              summary: 'Exitoso',
              detail: 'Nivel jerárquico actualizado',
              life: 3000
            });
            this.hierarchicalLevelDialog = false;
            this.hierarchicalLevel = {} as HierarchicalLevelDto;
          },
          error: (error) => {
            console.error('Error updating hierarchical level:', error);
            const errorMessage = error.error?.message || error.error?.error || error.message || 'Error al actualizar nivel jerárquico';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: errorMessage
            });
          }
        });
      } else {
        // Create
        const createDto = {
          name: this.hierarchicalLevel.name,
          description: this.hierarchicalLevel.description,
          level: this.hierarchicalLevel.level,
          isActive: this.hierarchicalLevel.isActive
        };

        this.hierarchicalLevelService.create(createDto).subscribe({
          next: (newLevel) => {
            this.hierarchicalLevels.set([...this.hierarchicalLevels(), newLevel]);
            this.messageService.add({
              severity: 'success',
              summary: 'Exitoso',
              detail: 'Nivel jerárquico creado',
              life: 3000
            });
            this.hierarchicalLevelDialog = false;
            this.hierarchicalLevel = {} as HierarchicalLevelDto;
          },
          error: (error) => {
            console.error('Error creating hierarchical level:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al crear nivel jerárquico'
            });
          }
        });
      }
    }
  }

  deleteHierarchicalLevel(level: HierarchicalLevelDto) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres eliminar ' + level.name + '?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.hierarchicalLevelService.delete(level.id).subscribe({
          next: () => {
            this.hierarchicalLevels.set(this.hierarchicalLevels().filter(hl => hl.id !== level.id));
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Exitoso', 
              detail: 'Nivel jerárquico eliminado', 
              life: 3000 
            });
            if (this.jobPosition.hierarchicalLevelId === level.id) {
              this.jobPosition.hierarchicalLevelId = undefined;
            }
          },
          error: (error) => {
            console.error('Error deleting hierarchical level:', error);
            this.messageService.add({ 
              severity: 'error', 
              summary: 'Error', 
              detail: error.error?.message || 'Error al eliminar nivel jerárquico' 
            });
          }
        });
      }
    });
  }

  // Mini CRUD methods for Contract Type
  openNewContractType() {
    this.contractType = {} as ContractTypeDto;
    this.contractTypeSubmitted = false;
    this.contractTypeDialog = true;
  }

  editContractType(contractType: ContractTypeDto) {
    this.contractType = { ...contractType };
    this.contractTypeSubmitted = false;
    this.contractTypeDialog = true;
  }

  hideContractTypeDialog() {
    this.contractTypeDialog = false;
    this.contractTypeSubmitted = false;
  }

  saveContractType() {
    this.contractTypeSubmitted = true;

    if (this.contractType.name?.trim()) {
      if (this.contractType.id) {
        // Update
        const updateDto = {
          id: this.contractType.id,
          name: this.contractType.name,
          description: this.contractType.description,
          isActive: this.contractType.isActive
        };

        this.contractTypeService.update(this.contractType.id, updateDto).subscribe({
          next: (updatedContractType) => {
            this.contractTypes.set(this.contractTypes().map(ct => ct.id === this.contractType.id ? updatedContractType : ct));
            this.messageService.add({
              severity: 'success',
              summary: 'Exitoso',
              detail: 'Tipo de contrato actualizado',
              life: 3000
            });
            this.contractTypeDialog = false;
            this.contractType = {} as ContractTypeDto;
          },
          error: (error) => {
            console.error('Error updating contract type:', error);
            const errorMessage = error.error?.message || error.error?.error || error.message || 'Error al actualizar tipo de contrato';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: errorMessage
            });
          }
        });
      } else {
        // Create
        const createDto = {
          name: this.contractType.name,
          description: this.contractType.description,
          isActive: this.contractType.isActive
        };

        this.contractTypeService.create(createDto).subscribe({
          next: (newContractType) => {
            this.contractTypes.set([...this.contractTypes(), newContractType]);
            this.messageService.add({
              severity: 'success',
              summary: 'Exitoso',
              detail: 'Tipo de contrato creado',
              life: 3000
            });
            this.contractTypeDialog = false;
            this.contractType = {} as ContractTypeDto;
          },
          error: (error) => {
            console.error('Error creating contract type:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al crear tipo de contrato'
            });
          }
        });
      }
    }
  }

  deleteContractType(contractType: ContractTypeDto) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres eliminar ' + contractType.name + '?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.contractTypeService.delete(contractType.id).subscribe({
          next: () => {
            this.contractTypes.set(this.contractTypes().filter(ct => ct.id !== contractType.id));
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Exitoso', 
              detail: 'Tipo de contrato eliminado', 
              life: 3000 
            });
            if (this.jobPosition.contractTypeId === contractType.id) {
              this.jobPosition.contractTypeId = undefined;
            }
          },
          error: (error) => {
            console.error('Error deleting contract type:', error);
            this.messageService.add({ 
              severity: 'error', 
              summary: 'Error', 
              detail: error.error?.message || 'Error al eliminar tipo de contrato' 
            });
          }
        });
      }
    });
  }

  // Mini CRUD methods for Work Shift
  openNewWorkShift() {
    this.workShift = {} as WorkShiftDto;
    this.workShiftSubmitted = false;
    this.workShiftDialog = true;
  }

  editWorkShift(workShift: WorkShiftDto) {
    this.workShift = { ...workShift };
    this.workShiftSubmitted = false;
    this.workShiftDialog = true;
  }

  hideWorkShiftDialog() {
    this.workShiftDialog = false;
    this.workShiftSubmitted = false;
  }

  saveWorkShift() {
    this.workShiftSubmitted = true;

    if (this.workShift.name?.trim()) {
      if (this.workShift.id) {
        // Update
        const updateDto = {
          id: this.workShift.id,
          name: this.workShift.name,
          description: this.workShift.description,
          isActive: this.workShift.isActive
        };

        this.workShiftService.update(this.workShift.id, updateDto).subscribe({
          next: (updatedWorkShift) => {
            this.workShifts.set(this.workShifts().map(ws => ws.id === this.workShift.id ? updatedWorkShift : ws));
            this.messageService.add({
              severity: 'success',
              summary: 'Exitoso',
              detail: 'Tipo de jornada actualizado',
              life: 3000
            });
            this.workShiftDialog = false;
            this.workShift = {} as WorkShiftDto;
          },
          error: (error) => {
            console.error('Error updating work shift:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al actualizar tipo de jornada'
            });
          }
        });
      } else {
        // Create
        const createDto = {
          name: this.workShift.name,
          description: this.workShift.description,
          isActive: this.workShift.isActive
        };

        this.workShiftService.create(createDto).subscribe({
          next: (newWorkShift) => {
            this.workShifts.set([...this.workShifts(), newWorkShift]);
            this.messageService.add({
              severity: 'success',
              summary: 'Exitoso',
              detail: 'Tipo de jornada creado',
              life: 3000
            });
            this.workShiftDialog = false;
            this.workShift = {} as WorkShiftDto;
          },
          error: (error) => {
            console.error('Error creating work shift:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al crear tipo de jornada'
            });
          }
        });
      }
    }
  }

  deleteWorkShift(workShift: WorkShiftDto) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres eliminar ' + workShift.name + '?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.workShiftService.delete(workShift.id).subscribe({
          next: () => {
            this.workShifts.set(this.workShifts().filter(ws => ws.id !== workShift.id));
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Exitoso', 
              detail: 'Tipo de jornada eliminado', 
              life: 3000 
            });
            if (this.jobPosition.workShiftId === workShift.id) {
              this.jobPosition.workShiftId = undefined;
            }
          },
          error: (error) => {
            console.error('Error deleting work shift:', error);
            this.messageService.add({ 
              severity: 'error', 
              summary: 'Error', 
              detail: error.error?.message || 'Error al eliminar tipo de jornada' 
            });
          }
        });
      }
    });
  }

  // Mini CRUD methods for Labor Risk
  openNewLaborRisk() {
    this.laborRisk = {} as LaborRiskDto;
    this.laborRiskSubmitted = false;
    this.laborRiskDialog = true;
  }

  editLaborRisk(laborRisk: LaborRiskDto) {
    this.laborRisk = { ...laborRisk };
    this.laborRiskSubmitted = false;
    this.laborRiskDialog = true;
  }

  hideLaborRiskDialog() {
    this.laborRiskDialog = false;
    this.laborRiskSubmitted = false;
  }

  saveLaborRisk() {
    this.laborRiskSubmitted = true;

    if (this.laborRisk.name?.trim()) {
      if (this.laborRisk.id) {
        // Update
        const updateDto = {
          id: this.laborRisk.id,
          name: this.laborRisk.name,
          description: this.laborRisk.description,
          riskLevel: this.laborRisk.riskLevel,
          isActive: this.laborRisk.isActive
        };

        this.laborRiskService.update(this.laborRisk.id, updateDto).subscribe({
          next: (updatedLaborRisk) => {
            this.laborRisks.set(this.laborRisks().map(lr => lr.id === this.laborRisk.id ? updatedLaborRisk : lr));
            this.messageService.add({
              severity: 'success',
              summary: 'Exitoso',
              detail: 'Riesgo laboral actualizado',
              life: 3000
            });
            this.laborRiskDialog = false;
            this.laborRisk = {} as LaborRiskDto;
          },
          error: (error) => {
            console.error('Error updating labor risk:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al actualizar riesgo laboral'
            });
          }
        });
      } else {
        // Create
        const createDto = {
          name: this.laborRisk.name,
          description: this.laborRisk.description,
          riskLevel: this.laborRisk.riskLevel,
          isActive: this.laborRisk.isActive
        };

        this.laborRiskService.create(createDto).subscribe({
          next: (newLaborRisk) => {
            this.laborRisks.set([...this.laborRisks(), newLaborRisk]);
            this.messageService.add({
              severity: 'success',
              summary: 'Exitoso',
              detail: 'Riesgo laboral creado',
              life: 3000
            });
            this.laborRiskDialog = false;
            this.laborRisk = {} as LaborRiskDto;
          },
          error: (error) => {
            console.error('Error creating labor risk:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al crear riesgo laboral'
            });
          }
        });
      }
    }
  }

  deleteLaborRisk(laborRisk: LaborRiskDto) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres eliminar ' + laborRisk.name + '?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.laborRiskService.delete(laborRisk.id).subscribe({
          next: () => {
            this.laborRisks.set(this.laborRisks().filter(lr => lr.id !== laborRisk.id));
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Exitoso', 
              detail: 'Riesgo laboral eliminado', 
              life: 3000 
            });
            if (this.jobPosition.laborRiskId === laborRisk.id) {
              this.jobPosition.laborRiskId = undefined;
            }
          },
          error: (error) => {
            console.error('Error deleting labor risk:', error);
            this.messageService.add({ 
              severity: 'error', 
              summary: 'Error', 
              detail: error.error?.message || 'Error al eliminar riesgo laboral' 
            });
          }
        });
      }
    });
  }

  // Mini CRUD methods for Shift
  openNewShift() {
    this.shift = {} as ShiftDto;
    this.shiftSubmitted = false;
    this.shiftDialog = true;
  }

  editShift(shift: ShiftDto) {
    this.shift = { ...shift };
    this.shiftSubmitted = false;
    this.shiftDialog = true;
  }

  hideShiftDialog() {
    this.shiftDialog = false;
    this.shiftSubmitted = false;
  }

  saveShift() {
    this.shiftSubmitted = true;

    if (this.shift.name?.trim()) {
      if (this.shift.id) {
        // Update
        const updateDto = {
          id: this.shift.id,
          name: this.shift.name,
          description: this.shift.description,
          startTime: this.shift.startTime,
          endTime: this.shift.endTime,
          isActive: this.shift.isActive
        };

        this.shiftService.update(this.shift.id, updateDto).subscribe({
          next: (updatedShift) => {
            this.shifts.set(this.shifts().map(s => s.id === this.shift.id ? updatedShift : s));
            this.messageService.add({
              severity: 'success',
              summary: 'Exitoso',
              detail: 'Turno actualizado',
              life: 3000
            });
            this.shiftDialog = false;
            this.shift = {} as ShiftDto;
          },
          error: (error) => {
            console.error('Error updating shift:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al actualizar turno'
            });
          }
        });
      } else {
        // Create
        const createDto = {
          name: this.shift.name,
          description: this.shift.description,
          startTime: this.shift.startTime,
          endTime: this.shift.endTime,
          isActive: this.shift.isActive
        };

        this.shiftService.create(createDto).subscribe({
          next: (newShift) => {
            this.shifts.set([...this.shifts(), newShift]);
            this.messageService.add({
              severity: 'success',
              summary: 'Exitoso',
              detail: 'Turno creado',
              life: 3000
            });
            this.shiftDialog = false;
            this.shift = {} as ShiftDto;
          },
          error: (error) => {
            console.error('Error creating shift:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al crear turno'
            });
          }
        });
      }
    }
  }

  deleteShift(shift: ShiftDto) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres eliminar ' + shift.name + '?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.shiftService.delete(shift.id).subscribe({
          next: () => {
            this.shifts.set(this.shifts().filter(s => s.id !== shift.id));
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Exitoso', 
              detail: 'Turno eliminado', 
              life: 3000 
            });
            if (this.jobPosition.shiftId === shift.id) {
              this.jobPosition.shiftId = undefined;
            }
          },
          error: (error) => {
            console.error('Error deleting shift:', error);
            this.messageService.add({ 
              severity: 'error', 
              summary: 'Error', 
              detail: error.error?.message || 'Error al eliminar turno' 
            });
          }
        });
      }
    });
  }

  // Mini CRUD methods for Payment Period
  openNewPaymentPeriod() {
    this.paymentPeriod = {} as PaymentPeriodDto;
    this.paymentPeriodSubmitted = false;
    this.paymentPeriodDialog = true;
  }

  editPaymentPeriod(paymentPeriod: PaymentPeriodDto) {
    this.paymentPeriod = { ...paymentPeriod };
    this.paymentPeriodSubmitted = false;
    this.paymentPeriodDialog = true;
  }

  hidePaymentPeriodDialog() {
    this.paymentPeriodDialog = false;
    this.paymentPeriodSubmitted = false;
  }

  savePaymentPeriod() {
    this.paymentPeriodSubmitted = true;

    if (this.paymentPeriod.name?.trim()) {
      if (this.paymentPeriod.id) {
        // Update
        const updateDto = {
          id: this.paymentPeriod.id,
          name: this.paymentPeriod.name,
          description: this.paymentPeriod.description,
          days: this.paymentPeriod.days,
          isActive: this.paymentPeriod.isActive
        };

        this.paymentPeriodService.update(this.paymentPeriod.id, updateDto).subscribe({
          next: (updatedPaymentPeriod) => {
            this.paymentPeriods.set(this.paymentPeriods().map(pp => pp.id === this.paymentPeriod.id ? updatedPaymentPeriod : pp));
            this.messageService.add({
              severity: 'success',
              summary: 'Exitoso',
              detail: 'Período de pago actualizado',
              life: 3000
            });
            this.paymentPeriodDialog = false;
            this.paymentPeriod = {} as PaymentPeriodDto;
          },
          error: (error) => {
            console.error('Error updating payment period:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al actualizar período de pago'
            });
          }
        });
      } else {
        // Create
        const createDto = {
          name: this.paymentPeriod.name,
          description: this.paymentPeriod.description,
          days: this.paymentPeriod.days,
          isActive: this.paymentPeriod.isActive
        };

        this.paymentPeriodService.create(createDto).subscribe({
          next: (newPaymentPeriod) => {
            this.paymentPeriods.set([...this.paymentPeriods(), newPaymentPeriod]);
            this.messageService.add({
              severity: 'success',
              summary: 'Exitoso',
              detail: 'Período de pago creado',
              life: 3000
            });
            this.paymentPeriodDialog = false;
            this.paymentPeriod = {} as PaymentPeriodDto;
          },
          error: (error) => {
            console.error('Error creating payment period:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al crear período de pago'
            });
          }
        });
      }
    }
  }

  deletePaymentPeriod(paymentPeriod: PaymentPeriodDto) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres eliminar ' + paymentPeriod.name + '?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.paymentPeriodService.delete(paymentPeriod.id).subscribe({
          next: () => {
            this.paymentPeriods.set(this.paymentPeriods().filter(pp => pp.id !== paymentPeriod.id));
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Exitoso', 
              detail: 'Período de pago eliminado', 
              life: 3000 
            });
            if (this.jobPosition.paymentPeriodId === paymentPeriod.id) {
              this.jobPosition.paymentPeriodId = undefined;
            }
          },
          error: (error) => {
            console.error('Error deleting payment period:', error);
            this.messageService.add({ 
              severity: 'error', 
              summary: 'Error', 
              detail: error.error?.message || 'Error al eliminar período de pago' 
            });
          }
        });
      }
    });
  }

  // Mini CRUD methods for Payment Unit
  openNewPaymentUnit() {
    this.paymentUnit = {} as PaymentUnitDto;
    this.paymentUnitSubmitted = false;
    this.paymentUnitDialog = true;
  }

  editPaymentUnit(paymentUnit: PaymentUnitDto) {
    this.paymentUnit = { ...paymentUnit };
    this.paymentUnitSubmitted = false;
    this.paymentUnitDialog = true;
  }

  hidePaymentUnitDialog() {
    this.paymentUnitDialog = false;
    this.paymentUnitSubmitted = false;
  }

  savePaymentUnit() {
    this.paymentUnitSubmitted = true;

    if (this.paymentUnit.name?.trim()) {
      if (this.paymentUnit.id) {
        // Update
        const updateDto = {
          id: this.paymentUnit.id,
          name: this.paymentUnit.name,
          description: this.paymentUnit.description,
          symbol: this.paymentUnit.symbol,
          isActive: this.paymentUnit.isActive
        };

        this.paymentUnitService.update(this.paymentUnit.id, updateDto).subscribe({
          next: (updatedPaymentUnit) => {
            this.paymentUnits.set(this.paymentUnits().map(pu => pu.id === this.paymentUnit.id ? updatedPaymentUnit : pu));
            this.messageService.add({
              severity: 'success',
              summary: 'Exitoso',
              detail: 'Unidad de pago actualizada',
              life: 3000
            });
            this.paymentUnitDialog = false;
            this.paymentUnit = {} as PaymentUnitDto;
          },
          error: (error) => {
            console.error('Error updating payment unit:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al actualizar unidad de pago'
            });
          }
        });
      } else {
        // Create
        const createDto = {
          name: this.paymentUnit.name,
          description: this.paymentUnit.description,
          symbol: this.paymentUnit.symbol,
          isActive: this.paymentUnit.isActive
        };

        this.paymentUnitService.create(createDto).subscribe({
          next: (newPaymentUnit) => {
            this.paymentUnits.set([...this.paymentUnits(), newPaymentUnit]);
            this.messageService.add({
              severity: 'success',
              summary: 'Exitoso',
              detail: 'Unidad de pago creada',
              life: 3000
            });
            this.paymentUnitDialog = false;
            this.paymentUnit = {} as PaymentUnitDto;
          },
          error: (error) => {
            console.error('Error creating payment unit:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al crear unidad de pago'
            });
          }
        });
      }
    }
  }

  deletePaymentUnit(paymentUnit: PaymentUnitDto) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres eliminar ' + paymentUnit.name + '?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.paymentUnitService.delete(paymentUnit.id).subscribe({
          next: () => {
            this.paymentUnits.set(this.paymentUnits().filter(pu => pu.id !== paymentUnit.id));
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Exitoso', 
              detail: 'Unidad de pago eliminada', 
              life: 3000 
            });
            if (this.jobPosition.paymentUnitId === paymentUnit.id) {
              this.jobPosition.paymentUnitId = undefined;
            }
          },
          error: (error) => {
            console.error('Error deleting payment unit:', error);
            this.messageService.add({ 
              severity: 'error', 
              summary: 'Error', 
              detail: error.error?.message || 'Error al eliminar unidad de pago' 
            });
          }
        });
      }
    });
  }
}