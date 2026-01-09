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
import { TabsModule } from 'primeng/tabs';
import { SupplierService } from '../services/supplier.service';
import { SupplierPhoneService } from '../services/supplier-phone.service';
import { SupplierAddressService } from '../services/supplier-address.service';
import { SupplierResponseDto, SupplierDto } from '../models/supplier.model';
import { SupplierPhoneResponseDto, SupplierPhoneDto } from '../models/supplier-phone.model';
import { SupplierAddressResponseDto, SupplierAddressDto } from '../models/supplier-address.model';
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
    selector: 'app-supplier-list',
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
        AddressPickerComponent,
        TabsModule
    ],
    templateUrl: './supplier-list.component.html',
    providers: [MessageService, SupplierService, SupplierPhoneService, SupplierAddressService, ConfirmationService]
})
export class SupplierListComponent implements OnInit {
    supplierDialog: boolean = false;
    suppliers = signal<SupplierResponseDto[]>([]);
    supplier: SupplierResponseDto = {} as SupplierResponseDto;
    selectedSuppliers!: SupplierResponseDto[] | null;
    submitted: boolean = false;

    // Teléfonos
    supplierPhones: SupplierPhoneResponseDto[] = [];
    phoneDialog: boolean = false;
    supplierPhone: SupplierPhoneResponseDto = {} as SupplierPhoneResponseDto;

    // Direcciones
    supplierAddresses: SupplierAddressResponseDto[] = [];
    addressDialog: boolean = false;
    supplierAddress: SupplierAddressResponseDto = {} as SupplierAddressResponseDto;
    @ViewChild('addressPickerComponent') addressPickerComponent!: AddressPickerComponent;

    @ViewChild('dt') dt!: Table;
    exportColumns!: ExportColumn[];
    cols!: Column[];

    constructor(
        private supplierService: SupplierService,
        private supplierPhoneService: SupplierPhoneService,
        private supplierAddressService: SupplierAddressService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadSuppliers();
        this.setupColumns();
    }

    loadSuppliers() {
        this.supplierService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.suppliers.set(response.data);
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: response.message || 'Error al cargar proveedores',
                        life: 3000
                    });
                }
            },
            error: (error) => {
                console.error('Error loading suppliers:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error de conexión al cargar proveedores',
                    life: 3000
                });
            }
        });
    }

    setupColumns() {
        this.cols = [
            { field: 'name', header: 'Nombre', customExportHeader: 'Nombre del Proveedor' },
            { field: 'contactPerson', header: 'Contacto' },
            { field: 'email', header: 'Email' },
            { field: 'phone', header: 'Teléfono' },
            { field: 'isActive', header: 'Estado' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.supplier = {
            name: '',
            contactPerson: '',
            email: '',
            phone: '',
            address: '',
            rfc: '',
            isActive: true
        } as SupplierResponseDto;
        this.submitted = false;
        this.supplierPhones = [];
        this.supplierAddresses = [];
        this.supplierDialog = true;
    }

    editSupplier(supplier: SupplierResponseDto) {
        this.supplier = { ...supplier };
        this.supplierDialog = true;
        // Cargar teléfonos y direcciones del proveedor
        if (supplier.id) {
            this.loadSupplierPhones(supplier.id);
            this.loadSupplierAddresses(supplier.id);
        }
    }

    deleteSelectedSuppliers() {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar los proveedores seleccionados?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const selectedIds = this.selectedSuppliers?.map(s => s.id) || [];
                selectedIds.forEach(id => {
                    this.supplierService.delete(id).subscribe({
                        next: () => {
                            this.loadSuppliers();
                        },
                        error: (error) => {
                            console.error('Error deleting supplier:', error);
                        }
                    });
                });
                this.selectedSuppliers = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Exitoso',
                    detail: 'Proveedores Eliminados',
                    life: 3000
                });
            }
        });
    }

    hideDialog() {
        this.supplierDialog = false;
        this.submitted = false;
        this.supplierPhones = [];
        this.supplierAddresses = [];
    }

    // Métodos para teléfonos
    loadSupplierPhones(supplierId: number) {
        this.supplierPhoneService.getBySupplierId(supplierId).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.supplierPhones = response.data;
                } else {
                    this.supplierPhones = [];
                }
            },
            error: (error) => {
                if (error.status === 404) {
                    this.supplierPhones = [];
                } else {
                    console.error('Error loading supplier phones:', error);
                }
            }
        });
    }

    openNewPhone() {
        this.supplierPhone = {
            supplierId: this.supplier.id!,
            phoneNumber: '',
            phoneLabel: '',
            isDefault: false,
            isActive: true
        } as SupplierPhoneResponseDto;
        this.phoneDialog = true;
    }

    editPhone(phone: SupplierPhoneResponseDto) {
        this.supplierPhone = { ...phone };
        this.phoneDialog = true;
    }

    savePhone() {
        const phoneData: SupplierPhoneDto = {
            supplierId: this.supplier.id!,
            phoneNumber: this.supplierPhone.phoneNumber,
            phoneLabel: this.supplierPhone.phoneLabel,
            isDefault: this.supplierPhone.isDefault,
            isActive: this.supplierPhone.isActive
        };

        if (this.supplierPhone.id) {
            this.supplierPhoneService.update(this.supplierPhone.id, phoneData).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.loadSupplierPhones(this.supplier.id!);
                        this.phoneDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Teléfono actualizado',
                            life: 3000
                        });
                    }
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error al actualizar teléfono',
                        life: 3000
                    });
                }
            });
        } else {
            this.supplierPhoneService.create(phoneData).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.loadSupplierPhones(this.supplier.id!);
                        this.phoneDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Teléfono agregado',
                            life: 3000
                        });
                    }
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error al crear teléfono',
                        life: 3000
                    });
                }
            });
        }
    }

    deletePhone(phone: SupplierPhoneResponseDto) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar este teléfono?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.supplierPhoneService.delete(phone.id).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadSupplierPhones(this.supplier.id!);
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Teléfono eliminado',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al eliminar teléfono',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    // Métodos para direcciones
    loadSupplierAddresses(supplierId: number) {
        this.supplierAddressService.getBySupplierId(supplierId).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.supplierAddresses = response.data;
                } else {
                    this.supplierAddresses = [];
                }
            },
            error: (error) => {
                if (error.status === 404) {
                    this.supplierAddresses = [];
                } else {
                    console.error('Error loading supplier addresses:', error);
                }
            }
        });
    }

    openNewAddress() {
        this.supplierAddress = {
            supplierId: this.supplier.id!,
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
        } as SupplierAddressResponseDto;
        this.addressDialog = true;
    }

    editAddress(address: SupplierAddressResponseDto) {
        this.supplierAddress = { ...address };
        this.addressDialog = true;
    }

    onAddressSelected(addressData: AddressData): void {
        this.supplierAddress.street = addressData.street;
        this.supplierAddress.externalNumber = addressData.externalNumber;
        this.supplierAddress.internalNumber = addressData.internalNumber || '';
        this.supplierAddress.neighborhood = addressData.neighborhood;
        this.supplierAddress.municipality = addressData.municipality;
        this.supplierAddress.state = addressData.state;
        this.supplierAddress.postalCode = addressData.postalCode;
        this.supplierAddress.country = addressData.country || 'México';

        this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Dirección seleccionada desde Google Maps',
            life: 3000
        });
    }

    saveAddress() {
        const addressData: SupplierAddressDto = {
            supplierId: this.supplier.id!,
            addressName: this.supplierAddress.addressName,
            street: this.supplierAddress.street,
            externalNumber: this.supplierAddress.externalNumber,
            internalNumber: this.supplierAddress.internalNumber,
            neighborhood: this.supplierAddress.neighborhood,
            municipality: this.supplierAddress.municipality,
            state: this.supplierAddress.state,
            postalCode: this.supplierAddress.postalCode,
            country: this.supplierAddress.country,
            deliveryInstructions: this.supplierAddress.deliveryInstructions,
            isDefault: this.supplierAddress.isDefault,
            isActive: this.supplierAddress.isActive
        };

        if (this.supplierAddress.id) {
            this.supplierAddressService.update(this.supplierAddress.id, addressData).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.loadSupplierAddresses(this.supplier.id!);
                        this.addressDialog = false;
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
            this.supplierAddressService.create(addressData).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.loadSupplierAddresses(this.supplier.id!);
                        this.addressDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Dirección agregada',
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

    deleteAddress(address: SupplierAddressResponseDto) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar esta dirección?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.supplierAddressService.delete(address.id).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadSupplierAddresses(this.supplier.id!);
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

    deleteSupplier(supplier: SupplierResponseDto) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar el proveedor "' + supplier.name + '"?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.supplierService.delete(supplier.id).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadSuppliers();
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: response.message || 'Proveedor Eliminado',
                                life: 3000
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al eliminar proveedor',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error de conexión al eliminar proveedor',
                            life: 3000
                        });
                        console.error('Error deleting supplier:', error);
                    }
                });
            }
        });
    }

    getSeverity(isActive: boolean) {
        return isActive ? 'success' : 'danger';
    }

    saveSupplier() {
        this.submitted = true;
        
        if (this.supplier.name?.trim()) {
            const supplierData: SupplierDto = {
                name: this.supplier.name,
                contactPerson: this.supplier.contactPerson,
                email: this.supplier.email,
                phone: this.supplier.phone,
                address: this.supplier.address,
                rfc: this.supplier.rfc,
                isActive: this.supplier.isActive
            };

            if (this.supplier.id) {
                // Update existing supplier
                this.supplierService.update(this.supplier.id, supplierData).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadSuppliers();
                            this.supplierDialog = false;
                            // Recargar teléfonos y direcciones si el proveedor tiene ID
                            if (this.supplier.id) {
                                this.loadSupplierPhones(this.supplier.id);
                                this.loadSupplierAddresses(this.supplier.id);
                            }
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: response.message || 'Proveedor Actualizado',
                                life: 3000
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al actualizar proveedor',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error de conexión al actualizar proveedor',
                            life: 3000
                        });
                        console.error('Error updating supplier:', error);
                    }
                });
            } else {
                // Create new supplier
                this.supplierService.create(supplierData).subscribe({
                    next: (response) => {
                        if (response.success && response.data) {
                            this.loadSuppliers();
                            this.supplierDialog = false;
                            // Asignar el ID del proveedor creado y cargar teléfonos/direcciones
                            this.supplier.id = response.data.id;
                            this.loadSupplierPhones(this.supplier.id);
                            this.loadSupplierAddresses(this.supplier.id);
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: response.message || 'Proveedor Creado',
                                life: 3000
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al crear proveedor',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error de conexión al crear proveedor',
                            life: 3000
                        });
                        console.error('Error creating supplier:', error);
                    }
                });
            }
        }
    }

    exportCSV() {
        this.dt.exportCSV();
    }
}
