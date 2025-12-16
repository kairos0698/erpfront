import { Component, OnInit, signal, ViewChild, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Table, TableModule } from 'primeng/table';
import { TreeTableModule } from 'primeng/treetable';
import { TreeNode } from 'primeng/api';
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
import { ChartModule } from 'primeng/chart';
import { FluidModule } from 'primeng/fluid';
import { Subscription, debounceTime, forkJoin } from 'rxjs';
import { LayoutService } from '../../../../layout/service/layout.service';
import { ProductionReportService, ProductionReportItem, ProductionReportFilter, ProductionReportTreeNode } from '../services/production-report.service';
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
import { WorkOrderService, WorkOrderResponseDto } from '../../productos-biologicos/services/work-order.service';

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
        TreeTableModule,
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
        CardModule,
        ChartModule,
        FluidModule
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
        ProductService,
        WorkOrderService
    ]
})
export class ProductionReportComponent implements OnInit, OnDestroy {
    @ViewChild('dt') dt!: Table;

    // Datos
    reportData = signal<ProductionReportItem[]>([]);
    treeData = signal<TreeNode[]>([]);
    loading = signal<boolean>(false);
    
    // Gráficos
    productionByProductData: any;
    costByProductData: any;
    productionByRegionData: any;
    productionByEmployeeData: any;
    costByActivityData: any;
    costByPhaseData: any;
    costByEmployeeData: any;
    costByRegionData: any;
    
    chartOptions: any;
    subscription: Subscription;

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

    // Columnas de la tabla (para exportación)
    cols: Column[] = [
        { field: 'folio', header: 'Folio' },
        { field: 'date', header: 'Fecha' },
        { field: 'biologicalProductName', header: 'Producto Biológico' },
        { field: 'unitsProduced', header: 'Unidades Producidas' },
        { field: 'totalCost', header: 'Costos Totales' },
        { field: 'costPerUnit', header: 'Costo por Unidad' }
    ];

    // Columnas del TreeTable
    treeCols: Column[] = [
        { field: 'name', header: 'Nombre' },
        { field: 'folio', header: 'Folio' },
        { field: 'date', header: 'Fecha' },
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
        private workOrderService: WorkOrderService,
        private messageService: MessageService,
        private layoutService: LayoutService,
        private cdr: ChangeDetectorRef
    ) {
        this.subscription = this.layoutService.configUpdate$.pipe(debounceTime(25)).subscribe(() => {
            this.initChartOptions();
            this.updateCharts();
        });
    }

    ngOnInit() {
        this.loadReferenceData();
        this.initChartOptions();
    }
    
    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
    
    initChartOptions() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border');
        const primaryColor = documentStyle.getPropertyValue('--p-primary-500');
        const primaryColor200 = documentStyle.getPropertyValue('--p-primary-200');
        
        this.chartOptions = {
            maintainAspectRatio: false,
            aspectRatio: 0.8,
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context: any) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                if (context.dataset.label?.includes('Costo') || context.dataset.label?.includes('$')) {
                                    label += new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                                } else {
                                    label += context.parsed.y.toLocaleString('es-MX');
                                }
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textColorSecondary,
                        font: {
                            weight: 500
                        }
                    },
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                },
                y: {
                    ticks: {
                        color: textColorSecondary,
                        callback: function(value: any) {
                            if (value >= 1000) {
                                return (value / 1000).toFixed(1) + 'k';
                            }
                            return value;
                        }
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false
                    }
                }
            }
        };
    }
    
    updateCharts() {
        const data = this.reportData();
        if (!data || data.length === 0) {
            this.clearCharts();
            return;
        }
        
        const documentStyle = getComputedStyle(document.documentElement);
        const primaryColor = documentStyle.getPropertyValue('--p-primary-500');
        const primaryColor200 = documentStyle.getPropertyValue('--p-primary-200');
        const successColor = documentStyle.getPropertyValue('--p-green-500');
        const infoColor = documentStyle.getPropertyValue('--p-blue-500');
        const warningColor = documentStyle.getPropertyValue('--p-orange-500');
        const dangerColor = documentStyle.getPropertyValue('--p-red-500');
        
        // 1. ¿Cuánto produje? - Unidades producidas por producto
        const productionByProduct = this.groupBy(data, 'biologicalProductName', 'unitsProduced', 'sum');
        this.productionByProductData = {
            labels: productionByProduct.labels,
            datasets: [{
                label: 'Unidades Producidas',
                backgroundColor: primaryColor,
                borderColor: primaryColor,
                data: productionByProduct.values
            }]
        };
        
        // 2. ¿Cuánto me costó producirlo? - Costos totales por producto
        const costByProduct = this.groupBy(data, 'biologicalProductName', 'totalCost', 'sum');
        this.costByProductData = {
            labels: costByProduct.labels,
            datasets: [{
                label: 'Costo Total',
                backgroundColor: successColor,
                borderColor: successColor,
                data: costByProduct.values
            }]
        };
        
        // 3. ¿Dónde se produjo? - Producción por región
        const productionByRegion = this.groupBy(data.filter(d => d.regionName), 'regionName', 'unitsProduced', 'sum');
        this.productionByRegionData = {
            labels: productionByRegion.labels.length > 0 ? productionByRegion.labels : ['Sin región'],
            datasets: [{
                label: 'Unidades Producidas',
                backgroundColor: infoColor,
                borderColor: infoColor,
                data: productionByRegion.values.length > 0 ? productionByRegion.values : [0]
            }]
        };
        
        // 4. ¿Quién lo produjo? - Producción por empleado
        const productionByEmployee = this.groupBy(data.filter(d => d.employeeName), 'employeeName', 'unitsProduced', 'sum');
        this.productionByEmployeeData = {
            labels: productionByEmployee.labels.length > 0 ? productionByEmployee.labels.slice(0, 10) : ['Sin empleado'],
            datasets: [{
                label: 'Unidades Producidas',
                backgroundColor: warningColor,
                borderColor: warningColor,
                data: productionByEmployee.values.length > 0 ? productionByEmployee.values.slice(0, 10) : [0]
            }]
        };
        
        // 5. ¿Qué actividades me cuestan más? - Costos por actividad
        const costByActivity = this.groupBy(data.filter(d => d.activityName), 'activityName', 'totalCost', 'sum');
        this.costByActivityData = {
            labels: costByActivity.labels.length > 0 ? costByActivity.labels : ['Sin actividad'],
            datasets: [{
                label: 'Costo Total',
                backgroundColor: dangerColor,
                borderColor: dangerColor,
                data: costByActivity.values.length > 0 ? costByActivity.values : [0]
            }]
        };
        
        // 6. ¿Qué fase aporta más? - Costos por fase
        const costByPhase = this.groupBy(data.filter(d => d.phaseName), 'phaseName', 'totalCost', 'sum');
        this.costByPhaseData = {
            labels: costByPhase.labels.length > 0 ? costByPhase.labels : ['Sin fase'],
            datasets: [{
                label: 'Costo Total',
                backgroundColor: primaryColor200,
                borderColor: primaryColor200,
                data: costByPhase.values.length > 0 ? costByPhase.values : [0]
            }]
        };
        
        // 7. ¿Cuál es el costo de mano de obra? - Costos por empleado
        const costByEmployee = this.groupBy(data.filter(d => d.employeeName), 'employeeName', 'totalCost', 'sum');
        this.costByEmployeeData = {
            labels: costByEmployee.labels.length > 0 ? costByEmployee.labels.slice(0, 10) : ['Sin empleado'],
            datasets: [{
                label: 'Costo de Mano de Obra',
                backgroundColor: warningColor,
                borderColor: warningColor,
                data: costByEmployee.values.length > 0 ? costByEmployee.values.slice(0, 10) : [0]
            }]
        };
        
        // 8. Costos por región
        const costByRegion = this.groupBy(data.filter(d => d.regionName), 'regionName', 'totalCost', 'sum');
        this.costByRegionData = {
            labels: costByRegion.labels.length > 0 ? costByRegion.labels : ['Sin región'],
            datasets: [{
                label: 'Costo Total',
                backgroundColor: infoColor,
                borderColor: infoColor,
                data: costByRegion.values.length > 0 ? costByRegion.values : [0]
            }]
        };
    }
    
    clearCharts() {
        this.productionByProductData = null;
        this.costByProductData = null;
        this.productionByRegionData = null;
        this.productionByEmployeeData = null;
        this.costByActivityData = null;
        this.costByPhaseData = null;
        this.costByEmployeeData = null;
        this.costByRegionData = null;
    }
    
    private groupBy(data: ProductionReportItem[], field: keyof ProductionReportItem, valueField: keyof ProductionReportItem, operation: 'sum' | 'avg' = 'sum'): { labels: string[], values: number[] } {
        const grouped = new Map<string, number[]>();
        
        data.forEach(item => {
            const fieldValue = item[field];
            const key = (fieldValue !== null && fieldValue !== undefined && fieldValue !== '') 
                ? String(fieldValue) 
                : 'Sin especificar';
            const valueFieldValue = item[valueField];
            const value = (typeof valueFieldValue === 'number' && !isNaN(valueFieldValue)) 
                ? valueFieldValue 
                : 0;
            
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key)!.push(value);
        });
        
        const labels: string[] = [];
        const values: number[] = [];
        
        grouped.forEach((vals, key) => {
            labels.push(key);
            if (operation === 'sum') {
                values.push(vals.reduce((a, b) => a + b, 0));
            } else {
                values.push(vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0);
            }
        });
        
        // Ordenar por valor descendente
        const sorted = labels.map((label, index) => ({ label, value: values[index] }))
            .sort((a, b) => b.value - a.value);
        
        return {
            labels: sorted.map(s => s.label),
            values: sorted.map(s => s.value)
        };
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

        // Cargar materiales (productos de inventario) - se cargarán todos inicialmente
        // pero se filtrarán cuando se seleccionen productos
        this.loadAllMaterials();
    }

    loadAllMaterials() {
        this.productService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    // Filtrar por MaterialsAndSupplies (5) y RawMaterial (0) que son materiales e insumos
                    this.allMaterials = response.data.filter(p => 
                        p.type === ProductType.MaterialsAndSupplies || 
                        p.type === ProductType.RawMaterial
                    );
                    console.log('📦 Materiales cargados:', this.allMaterials.length, this.allMaterials);
                } else {
                    console.warn('⚠️ No se recibieron materiales del backend');
                    this.allMaterials = [];
                }
            },
            error: (error) => {
                console.error('❌ Error loading materials:', error);
                this.allMaterials = [];
            }
        });
    }

    // Cargar fases cuando se selecciona un producto
    onProductsSelected() {
        if (this.selectedProducts.length > 0) {
            const productIds = this.selectedProducts.map(p => p.id);
            // Cargar fases de los productos seleccionados usando forkJoin para manejar múltiples llamadas
            this.allPhases = [];
            this.selectedPhases = [];
            
            // Crear un array de observables para todas las llamadas
            const phaseRequests = productIds.map(productId => 
                this.biologicalPhaseService.getByProductId(productId)
            );
            
            // Ejecutar todas las llamadas en paralelo
            forkJoin(phaseRequests).subscribe({
                next: (responses) => {
                    const newPhases: BiologicalPhaseResponseDto[] = [];
                    responses.forEach((response, index) => {
                        if (response.success && response.data) {
                            // Agregar fases sin duplicados
                            response.data.forEach(phase => {
                                if (!newPhases.find(p => p.id === phase.id)) {
                                    newPhases.push(phase);
                                }
                            });
                        }
                    });
                    // Asignar el nuevo array para forzar la detección de cambios
                    this.allPhases = [...newPhases];
                    console.log('✅ Fases cargadas:', this.allPhases.length, this.allPhases);
                    this.cdr.detectChanges();
                    
                    // Cargar materiales usados en las órdenes de trabajo de estas fases
                    this.loadMaterialsFromWorkOrders();
                },
                error: (error) => {
                    console.error('Error loading phases:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error al cargar las fases de los productos seleccionados',
                        life: 3000
                    });
                }
            });
        } else {
            this.allPhases = [];
            this.selectedPhases = [];
            this.allMaterials = [];
            this.selectedMaterials = [];
        }
    }
    
    // Cargar materiales usados en las órdenes de trabajo de los productos seleccionados
    loadMaterialsFromWorkOrders() {
        if (this.allPhases.length === 0) {
            this.allMaterials = [];
            console.log('⚠️ No hay fases, no se pueden cargar materiales');
            return;
        }
        
        const phaseIds = this.allPhases.map(p => p.id);
        console.log('🔍 Buscando materiales en fases:', phaseIds);
        const materialIdsSet = new Set<number>();
        
        // Obtener todas las órdenes de trabajo de las fases seleccionadas
        const workOrderRequests = phaseIds.map(phaseId => 
            this.workOrderService.getAll({ biologicalProductPhaseId: phaseId })
        );
        
        if (workOrderRequests.length === 0) {
            this.allMaterials = [];
            console.log('⚠️ No hay requests de órdenes de trabajo');
            return;
        }
        
        forkJoin(workOrderRequests).subscribe({
            next: (responses) => {
                console.log('📋 Respuestas de órdenes de trabajo:', responses.length);
                let totalWorkOrders = 0;
                
                responses.forEach((response, index) => {
                    if (response.success && response.data) {
                        totalWorkOrders += response.data.length;
                        console.log(`📦 Fase ${phaseIds[index]}: ${response.data.length} órdenes de trabajo`);
                        
                        response.data.forEach((workOrder: WorkOrderResponseDto) => {
                            // Obtener materiales de empleados
                            if (workOrder.employees && workOrder.employees.length > 0) {
                                workOrder.employees.forEach(employee => {
                                    if (employee.materials && employee.materials.length > 0) {
                                        employee.materials.forEach(material => {
                                            if (material.productId) {
                                                materialIdsSet.add(material.productId);
                                                console.log('  ➕ Material de empleado:', material.productId);
                                            }
                                        });
                                    }
                                });
                            }
                            
                            // Obtener materiales globales
                            if (workOrder.globalMaterials && workOrder.globalMaterials.length > 0) {
                                workOrder.globalMaterials.forEach(material => {
                                    if (material.productId) {
                                        materialIdsSet.add(material.productId);
                                        console.log('  ➕ Material global:', material.productId);
                                    }
                                });
                            }
                        });
                    } else {
                        console.warn(`⚠️ Respuesta sin éxito para fase ${phaseIds[index]}:`, response);
                    }
                });
                
                console.log(`📊 Total órdenes procesadas: ${totalWorkOrders}`);
                console.log(`🔢 IDs de materiales encontrados: ${materialIdsSet.size}`, Array.from(materialIdsSet));
                
                // Obtener los productos (materiales) correspondientes a estos IDs
                const materialIds = Array.from(materialIdsSet);
                if (materialIds.length > 0) {
                    this.productService.getAll().subscribe({
                        next: (productResponse) => {
                            if (productResponse.success && productResponse.data) {
                                console.log('📦 Todos los productos del inventario:', productResponse.data.length);
                                
                                // Filtrar solo los materiales que se usan en las órdenes de trabajo
                                // Excluir productos biológicos explícitamente
                                this.allMaterials = productResponse.data.filter(p => {
                                    const isInWorkOrders = materialIds.includes(p.id);
                                    const isMaterialOrSupply = p.type === ProductType.MaterialsAndSupplies || 
                                                               p.type === ProductType.RawMaterial;
                                    const isNotBiological = p.type !== ProductType.BiologicalProduct;
                                    
                                    const shouldInclude = isInWorkOrders && isMaterialOrSupply && isNotBiological;
                                    
                                    if (shouldInclude) {
                                        console.log('  ✅ Material incluido:', p.name, 'Tipo:', p.type);
                                    }
                                    
                                    return shouldInclude;
                                });
                                
                                console.log('📦 Materiales finales usados en órdenes de trabajo:', this.allMaterials.length, this.allMaterials);
                                this.cdr.detectChanges();
                            } else {
                                console.warn('⚠️ No se recibieron productos del inventario');
                                this.allMaterials = [];
                                this.cdr.detectChanges();
                            }
                        },
                        error: (error) => {
                            console.error('❌ Error loading materials from work orders:', error);
                            this.allMaterials = [];
                            this.cdr.detectChanges();
                        }
                    });
                } else {
                    this.allMaterials = [];
                    console.log('⚠️ No se encontraron materiales en las órdenes de trabajo');
                    this.cdr.detectChanges();
                }
            },
            error: (error) => {
                console.error('❌ Error loading work orders for materials:', error);
                this.allMaterials = [];
                this.cdr.detectChanges();
            }
        });
    }

    // Convertir ProductionReportTreeNode a TreeNode de PrimeNG
    convertToTreeNode(node: ProductionReportTreeNode): TreeNode {
        // Convertir fechas de string a Date si vienen del backend
        const data = { ...node.data };
        if (data.date && typeof data.date === 'string') {
            data.date = new Date(data.date);
        }
        if (data.createdAt && typeof data.createdAt === 'string') {
            data.createdAt = new Date(data.createdAt);
        }
        
        const treeNode: TreeNode = {
            key: node.key,
            data: {
                ...data,
                nodeType: node.nodeType
            },
            children: node.children ? node.children.map(child => this.convertToTreeNode(child)) : undefined
        };
        return treeNode;
    }

    // Aplanar datos del árbol para los gráficos
    flattenTreeData(nodes: ProductionReportTreeNode[]): ProductionReportItem[] {
        const items: ProductionReportItem[] = [];
        
        nodes.forEach(node => {
            if (node.nodeType === 'WorkOrder') {
                // Solo agregar órdenes de trabajo (hojas)
                items.push({
                    folio: node.data.folio || '',
                    date: node.data.date || new Date(),
                    biologicalProductId: node.data.biologicalProductId || 0,
                    biologicalProductName: node.data.biologicalProductName || '',
                    unitsProduced: node.data.unitsProduced,
                    totalCost: node.data.totalCost,
                    costPerUnit: node.data.costPerUnit,
                    phaseId: node.data.phaseId,
                    phaseName: node.data.phaseName,
                    activityId: node.data.activityId,
                    activityName: node.data.activityName,
                    regionId: node.data.regionId,
                    regionName: node.data.regionName,
                    employeeId: node.data.employeeId,
                    employeeName: node.data.employeeName,
                    workOrderStatusId: node.data.workOrderStatusId || 0,
                    workOrderStatusName: node.data.workOrderStatusName || ''
                });
            }
            
            // Recursivamente procesar hijos
            if (node.children && node.children.length > 0) {
                items.push(...this.flattenTreeData(node.children));
            }
        });
        
        return items;
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

        // Usar el nuevo endpoint Tree para obtener datos jerárquicos
        this.reportService.getReportTree(filters).subscribe({
            next: (response) => {
                this.loading.set(false);
                if (response.success && response.data) {
                    // Convertir a TreeNode de PrimeNG
                    const treeNodes = response.data.map(node => this.convertToTreeNode(node));
                    this.treeData.set(treeNodes);
                    
                    // Aplanar datos para los gráficos (solo órdenes de trabajo)
                    const flatData = this.flattenTreeData(response.data);
                    this.reportData.set(flatData);
                    
                    this.updateCharts();
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Reporte Generado',
                        detail: `Se encontraron ${flatData.length} órdenes de trabajo`,
                        life: 3000
                    });
                } else {
                    this.treeData.set([]);
                    this.reportData.set([]);
                    this.clearCharts();
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
        this.treeData.set([]);
        this.reportData.set([]);
        this.clearCharts();
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

