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
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { ProductService } from '../services/product.service';
import { ReferenceDataService, WarehouseResponseDto, ProductClassificationResponseDto, UnitResponseDto } from '../services/reference-data.service';
import { ProductResponseDto, ProductDto, ProductType } from '../models/product.model';

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
    selector: 'app-product-list',
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
        ConfirmDialogModule,
        SelectModule,
        InputNumberModule
    ],
    templateUrl: './product-list.component.html',
    providers: [MessageService, ProductService, ReferenceDataService, ConfirmationService]
})
export class ProductListComponent implements OnInit {
    productDialog: boolean = false;
    products = signal<ProductResponseDto[]>([]);
    product: ProductResponseDto = {} as ProductResponseDto;
    selectedProducts!: ProductResponseDto[] | null;
    submitted: boolean = false;

    // Datos de referencia
    warehouses: WarehouseResponseDto[] = [];
    classifications: ProductClassificationResponseDto[] = [];
    units: UnitResponseDto[] = [];

    // Opciones para dropdowns
    productTypes = [
        { label: 'Materia Prima', value: ProductType.RawMaterial },
        { label: 'Producto Terminado', value: ProductType.FinishedProduct },
        { label: 'Materia Prima y Producto Terminado', value: ProductType.RawMaterialAndFinishedProduct },
        { label: 'Servicio', value: ProductType.Service },
        { label: 'Producto Biológico', value: ProductType.BiologicalProduct },
        { label: 'Materiales y Suministros', value: ProductType.MaterialsAndSupplies }
    ];

    @ViewChild('dt') dt!: Table;
    exportColumns!: ExportColumn[];
    cols!: Column[];

    constructor(
        private productService: ProductService,
        private referenceDataService: ReferenceDataService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadProducts();
        this.loadReferenceData();
        this.setupColumns();
    }

    loadProducts() {
        this.productService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.products.set(response.data);
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: response.message || 'Error al cargar productos',
                        life: 3000
                    });
                }
            },
            error: (error) => {
                console.error('Error loading products:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error de conexión al cargar productos',
                    life: 3000
                });
            }
        });
    }

    loadReferenceData() {
        // Cargar almacenes
        this.referenceDataService.getWarehouses().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.warehouses = response.data;
                } else {
                    console.error('Error loading warehouses:', response.message);
                }
            },
            error: (error) => console.error('Error loading warehouses:', error)
        });

        // Cargar clasificaciones
        this.referenceDataService.getProductClassifications().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.classifications = response.data;
                } else {
                    console.error('Error loading classifications:', response.message);
                }
            },
            error: (error) => console.error('Error loading classifications:', error)
        });

        // Cargar unidades
        this.referenceDataService.getUnits().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.units = response.data;
                } else {
                    console.error('Error loading units:', response.message);
                }
            },
            error: (error) => console.error('Error loading units:', error)
        });
    }

    setupColumns() {
        this.cols = [
            { field: 'sku', header: 'SKU', customExportHeader: 'Código del Producto' },
            { field: 'name', header: 'Nombre' },
            { field: 'type', header: 'Tipo' },
            { field: 'productClassificationName', header: 'Clasificación' },
            { field: 'unitName', header: 'Unidad' },
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
        this.product = {
            name: '',
            description: '',
            sku: '',
            type: ProductType.RawMaterial,
            productClassificationId: 0,
            unitId: 0,
            price: 0,
            cost: 0,
            stockQuantity: 0,
            minStock: 0,
            isActive: true
        } as ProductResponseDto;
        this.submitted = false;
        this.productDialog = true;
    }

    editProduct(product: ProductResponseDto) {
        this.product = { ...product };
        this.productDialog = true;
    }

    deleteSelectedProducts() {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar los productos seleccionados?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const selectedIds = this.selectedProducts?.map(p => p.id) || [];
                selectedIds.forEach(id => {
                    this.productService.delete(id).subscribe({
                        next: () => {
                            this.loadProducts();
                        },
                        error: (error) => {
                            console.error('Error deleting product:', error);
                        }
                    });
                });
                this.selectedProducts = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Exitoso',
                    detail: 'Productos Eliminados',
                    life: 3000
                });
            }
        });
    }

    hideDialog() {
        this.productDialog = false;
        this.submitted = false;
    }

    deleteProduct(product: ProductResponseDto) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar el producto "' + product.name + '"?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.productService.delete(product.id).subscribe({
                    next: () => {
                        this.loadProducts();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Producto Eliminado',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al eliminar producto',
                            life: 3000
                        });
                        console.error('Error deleting product:', error);
                    }
                });
            }
        });
    }

    getSeverity(isActive: boolean) {
        return isActive ? 'success' : 'danger';
    }

    getProductTypeLabel(type: ProductType): string {
        const typeOption = this.productTypes.find(t => t.value === type);
        return typeOption ? typeOption.label : 'Desconocido';
    }

    saveProduct() {
        this.submitted = true;
        
        if (this.product.name?.trim() && this.product.type !== undefined && this.product.type !== null && this.product.productClassificationId && this.product.unitId) {
            const productData: ProductDto = {
                name: this.product.name,
                description: this.product.description,
                sku: this.product.sku,
                type: this.product.type,
                productClassificationId: this.product.productClassificationId,
                unitId: this.product.unitId,
                price: this.product.price,
                cost: this.product.cost,
                stockQuantity: this.product.stockQuantity,
                minStock: this.product.minStock,
                isActive: this.product.isActive,
                productFamilyId: this.product.productFamilyId,
                productSubfamilyId: this.product.productSubfamilyId,
                warehouseId: this.product.warehouseId
            };

            if (this.product.id) {
                // Update existing product
                this.productService.update(this.product.id, productData).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadProducts();
                            this.productDialog = false;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: response.message || 'Producto Actualizado',
                                life: 3000
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al actualizar producto',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error de conexión al actualizar producto',
                            life: 3000
                        });
                        console.error('Error updating product:', error);
                    }
                });
            } else {
                // Create new product
                console.log('Creando producto con datos:', productData);
                this.productService.create(productData).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadProducts();
                            this.productDialog = false;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: response.message || 'Producto Creado',
                                life: 3000
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al crear producto',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error de conexión al crear producto',
                            life: 3000
                        });
                        console.error('Error creating product:', error);
                    }
                });
            }
        }
    }

    exportCSV() {
        this.dt.exportCSV();
    }
}
