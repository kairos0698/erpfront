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
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { AutoCompleteModule, AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { PurchaseOrderService } from '../services/purchase-order.service';
import { PurchaseOrderItemService } from '../services/purchase-order-item.service';
import { SupplierService } from '../../proveedores/services/supplier.service';
import { WarehouseService } from '../../almacenes/services/warehouse.service';
import { ProductService } from '../../productos/services/product.service';
import { PurchaseOrderResponseDto, PurchaseOrderDto, PurchaseOrderStatus } from '../models/purchase-order.model';
import { PurchaseOrderItemResponseDto, PurchaseOrderItemDto } from '../models/purchase-order-item.model';
import { SupplierResponseDto } from '../../proveedores/models/supplier.model';
import { WarehouseResponseDto } from '../../almacenes/models/warehouse.model';
import { ProductResponseDto, ProductType } from '../../productos/models/product.model';

interface Column {
    field: string;
    header: string;
}

@Component({
    selector: 'app-purchase-order-list',
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
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        SelectModule,
        InputNumberModule,
        TooltipModule,
        AutoCompleteModule
    ],
    templateUrl: './purchase-order-list.component.html',
    providers: [MessageService, PurchaseOrderService, PurchaseOrderItemService, SupplierService, WarehouseService, ProductService, ConfirmationService]
})
export class PurchaseOrderListComponent implements OnInit {
    purchaseOrderDialog: boolean = false;
    purchaseOrders = signal<PurchaseOrderResponseDto[]>([]);
    purchaseOrder: PurchaseOrderResponseDto = {} as PurchaseOrderResponseDto;
    submitted: boolean = false;

    // Selectores
    suppliers: SupplierResponseDto[] = [];
    warehouses: WarehouseResponseDto[] = [];
    products: ProductResponseDto[] = [];
    filteredProducts: ProductResponseDto[] = [];

    // Items de la orden
    orderItems: PurchaseOrderItemResponseDto[] = [];
    itemDialog: boolean = false;
    orderItem: PurchaseOrderItemResponseDto = {} as PurchaseOrderItemResponseDto;
    selectedProductForAutocomplete: ProductResponseDto | null = null;

    // Estados
    statusOptions = [
        { label: 'Por aprobar', value: PurchaseOrderStatus.PendingApproval },
        { label: 'Aprobado', value: PurchaseOrderStatus.Approved }
    ];

    @ViewChild('dt') dt!: Table;
    cols!: Column[];

    constructor(
        private purchaseOrderService: PurchaseOrderService,
        private purchaseOrderItemService: PurchaseOrderItemService,
        private supplierService: SupplierService,
        private warehouseService: WarehouseService,
        private productService: ProductService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadPurchaseOrders();
        this.loadSuppliers();
        this.loadWarehouses();
        this.loadProducts();
        this.setupColumns();
    }

    loadPurchaseOrders() {
        this.purchaseOrderService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.purchaseOrders.set(response.data);
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: response.message || 'Error al cargar órdenes de compra',
                        life: 3000
                    });
                }
            },
            error: (error) => {
                console.error('Error loading purchase orders:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error de conexión al cargar órdenes de compra',
                    life: 3000
                });
            }
        });
    }

    loadSuppliers() {
        this.supplierService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.suppliers = response.data.filter(s => s.isActive);
                }
            },
            error: (error) => {
                console.error('Error loading suppliers:', error);
            }
        });
    }

    loadWarehouses() {
        this.warehouseService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.warehouses = response.data.filter(w => w.isActive);
                }
            },
            error: (error) => {
                console.error('Error loading warehouses:', error);
            }
        });
    }

    loadProducts() {
        this.productService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    // Filtrar productos que NO sean biológicos
                    this.products = response.data.filter(p => 
                        p.type !== ProductType.BiologicalProduct && p.isActive
                    );
                    this.filteredProducts = [...this.products];
                }
            },
            error: (error) => {
                console.error('Error loading products:', error);
            }
        });
    }

    setupColumns() {
        this.cols = [
            { field: 'orderNumber', header: 'Número' },
            { field: 'supplierName', header: 'Proveedor' },
            { field: 'warehouseName', header: 'Almacén' },
            { field: 'status', header: 'Estado' },
            { field: 'orderDate', header: 'Fecha' },
            { field: 'totalAmount', header: 'Total' }
        ];
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.purchaseOrder = {
            supplierId: 0,
            warehouseId: 0,
            orderDate: new Date(),
            status: PurchaseOrderStatus.PendingApproval,
            notes: ''
        } as PurchaseOrderResponseDto;
        this.orderItems = [];
        this.submitted = false;
        this.purchaseOrderDialog = true;
    }

    editPurchaseOrder(order: PurchaseOrderResponseDto) {
        this.purchaseOrderService.getById(order.id).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.purchaseOrder = response.data;
                    this.loadOrderItems(order.id);
                    this.purchaseOrderDialog = true;
                }
            },
            error: (error) => {
                console.error('Error loading purchase order:', error);
            }
        });
    }

    deletePurchaseOrder(order: PurchaseOrderResponseDto) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de que quieres eliminar la orden "${order.orderNumber}"?`,
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.purchaseOrderService.delete(order.id).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadPurchaseOrders();
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: response.message || 'Orden eliminada',
                                life: 3000
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al eliminar orden',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: error.error?.message || 'Error de conexión al eliminar orden',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    approvePurchaseOrder(order: PurchaseOrderResponseDto) {
        // Verificar que la orden tenga al menos 1 producto
        if (!order.items || order.items.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'No se puede aprobar una orden sin productos. Agrega al menos un producto antes de aprobar.',
                life: 5000
            });
            return;
        }

        this.confirmationService.confirm({
            message: `¿Estás seguro de que quieres aprobar la orden "${order.orderNumber}"?`,
            header: 'Confirmar Aprobación',
            icon: 'pi pi-check-circle',
            accept: () => {
                this.purchaseOrderService.approve(order.id).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadPurchaseOrders();
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Orden aprobada exitosamente',
                                life: 3000
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al aprobar orden',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: error.error?.message || 'Error de conexión al aprobar orden',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    cancelPurchaseOrder(order: PurchaseOrderResponseDto) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de que quieres cancelar la orden "${order.orderNumber}"?`,
            header: 'Confirmar Cancelación',
            icon: 'pi pi-times-circle',
            accept: () => {
                this.purchaseOrderService.cancel(order.id).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadPurchaseOrders();
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Orden cancelada exitosamente',
                                life: 3000
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al cancelar orden',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: error.error?.message || 'Error de conexión al cancelar orden',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    hideDialog() {
        this.purchaseOrderDialog = false;
        this.submitted = false;
        this.orderItems = [];
    }

    savePurchaseOrder() {
        this.submitted = true;

        if (!this.purchaseOrder.supplierId || !this.purchaseOrder.warehouseId) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Proveedor y Almacén son requeridos',
                life: 3000
            });
            return;
        }

        const orderData: PurchaseOrderDto = {
            supplierId: this.purchaseOrder.supplierId,
            warehouseId: this.purchaseOrder.warehouseId,
            orderDate: this.purchaseOrder.orderDate,
            status: PurchaseOrderStatus.PendingApproval, // Siempre se crea como "Por Aprobar"
            notes: this.purchaseOrder.notes
        };

        if (this.purchaseOrder.id) {
            this.purchaseOrderService.update(this.purchaseOrder.id, orderData).subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        this.loadPurchaseOrders(); // Recargar la lista de órdenes
                        this.purchaseOrderDialog = false; // Cerrar el modal
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: response.message || 'Orden actualizada',
                            life: 3000
                        });
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: response.message || 'Error al actualizar orden',
                            life: 3000
                        });
                    }
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: error.error?.message || 'Error de conexión al actualizar orden',
                        life: 3000
                    });
                }
            });
        } else {
            this.purchaseOrderService.create(orderData).subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        this.purchaseOrder = response.data; // Actualizar con la orden completa del servidor
                        this.loadOrderItems(response.data.id); // Cargar items (aunque esté vacío)
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: response.message || 'Orden creada',
                            life: 3000
                        });
                        // No cerrar el diálogo, permitir agregar productos inmediatamente
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: response.message || 'Error al crear orden',
                            life: 3000
                        });
                    }
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: error.error?.message || 'Error de conexión al crear orden',
                        life: 3000
                    });
                }
            });
        }
    }

    // Métodos para items
    loadOrderItems(purchaseOrderId: number) {
        this.purchaseOrderItemService.getByPurchaseOrderId(purchaseOrderId).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.orderItems = response.data;
                    // Actualizar el total de la orden localmente sumando los totales de los items
                    if (this.purchaseOrder.id) {
                        this.purchaseOrder.totalAmount = this.orderItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
                    }
                } else {
                    this.orderItems = [];
                    if (this.purchaseOrder.id) {
                        this.purchaseOrder.totalAmount = 0;
                    }
                }
            },
            error: (error) => {
                if (error.status === 404) {
                    this.orderItems = [];
                    if (this.purchaseOrder.id) {
                        this.purchaseOrder.totalAmount = 0;
                    }
                } else {
                    console.error('Error loading order items:', error);
                }
            }
        });
    }

    openNewItem() {
        if (!this.purchaseOrder.id) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'Primero debes guardar la orden de compra',
                life: 3000
            });
            return;
        }

        this.orderItem = {
            purchaseOrderId: this.purchaseOrder.id,
            productId: 0,
            quantity: 1,
            unitPrice: 0,
            ivaPercentage: 16,
            comment: ''
        } as PurchaseOrderItemResponseDto;
        this.filteredProducts = [...this.products];
        this.selectedProductForAutocomplete = null;
        this.itemDialog = true;
    }

    editItem(item: PurchaseOrderItemResponseDto) {
        this.orderItem = { ...item };
        const product = this.products.find(p => p.id === item.productId);
        this.selectedProductForAutocomplete = product || null;
        this.filteredProducts = [...this.products];
        this.itemDialog = true;
    }

    deleteItem(item: PurchaseOrderItemResponseDto) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar este producto?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.purchaseOrderItemService.delete(item.id).subscribe({
                    next: (response) => {
                        if (response.success) {
                            // Solo recargar los items - el backend ya recalcula el total automáticamente
                            this.loadOrderItems(this.purchaseOrder.id);
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Producto eliminado',
                                life: 3000
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al eliminar producto',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: error.error?.message || 'Error de conexión al eliminar producto',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    onProductSelect(event: AutoCompleteSelectEvent | null) {
        if (event && event.value) {
            const product = event.value as ProductResponseDto;
            this.orderItem.productId = product.id;
            this.orderItem.unitPrice = product.cost || 0;
            this.selectedProductForAutocomplete = product;
        } else {
            this.orderItem.productId = 0;
            this.selectedProductForAutocomplete = null;
        }
    }

    filterProducts(event: AutoCompleteCompleteEvent) {
        const query = event.query.toLowerCase();
        this.filteredProducts = this.products.filter(p =>
            p.name.toLowerCase().includes(query) ||
            (p.description && p.description.toLowerCase().includes(query)) ||
            (p.unitName && p.unitName.toLowerCase().includes(query))
        );
    }

    calculateItemTotal(): number {
        if (!this.orderItem.quantity || !this.orderItem.unitPrice) {
            return 0;
        }
        const subtotal = this.orderItem.quantity * this.orderItem.unitPrice;
        const iva = subtotal * (this.orderItem.ivaPercentage / 100);
        return subtotal + iva;
    }

    saveItem() {
        if (!this.orderItem.productId || !this.orderItem.quantity || !this.orderItem.unitPrice) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Producto, Cantidad y Costo son requeridos',
                life: 3000
            });
            return;
        }

        const itemData: PurchaseOrderItemDto = {
            purchaseOrderId: this.orderItem.purchaseOrderId,
            productId: this.orderItem.productId,
            quantity: this.orderItem.quantity,
            unitPrice: this.orderItem.unitPrice,
            ivaPercentage: this.orderItem.ivaPercentage || 0,
            comment: this.orderItem.comment
        };

        if (this.orderItem.id) {
            this.purchaseOrderItemService.update(this.orderItem.id, itemData).subscribe({
                next: (response) => {
                    if (response.success) {
                        // Solo recargar los items - el backend ya recalcula el total automáticamente
                        this.loadOrderItems(this.purchaseOrder.id);
                        this.itemDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Producto actualizado',
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
                        detail: error.error?.message || 'Error de conexión al actualizar producto',
                        life: 3000
                    });
                }
            });
        } else {
            this.purchaseOrderItemService.create(itemData).subscribe({
                next: (response) => {
                    if (response.success) {
                        // Solo recargar los items - el backend ya recalcula el total automáticamente
                        this.loadOrderItems(this.purchaseOrder.id);
                        this.itemDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Producto agregado',
                            life: 3000
                        });
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: response.message || 'Error al agregar producto',
                            life: 3000
                        });
                    }
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: error.error?.message || 'Error de conexión al agregar producto',
                        life: 3000
                    });
                }
            });
        }
    }

    getStatusSeverity(status: number): string {
        switch (status) {
            case PurchaseOrderStatus.PendingApproval:
                return 'warning';
            case PurchaseOrderStatus.Approved:
                return 'success';
            case PurchaseOrderStatus.Cancelled:
                return 'danger';
            default:
                return 'secondary';
        }
    }

    getStatusLabel(status: number): string {
        switch (status) {
            case PurchaseOrderStatus.PendingApproval:
                return 'Por Aprobar';
            case PurchaseOrderStatus.Approved:
                return 'Aprobado';
            case PurchaseOrderStatus.Cancelled:
                return 'Cancelado';
            default:
                return 'Desconocido';
        }
    }

    canEdit(order: PurchaseOrderResponseDto): boolean {
        return order.status === PurchaseOrderStatus.PendingApproval;
    }

    getSelectedProduct(): ProductResponseDto | undefined {
        return this.products.find(p => p.id === this.orderItem.productId);
    }
}
