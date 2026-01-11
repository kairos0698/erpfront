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
import { BiologicalPhaseService, BiologicalPhaseResponseDto, BiologicalPhaseDto } from '../services/biological-phase.service';
import { BiologicalProductResponseDto } from '../models/biological-product.model';

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
        InputIconModule
    ],
    templateUrl: './biological-phase-management.component.html',
    providers: [MessageService, BiologicalPhaseService, ConfirmationService]
})
export class BiologicalPhaseManagementComponent implements OnChanges {
    @Input() selectedProduct: BiologicalProductResponseDto | null = null;
    @Input() phasesDialog: boolean = false;
    @Output() phasesDialogChange = new EventEmitter<boolean>();
    @Output() workOrdersRequested = new EventEmitter<BiologicalPhaseResponseDto>();
    @Output() productDataChanged = new EventEmitter<void>(); // Propagado desde work-order-management

    phases: BiologicalPhaseResponseDto[] = [];
    newPhaseDialog: boolean = false;
    newPhase: BiologicalPhaseDto = {} as BiologicalPhaseDto;
    editingPhase: boolean = false;
    submitted: boolean = false;

    constructor(
        private biologicalPhaseService: BiologicalPhaseService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
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
                    this.phases = response.data;
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
        this.newPhase = {
            id: phase.id,
            name: phase.name,
            description: phase.description,
            phaseDate: phase.phaseDate,
            productId: phase.productId,
            isActive: phase.isActive
        };
        this.editingPhase = true;
        this.submitted = false;
        this.newPhaseDialog = true;
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

    /**
     * Obtiene el costo por unidad del producto biológico
     * El costo ya está calculado en el backend como TotalCost / StockQuantity
     */
    getCostPerUnit(): number {
        if (!this.selectedProduct) {
            return 0;
        }
        // El cost del producto ya es el costo por unidad (calculado en el backend)
        return this.selectedProduct.cost ?? this.selectedProduct.price ?? 0;
    }

    /**
     * Calcula el costo total de todas las fases (suma de todos los totalCost)
     */
    getTotalPhasesCost(): number {
        if (!this.phases || this.phases.length === 0) {
            return 0;
        }
        return this.phases.reduce((total, phase) => total + (phase.totalCost || 0), 0);
    }
}
