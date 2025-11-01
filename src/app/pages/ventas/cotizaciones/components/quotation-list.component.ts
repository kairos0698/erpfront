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
import { QuotationService } from '../services/quotation.service';
import { CustomerService } from '../../clientes/services/customer.service';
import { CustomerDeliveryAddressService } from '../../clientes/services/customer-delivery-address.service';
import { EmployeeService } from '../../../rh/employee/services/employee.service';
import { ProductService } from '../../../inventario/productos/services/product.service';
import { QuotationDto, QuotationResponseDto, QuotationItemDto, QuotationStatus, QUOTATION_STATUS_OPTIONS } from '../models/quotation.model';
import { CustomerResponseDto } from '../../clientes/models/customer.model';
import { CustomerDeliveryAddressResponseDto } from '../../clientes/models/customer-delivery-address.model';
import { EmployeeResponseDto } from '../../../rh/employee/models/employee.model';
import { ProductResponseDto } from '../../../inventario/productos/models/product.model';
import { OrderDto } from '../../pedidos/models/order.model';
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
    selector: 'app-quotation-list',
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
    templateUrl: './quotation-list.component.html',
    providers: [MessageService, QuotationService, ConfirmationService]
})
export class QuotationListComponent implements OnInit {
    quotations = signal<QuotationResponseDto[]>([]);
    quotation: QuotationResponseDto = {} as QuotationResponseDto;
    selectedQuotations!: QuotationResponseDto[] | null;
    submitted: boolean = false;
    quotationDialog: boolean = false;
    
    // Referencias
    customers: CustomerResponseDto[] = [];
    employees: EmployeeResponseDto[] = [];
    products: ProductResponseDto[] = [];
    deliveryAddresses: CustomerDeliveryAddressResponseDto[] = [];
    
    // Items de la cotización
    quotationItems: QuotationItemDto[] = [];
    currentItem: QuotationItemDto = {} as QuotationItemDto;
    itemDialog: boolean = false;
    editingItemIndex: number = -1;
    
    // Totales calculados
    subtotal: number = 0;
    discount: number = 0;
    iva: number = 0;
    total: number = 0;
    
    quotationStatusOptions = QUOTATION_STATUS_OPTIONS;
    
    @ViewChild('dt') dt!: Table;
    exportColumns!: ExportColumn[];
    cols!: Column[];

    constructor(
        private quotationService: QuotationService,
        private customerService: CustomerService,
        private customerDeliveryAddressService: CustomerDeliveryAddressService,
        private employeeService: EmployeeService,
        private productService: ProductService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadQuotations();
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
    }

    loadQuotations() {
        this.quotationService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.quotations.set(response.data);
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: response.message || 'Error al cargar cotizaciones',
                        life: 3000
                    });
                }
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error de conexión al cargar cotizaciones',
                    life: 3000
                });
                console.error('Error loading quotations:', error);
            }
        });
    }

    setupColumns() {
        this.cols = [
            { field: 'quotationNumber', header: 'Número' },
            { field: 'customerName', header: 'Cliente' },
            { field: 'employeeName', header: 'Empleado' },
            { field: 'quotationDate', header: 'Fecha' },
            { field: 'validUntil', header: 'Válida Hasta' },
            { field: 'status', header: 'Estado' },
            { field: 'total', header: 'Total' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.quotation = {
            id: 0,
            quotationNumber: '',
            customerId: 0,
            employeeId: 0,
            quotationDate: new Date(),
            status: QuotationStatus.Borrador,
            isConvertedToOrder: false,
            items: [],
            subtotal: 0,
            discount: 0,
            iva: 0,
            total: 0,
            organizationId: '',
            createdAt: new Date(),
            updatedAt: new Date()
        } as QuotationResponseDto;
        this.quotationItems = [];
        this.subtotal = 0;
        this.discount = 0;
        this.iva = 0;
        this.total = 0;
        this.deliveryAddresses = [];
        this.submitted = false;
        this.quotationDialog = true;
    }

    editQuotation(quotation: QuotationResponseDto) {
        this.quotationService.getById(quotation.id).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.quotation = { ...response.data };
                    this.quotationItems = response.data.items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        discountPercentage: item.discountPercentage,
                        discountAmount: item.discountAmount
                    }));
                    this.loadDeliveryAddresses(this.quotation.customerId);
                    this.calculateTotals();
                    this.quotationDialog = true;
                }
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar cotización',
                    life: 3000
                });
                console.error('Error loading quotation:', error);
            }
        });
    }

    deleteQuotation(quotation: QuotationResponseDto) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar la cotización "' + quotation.quotationNumber + '"?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.quotationService.delete(quotation.id).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadQuotations();
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Cotización eliminada',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al eliminar cotización',
                            life: 3000
                        });
                        console.error('Error deleting quotation:', error);
                    }
                });
            }
        });
    }

    hideDialog() {
        this.quotationDialog = false;
        this.submitted = false;
    }

    onCustomerChange() {
        if (this.quotation.customerId) {
            this.loadDeliveryAddresses(this.quotation.customerId);
        } else {
            this.deliveryAddresses = [];
            this.quotation.deliveryAddressId = undefined;
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

    editItem(item: QuotationItemDto, index: number) {
        this.currentItem = { ...item };
        this.editingItemIndex = index;
        this.itemDialog = true;
    }

    deleteItem(index: number) {
        this.quotationItems.splice(index, 1);
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
                this.quotationItems[this.editingItemIndex] = { ...this.currentItem };
            } else {
                this.quotationItems.push({ ...this.currentItem });
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

        this.quotationItems.forEach(item => {
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
        const customer = this.customers.find(c => c.id === this.quotation.customerId);
        const ivaPercentage = customer?.ivaPercentage || 0;
        this.iva = finalSubtotal * (ivaPercentage / 100);
        this.total = finalSubtotal + this.iva;
    }

    calculateLineTotal(item: QuotationItemDto): number {
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

    saveQuotation() {
        this.submitted = true;

        if (this.quotation.customerId && this.quotation.employeeId && this.quotationItems.length > 0) {
            const quotationData: QuotationDto = {
                customerId: this.quotation.customerId,
                deliveryAddressId: this.quotation.deliveryAddressId,
                employeeId: this.quotation.employeeId,
                quotationDate: this.quotation.quotationDate,
                validUntil: this.quotation.validUntil,
                status: this.quotation.status,
                notes: this.quotation.notes,
                items: this.quotationItems
            };

            if (this.quotation.id) {
                // Actualizar
                this.quotationService.update(this.quotation.id, quotationData).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadQuotations();
                            this.quotationDialog = false;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Cotización actualizada',
                                life: 3000
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al actualizar cotización',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error de conexión al actualizar cotización',
                            life: 3000
                        });
                        console.error('Error updating quotation:', error);
                    }
                });
            } else {
                // Crear
                this.quotationService.create(quotationData).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadQuotations();
                            this.quotationDialog = false;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Cotización creada',
                                life: 3000
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al crear cotización',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error de conexión al crear cotización',
                            life: 3000
                        });
                        console.error('Error creating quotation:', error);
                    }
                });
            }
        }
    }

    convertToOrder(quotation: QuotationResponseDto) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres convertir esta cotización en pedido?',
            header: 'Confirmar Conversión',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.quotationService.convertToOrder(quotation.id).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadQuotations();
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Cotización convertida a pedido',
                                life: 3000
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al convertir cotización',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al convertir cotización',
                            life: 3000
                        });
                        console.error('Error converting quotation:', error);
                    }
                });
            }
        });
    }

    convertToSale(quotation: QuotationResponseDto) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres convertir esta cotización directamente en venta?',
            header: 'Confirmar Conversión Directa',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.quotationService.convertToSale(quotation.id).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadQuotations();
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Cotización convertida directamente a venta',
                                life: 3000
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al convertir cotización',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al convertir cotización',
                            life: 3000
                        });
                        console.error('Error converting quotation:', error);
                    }
                });
            }
        });
    }

    exportQuotation(format: string = 'pdf') {
        // TODO: Implementar exportación PDF/Excel
        this.messageService.add({
            severity: 'info',
            summary: 'En desarrollo',
            detail: 'La exportación estará disponible próximamente',
            life: 3000
        });
    }

    getStatusSeverity(status: QuotationStatus): string {
        switch (status) {
            case QuotationStatus.Aprobada:
                return 'success';
            case QuotationStatus.Enviada:
                return 'info';
            case QuotationStatus.Borrador:
                return 'warning';
            case QuotationStatus.Rechazada:
            case QuotationStatus.Expirada:
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
        // Asegurar que sea un objeto Date válido
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return '';
        
        // Obtener fecha en hora local
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    onQuotationDateChange(value: string) {
        if (value) {
            // Convertir el string datetime-local a Date
            // El formato es yyyy-MM-ddThh:mm
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                this.quotation.quotationDate = date;
            }
        }
    }

    onValidUntilChange(value: string) {
        if (value) {
            // Convertir el string datetime-local a Date
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                this.quotation.validUntil = date;
            }
        } else {
            this.quotation.validUntil = undefined;
        }
    }
}

