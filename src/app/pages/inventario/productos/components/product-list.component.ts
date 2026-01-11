import { Component, OnInit, signal, ViewChild, ChangeDetectorRef } from '@angular/core';
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
import { TooltipModule } from 'primeng/tooltip';
import { ProductService } from '../services/product.service';
import { ReferenceDataService, WarehouseResponseDto, ProductClassificationResponseDto } from '../services/reference-data.service';
import { UnitService, CreateUnitDto, UpdateUnitDto, UnitResponseDto } from '../services/unit.service';
import { ProductResponseDto, ProductDto, ProductType } from '../models/product.model';
import { AuthService } from '../../../../auth.service';

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
        InputNumberModule,
        TooltipModule
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
    units = signal<UnitResponseDto[]>([]); // Usar signal como en Puesto de Trabajo

    // Mini CRUD de Unidad
    unitDialog: boolean = false;
    unit: UnitResponseDto = {} as UnitResponseDto;
    unitSubmitted: boolean = false;
    currentUserOrganizationId: string | null = null;
    systemOrganizationId: string = '00000000-0000-0000-0000-000000000001';

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
        private unitService: UnitService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef
    ) {
        const currentUser = this.authService.getCurrentUser();
        this.currentUserOrganizationId = currentUser?.organizationId || null;
    }

    ngOnInit() {
        // Invalidar caché de unidades, almacenes y clasificaciones al inicializar para asegurar datos frescos de la organización actual
        this.unitService.invalidateCache();
        this.referenceDataService.invalidateCache('warehouses');
        this.referenceDataService.invalidateCache('classifications');
        this.loadProducts();
        this.loadReferenceData();
        this.setupColumns();
    }

    loadProducts() {
        this.productService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    // Convertir el tipo de string a número si viene como string del backend
                    const productsWithNumericType = response.data.map(product => {
                        if (typeof product.type === 'string') {
                            const typeString = product.type as string;
                            return {
                                ...product,
                                type: ProductType[typeString as keyof typeof ProductType] as ProductType
                            };
                        }
                        return product;
                    });
                    this.products.set(productsWithNumericType);
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

        // Cargar unidades usando UnitService
        this.loadUnits();
    }

    loadUnits() {
        this.unitService.getAll().subscribe({
            next: (units) => {
                console.log('ProductListComponent: Units received:', units);
                console.log('ProductListComponent: Is array?', Array.isArray(units));
                console.log('ProductListComponent: Length?', Array.isArray(units) ? units.length : 'N/A');
                
                if (Array.isArray(units) && units.length > 0) {
                    console.log('ProductListComponent: Setting units signal with', units.length, 'items');
                    this.units.set([...units]); // Crear nueva referencia para forzar detección
                    console.log('ProductListComponent: Units signal value after set:', this.units().length);
                    this.cdr.detectChanges(); // Forzar detección de cambios
                } else if (Array.isArray(units)) {
                    console.warn('ProductListComponent: Units array is empty');
                    this.units.set([]);
                } else {
                    console.warn('ProductListComponent: Units response is not an array:', units);
                    this.units.set([]);
                    // Intentar fallback
                    this.loadUnitsFallback();
                }
            },
            error: (error) => {
                console.error('ProductListComponent: Error loading units from UnitService:', error);
                this.units.set([]);
                this.loadUnitsFallback();
            }
        });
    }

    private loadUnitsFallback() {
        this.referenceDataService.getUnits().subscribe({
            next: (response) => {
                if (response.success && response.data && Array.isArray(response.data)) {
                    this.units.set(response.data);
                    this.cdr.detectChanges(); // Forzar detección de cambios
                } else {
                    console.error('Fallback response invalid:', response);
                    this.units.set([]);
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Advertencia',
                        detail: 'No se pudieron cargar las unidades. Por favor, recarga la página.',
                        life: 5000
                    });
                }
            },
            error: (err) => {
                console.error('Error loading units from fallback:', err);
                this.units.set([]);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar las unidades. Verifica tu conexión.',
                    life: 5000
                });
            }
        });
    }

    // Helper method to check if an item can be edited/deleted (belongs to user's organization, not system)
    canEditItem(organizationId: string | undefined): boolean {
        if (!organizationId || !this.currentUserOrganizationId) return false;
        return organizationId !== this.systemOrganizationId && organizationId === this.currentUserOrganizationId;
    }

    // Mini CRUD methods for Unit
    openNewUnit() {
        this.unit = {} as UnitResponseDto;
        this.unitSubmitted = false;
        this.unitDialog = true;
    }

    editUnit(unit: UnitResponseDto) {
        this.unit = { ...unit };
        this.unitSubmitted = false;
        this.unitDialog = true;
    }

    quickEditUnit(event: Event, unit: UnitResponseDto) {
        event.stopPropagation();
        this.editUnit(unit);
    }

    quickDeleteUnit(event: Event, unit: UnitResponseDto) {
        event.stopPropagation();
        this.deleteUnit(unit);
    }

    hideUnitDialog() {
        this.unitDialog = false;
        this.unitSubmitted = false;
    }

    saveUnit() {
        this.unitSubmitted = true;

        if (this.unit.name?.trim() && this.unit.abbreviation?.trim()) {
            if (this.unit.id) {
                // Update
                const updateDto: UpdateUnitDto = {
                    id: this.unit.id,
                    name: this.unit.name,
                    abbreviation: this.unit.abbreviation,
                    isActive: !!this.unit.isActive
                };

                this.unitService.update(this.unit.id, updateDto).subscribe({
                    next: (updatedUnit) => {
                        if (updatedUnit && updatedUnit.id) {
                            this.units.set(this.units().map(u => u.id === updatedUnit.id ? updatedUnit : u));
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Unidad actualizada',
                                life: 3000
                            });
                            this.unitDialog = false;
                            this.unit = {} as UnitResponseDto;
                        } else {
                            // Recargar unidades si la respuesta no es válida
                            this.loadUnits();
                            this.unitDialog = false;
                        }
                    },
                    error: (error) => {
                        console.error('Error updating unit:', error);
                        const errorMessage = error.error?.message || error.error?.error || error.message || 'Error al actualizar unidad';
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: errorMessage
                        });
                    }
                });
            } else {
                // Create
                const createDto: CreateUnitDto = {
                    name: this.unit.name,
                    abbreviation: this.unit.abbreviation,
                    isActive: !!this.unit.isActive
                };

                this.unitService.create(createDto).subscribe({
                    next: (newUnit) => {
                        if (newUnit && newUnit.id) {
                            this.units.set([...this.units(), newUnit]);
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Unidad creada',
                                life: 3000
                            });
                            this.unitDialog = false;
                            this.unit = {} as UnitResponseDto;
                        } else {
                            // Recargar unidades si la respuesta no es válida
                            this.loadUnits();
                            this.unitDialog = false;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Unidad creada',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        console.error('Error creating unit:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al crear unidad'
                        });
                    }
                });
            }
        }
    }

    deleteUnit(unit: UnitResponseDto) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar ' + unit.name + '?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.unitService.delete(unit.id).subscribe({
                    next: () => {
                        this.units.set(this.units().filter(u => u.id !== unit.id));
                        this.messageService.add({ 
                            severity: 'success', 
                            summary: 'Exitoso', 
                            detail: 'Unidad eliminada', 
                            life: 3000 
                        });
                        if (this.product.unitId === unit.id) {
                            this.product.unitId = 0;
                        }
                    },
                    error: (error) => {
                        console.error('Error deleting unit:', error);
                        this.messageService.add({ 
                            severity: 'error', 
                            summary: 'Error', 
                            detail: error.error?.message || 'Error al eliminar unidad' 
                        });
                    }
                });
            }
        });
    }

    setupColumns() {
        this.cols = [
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
        // Asegurar que las unidades estén cargadas antes de abrir el modal
        if (this.units().length === 0) {
            this.loadUnits();
        }
        this.product = {
            id: 0,
            name: '',
            description: '',
            type: ProductType.RawMaterial,
            productClassificationId: 0,
            unitId: 0,
            price: 0,
            cost: 0,
            isFixedCost: true,
            stockQuantity: 0,
            minStock: 0,
            isActive: true,
            organizationId: '',
            createdAt: new Date(),
            updatedAt: new Date()
        } as ProductResponseDto;
        this.submitted = false;
        this.productDialog = true;
    }

    editProduct(product: ProductResponseDto) {
        // Asegurar que las unidades estén cargadas antes de abrir el modal
        if (this.units().length === 0) {
            this.loadUnits();
        }
        // Convertir el tipo de string a número si viene como string del backend
        let productType: ProductType;
        if (typeof product.type === 'string') {
            // El backend devuelve el enum como string en inglés, convertir a número
            const typeString = product.type as string;
            productType = ProductType[typeString as keyof typeof ProductType] as ProductType;
        } else {
            // Ya es un número (ProductType)
            productType = product.type as ProductType;
        }

        this.product = { 
            ...product,
            type: productType, // Asegurar que sea un número
            isFixedCost: product.isFixedCost !== undefined ? product.isFixedCost : true // Por defecto true si no existe
        };
        // Asegurar que isFixedCost esté inicializado
        if (this.product.isFixedCost === undefined) {
            this.product.isFixedCost = true;
        }
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

    getProductTypeLabel(type: ProductType | undefined | null): string {
        if (type === undefined || type === null) {
            return 'Desconocido';
        }
        if (!this.productTypes || !Array.isArray(this.productTypes)) {
            return 'Desconocido';
        }
        const typeOption = this.productTypes.find(t => t && t.value === type);
        return typeOption ? typeOption.label : 'Desconocido';
    }

    // Verificar si el producto es biológico
    isBiologicalProduct(): boolean {
        return this.product?.type === ProductType.BiologicalProduct;
    }

    // Exponer ProductType al template
    ProductType = ProductType;

    saveProduct() {
        this.submitted = true;
        
        if (this.product.name?.trim() && this.product.type !== undefined && this.product.type !== null && this.product.productClassificationId && this.product.unitId) {
            // Asegurar que el tipo sea un número (ProductType) y no un string
            const productType: ProductType = typeof this.product.type === 'string' 
                ? ProductType[this.product.type as keyof typeof ProductType] as ProductType
                : this.product.type as ProductType;

            const productData: ProductDto = {
                name: this.product.name,
                description: this.product.description,
                type: productType,
                productClassificationId: this.product.productClassificationId,
                unitId: this.product.unitId,
                price: this.product.price,
                cost: this.product.cost,
                isFixedCost: this.product.isFixedCost ?? true,
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
