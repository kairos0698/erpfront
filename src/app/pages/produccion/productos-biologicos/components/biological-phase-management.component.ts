import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { TableModule, Table } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { BiologicalPhaseService, BiologicalPhaseResponseDto, BiologicalPhaseDto } from '../services/biological-phase.service';
import { BiologicalProductResponseDto } from '../models/biological-product.model';
import { WorkOrderService } from '../services/work-order.service';
import { ActivityService } from '../../activity/services/activity.service';
import { ActivityResponseDto, ActivityType } from '../../activity/models/activity.model';
import { SelectModule } from 'primeng/select';

@Component({
    selector: 'app-biological-phase-management',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        TextareaModule,
        CheckboxModule,
        TableModule,
        TagModule,
        ConfirmDialogModule,
        IconFieldModule,
        InputIconModule,
        TooltipModule,
        DatePickerModule,
        SelectModule
    ],
    templateUrl: './biological-phase-management.component.html',
    providers: [MessageService, BiologicalPhaseService, ConfirmationService, WorkOrderService, ActivityService]
})
export class BiologicalPhaseManagementComponent implements OnChanges {
    @Input() selectedProduct: BiologicalProductResponseDto | null = null;
    @Input() phasesDialog: boolean = false;
    @Output() phasesDialogChange = new EventEmitter<boolean>();
    @Output() workOrdersRequested = new EventEmitter<BiologicalPhaseResponseDto>();
    @Output() productCostRecalculated = new EventEmitter<void>();

    phases: BiologicalPhaseResponseDto[] = [];
    allPhases: BiologicalPhaseResponseDto[] = []; // Todas las fases sin filtrar
    newPhaseDialog: boolean = false;
    newPhase: BiologicalPhaseDto = {} as BiologicalPhaseDto;
    editingPhase: boolean = false;
    submitted: boolean = false;
    recalculatingCost: boolean = false;
    
    // Filtros de fecha
    filterDateStart: Date | null = null;
    filterDateEnd: Date | null = null;
    
    // Actividades de tipo Cosecha
    cosechaActivities: ActivityResponseDto[] = [];
    selectedPhaseForEdit: BiologicalPhaseResponseDto | null = null; // Fase que se está editando
    canChangeActivity: boolean = true; // Si se puede cambiar la actividad

    constructor(
        private biologicalPhaseService: BiologicalPhaseService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private workOrderService: WorkOrderService,
        private activityService: ActivityService
    ) {}

    ngOnChanges() {
        if (this.selectedProduct && this.phasesDialog) {
            this.loadPhases(this.selectedProduct.id);
            // Asegurar que cost y price estén sincronizados
            if (this.selectedProduct.cost !== undefined) {
                this.selectedProduct.price = this.selectedProduct.cost;
            } else if (this.selectedProduct.price !== undefined) {
                this.selectedProduct.cost = this.selectedProduct.price;
            }
        }
    }

    loadPhases(productId: number) {
        this.biologicalPhaseService.getByProductId(productId).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.allPhases = response.data; // Guardar copia original
                    this.phases = response.data;
                    // Limpiar filtros de fecha al recargar
                    this.filterDateStart = null;
                    this.filterDateEnd = null;
                    
                    // Debug: verificar fases de Cosecha
                    const cosechaPhase = this.phases.find(p => p.isDefault);
                    if (cosechaPhase) {
                        console.log('🌾 Fase de Cosecha encontrada:', cosechaPhase);
                        console.log('  - isDefault:', cosechaPhase.isDefault);
                        console.log('  - activityId:', cosechaPhase.activityId);
                        console.log('  - activityName:', cosechaPhase.activityName);
                    } else {
                        console.warn('⚠️ No se encontró fase de Cosecha (isDefault=true)');
                    }
                }
            },
            error: (error) => {
                console.error('Error loading phases:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar fases del producto',
                    life: 3000
                });
            }
        });
    }

    openNewPhase() {
        if (this.selectedProduct) {
            this.newPhase = {
                name: '',
                description: '',
                phaseDate: undefined,
                productId: this.selectedProduct.id,
                isActive: true
            };
            this.submitted = false;
            this.newPhaseDialog = true;
        }
    }

    savePhase() {
        this.submitted = true;

        if (this.newPhase.name?.trim() && this.selectedProduct) {
            if (this.editingPhase) {
                // Actualizar fase existente
                this.biologicalPhaseService.update(this.newPhase.id!, this.newPhase).subscribe({
                    next: () => {
                        this.loadPhases(this.selectedProduct!.id);
                        this.newPhaseDialog = false;
                        this.editingPhase = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Fase Actualizada',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al actualizar fase',
                            life: 3000
                        });
                        console.error('Error updating phase:', error);
                    }
                });
            } else {
                // Crear nueva fase
                this.biologicalPhaseService.create(this.newPhase).subscribe({
                    next: () => {
                        this.loadPhases(this.selectedProduct!.id);
                        this.newPhaseDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Fase Creada',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al crear fase',
                            life: 3000
                        });
                        console.error('Error creating phase:', error);
                    }
                });
            }
        }
    }

    hideNewPhaseDialog() {
        this.newPhaseDialog = false;
        this.submitted = false;
        this.editingPhase = false;
        this.selectedPhaseForEdit = null;
        this.cosechaActivities = [];
        this.canChangeActivity = true;
        // Limpiar el objeto de fase para evitar problemas de estado
        this.newPhase = {
            name: '',
            description: '',
            phaseDate: undefined,
            productId: this.selectedProduct?.id || 0,
            isActive: true
        } as BiologicalPhaseDto;
    }

    editPhase(phase: BiologicalPhaseResponseDto) {
        console.log('✏️ Editando fase:', phase);
        console.log('  - isDefault:', phase.isDefault);
        console.log('  - isDefault (tipo):', typeof phase.isDefault);
        console.log('  - activityId actual:', phase.activityId);
        console.log('  - activityName:', phase.activityName);
        
        this.selectedPhaseForEdit = phase;
        this.newPhase = {
            id: phase.id,
            name: phase.name,
            description: phase.description,
            phaseDate: phase.phaseDate,
            productId: phase.productId,
            isActive: phase.isActive,
            activityId: phase.activityId
        };
        this.editingPhase = true;
        this.submitted = false;
        
        // Siempre cargar actividades si es fase de Cosecha (isDefault = true)
        // Verificar tanto isDefault como el nombre "Cosecha" por si acaso
        const isCosechaPhase = phase.isDefault === true || phase.name?.toLowerCase().includes('cosecha');
        
        if (isCosechaPhase) {
            console.log('🌾 Es fase de Cosecha, cargando actividades...');
            this.loadCosechaActivities();
            this.checkCanChangeActivity(phase.id);
        } else {
            console.log('ℹ️ No es fase de Cosecha, no se carga campo de actividad');
            this.cosechaActivities = [];
        }
        
        this.newPhaseDialog = true;
    }
    
    /**
     * Carga las actividades de tipo Cosecha para el dropdown
     */
    loadCosechaActivities() {
        console.log('🔄 Cargando actividades de tipo Cosecha...');
        this.activityService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    console.log('📋 Todas las actividades recibidas:', response.data);
                    // Filtrar solo actividades de tipo Cosecha
                    this.cosechaActivities = response.data.filter(activity => {
                        const type = typeof activity.type === 'string' 
                            ? (activity.type === 'Cosecha' ? ActivityType.Cosecha : ActivityType.ActividadesVarias)
                            : activity.type;
                        const isCosecha = type === ActivityType.Cosecha;
                        const isActive = activity.isActive !== false; // Por defecto true si no está definido
                        console.log(`  - ${activity.name}: tipo=${activity.type}, isCosecha=${isCosecha}, isActive=${isActive}`);
                        return isCosecha && isActive;
                    });
                    console.log('✅ Actividades de Cosecha filtradas:', this.cosechaActivities);
                } else {
                    console.warn('⚠️ No se recibieron actividades del servidor');
                }
            },
            error: (error) => {
                console.error('❌ Error loading activities:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar actividades',
                    life: 3000
                });
            }
        });
    }
    
    /**
     * Verifica si se puede cambiar la actividad de la fase de Cosecha.
     * Solo se puede cambiar si todas las órdenes están canceladas o no hay órdenes.
     */
    checkCanChangeActivity(phaseId: number) {
        this.workOrderService.getAll({ biologicalProductPhaseId: phaseId }).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    // Verificar si hay órdenes que NO están canceladas (statusId !== 4)
                    const hasNonCancelledOrders = response.data.some(order => order.statusId !== 4);
                    this.canChangeActivity = !hasNonCancelledOrders;
                } else {
                    this.canChangeActivity = true; // Si no hay órdenes, se puede cambiar
                }
            },
            error: (error) => {
                console.error('Error checking work orders:', error);
                this.canChangeActivity = true; // En caso de error, permitir cambio
            }
        });
    }

    deletePhase(phase: BiologicalPhaseResponseDto) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar la fase "' + phase.name + '"?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.biologicalPhaseService.delete(phase.id).subscribe({
                    next: () => {
                        this.loadPhases(this.selectedProduct!.id);
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Fase Eliminada',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al eliminar fase',
                            life: 3000
                        });
                        console.error('Error deleting phase:', error);
                    }
                });
            }
        });
    }

    viewWorkOrders(phase: BiologicalPhaseResponseDto) {
        // Validar: Si la fase es de Cosecha, debe tener una actividad seleccionada
        if (phase.isDefault && !phase.activityId) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Actividad Requerida',
                detail: 'La fase de Cosecha debe tener una actividad seleccionada antes de ver las órdenes de trabajo. Por favor, edita la fase y selecciona una actividad de tipo "Cosecha".',
                life: 6000
            });
            return; // No abrir el modal
        }
        
        this.workOrdersRequested.emit(phase);
    }

    hidePhasesDialog() {
        this.phasesDialog = false;
        this.phasesDialogChange.emit(false);
    }

    getSeverity(isActive: boolean) {
        return isActive ? 'success' : 'danger';
    }

    onPhaseFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    recalculateCost() {
        if (!this.selectedProduct) return;

        this.recalculatingCost = true;
        this.workOrderService.recalculateCost(this.selectedProduct.id).subscribe({
            next: (response) => {
                this.recalculatingCost = false;
                if (response.success && response.data) {
                    // Actualizar el producto con los nuevos valores
                    if (this.selectedProduct) {
                        this.selectedProduct.cost = response.data.cost;
                        this.selectedProduct.stockQuantity = response.data.stockQuantity;
                    }
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Costo Recalculado',
                        detail: response.message || `Nuevo costo: $${response.data.cost.toFixed(2)}`,
                        life: 5000
                    });
                    // Emitir evento para que el padre actualice la lista
                    this.productCostRecalculated.emit();
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: response.message || 'Error al recalcular el costo',
                        life: 3000
                    });
                }
            },
            error: (error) => {
                this.recalculatingCost = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.message || 'Error de conexión al recalcular el costo',
                    life: 3000
                });
                console.error('Error recalculating cost:', error);
            }
        });
    }

    /**
     * Aplica el filtro de fechas a las fases.
     * Filtra por la fecha de creación (createdAt) de cada fase.
     */
    applyDateFilter() {
        if (!this.filterDateStart && !this.filterDateEnd) {
            // Sin filtros, mostrar todas
            this.phases = [...this.allPhases];
            return;
        }

        this.phases = this.allPhases.filter(phase => {
            const phaseDate = new Date(phase.createdAt);
            
            // Normalizar las fechas a medianoche para comparar solo días
            const phaseDateOnly = new Date(phaseDate.getFullYear(), phaseDate.getMonth(), phaseDate.getDate());
            
            let matchesStart = true;
            let matchesEnd = true;

            if (this.filterDateStart) {
                const startDateOnly = new Date(this.filterDateStart.getFullYear(), this.filterDateStart.getMonth(), this.filterDateStart.getDate());
                matchesStart = phaseDateOnly >= startDateOnly;
            }

            if (this.filterDateEnd) {
                const endDateOnly = new Date(this.filterDateEnd.getFullYear(), this.filterDateEnd.getMonth(), this.filterDateEnd.getDate());
                matchesEnd = phaseDateOnly <= endDateOnly;
            }

            return matchesStart && matchesEnd;
        });
    }

    /**
     * Limpia los filtros de fecha y muestra todas las fases.
     */
    clearDateFilters() {
        this.filterDateStart = null;
        this.filterDateEnd = null;
        this.phases = [...this.allPhases];
    }
}
