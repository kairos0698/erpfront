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
import { SupplierService } from '../services/supplier.service';
import { SupplierResponseDto, SupplierDto } from '../models/supplier.model';

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
        ConfirmDialogModule
    ],
    templateUrl: './supplier-list.component.html',
    providers: [MessageService, SupplierService, ConfirmationService]
})
export class SupplierListComponent implements OnInit {
    supplierDialog: boolean = false;
    suppliers = signal<SupplierResponseDto[]>([]);
    supplier: SupplierResponseDto = {} as SupplierResponseDto;
    selectedSuppliers!: SupplierResponseDto[] | null;
    submitted: boolean = false;

    @ViewChild('dt') dt!: Table;
    exportColumns!: ExportColumn[];
    cols!: Column[];

    constructor(
        private supplierService: SupplierService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadSuppliers();
        this.setupColumns();
    }

    loadSuppliers() {
        this.supplierService.getAll().subscribe({
            next: (data) => this.suppliers.set(data),
            error: (error) => {
                console.error('Error loading suppliers:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar proveedores',
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
        this.supplierDialog = true;
    }

    editSupplier(supplier: SupplierResponseDto) {
        this.supplier = { ...supplier };
        this.supplierDialog = true;
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
    }

    deleteSupplier(supplier: SupplierResponseDto) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar el proveedor "' + supplier.name + '"?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.supplierService.delete(supplier.id).subscribe({
                    next: () => {
                        this.loadSuppliers();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Proveedor Eliminado',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al eliminar proveedor',
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
                    next: () => {
                        this.loadSuppliers();
                        this.supplierDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Proveedor Actualizado',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al actualizar proveedor',
                            life: 3000
                        });
                        console.error('Error updating supplier:', error);
                    }
                });
            } else {
                // Create new supplier
                this.supplierService.create(supplierData).subscribe({
                    next: () => {
                        this.loadSuppliers();
                        this.supplierDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Proveedor Creado',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al crear proveedor',
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
