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
import { TabsModule } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip';
import { CustomerService } from '../services/customer.service';
import { CustomerOriginService } from '../../shared/services/customer-origin.service';
import { PriceListService } from '../../shared/services/price-list.service';
import { AuthService } from '../../../../auth.service';
import { CustomerDeliveryAddressService } from '../services/customer-delivery-address.service';
import { CustomerFiscalDataService } from '../services/customer-fiscal-data.service';
import { CustomerProductService } from '../services/customer-product.service';
import { ProductService } from '../../../inventario/productos/services/product.service';
import { CustomerResponseDto, CustomerDto, DISCOUNT_TYPE_OPTIONS } from '../models/customer.model';
import { CustomerDeliveryAddressDto, CustomerDeliveryAddressResponseDto } from '../models/customer-delivery-address.model';
import { CustomerFiscalDataDto, CustomerFiscalDataResponseDto } from '../models/customer-fiscal-data.model';
import { CustomerProductDto, CustomerProductResponseDto } from '../models/customer-product.model';
import { CustomerOriginResponseDto } from '../../shared/models/customer-origin.model';
import { PriceListResponseDto } from '../../shared/models/price-list.model';
import { ProductResponseDto } from '../../../inventario/productos/models/product.model';
import { EmployeeService } from '../../../rh/employee/services/employee.service';
import { EmployeeResponseDto } from '../../../rh/employee/models/employee.model';
import { ApiResponse } from '../../../../shared/models/api-response.model';
import { AddressPickerComponent, AddressData } from '../../../../shared/components/address-picker/address-picker.component';

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
    selector: 'app-customer-list',
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
        TabsModule,
        TooltipModule,
        AddressPickerComponent
    ],
    templateUrl: './customer-list.component.html',
    providers: [MessageService, CustomerService, CustomerOriginService, PriceListService, ConfirmationService]
})
export class CustomerListComponent implements OnInit {
    customerDialog: boolean = false;
    customers = signal<CustomerResponseDto[]>([]);
    customer: CustomerResponseDto = {} as CustomerResponseDto;
    selectedCustomers!: CustomerResponseDto[] | null;
    submitted: boolean = false;

    // Selectores
    employees: EmployeeResponseDto[] = [];
    customerOrigins: CustomerOriginResponseDto[] = [];
    priceLists: PriceListResponseDto[] = [];
    products: ProductResponseDto[] = [];

    // Direcciones
    deliveryAddresses: CustomerDeliveryAddressResponseDto[] = [];
    deliveryAddressDialog: boolean = false;
    deliveryAddress: CustomerDeliveryAddressResponseDto = {} as CustomerDeliveryAddressResponseDto;

    // Datos fiscales
    fiscalData: CustomerFiscalDataResponseDto | null = null;
    fiscalDataDialog: boolean = false;
    hasFiscalData: boolean = false;

    // Productos específicos
    customerProducts: CustomerProductResponseDto[] = [];
    customerProductDialog: boolean = false;
    customerProduct: CustomerProductResponseDto = {} as CustomerProductResponseDto;

    // Opciones
    discountTypeOptions = DISCOUNT_TYPE_OPTIONS;
    activeTabIndex: number = 0;

    // Mini CRUD para Origen
    customerOriginDialog: boolean = false;
    customerOrigin: CustomerOriginResponseDto = {} as CustomerOriginResponseDto;
    customerOriginSubmitted: boolean = false;

    // User organization info
    private readonly systemOrganizationId = '00000000-0000-0000-0000-000000000001';
    currentUserOrganizationId: string | null = null;

    @ViewChild('dt') dt!: Table;
    exportColumns!: ExportColumn[];
    cols!: Column[];

    constructor(
        private customerService: CustomerService,
        private customerOriginService: CustomerOriginService,
        private priceListService: PriceListService,
        private customerDeliveryAddressService: CustomerDeliveryAddressService,
        private customerFiscalDataService: CustomerFiscalDataService,
        private customerProductService: CustomerProductService,
        private productService: ProductService,
        private employeeService: EmployeeService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private authService: AuthService
    ) {
        const currentUser = this.authService.getCurrentUser();
        this.currentUserOrganizationId = currentUser?.organizationId || null;
    }

    ngOnInit() {
        this.loadCustomers();
        this.loadEmployees();
        this.loadCustomerOrigins();
        this.loadPriceLists();
        this.loadProducts();
        this.setupColumns();
    }

    loadProducts() {
        this.productService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.products = response.data.filter(p => p.isActive);
                }
            },
            error: (error) => {
                console.error('Error loading products:', error);
            }
        });
    }

    loadCustomers() {
        this.customerService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.customers.set(response.data);
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: response.message || 'Error al cargar clientes',
                        life: 3000
                    });
                }
            },
            error: (error) => {
                console.error('Error loading customers:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error de conexión al cargar clientes',
                    life: 3000
                });
            }
        });
    }

    loadEmployees() {
        this.employeeService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.employees = response.data.filter(e => e.employeeStatus === 'Activo');
                }
            },
            error: (error) => {
                console.error('Error loading employees:', error);
            }
        });
    }

    loadCustomerOrigins() {
        this.customerOriginService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.customerOrigins = response.data.filter(co => co.isActive);
                }
            },
            error: (error) => {
                console.error('Error loading customer origins:', error);
            }
        });
    }

    refreshCustomerOrigins() {
        this.loadCustomerOrigins();
    }

    loadPriceLists() {
        this.priceListService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.priceLists = response.data.filter(pl => pl.isActive);
                }
            },
            error: (error) => {
                console.error('Error loading price lists:', error);
            }
        });
    }

    setupColumns() {
        this.cols = [
            { field: 'name', header: 'Nombre', customExportHeader: 'Nombre del Cliente' },
            { field: 'email', header: 'Email' },
            { field: 'phoneNumber', header: 'Teléfono' },
            { field: 'assignedEmployeeName', header: 'Vendedor' },
            { field: 'customerOriginName', header: 'Origen' },
            { field: 'isActive', header: 'Estado' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.customer = {
            name: '',
            commercialName: '',
            email: '',
            phoneNumber: '',
            address: '',
            rfc: '',
            assignedEmployeeId: undefined,
            customerOriginId: undefined,
            priceListId: undefined,
            discountType: 'Porcentaje',
            discountPercentage: undefined,
            discountAmount: undefined,
            creditDays: undefined,
            ivaPercentage: undefined,
            comments: '',
            isActive: true,
            isAlsoEmployee: false,
            employeeId: undefined
        } as CustomerResponseDto;
        this.submitted = false;
        this.activeTabIndex = 0;
        this.customerDialog = true;
        
        // Limpiar datos relacionados para nuevo cliente
        this.deliveryAddresses = [];
        this.fiscalData = null;
        this.hasFiscalData = false;
        this.customerProducts = [];
    }

    editCustomer(customer: CustomerResponseDto) {
        this.customer = { ...customer };
        this.activeTabIndex = 0;
        this.customerDialog = true;
        
        // Cargar datos relacionados
        if (customer.id) {
            this.loadDeliveryAddresses(customer.id);
            this.loadFiscalData(customer.id);
            this.loadCustomerProducts(customer.id);
        }
    }

    deleteSelectedCustomers() {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar los clientes seleccionados?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const selectedIds = this.selectedCustomers?.map(c => c.id) || [];
                selectedIds.forEach(id => {
                    this.customerService.delete(id).subscribe({
                        next: () => {
                            this.loadCustomers();
                        },
                        error: (error) => {
                            console.error('Error deleting customer:', error);
                        }
                    });
                });
                this.selectedCustomers = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Exitoso',
                    detail: 'Clientes Eliminados',
                    life: 3000
                });
            }
        });
    }

    hideDialog() {
        this.customerDialog = false;
        this.submitted = false;
        this.activeTabIndex = 0;
        // Limpiar datos relacionados
        this.deliveryAddresses = [];
        this.fiscalData = null;
        this.hasFiscalData = false;
        this.customerProducts = [];
    }

    deleteCustomer(customer: CustomerResponseDto) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar el cliente "' + customer.name + '"?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.customerService.delete(customer.id).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadCustomers();
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: response.message || 'Cliente Eliminado',
                                life: 3000
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al eliminar cliente',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error de conexión al eliminar cliente',
                            life: 3000
                        });
                        console.error('Error deleting customer:', error);
                    }
                });
            }
        });
    }

    getSeverity(isActive: boolean) {
        return isActive ? 'success' : 'danger';
    }

    getEmployeeName(employeeId?: number): string {
        if (!employeeId) return '';
        const employee = this.employees.find(e => e.id === employeeId);
        return employee ? `${employee.firstName} ${employee.lastName}` : '';
    }

    getEmployeeFullName(employee: EmployeeResponseDto): string {
        return `${employee.firstName} ${employee.lastName}`;
    }

    saveCustomer() {
        this.submitted = true;

        if (this.customer.name?.trim() && this.customer.email?.trim()) {
            const customerData: CustomerDto = {
                name: this.customer.name,
                commercialName: this.customer.commercialName,
                email: this.customer.email,
                phoneNumber: this.customer.phoneNumber,
                address: this.customer.address,
                rfc: this.customer.rfc,
                assignedEmployeeId: this.customer.assignedEmployeeId,
                customerOriginId: this.customer.customerOriginId,
                priceListId: this.customer.priceListId,
                discountType: this.customer.discountType,
                discountPercentage: this.customer.discountPercentage,
                discountAmount: this.customer.discountAmount,
                creditDays: this.customer.creditDays,
                ivaPercentage: this.customer.ivaPercentage,
                comments: this.customer.comments,
                isActive: this.customer.isActive,
                isAlsoEmployee: this.customer.isAlsoEmployee,
                employeeId: this.customer.employeeId
            };

            if (this.customer.id) {
                this.customerService.update(this.customer.id, customerData).subscribe({
                    next: (response) => {
                        if (response.success && response.data) {
                            this.loadCustomers();
                            this.customerDialog = false;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: response.message || 'Cliente Actualizado',
                                life: 3000
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al actualizar cliente',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error de conexión al actualizar cliente',
                            life: 3000
                        });
                        console.error('Error updating customer:', error);
                    }
                });
            } else {
                this.customerService.create(customerData).subscribe({
                    next: (response) => {
                        if (response.success && response.data) {
                            this.loadCustomers();
                            this.customerDialog = false;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: response.message || 'Cliente Creado',
                                life: 3000
                            });
                            // Limpiar el formulario
                            this.customer = {} as CustomerResponseDto;
                            this.submitted = false;
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al crear cliente',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error de conexión al crear cliente',
                            life: 3000
                        });
                        console.error('Error creating customer:', error);
                    }
                });
            }
        }
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    // Métodos para Direcciones de Entrega
    loadDeliveryAddresses(customerId: number) {
        this.customerDeliveryAddressService.getByCustomerId(customerId).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.deliveryAddresses = response.data;
                } else {
                    this.deliveryAddresses = [];
                }
            },
            error: (error) => {
                // Si es 404, simplemente inicializar vacío (es normal cuando no hay direcciones o el endpoint no existe aún)
                if (error.status === 404) {
                    this.deliveryAddresses = [];
                    // No mostrar error en consola para 404 (endpoint puede no existir aún)
                } else {
                    console.error('Error loading delivery addresses:', error);
                }
            }
        });
    }

    openNewDeliveryAddress() {
        this.deliveryAddress = {
            customerId: this.customer.id!,
            addressName: '',
            street: '',
            externalNumber: '',
            internalNumber: '',
            neighborhood: '',
            municipality: '',
            state: '',
            postalCode: '',
            country: 'México',
            deliveryInstructions: '',
            isDefault: false,
            isActive: true
        } as CustomerDeliveryAddressResponseDto;
        this.deliveryAddressDialog = true;
    }

    @ViewChild('addressPickerComponent') addressPickerComponent!: AddressPickerComponent;

    openGoogleMapsPicker(): void {
        // El componente AddressPickerComponent maneja su propio diálogo
        // Solo necesitamos inicializar la instancia si no está abierto
    }

    onAddressSelected(addressData: AddressData): void {
        // Asignar los datos de Google Maps a la dirección de entrega
        this.deliveryAddress.street = addressData.street;
        this.deliveryAddress.externalNumber = addressData.externalNumber;
        this.deliveryAddress.internalNumber = addressData.internalNumber || '';
        this.deliveryAddress.neighborhood = addressData.neighborhood;
        this.deliveryAddress.municipality = addressData.municipality;
        this.deliveryAddress.state = addressData.state;
        this.deliveryAddress.postalCode = addressData.postalCode;
        this.deliveryAddress.country = addressData.country || 'México';

        // Limpiar la lista de colonias ya que Google Maps ya proporciona toda la información

        this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Dirección seleccionada desde Google Maps',
            life: 3000
        });
    }

    getAddressDataForPicker(): AddressData {
        return {
            street: this.deliveryAddress.street || '',
            externalNumber: this.deliveryAddress.externalNumber || '',
            internalNumber: this.deliveryAddress.internalNumber || '',
            neighborhood: this.deliveryAddress.neighborhood || '',
            municipality: this.deliveryAddress.municipality || '',
            state: this.deliveryAddress.state || '',
            postalCode: this.deliveryAddress.postalCode || '',
            country: this.deliveryAddress.country || 'México'
        };
    }

    editDeliveryAddress(address: CustomerDeliveryAddressResponseDto) {
        this.deliveryAddress = { ...address };
        this.deliveryAddressDialog = true;
    }

    deleteDeliveryAddress(address: CustomerDeliveryAddressResponseDto) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar esta dirección?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.customerDeliveryAddressService.delete(address.id).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadDeliveryAddresses(this.customer.id!);
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Dirección eliminada',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al eliminar dirección',
                            life: 3000
                        });
                    }
                });
            }
        });
    }


    saveDeliveryAddress() {
        const addressData: CustomerDeliveryAddressDto = {
            customerId: this.customer.id!,
            addressName: this.deliveryAddress.addressName,
            street: this.deliveryAddress.street,
            externalNumber: this.deliveryAddress.externalNumber,
            internalNumber: this.deliveryAddress.internalNumber,
            neighborhood: this.deliveryAddress.neighborhood,
            municipality: this.deliveryAddress.municipality,
            state: this.deliveryAddress.state,
            postalCode: this.deliveryAddress.postalCode,
            country: this.deliveryAddress.country,
            deliveryInstructions: this.deliveryAddress.deliveryInstructions,
            isDefault: this.deliveryAddress.isDefault,
            isActive: this.deliveryAddress.isActive
        };

        if (this.deliveryAddress.id) {
            this.customerDeliveryAddressService.update(this.deliveryAddress.id, addressData).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.loadDeliveryAddresses(this.customer.id!);
                        this.deliveryAddressDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Dirección actualizada',
                            life: 3000
                        });
                    }
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error al actualizar dirección',
                        life: 3000
                    });
                }
            });
        } else {
            this.customerDeliveryAddressService.create(addressData).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.loadDeliveryAddresses(this.customer.id!);
                        this.deliveryAddressDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Dirección creada',
                            life: 3000
                        });
                    }
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error al crear dirección',
                        life: 3000
                    });
                }
            });
        }
    }

    // Métodos para Datos Fiscales
    loadFiscalData(customerId: number) {
        this.customerFiscalDataService.getByCustomerId(customerId).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.fiscalData = response.data;
                    this.hasFiscalData = response.data.hasFiscalData;
                } else {
                    this.fiscalData = null;
                    this.hasFiscalData = false;
                }
            },
            error: (error) => {
                // Si es 404, simplemente inicializar vacío (es normal cuando no hay datos fiscales o el endpoint no existe aún)
                if (error.status === 404) {
                    this.fiscalData = null;
                    this.hasFiscalData = false;
                    // No mostrar error en consola para 404 (endpoint puede no existir aún)
                } else {
                    console.error('Error loading fiscal data:', error);
                    this.fiscalData = null;
                    this.hasFiscalData = false;
                }
            }
        });
    }

    openFiscalDataDialog() {
        if (!this.fiscalData) {
            this.fiscalData = {
                customerId: this.customer.id!,
                hasFiscalData: false,
                legalName: '',
                commercialName: '',
                fiscalRFC: '',
                fiscalAddress: '',
                cfdiUsage: '',
                fiscalRegime: '',
                accountNumber: ''
            } as CustomerFiscalDataResponseDto;
        }
        this.fiscalDataDialog = true;
    }

    saveFiscalData() {
        if (!this.customer.id) return;

        const fiscalDataDto: CustomerFiscalDataDto = {
            customerId: this.customer.id,
            hasFiscalData: this.hasFiscalData,
            legalName: this.fiscalData?.legalName,
            commercialName: this.fiscalData?.commercialName,
            fiscalRFC: this.fiscalData?.fiscalRFC,
            fiscalAddress: this.fiscalData?.fiscalAddress,
            cfdiUsage: this.fiscalData?.cfdiUsage,
            fiscalRegime: this.fiscalData?.fiscalRegime,
            accountNumber: this.fiscalData?.accountNumber
        };

        if (this.fiscalData?.id) {
            this.customerFiscalDataService.update(this.fiscalData.id, fiscalDataDto).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.loadFiscalData(this.customer.id!);
                        this.fiscalDataDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Datos fiscales actualizados',
                            life: 3000
                        });
                    }
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error al actualizar datos fiscales',
                        life: 3000
                    });
                }
            });
        } else {
            this.customerFiscalDataService.create(fiscalDataDto).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.loadFiscalData(this.customer.id!);
                        this.fiscalDataDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Datos fiscales creados',
                            life: 3000
                        });
                    }
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error al crear datos fiscales',
                        life: 3000
                    });
                }
            });
        }
    }

    // Métodos para Productos Específicos
    loadCustomerProducts(customerId: number) {
        this.customerProductService.getByCustomerId(customerId).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.customerProducts = response.data;
                } else {
                    this.customerProducts = [];
                }
            },
            error: (error) => {
                // Si es 404, simplemente inicializar vacío (es normal cuando no hay productos o el endpoint no existe aún)
                if (error.status === 404) {
                    this.customerProducts = [];
                    // No mostrar error en consola para 404 (endpoint puede no existir aún)
                } else {
                    console.error('Error loading customer products:', error);
                }
            }
        });
    }

    openNewCustomerProduct() {
        this.customerProduct = {
            customerId: this.customer.id!,
            productId: 0,
            quantity: 1,
            unitPrice: 0,
            discountPercentage: undefined,
            discountAmount: undefined,
            isActive: true
        } as CustomerProductResponseDto;
        this.customerProductDialog = true;
    }

    editCustomerProduct(product: CustomerProductResponseDto) {
        this.customerProduct = { ...product };
        this.customerProductDialog = true;
    }

    deleteCustomerProduct(product: CustomerProductResponseDto) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar este producto?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.customerProductService.delete(product.id).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadCustomerProducts(this.customer.id!);
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Producto eliminado',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al eliminar producto',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    onProductSelected(productId: number) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            this.customerProduct.unitPrice = product.price;
        }
    }

    calculateLineTotal(): number {
        if (!this.customerProduct.quantity || !this.customerProduct.unitPrice) return 0;
        let subtotal = this.customerProduct.quantity * this.customerProduct.unitPrice;
        if (this.customerProduct.discountPercentage) {
            subtotal -= subtotal * (this.customerProduct.discountPercentage / 100);
        } else if (this.customerProduct.discountAmount) {
            subtotal -= this.customerProduct.discountAmount;
        }
        return subtotal;
    }

    saveCustomerProduct() {
        const productData: CustomerProductDto = {
            customerId: this.customer.id!,
            productId: this.customerProduct.productId,
            quantity: this.customerProduct.quantity,
            unitPrice: this.customerProduct.unitPrice,
            discountPercentage: this.customerProduct.discountPercentage,
            discountAmount: this.customerProduct.discountAmount,
            isActive: this.customerProduct.isActive
        };

        if (this.customerProduct.id) {
            this.customerProductService.update(this.customerProduct.id, productData).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.loadCustomerProducts(this.customer.id!);
                        this.customerProductDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Producto actualizado',
                            life: 3000
                        });
                    }
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error al actualizar producto',
                        life: 3000
                    });
                }
            });
        } else {
            this.customerProductService.create(productData).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.loadCustomerProducts(this.customer.id!);
                        this.customerProductDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Producto creado',
                            life: 3000
                        });
                    }
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error al crear producto',
                        life: 3000
                    });
                }
            });
        }
    }

    getProductName(productId: number): string {
        const product = this.products.find(p => p.id === productId);
        return product ? product.name : 'Sin producto';
    }

    // Helper method to check if an item can be edited/deleted (belongs to user's organization, not system)
    canEditItem(organizationId: string | undefined): boolean {
        if (!organizationId || !this.currentUserOrganizationId) return false;
        return organizationId !== this.systemOrganizationId && organizationId === this.currentUserOrganizationId;
    }

    // Quick edit/delete methods for Customer Origin dropdown items
    quickEditCustomerOrigin(event: Event, origin: CustomerOriginResponseDto) {
        event.stopPropagation();
        this.editCustomerOrigin(origin);
    }

    quickDeleteCustomerOrigin(event: Event, origin: CustomerOriginResponseDto) {
        event.stopPropagation();
        this.deleteCustomerOrigin(origin);
    }

    // Mini CRUD methods for Customer Origin
    openNewCustomerOrigin() {
        this.customerOrigin = {} as CustomerOriginResponseDto;
        this.customerOriginSubmitted = false;
        this.customerOriginDialog = true;
    }

    editCustomerOrigin(origin: CustomerOriginResponseDto) {
        this.customerOrigin = { ...origin };
        this.customerOriginSubmitted = false;
        this.customerOriginDialog = true;
    }

    hideCustomerOriginDialog() {
        this.customerOriginDialog = false;
        this.customerOriginSubmitted = false;
    }

    saveCustomerOrigin() {
        this.customerOriginSubmitted = true;

        if (this.customerOrigin.name?.trim()) {
            if (this.customerOrigin.id) {
                // Update
                const updateDto = {
                    id: this.customerOrigin.id,
                    name: this.customerOrigin.name,
                    description: this.customerOrigin.description,
                    isActive: !!this.customerOrigin.isActive
                };

                this.customerOriginService.update(this.customerOrigin.id, updateDto).subscribe({
                    next: (response) => {
                        if (response.success && response.data) {
                            this.refreshCustomerOrigins();
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Origen actualizado',
                                life: 3000
                            });
                            this.customerOriginDialog = false;
                            this.customerOrigin = {} as CustomerOriginResponseDto;
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al actualizar origen',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        console.error('Error updating customer origin:', error);
                        const errorMessage = error.error?.message || error.error?.error || error.message || 'Error al actualizar origen';
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: errorMessage
                        });
                    }
                });
            } else {
                // Create
                const createDto = {
                    name: this.customerOrigin.name,
                    description: this.customerOrigin.description,
                    isActive: this.customerOrigin.isActive !== undefined ? this.customerOrigin.isActive : true
                };

                this.customerOriginService.create(createDto).subscribe({
                    next: (response) => {
                        if (response.success && response.data) {
                            this.refreshCustomerOrigins();
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Origen creado',
                                life: 3000
                            });
                            this.customerOriginDialog = false;
                            this.customerOrigin = {} as CustomerOriginResponseDto;
                            // Auto-select the newly created origin
                            if (this.customer) {
                                this.customer.customerOriginId = response.data.id;
                            }
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al crear origen',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        console.error('Error creating customer origin:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al crear origen'
                        });
                    }
                });
            }
        }
    }

    deleteCustomerOrigin(origin: CustomerOriginResponseDto) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar ' + origin.name + '?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.customerOriginService.delete(origin.id).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.refreshCustomerOrigins();
                            this.messageService.add({ 
                                severity: 'success', 
                                summary: 'Exitoso', 
                                detail: 'Origen eliminado', 
                                life: 3000 
                            });
                            // Clear selection if deleted origin was selected
                            if (this.customer?.customerOriginId === origin.id) {
                                this.customer.customerOriginId = undefined;
                            }
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al eliminar origen',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        console.error('Error deleting customer origin:', error);
                        this.messageService.add({ 
                            severity: 'error', 
                            summary: 'Error', 
                            detail: error.error?.message || 'Error al eliminar origen' 
                        });
                    }
                });
            }
        });
    }
}

