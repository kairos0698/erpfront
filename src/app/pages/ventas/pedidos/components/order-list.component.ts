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
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TooltipModule } from 'primeng/tooltip';
import { OrderService } from '../services/order.service';
import { CustomerService } from '../../clientes/services/customer.service';
import { CustomerDeliveryAddressService } from '../../clientes/services/customer-delivery-address.service';
import { EmployeeService } from '../../../rh/employee/services/employee.service';
import { ProductService } from '../../../inventario/productos/services/product.service';
import { QuotationService } from '../../cotizaciones/services/quotation.service';
import { OrderDto, OrderResponseDto, OrderItemDto, OrderStatus, ORDER_STATUS_OPTIONS } from '../models/order.model';
import { CustomerResponseDto } from '../../clientes/models/customer.model';
import { CustomerDeliveryAddressResponseDto } from '../../clientes/models/customer-delivery-address.model';
import { EmployeeResponseDto } from '../../../rh/employee/models/employee.model';
import { ProductResponseDto } from '../../../inventario/productos/models/product.model';
import { QuotationResponseDto } from '../../cotizaciones/models/quotation.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';

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
    selector: 'app-order-list',
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
        SelectModule,
        CheckboxModule,
        InputNumberModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        RadioButtonModule,
        TooltipModule
    ],
    templateUrl: './order-list.component.html',
    providers: [MessageService, OrderService, ConfirmationService]
})
export class OrderListComponent implements OnInit {
    orders = signal<OrderResponseDto[]>([]);
    order: OrderResponseDto = {} as OrderResponseDto;
    selectedOrders!: OrderResponseDto[] | null;
    submitted: boolean = false;
    orderDialog: boolean = false;
    
    // Referencias
    customers: CustomerResponseDto[] = [];
    employees: EmployeeResponseDto[] = [];
    products: ProductResponseDto[] = [];
    deliveryAddresses: CustomerDeliveryAddressResponseDto[] = [];
    quotations: QuotationResponseDto[] = [];
    
    // Items del pedido
    orderItems: OrderItemDto[] = [];
    currentItem: OrderItemDto = {} as OrderItemDto;
    itemDialog: boolean = false;
    editingItemIndex: number = -1;
    
    // Totales calculados
    subtotal: number = 0;
    discount: number = 0;
    iva: number = 0;
    total: number = 0;
    
    orderStatusOptions = ORDER_STATUS_OPTIONS;
    
    @ViewChild('dt') dt!: Table;
    exportColumns!: ExportColumn[];
    cols!: Column[];

    constructor(
        private orderService: OrderService,
        private customerService: CustomerService,
        private customerDeliveryAddressService: CustomerDeliveryAddressService,
        private employeeService: EmployeeService,
        private productService: ProductService,
        private quotationService: QuotationService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadOrders();
        this.loadReferenceData();
        this.setupColumns();
    }

    loadReferenceData() {
        // Cargar clientes
        this.customerService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.customers = response.data.filter(c => c.isActive);
                }
            },
            error: (error) => console.error('Error loading customers:', error)
        });

        // Cargar empleados
        this.employeeService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.employees = response.data.filter(e => e.employeeStatus === 'Activo');
                }
            },
            error: (error) => console.error('Error loading employees:', error)
        });

        // Cargar productos
        this.productService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.products = response.data.filter(p => p.isActive);
                }
            },
            error: (error) => console.error('Error loading products:', error)
        });

        // Cargar cotizaciones aprobadas
        this.quotationService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.quotations = response.data.filter(q => q.status === 'Aprobada' && !q.isConvertedToOrder);
                }
            },
            error: (error) => console.error('Error loading quotations:', error)
        });
    }

    loadOrders() {
        this.orderService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.orders.set(response.data);
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: response.message || 'Error al cargar pedidos',
                        life: 3000
                    });
                }
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error de conexión al cargar pedidos',
                    life: 3000
                });
                console.error('Error loading orders:', error);
            }
        });
    }

    setupColumns() {
        this.cols = [
            { field: 'orderNumber', header: 'Número' },
            { field: 'customerName', header: 'Cliente' },
            { field: 'employeeName', header: 'Empleado' },
            { field: 'orderDate', header: 'Fecha' },
            { field: 'quotationNumber', header: 'Cotización' },
            { field: 'status', header: 'Estado' },
            { field: 'total', header: 'Total' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.order = {
            id: 0,
            orderNumber: '',
            customerId: 0,
            employeeId: 0,
            quotationId: undefined,
            orderDate: new Date(),
            status: OrderStatus.Pendiente,
            items: [],
            subtotal: 0,
            discount: 0,
            iva: 0,
            total: 0,
            organizationId: '',
            createdAt: new Date(),
            updatedAt: new Date()
        } as OrderResponseDto;
        this.orderItems = [];
        this.subtotal = 0;
        this.discount = 0;
        this.iva = 0;
        this.total = 0;
        this.deliveryAddresses = [];
        this.submitted = false;
        this.orderDialog = true;
    }

    editOrder(order: OrderResponseDto) {
        this.orderService.getById(order.id).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.order = { ...response.data };
                    this.orderItems = response.data.items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        discountPercentage: item.discountPercentage,
                        discountAmount: item.discountAmount
                    }));
                    this.loadDeliveryAddresses(this.order.customerId);
                    this.calculateTotals();
                    this.orderDialog = true;
                }
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar pedido',
                    life: 3000
                });
                console.error('Error loading order:', error);
            }
        });
    }

    deleteOrder(order: OrderResponseDto) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar el pedido "' + order.orderNumber + '"?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.orderService.delete(order.id).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadOrders();
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Pedido eliminado',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al eliminar pedido',
                            life: 3000
                        });
                        console.error('Error deleting order:', error);
                    }
                });
            }
        });
    }

    hideDialog() {
        this.orderDialog = false;
        this.submitted = false;
    }

    onCustomerChange() {
        if (this.order.customerId) {
            this.loadDeliveryAddresses(this.order.customerId);
        } else {
            this.deliveryAddresses = [];
            this.order.deliveryAddressId = undefined;
        }
    }

    loadDeliveryAddresses(customerId: number) {
        this.customerDeliveryAddressService.getByCustomerId(customerId).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.deliveryAddresses = response.data.filter(a => a.isActive);
                } else {
                    this.deliveryAddresses = [];
                }
            },
            error: (error) => {
                if (error.status !== 404) {
                    console.error('Error loading delivery addresses:', error);
                }
                this.deliveryAddresses = [];
            }
        });
    }

    onQuotationChange() {
        if (this.order.quotationId) {
            this.quotationService.getById(this.order.quotationId).subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        const quotation = response.data;
                        this.order.customerId = quotation.customerId;
                        this.order.deliveryAddressId = quotation.deliveryAddressId;
                        this.order.employeeId = quotation.employeeId;
                        this.loadDeliveryAddresses(this.order.customerId);
                        this.orderItems = quotation.items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            discountPercentage: item.discountPercentage,
                            discountAmount: item.discountAmount
                        }));
                        this.calculateTotals();
                    }
                },
                error: (error) => {
                    console.error('Error loading quotation:', error);
                }
            });
        }
    }

    // Manejo de items
    openNewItem() {
        this.currentItem = {
            productId: 0,
            quantity: 1,
            unitPrice: 0,
            discountPercentage: undefined,
            discountAmount: undefined
        };
        this.editingItemIndex = -1;
        this.itemDialog = true;
    }

    editItem(item: OrderItemDto, index: number) {
        this.currentItem = { ...item };
        this.editingItemIndex = index;
        this.itemDialog = true;
    }

    deleteItem(index: number) {
        this.orderItems.splice(index, 1);
        this.calculateTotals();
    }

    saveItem() {
        if (this.currentItem.productId && this.currentItem.quantity > 0) {
            // Obtener precio del producto si no está especificado
            if (this.currentItem.unitPrice === 0) {
                const product = this.products.find(p => p.id === this.currentItem.productId);
                if (product) {
                    this.currentItem.unitPrice = product.price;
                }
            }

            if (this.editingItemIndex >= 0) {
                this.orderItems[this.editingItemIndex] = { ...this.currentItem };
            } else {
                this.orderItems.push({ ...this.currentItem });
            }

            this.itemDialog = false;
            this.calculateTotals();
        }
    }

    onProductSelected(productId: number) {
        const product = this.products.find(p => p.id === productId);
        if (product && this.currentItem.unitPrice === 0) {
            this.currentItem.unitPrice = product.price;
        }
    }

    calculateTotals() {
        this.subtotal = 0;
        this.discount = 0;

        this.orderItems.forEach(item => {
            let lineSubtotal = item.quantity * item.unitPrice;
            let itemDiscount = 0;

            if (item.discountPercentage) {
                itemDiscount = lineSubtotal * (item.discountPercentage / 100);
            } else if (item.discountAmount) {
                itemDiscount = item.discountAmount;
            }

            this.subtotal += lineSubtotal;
            this.discount += itemDiscount;
        });

        const finalSubtotal = this.subtotal - this.discount;
        
        // Obtener IVA del cliente
        const customer = this.customers.find(c => c.id === this.order.customerId);
        const ivaPercentage = customer?.ivaPercentage || 0;
        this.iva = finalSubtotal * (ivaPercentage / 100);
        this.total = finalSubtotal + this.iva;
    }

    calculateLineTotal(item: OrderItemDto): number {
        let lineSubtotal = item.quantity * item.unitPrice;
        let itemDiscount = 0;

        if (item.discountPercentage) {
            itemDiscount = lineSubtotal * (item.discountPercentage / 100);
        } else if (item.discountAmount) {
            itemDiscount = item.discountAmount;
        }

        return lineSubtotal - itemDiscount;
    }

    getProductName(productId: number): string {
        const product = this.products.find(p => p.id === productId);
        return product ? product.name : 'Sin producto';
    }

    getEmployeeName(employeeId: number): string {
        const employee = this.employees.find(e => e.id === employeeId);
        return employee ? `${employee.firstName} ${employee.lastName}` : '';
    }

    getCustomerName(customerId: number): string {
        const customer = this.customers.find(c => c.id === customerId);
        return customer ? customer.name : '';
    }

    getQuotationNumber(quotationId: number | undefined): string {
        if (!quotationId) return '';
        const quotation = this.quotations.find(q => q.id === quotationId);
        return quotation ? quotation.quotationNumber : '';
    }

    saveOrder() {
        this.submitted = true;

        if (this.order.customerId && this.order.employeeId && this.orderItems.length > 0) {
            const orderData: OrderDto = {
                customerId: this.order.customerId,
                deliveryAddressId: this.order.deliveryAddressId,
                employeeId: this.order.employeeId,
                quotationId: this.order.quotationId,
                orderDate: this.order.orderDate,
                status: this.order.status,
                notes: this.order.notes,
                items: this.orderItems
            };

            if (this.order.id) {
                // Actualizar
                this.orderService.update(this.order.id, orderData).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadOrders();
                            this.orderDialog = false;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Pedido actualizado',
                                life: 3000
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al actualizar pedido',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error de conexión al actualizar pedido',
                            life: 3000
                        });
                        console.error('Error updating order:', error);
                    }
                });
            } else {
                // Crear
                this.orderService.create(orderData).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadOrders();
                            this.orderDialog = false;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Pedido creado',
                                life: 3000
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al crear pedido',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error de conexión al crear pedido',
                            life: 3000
                        });
                        console.error('Error creating order:', error);
                    }
                });
            }
        }
    }

    convertToSale(order: OrderResponseDto) {
        if (order.status !== OrderStatus.Completado) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'Solo se pueden convertir pedidos completados a venta',
                life: 3000
            });
            return;
        }

        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres convertir este pedido en venta?',
            header: 'Confirmar Conversión',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.orderService.convertToSale(order.id).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadOrders();
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Pedido convertido a venta exitosamente',
                                life: 3000
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al convertir pedido',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al convertir pedido',
                            life: 3000
                        });
                        console.error('Error converting order:', error);
                    }
                });
            }
        });
    }

    exportOrder(format: string = 'pdf') {
        // TODO: Implementar exportación PDF/Excel
        this.messageService.add({
            severity: 'info',
            summary: 'En desarrollo',
            detail: 'La exportación estará disponible próximamente',
            life: 3000
        });
    }

    getStatusSeverity(status: OrderStatus): string {
        switch (status) {
            case OrderStatus.Completado:
                return 'success';
            case OrderStatus.EnProceso:
                return 'info';
            case OrderStatus.Pendiente:
                return 'warning';
            case OrderStatus.Cancelado:
                return 'danger';
            default:
                return '';
        }
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    getDateTimeLocalValue(date: Date | undefined): string {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return '';
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    onOrderDateChange(value: string) {
        if (value) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                this.order.orderDate = date;
            }
        }
    }
}

