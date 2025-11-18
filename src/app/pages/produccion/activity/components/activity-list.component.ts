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
import { TooltipModule } from 'primeng/tooltip';
import { ActivityService } from '../services/activity.service';
import { UnitService } from '../services/unit.service';
import { ActivityResponseDto, ActivityDto, ActivityType } from '../models/activity.model';
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
        SelectModule,
        TooltipModule
    ],
    template: `
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="Nueva Actividad" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                <!-- <p-button severity="secondary" label="Eliminar Seleccionadas" icon="pi pi-trash" outlined (onClick)="deleteSelectedActivities()" [disabled]="!selectedActivities || !selectedActivities.length" /> -->
            </ng-template>

            <ng-template #end>
                <p-button label="Exportar" icon="pi pi-upload" severity="secondary" (onClick)="exportCSV()" />
            </ng-template>
        </p-toolbar>

        <div class="card">
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
                    <!-- <th style="width: 3rem">
                        <p-tableHeaderCheckbox />
                    </th> -->
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
                    <!-- <td style="width: 3rem">
                        <p-tableCheckbox [value]="activity" [disabled]="isDefaultActivity(activity)" />
                    </td> -->
                    <td style="min-width: 16rem">{{ activity.name }}</td>
                    <td style="min-width: 20rem">{{ activity.description || 'Sin descripción' }}</td>
                    <td style="min-width: 8rem">{{ getUnitName(activity.unitId) }}</td>
                    <td style="min-width: 8rem">{{ activity.unitCost | currency:'USD':'symbol':'1.2-2' }}</td>
                    <td style="min-width: 8rem">
                        <p-tag [value]="activity.isActive ? 'Activa' : 'Inactiva'" [severity]="getSeverity(activity.isActive)" />
                    </td>
                    <td>
                        <p-button 
                            icon="pi pi-pencil" 
                            class="mr-2" 
                            [rounded]="true" 
                            [outlined]="true" 
                            [disabled]="isDefaultActivity(activity)"
                            [pTooltip]="isDefaultActivity(activity) ? 'Esta actividad no se puede editar porque es una actividad por defecto' : 'Editar actividad'"
                            (click)="editActivity(activity)" />
                        <p-button 
                            icon="pi pi-trash" 
                            severity="danger" 
                            [rounded]="true" 
                            [outlined]="true" 
                            [disabled]="isDefaultActivity(activity)"
                            [pTooltip]="isDefaultActivity(activity) ? 'Esta actividad no se puede eliminar porque es una actividad por defecto' : 'Eliminar actividad'"
                            (click)="deleteActivity(activity)" />
                    </td>
                </tr>
            </ng-template>
        </p-table>
    </div>
        <p-dialog [(visible)]="activityDialog" [style]="{ width: '600px' }" header="Detalles de la Actividad" [modal]="true" [closable]="true" [dismissableMask]="false" (onHide)="hideDialog()">
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <div>
                        <label for="name" class="block font-bold mb-3">Nombre *</label>
                        <input type="text" pInputText id="name" [(ngModel)]="activity.name" required autofocus fluid />
                        <small class="text-red-500" *ngIf="submitted && !activity.name">Nombre es requerido.</small>
                    </div>

                    <div class="col-span-6">
                        <label for="unitId" class="block font-bold mb-3">Unidad *</label>
                        <p-select [(ngModel)]="activity.unitId" inputId="unitId" [options]="units" optionLabel="name" optionValue="id" placeholder="Seleccionar Unidad" fluid />
                        <small class="text-red-500" *ngIf="submitted && !activity.unitId">Unidad es requerida.</small>
                    </div>

                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-6">
                            <label for="type" class="block font-bold mb-3">Tipo *</label>
                            <p-select [(ngModel)]="activity.type" inputId="type" [options]="activityTypes" optionLabel="label" optionValue="value" placeholder="Seleccionar Tipo" fluid />
                            <small class="text-red-500" *ngIf="submitted && activity.type === undefined">Tipo es requerido.</small>
                        </div>
                        <div class="col-span-6">
                            <label for="unitCost" class="block font-bold mb-3">Costo por Unidad *</label>
                            <p-inputnumber [(ngModel)]="activity.unitCost" inputId="unitCost" mode="currency" currency="USD" locale="en-US" fluid />
                            <small class="text-red-500" *ngIf="submitted && !activity.unitCost">Costo por unidad es requerido.</small>
                        </div>
                    </div>

                    <div *ngIf="activity.type === ActivityType.Cosecha">
                        <label for="dailyActivityCost" class="block font-bold mb-3">Costo de actividad por día</label>
                        <p-inputnumber [(ngModel)]="activity.dailyActivityCost" inputId="dailyActivityCost" mode="currency" currency="USD" locale="en-US" fluid />
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
    activityTypes = [
        { label: 'Cosecha', value: ActivityType.Cosecha },
        { label: 'Actividades Varias', value: ActivityType.ActividadesVarias }
    ];
    ActivityType = ActivityType; // Exponer el enum para usar en el template

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
                    // Convertir el tipo de string a número si viene como string del backend
                    const activitiesWithConvertedType = response.data.map(activity => {
                        let activityType: ActivityType;
                        if (typeof activity.type === 'string') {
                            activityType = activity.type === 'Cosecha' ? ActivityType.Cosecha : ActivityType.ActividadesVarias;
                        } else {
                            activityType = activity.type;
                        }
                        return {
                            ...activity,
                            type: activityType
                        };
                    });
                    this.activities.set(activitiesWithConvertedType);
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
            next: (response) => {
                if (response.success && response.data) {
                    this.units = response.data;
                } else {
                    this.units = [];
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: response.message || 'Error al cargar unidades',
                        life: 3000
                    });
                }
            },
            error: (error) => {
                console.error('Error loading units:', error);
                this.units = [];
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error de conexión al cargar unidades',
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
            id: 0,
            name: '',
            description: '',
            unitId: undefined,
            unitCost: 0,
            dailyActivityCost: undefined,
            isActive: true,
            type: ActivityType.ActividadesVarias,
            organizationId: '',
            createdAt: new Date(),
            updatedAt: new Date()
        } as ActivityResponseDto;
        this.submitted = false;
        this.activityDialog = true;
    }

    editActivity(activity: ActivityResponseDto) {
        if (this.isDefaultActivity(activity)) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Acción no permitida',
                detail: 'La actividad "Cosecha" no se puede editar porque es una actividad por defecto del sistema',
                life: 3000
            });
            return;
        }
        
        // Convertir el tipo de string a número si viene como string del backend
        let activityType: ActivityType;
        if (typeof activity.type === 'string') {
            activityType = activity.type === 'Cosecha' ? ActivityType.Cosecha : ActivityType.ActividadesVarias;
        } else {
            activityType = activity.type;
        }
        
        this.activity = { 
            ...activity,
            type: activityType
        };
        this.activityDialog = true;
    }

    deleteSelectedActivities() {
        if (!this.selectedActivities || this.selectedActivities.length === 0) {
            return;
        }

        // Filtrar actividades por defecto
        const defaultActivities = this.selectedActivities.filter(a => this.isDefaultActivity(a));
        const activitiesToDelete = this.selectedActivities.filter(a => !this.isDefaultActivity(a));

        if (defaultActivities.length > 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Acción no permitida',
                detail: `No se pueden eliminar ${defaultActivities.length} actividad(es) por defecto del sistema`,
                life: 3000
            });
        }

        if (activitiesToDelete.length === 0) {
            return;
        }

        this.confirmationService.confirm({
            message: `¿Estás seguro de que quieres eliminar ${activitiesToDelete.length} actividad(es) seleccionada(s)?`,
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const selectedIds = activitiesToDelete.map(a => a.id);
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
                    detail: `${activitiesToDelete.length} Actividad(es) Eliminada(s)`,
                    life: 3000
                });
            }
        });
    }

    hideDialog() {
        this.activityDialog = false;
        this.submitted = false;
        // Limpiar el objeto de actividad para evitar problemas de estado
        this.activity = {
            id: 0,
            name: '',
            description: '',
            unitId: undefined,
            unitCost: 0,
            dailyActivityCost: undefined,
            isActive: true,
            type: ActivityType.ActividadesVarias,
            organizationId: '',
            createdAt: new Date(),
            updatedAt: new Date()
        } as ActivityResponseDto;
    }

    deleteActivity(activity: ActivityResponseDto) {
        if (this.isDefaultActivity(activity)) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Acción no permitida',
                detail: 'La actividad "Cosecha" no se puede eliminar porque es una actividad por defecto del sistema',
                life: 3000
            });
            return;
        }

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
        if (!Array.isArray(this.units) || this.units.length === 0) return 'Sin unidad';
        const unit = this.units.find(u => u.id === unitId);
        return unit ? unit.name : 'Sin unidad';
    }

    /**
     * Verifica si la actividad es "Cosecha" (actividad por defecto que no se puede editar ni eliminar)
     */
    isDefaultActivity(activity: ActivityResponseDto): boolean {
        return activity.name?.toLowerCase().trim() === 'cosecha';
    }

    saveActivity() {
        this.submitted = true;
        
        if (this.activity.name?.trim() && this.activity.unitCost !== undefined && this.activity.unitId) {
            const activityData: ActivityDto = {
                name: this.activity.name,
                description: this.activity.description,
                unitId: this.activity.unitId,
                unitCost: this.activity.unitCost,
                dailyActivityCost: this.activity.dailyActivityCost,
                isActive: this.activity.isActive,
                type: this.activity.type ?? ActivityType.ActividadesVarias
            };

            if (this.activity.id) {
                // Verificar si es actividad por defecto antes de actualizar
                if (this.isDefaultActivity(this.activity)) {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Acción no permitida',
                        detail: 'La actividad "Cosecha" no se puede editar porque es una actividad por defecto del sistema',
                        life: 3000
                    });
                    return;
                }

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
