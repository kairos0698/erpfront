import { Component, OnInit, ViewChild } from '@angular/core';
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
import { BiologicalProductService } from '../services/biological-product.service';
import { BiologicalProductResponseDto, BiologicalProductDto } from '../models/biological-product.model';
import { BiologicalPhaseResponseDto } from '../services/biological-phase.service';
import { BiologicalPhaseManagementComponent } from './biological-phase-management.component';
import { WorkOrderManagementComponent } from './work-order-management.component';

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
    selector: 'app-biological-product-list',
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
        BiologicalPhaseManagementComponent,
        WorkOrderManagementComponent
    ],
    templateUrl: './biological-product-list.component.html',
    providers: [MessageService, BiologicalProductService, ConfirmationService]
})
export class BiologicalProductListComponent implements OnInit {
    biologicalProductDialog: boolean = false;
    phasesDialog: boolean = false;
    workOrdersDialog: boolean = false;
    biologicalProducts: BiologicalProductResponseDto[] = [];
    biologicalProduct: BiologicalProductResponseDto = {} as BiologicalProductResponseDto;
    selectedBiologicalProducts!: BiologicalProductResponseDto[] | null;
    submitted: boolean = false;

    // Datos para comunicación entre componentes
    selectedProduct: BiologicalProductResponseDto | null = null;
    selectedPhase: BiologicalPhaseResponseDto | null = null;

    @ViewChild('dt') dt!: Table;
    exportColumns!: ExportColumn[];
    cols!: Column[];

    constructor(
        private biologicalProductService: BiologicalProductService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadBiologicalProducts();
        this.setupColumns();
    }

    loadBiologicalProducts() {
        this.biologicalProductService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.biologicalProducts = response.data;
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: response.message || 'Error al cargar productos biológicos',
                        life: 3000
                    });
                }
            },
            error: (error) => {
                console.error('Error loading biological products:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error de conexión al cargar productos biológicos',
                    life: 3000
                });
            }
        });
    }

    setupColumns() {
        this.cols = [
            { field: 'name', header: 'Nombre', customExportHeader: 'Nombre del Producto' },
            { field: 'sku', header: 'SKU' },
            { field: 'description', header: 'Descripción' },
            { field: 'price', header: 'Precio' },
            { field: 'stockQuantity', header: 'Stock' },
            { field: 'isActive', header: 'Estado' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.biologicalProduct = {
            name: '',
            description: '',
            sku: '',
            price: 0,
            stockQuantity: 0,
            isActive: true
        } as BiologicalProductResponseDto;
        this.submitted = false;
        this.biologicalProductDialog = true;
    }

    editBiologicalProduct(biologicalProduct: BiologicalProductResponseDto) {
        this.biologicalProduct = { ...biologicalProduct };
        this.biologicalProductDialog = true;
    }

    viewPhases(biologicalProduct: BiologicalProductResponseDto) {
        this.selectedProduct = biologicalProduct;
        this.phasesDialog = true;
    }

    onWorkOrdersRequested(phase: BiologicalPhaseResponseDto) {
        this.selectedPhase = phase;
        this.workOrdersDialog = true;
    }

    deleteSelectedBiologicalProducts() {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar los productos biológicos seleccionados?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const selectedIds = this.selectedBiologicalProducts?.map(bp => bp.id) || [];
                selectedIds.forEach(id => {
                    this.biologicalProductService.delete(id).subscribe({
                        next: () => {
                            this.loadBiologicalProducts();
                        },
                        error: (error) => {
                            console.error('Error deleting biological product:', error);
                        }
                    });
                });
                this.selectedBiologicalProducts = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Exitoso',
                    detail: 'Productos Biológicos Eliminados',
                    life: 3000
                });
            }
        });
    }

    hideDialog() {
        this.biologicalProductDialog = false;
        this.submitted = false;
    }

    hidePhasesDialog() {
        this.phasesDialog = false;
        this.selectedProduct = null;
    }

    hideWorkOrdersDialog() {
        this.workOrdersDialog = false;
        this.selectedPhase = null;
    }

    deleteBiologicalProduct(biologicalProduct: BiologicalProductResponseDto) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar el producto biológico "' + biologicalProduct.name + '"?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.biologicalProductService.delete(biologicalProduct.id).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadBiologicalProducts();
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: response.message || 'Producto Biológico Eliminado',
                                life: 3000
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al eliminar producto biológico',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error de conexión al eliminar producto biológico',
                            life: 3000
                        });
                        console.error('Error deleting biological product:', error);
                    }
                });
            }
        });
    }

    getSeverity(isActive: boolean) {
        return isActive ? 'success' : 'danger';
    }

    saveBiologicalProduct() {
        this.submitted = true;

        if (this.biologicalProduct.name?.trim() && this.biologicalProduct.sku?.trim()) {
            const biologicalProductData: BiologicalProductDto = {
                name: this.biologicalProduct.name,
                description: this.biologicalProduct.description,
                sku: this.biologicalProduct.sku,
                price: this.biologicalProduct.price,
                stockQuantity: this.biologicalProduct.stockQuantity,
                isActive: this.biologicalProduct.isActive
            };

            if (this.biologicalProduct.id) {
                // Update existing biological product
                this.biologicalProductService.update(this.biologicalProduct.id, biologicalProductData).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadBiologicalProducts();
                            this.biologicalProductDialog = false;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: response.message || 'Producto Biológico Actualizado',
                                life: 3000
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al actualizar producto biológico',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error de conexión al actualizar producto biológico',
                            life: 3000
                        });
                        console.error('Error updating biological product:', error);
                    }
                });
            } else {
                // Create new biological product
                this.biologicalProductService.create(biologicalProductData).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadBiologicalProducts();
                            this.biologicalProductDialog = false;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: response.message || 'Producto Biológico Creado',
                                life: 3000
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al crear producto biológico',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error de conexión al crear producto biológico',
                            life: 3000
                        });
                        console.error('Error creating biological product:', error);
                    }
                });
            }
        }
    }

    exportCSV() {
        this.dt.exportCSV();
    }
}
