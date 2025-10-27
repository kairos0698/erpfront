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
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { WarehouseService } from '../services/warehouse.service';
import { WarehouseResponseDto, WarehouseDto } from '../models/warehouse.model';

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
    selector: 'app-warehouse-list',
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
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule
    ],
    templateUrl: './warehouse-list.component.html',
    providers: [MessageService, WarehouseService, ConfirmationService]
})
export class WarehouseListComponent implements OnInit {
    warehouseDialog: boolean = false;
    warehouses = signal<WarehouseResponseDto[]>([]);
    warehouse: WarehouseResponseDto = {} as WarehouseResponseDto;
    selectedWarehouses!: WarehouseResponseDto[] | null;
    submitted: boolean = false;

    @ViewChild('dt') dt!: Table;
    exportColumns!: ExportColumn[];
    cols!: Column[];

    constructor(
        private warehouseService: WarehouseService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadWarehouses();
        this.setupColumns();
    }

    loadWarehouses() {
        this.warehouseService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.warehouses.set(response.data);
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: response.message || 'Error al cargar almacenes',
                        life: 3000
                    });
                }
            },
            error: (error) => {
                console.error('Error loading warehouses:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error de conexión al cargar almacenes',
                    life: 3000
                });
            }
        });
    }

    setupColumns() {
        this.cols = [
            { field: 'name', header: 'Nombre', customExportHeader: 'Nombre del Almacén' },
            { field: 'location', header: 'Ubicación' },
            { field: 'type', header: 'Tipo' },
            { field: 'responsiblePerson', header: 'Responsable' },
            { field: 'isActive', header: 'Estado' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.warehouse = {
            name: '',
            location: '',
            type: '',
            responsiblePerson: '',
            isActive: true
        } as WarehouseResponseDto;
        this.submitted = false;
        this.warehouseDialog = true;
    }

    editWarehouse(warehouse: WarehouseResponseDto) {
        this.warehouse = { ...warehouse };
        this.warehouseDialog = true;
    }

    deleteSelectedWarehouses() {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar los almacenes seleccionados?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const selectedIds = this.selectedWarehouses?.map(w => w.id) || [];
                selectedIds.forEach(id => {
                    this.warehouseService.delete(id).subscribe({
                        next: () => {
                            this.loadWarehouses();
                        },
                        error: (error) => {
                            console.error('Error deleting warehouse:', error);
                        }
                    });
                });
                this.selectedWarehouses = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Exitoso',
                    detail: 'Almacenes Eliminados',
                    life: 3000
                });
            }
        });
    }

    hideDialog() {
        this.warehouseDialog = false;
        this.submitted = false;
    }

    deleteWarehouse(warehouse: WarehouseResponseDto) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar el almacén "' + warehouse.name + '"?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.warehouseService.delete(warehouse.id).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadWarehouses();
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: response.message || 'Almacén Eliminado',
                                life: 3000
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al eliminar almacén',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error de conexión al eliminar almacén',
                            life: 3000
                        });
                        console.error('Error deleting warehouse:', error);
                    }
                });
            }
        });
    }

    getSeverity(isActive: boolean) {
        return isActive ? 'success' : 'danger';
    }

    saveWarehouse() {
        this.submitted = true;
        
        if (this.warehouse.name?.trim()) {
            const warehouseData: WarehouseDto = {
                name: this.warehouse.name,
                location: this.warehouse.location,
                type: this.warehouse.type,
                responsiblePerson: this.warehouse.responsiblePerson,
                isActive: this.warehouse.isActive
            };

            if (this.warehouse.id) {
                // Update existing warehouse
                this.warehouseService.update(this.warehouse.id, warehouseData).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadWarehouses();
                            this.warehouseDialog = false;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: response.message || 'Almacén Actualizado',
                                life: 3000
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al actualizar almacén',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error de conexión al actualizar almacén',
                            life: 3000
                        });
                        console.error('Error updating warehouse:', error);
                    }
                });
            } else {
                // Create new warehouse
                this.warehouseService.create(warehouseData).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadWarehouses();
                            this.warehouseDialog = false;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: response.message || 'Almacén Creado',
                                life: 3000
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al crear almacén',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error de conexión al crear almacén',
                            life: 3000
                        });
                        console.error('Error creating warehouse:', error);
                    }
                });
            }
        }
    }

    exportCSV() {
        this.warehouseService.export('csv').subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'almacenes.csv';
                link.click();
                window.URL.revokeObjectURL(url);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Exitoso',
                    detail: 'Almacenes exportados correctamente',
                    life: 3000
                });
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al exportar almacenes',
                    life: 3000
                });
                console.error('Error exporting warehouses:', error);
            }
        });
    }
}
