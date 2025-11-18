import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Table, TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { InventoryReportService, InventoryReportItem, InventoryReportFilter } from '../services/inventory-report.service';
import { ProductService } from '../../productos/services/product.service';
import { ReferenceDataService, WarehouseResponseDto, ProductClassificationResponseDto } from '../../productos/services/reference-data.service';
import { ProductResponseDto } from '../../productos/models/product.model';

interface Column {
    field: string;
    header: string;
}

@Component({
    selector: 'app-inventory-report',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        SelectModule,
        ToolbarModule,
        ToastModule,
        InputIconModule,
        IconFieldModule,
        InputTextModule,
        TagModule
    ],
    templateUrl: './inventory-report.component.html',
    providers: [MessageService, InventoryReportService, ProductService, ReferenceDataService]
})
export class InventoryReportComponent implements OnInit {
    @ViewChild('dt') dt!: Table;

    // Datos
    reportData = signal<InventoryReportItem[]>([]);
    loading = signal<boolean>(false);

    // Filtros
    selectedProduct: ProductResponseDto | null = null;
    selectedWarehouse: WarehouseResponseDto | null = null;
    selectedClassification: ProductClassificationResponseDto | null = null;

    // Opciones para dropdowns
    products: ProductResponseDto[] = [];
    warehouses: WarehouseResponseDto[] = [];
    classifications: ProductClassificationResponseDto[] = [];

    // Columnas de la tabla
    cols: Column[] = [
        { field: 'name', header: 'Producto' },
        { field: 'sku', header: 'SKU' },
        { field: 'classificationName', header: 'Clasificación' },
        { field: 'warehouseName', header: 'Almacén' },
        { field: 'price', header: 'Precio' },
        { field: 'cost', header: 'Costo' },
        { field: 'stockQuantity', header: 'Stock' },
        { field: 'minStock', header: 'Stock Mínimo' },
        { field: 'unitName', header: 'Unidad' },
        { field: 'isActive', header: 'Estado' }
    ];

    constructor(
        private reportService: InventoryReportService,
        private productService: ProductService,
        private referenceDataService: ReferenceDataService,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.loadReferenceData();
    }

    loadReferenceData() {
        // Cargar productos
        this.productService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.products = response.data;
                }
            },
            error: (error) => {
                console.error('Error loading products:', error);
            }
        });

        // Cargar almacenes
        this.referenceDataService.getWarehouses().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.warehouses = response.data;
                }
            },
            error: (error) => {
                console.error('Error loading warehouses:', error);
            }
        });

        // Cargar clasificaciones
        this.referenceDataService.getProductClassifications().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.classifications = response.data;
                }
            },
            error: (error) => {
                console.error('Error loading classifications:', error);
            }
        });
    }

    onFilter() {
        this.loading.set(true);
        
        const filters: InventoryReportFilter = {};
        
        if (this.selectedProduct) {
            filters.productId = this.selectedProduct.id;
        }
        if (this.selectedWarehouse) {
            filters.warehouseId = this.selectedWarehouse.id;
        }
        if (this.selectedClassification) {
            filters.classificationId = this.selectedClassification.id;
        }

        this.reportService.getReport(filters).subscribe({
            next: (response) => {
                this.loading.set(false);
                if (response.success && response.data) {
                    this.reportData.set(response.data);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: `Se encontraron ${response.data.length} registros`,
                        life: 3000
                    });
                } else {
                    this.reportData.set([]);
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Sin resultados',
                        detail: response.message || 'No se encontraron registros con los filtros seleccionados',
                        life: 3000
                    });
                }
            },
            error: (error) => {
                this.loading.set(false);
                console.error('Error loading report:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar el reporte',
                    life: 3000
                });
            }
        });
    }

    onExportExcel() {
        if (this.reportData().length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'No hay datos para exportar. Por favor, filtra primero los datos.',
                life: 3000
            });
            return;
        }

        this.loading.set(true);

        const filters: InventoryReportFilter = {};
        
        if (this.selectedProduct) {
            filters.productId = this.selectedProduct.id;
        }
        if (this.selectedWarehouse) {
            filters.warehouseId = this.selectedWarehouse.id;
        }
        if (this.selectedClassification) {
            filters.classificationId = this.selectedClassification.id;
        }

        this.reportService.exportToExcel(filters).subscribe({
            next: (blob) => {
                this.loading.set(false);
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `reporte_inventario_${new Date().toISOString().split('T')[0]}.xlsx`;
                link.click();
                window.URL.revokeObjectURL(url);
                
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Reporte exportado correctamente',
                    life: 3000
                });
            },
            error: (error) => {
                this.loading.set(false);
                console.error('Error exporting report:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al exportar el reporte',
                    life: 3000
                });
            }
        });
    }

    onClearFilters() {
        this.selectedProduct = null;
        this.selectedWarehouse = null;
        this.selectedClassification = null;
        this.reportData.set([]);
    }

    getSeverity(isActive: boolean): string {
        return isActive ? 'success' : 'danger';
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }
}

