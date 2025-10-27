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
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { ActivityService } from '../services/activity.service';
import { UnitService } from '../services/unit.service';
import { ActivityResponseDto, ActivityDto } from '../models/activity.model';
import { UnitResponseDto } from '../services/unit.service';

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
    selector: 'app-activity-list',
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
        CheckboxModule,
        InputNumberModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        SelectModule
    ],
    template: `
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="Nueva Actividad" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                <p-button severity="secondary" label="Eliminar Seleccionadas" icon="pi pi-trash" outlined (onClick)="deleteSelectedActivities()" [disabled]="!selectedActivities || !selectedActivities.length" />
            </ng-template>

            <ng-template #end>
                <p-button label="Exportar" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="activities()"
            [rows]="10"
            [columns]="cols"
            [paginator]="true"
            [globalFilterFields]="['name', 'description']"
            [tableStyle]="{ 'min-width': '75rem' }"
            [(selection)]="selectedActivities"
            [rowHover]="true"
            dataKey="id"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} actividades"
            [showCurrentPageReport]="true"
            [rowsPerPageOptions]="[10, 20, 30]"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0">Gestionar Actividades</h5>
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
                    <th pSortableColumn="name" style="min-width: 16rem">
                        Nombre
                        <p-sortIcon field="name" />
                    </th>
                    <th style="min-width: 20rem">Descripción</th>
                    <th style="min-width: 8rem">Unidad</th>
                    <th pSortableColumn="unitCost" style="min-width: 8rem">
                        Costo por Unidad
                        <p-sortIcon field="unitCost" />
                    </th>
                    <th pSortableColumn="isActive" style="min-width: 8rem">
                        Estado
                        <p-sortIcon field="isActive" />
                    </th>
                    <th style="min-width: 12rem"></th>
                </tr>
            </ng-template>
            <ng-template #body let-activity>
                <tr>
                    <td style="width: 3rem">
                        <p-tableCheckbox [value]="activity" />
                    </td>
                    <td style="min-width: 16rem">{{ activity.name }}</td>
                    <td style="min-width: 20rem">{{ activity.description || 'Sin descripción' }}</td>
                    <td style="min-width: 8rem">{{ getUnitName(activity.unitId) }}</td>
                    <td style="min-width: 8rem">{{ activity.unitCost | currency:'USD':'symbol':'1.2-2' }}</td>
                    <td style="min-width: 8rem">
                        <p-tag [value]="activity.isActive ? 'Activa' : 'Inactiva'" [severity]="getSeverity(activity.isActive)" />
                    </td>
                    <td>
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editActivity(activity)" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteActivity(activity)" />
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="activityDialog" [style]="{ width: '600px' }" header="Detalles de la Actividad" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <div>
                        <label for="name" class="block font-bold mb-3">Nombre *</label>
                        <input type="text" pInputText id="name" [(ngModel)]="activity.name" required autofocus fluid />
                        <small class="text-red-500" *ngIf="submitted && !activity.name">Nombre es requerido.</small>
                    </div>

                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-6">
                            <label for="unitId" class="block font-bold mb-3">Unidad *</label>
                            <p-select [(ngModel)]="activity.unitId" inputId="unitId" [options]="units" optionLabel="name" optionValue="id" placeholder="Seleccionar Unidad" fluid />
                            <small class="text-red-500" *ngIf="submitted && !activity.unitId">Unidad es requerida.</small>
                        </div>
                        <div class="col-span-6">
                            <label for="unitCost" class="block font-bold mb-3">Costo por Unidad *</label>
                            <p-inputnumber [(ngModel)]="activity.unitCost" inputId="unitCost" mode="currency" currency="USD" locale="en-US" fluid />
                            <small class="text-red-500" *ngIf="submitted && !activity.unitCost">Costo por unidad es requerido.</small>
                        </div>
                    </div>

                    <div>
                        <label for="description" class="block font-bold mb-3">Descripción</label>
                        <textarea pInputTextarea id="description" [(ngModel)]="activity.description" placeholder="Descripción de la actividad..." rows="3" fluid></textarea>
                    </div>

                    <div class="flex items-center gap-2">
                        <p-checkbox [(ngModel)]="activity.isActive" id="isActive" binary />
                        <label for="isActive">Activa</label>
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (click)="hideDialog()" />
                <p-button label="Guardar" icon="pi pi-check" (click)="saveActivity()" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `,
    providers: [MessageService, ActivityService, ConfirmationService]
})
export class ActivityListComponent implements OnInit {
    activityDialog: boolean = false;
    activities = signal<ActivityResponseDto[]>([]);
    activity: ActivityResponseDto = {} as ActivityResponseDto;
    selectedActivities!: ActivityResponseDto[] | null;
    submitted: boolean = false;

    @ViewChild('dt') dt!: Table;
    exportColumns!: ExportColumn[];
    cols!: Column[];

    units: UnitResponseDto[] = [];

    constructor(
        private activityService: ActivityService,
        private unitService: UnitService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadActivities();
        this.loadUnits();
        this.setupColumns();
    }

    loadActivities() {
        this.activityService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.activities.set(response.data);
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: response.message || 'Error al cargar actividades',
                        life: 3000
                    });
                }
            },
            error: (error) => {
                console.error('Error loading activities:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error de conexión al cargar actividades',
                    life: 3000
                });
            }
        });
    }

    loadUnits() {
        this.unitService.getAll().subscribe({
            next: (data) => this.units = data,
            error: (error) => {
                console.error('Error loading units:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar unidades',
                    life: 3000
                });
            }
        });
    }

    setupColumns() {
        this.cols = [
            { field: 'name', header: 'Nombre', customExportHeader: 'Nombre de la Actividad' },
            { field: 'description', header: 'Descripción' },
            { field: 'unitId', header: 'Unidad' },
            { field: 'unitCost', header: 'Costo por Unidad' },
            { field: 'isActive', header: 'Estado' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.activity = {
            name: '',
            description: '',
            unitId: undefined,
            unitCost: 0,
            isActive: true
        } as ActivityResponseDto;
        this.submitted = false;
        this.activityDialog = true;
    }

    editActivity(activity: ActivityResponseDto) {
        this.activity = { ...activity };
        this.activityDialog = true;
    }

    deleteSelectedActivities() {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar las actividades seleccionadas?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const selectedIds = this.selectedActivities?.map(a => a.id) || [];
                selectedIds.forEach(id => {
                    this.activityService.delete(id).subscribe({
                        next: () => {
                            this.loadActivities();
                        },
                        error: (error) => {
                            console.error('Error deleting activity:', error);
                        }
                    });
                });
                this.selectedActivities = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Exitoso',
                    detail: 'Actividades Eliminadas',
                    life: 3000
                });
            }
        });
    }

    hideDialog() {
        this.activityDialog = false;
        this.submitted = false;
    }

    deleteActivity(activity: ActivityResponseDto) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar la actividad "' + activity.name + '"?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.activityService.delete(activity.id).subscribe({
                    next: () => {
                        this.loadActivities();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Actividad Eliminada',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al eliminar actividad',
                            life: 3000
                        });
                        console.error('Error deleting activity:', error);
                    }
                });
            }
        });
    }

    getSeverity(isActive: boolean) {
        return isActive ? 'success' : 'danger';
    }

    getUnitName(unitId?: number): string {
        if (!unitId) return 'Sin unidad';
        const unit = this.units.find(u => u.id === unitId);
        return unit ? unit.name : 'Sin unidad';
    }

    saveActivity() {
        this.submitted = true;
        
        if (this.activity.name?.trim() && this.activity.unitCost !== undefined && this.activity.unitId) {
            const activityData: ActivityDto = {
                name: this.activity.name,
                description: this.activity.description,
                unitId: this.activity.unitId,
                unitCost: this.activity.unitCost,
                isActive: this.activity.isActive
            };

            if (this.activity.id) {
                // Update existing activity
                this.activityService.update(this.activity.id, activityData).subscribe({
                    next: () => {
                        this.loadActivities();
                        this.activityDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Actividad Actualizada',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al actualizar actividad',
                            life: 3000
                        });
                        console.error('Error updating activity:', error);
                    }
                });
            } else {
                // Create new activity
                this.activityService.create(activityData).subscribe({
                    next: () => {
                        this.loadActivities();
                        this.activityDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Actividad Creada',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al crear actividad',
                            life: 3000
                        });
                        console.error('Error creating activity:', error);
                    }
                });
            }
        }
    }

    exportCSV() {
        this.activityService.export('csv').subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'actividades.csv';
                link.click();
                window.URL.revokeObjectURL(url);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Exitoso',
                    detail: 'Actividades exportadas correctamente',
                    life: 3000
                });
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al exportar actividades',
                    life: 3000
                });
                console.error('Error exporting activities:', error);
            }
        });
    }
}
