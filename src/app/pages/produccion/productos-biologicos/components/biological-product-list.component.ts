import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
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
        private confirmationService: ConfirmationService,
        private router: Router
    ) {}

    ngOnInit() {
        this.loadBiologicalProducts();
        this.setupColumns();
    }

    loadBiologicalProducts() {
        this.biologicalProductService.getAll().subscribe({
            next: (response) => {
                console.log('📦 Response de productos biológicos:', response);
                if (response.success && response.data) {
                    this.biologicalProducts = response.data;
                    console.log('📦 Productos biológicos cargados:', this.biologicalProducts.length, this.biologicalProducts);
                    if (this.biologicalProducts.length === 0) {
                        console.warn('⚠️ No se encontraron productos biológicos en la respuesta');
                    }
                } else {
                    console.error('❌ Error en respuesta:', response.message);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: response.message || 'Error al cargar productos biológicos',
                        life: 3000
                    });
                }
            },
            error: (error) => {
                console.error('❌ Error loading biological products:', error);
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
            { field: 'description', header: 'Descripción' },
            { field: 'price', header: 'Costo' },
            { field: 'stockQuantity', header: 'Stock' },
            { field: 'isActive', header: 'Estado' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        // Navegar a la página de productos en inventario
        this.router.navigate(['/inventario/productos']);
    }

    editBiologicalProduct(biologicalProduct: BiologicalProductResponseDto) {
        this.biologicalProduct = { 
            ...biologicalProduct,
            cost: biologicalProduct.cost ?? biologicalProduct.price ?? 0, // Usar cost del backend, o price como fallback
            price: biologicalProduct.cost ?? biologicalProduct.price ?? 0, // Mantener price también
            isFixedCost: biologicalProduct.isFixedCost ?? true // Por defecto true si no existe
        };
        this.biologicalProductDialog = true;
    }

    viewPhases(biologicalProduct: BiologicalProductResponseDto) {
        // Recargar el producto para obtener el costo actualizado
        this.biologicalProductService.getById(biologicalProduct.id).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.selectedProduct = response.data;
                    // Actualizar también en la lista local
                    const index = this.biologicalProducts.findIndex(p => p.id === biologicalProduct.id);
                    if (index !== -1) {
                        this.biologicalProducts[index] = response.data;
                    }
                } else {
                    this.selectedProduct = biologicalProduct;
                }
                this.phasesDialog = true;
            },
            error: (error) => {
                console.error('Error loading product:', error);
                this.selectedProduct = biologicalProduct;
                this.phasesDialog = true;
            }
        });
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
        // Limpiar el objeto de producto biológico para evitar problemas de estado
        this.biologicalProduct = {
            id: 0,
            name: '',
            sku: '',
            description: '',
            price: 0,
            cost: 0,
            isFixedCost: true,
            stockQuantity: 0,
            isActive: true,
            organizationId: '',
            createdAt: new Date(),
            updatedAt: new Date()
        } as BiologicalProductResponseDto;
    }

    hidePhasesDialog() {
        this.phasesDialog = false;
        this.selectedProduct = null;
    }

    hideWorkOrdersDialog() {
        this.workOrdersDialog = false;
        this.selectedPhase = null;
    }

    /**
     * Se llama cuando una orden de trabajo cambia a Completada o Cancelada.
     * Recarga los datos del producto para actualizar el costo promedio y stock.
     * Cierra todos los modales para mostrar la tabla actualizada.
     */
    onProductDataChanged() {
        console.log('📊 Recargando datos del producto biológico por cambio de estado en orden de trabajo');
        
        // Cerrar todos los modales
        this.workOrdersDialog = false;
        this.phasesDialog = false;
        this.selectedPhase = null;
        this.selectedProduct = null;
        
        // Recargar la lista de productos biológicos
        this.loadBiologicalProducts();
        
        // Mostrar mensaje de éxito
        this.messageService.add({
            severity: 'info',
            summary: 'Datos Actualizados',
            detail: 'El costo y stock del producto se han recalculado',
            life: 3000
        });
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

        if (this.biologicalProduct.name?.trim()) {
            const costValue = this.biologicalProduct.cost ?? this.biologicalProduct.price ?? 0;
            const biologicalProductData: BiologicalProductDto = {
                name: this.biologicalProduct.name,
                description: this.biologicalProduct.description,
                sku: this.biologicalProduct.sku || '',
                price: costValue,
                cost: costValue,
                isFixedCost: this.biologicalProduct.isFixedCost ?? true,
                stockQuantity: this.biologicalProduct.stockQuantity,
                isActive: this.biologicalProduct.isActive
            };

            if (this.biologicalProduct.id) {
                // Update existing biological product
                this.biologicalProductService.update(this.biologicalProduct.id, biologicalProductData).subscribe({
                    next: (response) => {
                        if (response.success) {
                            // Si cambió a costo promedio, actualizar el costo desde la respuesta
                            if (response.data) {
                                this.biologicalProduct.cost = response.data.cost ?? response.data.price;
                                this.biologicalProduct.price = response.data.cost ?? response.data.price;
                            }
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
