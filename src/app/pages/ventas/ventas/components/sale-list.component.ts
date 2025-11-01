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
import { SaleService } from '../services/sale.service';
import { CustomerService } from '../../clientes/services/customer.service';
import { EmployeeService } from '../../../rh/employee/services/employee.service';
import { ProductService } from '../../../inventario/productos/services/product.service';
import { OrderService } from '../../pedidos/services/order.service';
import { SaleDto, SaleResponseDto, SaleItemDto, PaymentMethod, PaymentStatus, PAYMENT_METHOD_OPTIONS, PAYMENT_STATUS_OPTIONS, PaymentDto } from '../models/sale.model';
import { CustomerResponseDto } from '../../clientes/models/customer.model';
import { EmployeeResponseDto } from '../../../rh/employee/models/employee.model';
import { ProductResponseDto } from '../../../inventario/productos/models/product.model';
import { OrderResponseDto } from '../../pedidos/models/order.model';
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
    selector: 'app-sale-list',
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
    templateUrl: './sale-list.component.html',
    providers: [MessageService, SaleService, ConfirmationService]
})
export class SaleListComponent implements OnInit {
    sales = signal<SaleResponseDto[]>([]);
    sale: SaleResponseDto = {} as SaleResponseDto;
    selectedSales!: SaleResponseDto[] | null;
    submitted: boolean = false;
    saleDialog: boolean = false;
    
    // Referencias
    customers: CustomerResponseDto[] = [];
    employees: EmployeeResponseDto[] = [];
    products: ProductResponseDto[] = [];
    orders: OrderResponseDto[] = [];
    
    // Items de la venta
    saleItems: SaleItemDto[] = [];
    currentItem: SaleItemDto = {} as SaleItemDto;
    itemDialog: boolean = false;
    editingItemIndex: number = -1;
    
    // Totales calculados
    subtotal: number = 0;
    discount: number = 0;
    iva: number = 0;
    total: number = 0;
    totalPaid: number = 0;
    pendingBalance: number = 0;
    
    paymentMethodOptions = PAYMENT_METHOD_OPTIONS;
    paymentStatusOptions = PAYMENT_STATUS_OPTIONS;
    
    // Pago/Abono
    paymentDialog: boolean = false;
    currentPayment: PaymentDto = {} as PaymentDto;
    
    @ViewChild('dt') dt!: Table;
    exportColumns!: ExportColumn[];
    cols!: Column[];

    constructor(
        private saleService: SaleService,
        private customerService: CustomerService,
        private employeeService: EmployeeService,
        private productService: ProductService,
        private orderService: OrderService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadSales();
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

        // Cargar pedidos completados
        this.orderService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.orders = response.data.filter(o => o.status === 'Completado');
                }
            },
            error: (error) => console.error('Error loading orders:', error)
        });
    }

    loadSales() {
        this.saleService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.sales.set(response.data);
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: response.message || 'Error al cargar ventas',
                        life: 3000
                    });
                }
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error de conexión al cargar ventas',
                    life: 3000
                });
                console.error('Error loading sales:', error);
            }
        });
    }

    setupColumns() {
        this.cols = [
            { field: 'saleNumber', header: 'Número' },
            { field: 'customerName', header: 'Cliente' },
            { field: 'employeeName', header: 'Empleado' },
            { field: 'saleDate', header: 'Fecha' },
            { field: 'orderNumber', header: 'Pedido' },
            { field: 'paymentMethod', header: 'Método Pago' },
            { field: 'paymentStatus', header: 'Estado Pago' },
            { field: 'total', header: 'Total' },
            { field: 'pendingBalance', header: 'Saldo Pendiente' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.sale = {
            id: 0,
            saleNumber: '',
            customerId: 0,
            employeeId: 0,
            orderId: undefined,
            saleDate: new Date(),
            paymentMethod: PaymentMethod.Efectivo,
            paymentStatus: PaymentStatus.Pagado,
            items: [],
            subtotal: 0,
            discount: 0,
            iva: 0,
            total: 0,
            totalPaid: 0,
            pendingBalance: 0,
            payments: [],
            organizationId: '',
            createdAt: new Date(),
            updatedAt: new Date()
        } as SaleResponseDto;
        this.saleItems = [];
        this.subtotal = 0;
        this.discount = 0;
        this.iva = 0;
        this.total = 0;
        this.totalPaid = 0;
        this.pendingBalance = 0;
        this.submitted = false;
        this.saleDialog = true;
    }

    editSale(sale: SaleResponseDto) {
        this.saleService.getById(sale.id).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.sale = { ...response.data };
                    this.saleItems = response.data.items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        discountPercentage: item.discountPercentage,
                        discountAmount: item.discountAmount
                    }));
                    this.calculateTotals();
                    this.totalPaid = response.data.totalPaid;
                    this.pendingBalance = response.data.pendingBalance;
                    this.saleDialog = true;
                }
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar venta',
                    life: 3000
                });
                console.error('Error loading sale:', error);
            }
        });
    }

    deleteSale(sale: SaleResponseDto) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar la venta "' + sale.saleNumber + '"?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.saleService.delete(sale.id).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadSales();
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Venta eliminada',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al eliminar venta',
                            life: 3000
                        });
                        console.error('Error deleting sale:', error);
                    }
                });
            }
        });
    }

    hideDialog() {
        this.saleDialog = false;
        this.submitted = false;
    }

    onOrderChange() {
        if (this.sale.orderId) {
            this.orderService.getById(this.sale.orderId).subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        const order = response.data;
                        this.sale.customerId = order.customerId;
                        this.sale.employeeId = order.employeeId;
                        this.saleItems = order.items.map(item => ({
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
                    console.error('Error loading order:', error);
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

    editItem(item: SaleItemDto, index: number) {
        this.currentItem = { ...item };
        this.editingItemIndex = index;
        this.itemDialog = true;
    }

    deleteItem(index: number) {
        this.saleItems.splice(index, 1);
        this.calculateTotals();
    }

    saveItem() {
        if (this.currentItem.productId && this.currentItem.quantity > 0) {
            if (this.currentItem.unitPrice === 0) {
                const product = this.products.find(p => p.id === this.currentItem.productId);
                if (product) {
                    this.currentItem.unitPrice = product.price;
                }
            }

            if (this.editingItemIndex >= 0) {
                this.saleItems[this.editingItemIndex] = { ...this.currentItem };
            } else {
                this.saleItems.push({ ...this.currentItem });
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

        this.saleItems.forEach(item => {
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
        
        const customer = this.customers.find(c => c.id === this.sale.customerId);
        const ivaPercentage = customer?.ivaPercentage || 0;
        this.iva = finalSubtotal * (ivaPercentage / 100);
        this.total = finalSubtotal + this.iva;
        this.pendingBalance = this.total - this.totalPaid;
    }

    onPaymentStatusChange() {
        if (this.sale.paymentStatus === PaymentStatus.Pagado) {
            this.totalPaid = this.total;
            this.pendingBalance = 0;
        } else if (this.sale.paymentStatus === PaymentStatus.Credito) {
            this.totalPaid = 0;
            this.pendingBalance = this.total;
        }
        // Para Abonos, se maneja con pagos individuales
    }

    calculateLineTotal(item: SaleItemDto): number {
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

    getOrderNumber(orderId: number | undefined): string {
        if (!orderId) return '';
        const order = this.orders.find(o => o.id === orderId);
        return order ? order.orderNumber : '';
    }

    saveSale() {
        this.submitted = true;

        if (this.sale.customerId && this.sale.employeeId && this.saleItems.length > 0) {
            const saleData: SaleDto = {
                customerId: this.sale.customerId,
                employeeId: this.sale.employeeId,
                orderId: this.sale.orderId,
                saleDate: this.sale.saleDate,
                paymentMethod: this.sale.paymentMethod,
                paymentStatus: this.sale.paymentStatus,
                notes: this.sale.notes,
                items: this.saleItems
            };

            if (this.sale.id) {
                // Actualizar
                this.saleService.update(this.sale.id, saleData).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadSales();
                            this.saleDialog = false;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Venta actualizada',
                                life: 3000
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al actualizar venta',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error de conexión al actualizar venta',
                            life: 3000
                        });
                        console.error('Error updating sale:', error);
                    }
                });
            } else {
                // Crear
                this.saleService.create(saleData).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadSales();
                            this.saleDialog = false;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Venta creada',
                                life: 3000
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al crear venta',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error de conexión al crear venta',
                            life: 3000
                        });
                        console.error('Error creating sale:', error);
                    }
                });
            }
        }
    }

    // Gestión de pagos
    openPaymentDialog(sale: SaleResponseDto) {
        this.sale = sale;
        this.currentPayment = {
            saleId: sale.id,
            amount: sale.pendingBalance,
            paymentDate: new Date(),
            paymentMethod: PaymentMethod.Efectivo,
            notes: ''
        } as PaymentDto;
        this.paymentDialog = true;
    }

    savePayment() {
        if (this.currentPayment.amount > 0 && this.currentPayment.amount <= this.sale.pendingBalance) {
            this.saleService.addPayment(this.sale.id, this.currentPayment).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.loadSales();
                        this.paymentDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Pago registrado',
                            life: 3000
                        });
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: response.message || 'Error al registrar pago',
                            life: 3000
                        });
                    }
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error al registrar pago',
                        life: 3000
                    });
                    console.error('Error adding payment:', error);
                }
            });
        } else {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'El monto debe ser mayor a 0 y no exceder el saldo pendiente',
                life: 3000
            });
        }
    }

    exportSale(format: string = 'pdf') {
        // TODO: Implementar exportación PDF/Excel
        this.messageService.add({
            severity: 'info',
            summary: 'En desarrollo',
            detail: 'La exportación estará disponible próximamente',
            life: 3000
        });
    }

    getPaymentMethodSeverity(method: PaymentMethod): string {
        switch (method) {
            case PaymentMethod.Efectivo:
                return 'success';
            case PaymentMethod.Tarjeta:
                return 'info';
            case PaymentMethod.Transferencia:
                return 'warning';
            case PaymentMethod.Cheque:
                return 'secondary';
            default:
                return '';
        }
    }

    getPaymentStatusSeverity(status: PaymentStatus): string {
        switch (status) {
            case PaymentStatus.Pagado:
                return 'success';
            case PaymentStatus.Credito:
                return 'danger';
            case PaymentStatus.Abonos:
                return 'warning';
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

    onSaleDateChange(value: string) {
        if (value) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                this.sale.saleDate = date;
            }
        }
    }

    onPaymentDateChange(value: string) {
        if (value) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                this.currentPayment.paymentDate = date;
            }
        }
    }
}

