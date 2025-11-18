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
import { ExtraCostService } from '../services/extra-cost.service';
import { ReferenceDataService, UnitResponseDto } from '../services/reference-data.service';
import { ExtraCostResponseDto, ExtraCostDto } from '../models/extra-cost.model';

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
    selector: 'app-extra-cost-list',
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
    templateUrl: './extra-cost-list.component.html',
    providers: [MessageService, ExtraCostService, ReferenceDataService, ConfirmationService]
})
export class ExtraCostListComponent implements OnInit {
    extraCostDialog: boolean = false;
    extraCosts = signal<ExtraCostResponseDto[]>([]);
    extraCost: ExtraCostResponseDto = {} as ExtraCostResponseDto;
    selectedExtraCosts!: ExtraCostResponseDto[] | null;
    submitted: boolean = false;

    // Datos de referencia
    units: UnitResponseDto[] = [];

    @ViewChild('dt') dt!: Table;
    exportColumns!: ExportColumn[];
    cols!: Column[];

    constructor(
        private extraCostService: ExtraCostService,
        private referenceDataService: ReferenceDataService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadExtraCosts();
        this.loadReferenceData();
        this.setupColumns();
    }

    loadExtraCosts() {
        this.extraCostService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.extraCosts.set(response.data);
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: response.message || 'Error al cargar costos extra',
                        life: 3000
                    });
                }
            },
            error: (error) => {
                console.error('Error loading extra costs:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error de conexión al cargar costos extra',
                    life: 3000
                });
            }
        });
    }

    loadReferenceData() {
        // Cargar unidades
        this.referenceDataService.getUnits().subscribe({
            next: (data) => {
                // Asegurar que siempre sea un array
                this.units = Array.isArray(data) ? data : [];
            },
            error: (error) => {
                console.error('Error loading units:', error);
                // Asegurar que siempre sea un array incluso en caso de error
                this.units = [];
            }
        });
    }

    setupColumns() {
        this.cols = [
            { field: 'name', header: 'Nombre', customExportHeader: 'Nombre del Costo Extra' },
            { field: 'description', header: 'Descripción' },
            { field: 'unitName', header: 'Unidad' },
            { field: 'unitCost', header: 'Costo Unitario' },
            { field: 'isActive', header: 'Estado' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.extraCost = {
            name: '',
            description: '',
            unitId: 0,
            unitCost: 0,
            isActive: true
        } as ExtraCostResponseDto;
        this.submitted = false;
        this.extraCostDialog = true;
    }

    editExtraCost(extraCost: ExtraCostResponseDto) {
        this.extraCost = { ...extraCost };
        this.extraCostDialog = true;
    }

    deleteSelectedExtraCosts() {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar los costos extra seleccionados?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const selectedIds = this.selectedExtraCosts?.map(ec => ec.id) || [];
                selectedIds.forEach(id => {
                    this.extraCostService.delete(id).subscribe({
                        next: () => {
                            this.loadExtraCosts();
                        },
                        error: (error) => {
                            console.error('Error deleting extra cost:', error);
                        }
                    });
                });
                this.selectedExtraCosts = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Exitoso',
                    detail: 'Costos Extra Eliminados',
                    life: 3000
                });
            }
        });
    }

    hideDialog() {
        this.extraCostDialog = false;
        this.submitted = false;
    }

    deleteExtraCost(extraCost: ExtraCostResponseDto) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar el costo extra "' + extraCost.name + '"?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.extraCostService.delete(extraCost.id).subscribe({
                    next: () => {
                        this.loadExtraCosts();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Costo Extra Eliminado',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al eliminar costo extra',
                            life: 3000
                        });
                        console.error('Error deleting extra cost:', error);
                    }
                });
            }
        });
    }

    getSeverity(isActive: boolean) {
        return isActive ? 'success' : 'danger';
    }

    saveExtraCost() {
        this.submitted = true;

        if (this.extraCost.name?.trim() && this.extraCost.unitId && this.extraCost.unitCost) {
            const extraCostData: ExtraCostDto = {
                name: this.extraCost.name,
                description: this.extraCost.description,
                unitId: this.extraCost.unitId,
                unitCost: this.extraCost.unitCost,
                isActive: this.extraCost.isActive
            };

            if (this.extraCost.id) {
                // Update existing extra cost
                this.extraCostService.update(this.extraCost.id, extraCostData).subscribe({
                    next: () => {
                        this.loadExtraCosts();
                        this.extraCostDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Costo Extra Actualizado',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al actualizar costo extra',
                            life: 3000
                        });
                        console.error('Error updating extra cost:', error);
                    }
                });
            } else {
                // Create new extra cost
                this.extraCostService.create(extraCostData).subscribe({
                    next: () => {
                        this.loadExtraCosts();
                        this.extraCostDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Costo Extra Creado',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al crear costo extra',
                            life: 3000
                        });
                        console.error('Error creating extra cost:', error);
                    }
                });
            }
        }
    }

    exportCSV() {
        this.dt.exportCSV();
    }
}
