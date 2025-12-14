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
import { DatePickerModule } from 'primeng/datepicker';
import { MultiSelectModule } from 'primeng/multiselect';
import { CardModule } from 'primeng/card';
import { ProductionReportService, ProductionReportItem, ProductionReportFilter } from '../services/production-report.service';
import { BiologicalProductService } from '../../productos-biologicos/services/biological-product.service';
import { BiologicalProductResponseDto } from '../../productos-biologicos/models/biological-product.model';
import { RegionLotService } from '../../regiones-lotes/services/region-lot.service';
import { RegionLotResponseDto } from '../../regiones-lotes/models/region-lot.model';
import { ActivityService } from '../../activity/services/activity.service';
import { ActivityResponseDto } from '../../activity/models/activity.model';
import { EmployeeService } from '../../../rh/employee/services/employee.service';
import { EmployeeResponseDto } from '../../../rh/employee/models/employee.model';
import { ExtraCostService } from '../../costos-extra/services/extra-cost.service';
import { ExtraCostResponseDto } from '../../costos-extra/models/extra-cost.model';
import { BiologicalPhaseService } from '../../productos-biologicos/services/biological-phase.service';
import { BiologicalPhaseResponseDto } from '../../productos-biologicos/services/biological-phase.service';
import { ProductService } from '../../../inventario/productos/services/product.service';
import { ProductResponseDto, ProductType } from '../../../inventario/productos/models/product.model';

interface Column {
    field: string;
    header: string;
}

@Component({
    selector: 'app-production-report',
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
        TagModule,
        DatePickerModule,
        MultiSelectModule,
        CardModule
    ],
    templateUrl: './production-report.component.html',
    providers: [
        MessageService, 
        ProductionReportService, 
        BiologicalProductService,
        RegionLotService,
        ActivityService,
        EmployeeService,
        ExtraCostService,
        BiologicalPhaseService,
        ProductService
    ]
})
export class ProductionReportComponent implements OnInit {
    @ViewChild('dt') dt!: Table;

    // Datos
    reportData = signal<ProductionReportItem[]>([]);
    loading = signal<boolean>(false);

    // Filtros
    startDate: Date | null = null;
    endDate: Date | null = null;
    selectedProducts: BiologicalProductResponseDto[] = [];
    selectedRegions: RegionLotResponseDto[] = [];
    selectedActivities: ActivityResponseDto[] = [];
    selectedWorkOrderStatuses: number[] = [3]; // Por defecto solo Completadas
    selectedMaterials: ProductResponseDto[] = [];
    selectedEmployees: EmployeeResponseDto[] = [];
    selectedExtraCosts: ExtraCostResponseDto[] = [];
    selectedPhases: BiologicalPhaseResponseDto[] = [];

    // Opciones para dropdowns
    allProducts: BiologicalProductResponseDto[] = [];
    allRegions: RegionLotResponseDto[] = [];
    allActivities: ActivityResponseDto[] = [];
    allMaterials: ProductResponseDto[] = [];
    allEmployees: EmployeeResponseDto[] = [];
    allExtraCosts: ExtraCostResponseDto[] = [];
    allPhases: BiologicalPhaseResponseDto[] = [];

    // Opciones de estatus de órdenes de trabajo
    workOrderStatusOptions = [
        { label: 'Completada', value: 3 },
        { label: 'En Progreso', value: 2 },
        { label: 'Cancelada', value: 4 },
        { label: 'Pendiente', value: 1 }
    ];

    // Columnas de la tabla
    cols: Column[] = [
        { field: 'folio', header: 'Folio' },
        { field: 'date', header: 'Fecha' },
        { field: 'biologicalProductName', header: 'Producto Biológico' },
        { field: 'unitsProduced', header: 'Unidades Producidas' },
        { field: 'totalCost', header: 'Costos Totales' },
        { field: 'costPerUnit', header: 'Costo por Unidad' }
    ];

    constructor(
        private reportService: ProductionReportService,
        private biologicalProductService: BiologicalProductService,
        private regionLotService: RegionLotService,
        private activityService: ActivityService,
        private employeeService: EmployeeService,
        private extraCostService: ExtraCostService,
        private biologicalPhaseService: BiologicalPhaseService,
        private productService: ProductService,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.loadReferenceData();
    }

    loadReferenceData() {
        // Cargar productos biológicos
        this.biologicalProductService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.allProducts = response.data;
                }
            },
            error: (error) => console.error('Error loading products:', error)
        });

        // Cargar regiones
        this.regionLotService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.allRegions = response.data;
                }
            },
            error: (error) => console.error('Error loading regions:', error)
        });

        // Cargar actividades
        this.activityService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.allActivities = response.data;
                }
            },
            error: (error) => console.error('Error loading activities:', error)
        });

        // Cargar empleados
        this.employeeService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    // Agregar campo fullName calculado
                    this.allEmployees = response.data.map(emp => ({
                        ...emp,
                        fullName: `${emp.firstName} ${emp.lastName}`
                    }));
                }
            },
            error: (error) => console.error('Error loading employees:', error)
        });

        // Cargar costos extra
        this.extraCostService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.allExtraCosts = response.data;
                }
            },
            error: (error) => console.error('Error loading extra costs:', error)
        });

        // Cargar materiales (productos de inventario)
        this.productService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    // Filtrar por MaterialsAndSupplies (5) y RawMaterial (0) que son materiales e insumos
                    this.allMaterials = response.data.filter(p => 
                        p.type === ProductType.MaterialsAndSupplies || 
                        p.type === ProductType.RawMaterial
                    );
                }
            },
            error: (error) => console.error('Error loading materials:', error)
        });
    }

    // Cargar fases cuando se selecciona un producto
    onProductsSelected() {
        if (this.selectedProducts.length > 0) {
            const productIds = this.selectedProducts.map(p => p.id);
            // Cargar fases de los productos seleccionados
            this.allPhases = [];
            this.selectedPhases = [];
            
            productIds.forEach(productId => {
                this.biologicalPhaseService.getByProductId(productId).subscribe({
                    next: (response) => {
                        if (response.success && response.data) {
                            // Agregar fases sin duplicados
                            response.data.forEach(phase => {
                                if (!this.allPhases.find(p => p.id === phase.id)) {
                                    this.allPhases.push(phase);
                                }
                            });
                        }
                    },
                    error: (error) => console.error('Error loading phases:', error)
                });
            });
        } else {
            this.allPhases = [];
            this.selectedPhases = [];
        }
    }

    onFilter() {
        this.loading.set(true);
        
        const filters: ProductionReportFilter = {
            startDate: this.startDate || undefined,
            endDate: this.endDate || undefined,
            productIds: this.selectedProducts.length > 0 ? this.selectedProducts.map(p => p.id) : undefined,
            regionIds: this.selectedRegions.length > 0 ? this.selectedRegions.map(r => r.id) : undefined,
            activityIds: this.selectedActivities.length > 0 ? this.selectedActivities.map(a => a.id) : undefined,
            workOrderStatusIds: this.selectedWorkOrderStatuses.length > 0 ? this.selectedWorkOrderStatuses : [3],
            materialIds: this.selectedMaterials.length > 0 ? this.selectedMaterials.map(m => m.id) : undefined,
            employeeIds: this.selectedEmployees.length > 0 ? this.selectedEmployees.map(e => e.id) : undefined,
            extraCostIds: this.selectedExtraCosts.length > 0 ? this.selectedExtraCosts.map(ec => ec.id) : undefined,
            phaseIds: this.selectedPhases.length > 0 ? this.selectedPhases.map(p => p.id) : undefined
        };

        this.reportService.getReport(filters).subscribe({
            next: (response) => {
                this.loading.set(false);
                if (response.success && response.data) {
                    this.reportData.set(response.data);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Reporte Generado',
                        detail: `Se encontraron ${response.data.length} registros`,
                        life: 3000
                    });
                } else {
                    this.reportData.set([]);
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Sin Resultados',
                        detail: response.message || 'No se encontraron registros con los filtros seleccionados',
                        life: 3000
                    });
                }
            },
            error: (error) => {
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.message || 'Error al generar el reporte',
                    life: 5000
                });
                console.error('Error generating report:', error);
            }
        });
    }

    onClearFilters() {
        this.startDate = null;
        this.endDate = null;
        this.selectedProducts = [];
        this.selectedRegions = [];
        this.selectedActivities = [];
        this.selectedWorkOrderStatuses = [3]; // Resetear a solo Completadas
        this.selectedMaterials = [];
        this.selectedEmployees = [];
        this.selectedExtraCosts = [];
        this.selectedPhases = [];
        this.allPhases = [];
        this.reportData.set([]);
    }

    onExportExcel() {
        this.loading.set(true);
        
        const filters: ProductionReportFilter = {
            startDate: this.startDate || undefined,
            endDate: this.endDate || undefined,
            productIds: this.selectedProducts.length > 0 ? this.selectedProducts.map(p => p.id) : undefined,
            regionIds: this.selectedRegions.length > 0 ? this.selectedRegions.map(r => r.id) : undefined,
            activityIds: this.selectedActivities.length > 0 ? this.selectedActivities.map(a => a.id) : undefined,
            workOrderStatusIds: this.selectedWorkOrderStatuses.length > 0 ? this.selectedWorkOrderStatuses : [3],
            materialIds: this.selectedMaterials.length > 0 ? this.selectedMaterials.map(m => m.id) : undefined,
            employeeIds: this.selectedEmployees.length > 0 ? this.selectedEmployees.map(e => e.id) : undefined,
            extraCostIds: this.selectedExtraCosts.length > 0 ? this.selectedExtraCosts.map(ec => ec.id) : undefined,
            phaseIds: this.selectedPhases.length > 0 ? this.selectedPhases.map(p => p.id) : undefined
        };

        this.reportService.exportToExcel(filters).subscribe({
            next: (blob) => {
                this.loading.set(false);
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Reporte_Produccion_${new Date().toISOString().split('T')[0]}.xlsx`;
                link.click();
                window.URL.revokeObjectURL(url);
                
                this.messageService.add({
                    severity: 'success',
                    summary: 'Exportación Exitosa',
                    detail: 'El reporte se ha descargado correctamente',
                    life: 3000
                });
            },
            error: (error) => {
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.message || 'Error al exportar el reporte',
                    life: 5000
                });
                console.error('Error exporting report:', error);
            }
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }
}

