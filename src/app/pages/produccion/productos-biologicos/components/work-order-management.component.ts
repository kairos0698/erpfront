import { Component, EventEmitter, Input, Output, OnInit, OnChanges, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TreeTableModule } from 'primeng/treetable';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { PaginatorModule } from 'primeng/paginator';
import { WorkOrderService, WorkOrderDto, WorkOrderResponseDto, CostCalculationMode } from '../services/work-order.service';
import { BiologicalPhaseResponseDto } from '../services/biological-phase.service';
import { BiologicalPhaseStatusService } from '../services/biological-phase-status.service';
import { BiologicalPhaseStatusDto } from '../models/biological-phase-status.model';
import { EmployeeService } from '../../../rh/employee/services/employee.service';
import { EmployeeResponseDto } from '../../../rh/employee/models/employee.model';
import { ActivityService } from '../../activity/services/activity.service';
import { ActivityResponseDto, ActivityType } from '../../activity/models/activity.model';
import { ProductService } from '../../../inventario/productos/services/product.service';
import { ProductResponseDto } from '../../../inventario/productos/models/product.model';
import { ExtraCostService } from '../../costos-extra/services/extra-cost.service';
import { ExtraCostResponseDto } from '../../costos-extra/models/extra-cost.model';
import { RegionLotService } from '../../regiones-lotes/services/region-lot.service';
import { RegionLotResponseDto } from '../../regiones-lotes/models/region-lot.model';

@Component({
    selector: 'app-work-order-management',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        TextareaModule,
        InputNumberModule,
        SelectModule,
        TableModule,
        TagModule,
        TreeTableModule,
        TooltipModule,
        ConfirmDialogModule,
        IconFieldModule,
        InputIconModule,
        PaginatorModule,
        PaginatorModule
    ],
    templateUrl: './work-order-management.component.html',
    providers: [MessageService, WorkOrderService, ConfirmationService]
})
export class WorkOrderManagementComponent implements OnInit, OnChanges {
    @Input() selectedPhase: BiologicalPhaseResponseDto | null = null;
    @Input() workOrdersDialog: boolean = false;
    @Output() workOrdersDialogChange = new EventEmitter<boolean>();

    // Usar signals como en product-list.component.ts
    workOrders = signal<any[]>([]);
    filteredWorkOrders = signal<any[]>([]);
    workOrderSearchTerm: string = '';
    newWorkOrderDialog: boolean = false;
    workOrderDetailDialog: boolean = false;
    workOrderSubmitted: boolean = false;
    submitted: boolean = false;
    
    // Modal de gestión de empleados
    employeesManagementDialog: boolean = false;
    isEditingEmployee: boolean = false; // true = editar, false = crear
    currentEmployeeIndex: number = -1; // índice del empleado que se está editando
    selectedEmployeeForEdit: any = null; // empleado seleccionado para editar
    
    // Paginación para tabla de empleados
    employeesTableFirst: number = 0;
    employeesTableRows: number = 10;
    
    // Filas expandidas en la tabla
    expandedRows: { [key: number]: boolean } = {};
    
    // Índices para edición de materiales y costos extra
    editingMaterial: { employeeIndex: number; materialIndex: number } | null = null;
    editingExtraCost: { employeeIndex: number; extraCostIndex: number } | null = null;
    
    // Determinar qué lista de empleados usar (nueva orden o edición)
    get currentEmployeesList(): any[] {
        return this.workOrderDetailDialog ? this.workOrderEmployees : this.newWorkOrderEmployees;
    }
    
    set currentEmployeesList(value: any[]) {
        if (this.workOrderDetailDialog) {
            this.workOrderEmployees = value;
        } else {
            this.newWorkOrderEmployees = value;
        }
    }

    // Usar WorkOrderDto como modelo principal (como ProductResponseDto en product-list)
    selectedWorkOrder: WorkOrderDto | null = null;
    newWorkOrder: WorkOrderDto = {
        name: '',
        description: '',
        customDate: null, // Nueva fecha personalizada
        status: 'Pendiente',
        totalCost: 0,
        biologicalProductPhaseId: 0,
        activityId: 0,
        employees: [],
        id: 0
    };

    // Propiedades para compatibilidad con el HTML
    workOrderEmployees: any[] = [];
    newWorkOrderEmployees: any[] = [];
    
    // Propiedades para materiales y costos extra globales
    workOrderGlobalMaterials: any[] = [];
    workOrderGlobalExtraCosts: any[] = [];
    newWorkOrderGlobalMaterials: any[] = [];
    newWorkOrderGlobalExtraCosts: any[] = [];

    // Propiedades para región/lote de la orden
    selectedRegionLot: RegionLotResponseDto | null = null;
    newWorkOrderRegionLot: RegionLotResponseDto | null = null;

    // Getters y setters para null safety en el template
    get selectedWorkOrderName(): string {
        return this.selectedWorkOrder?.name || '';
    }

    // Getter para verificar si hay materiales o costos extra globales
    get hasGlobalMaterialsOrCosts(): boolean {
        return (this.newWorkOrderGlobalMaterials && this.newWorkOrderGlobalMaterials.length > 0) ||
               (this.newWorkOrderGlobalExtraCosts && this.newWorkOrderGlobalExtraCosts.length > 0);
    }

    get hasWorkOrderGlobalMaterialsOrCosts(): boolean {
        return (this.workOrderGlobalMaterials && this.workOrderGlobalMaterials.length > 0) ||
               (this.workOrderGlobalExtraCosts && this.workOrderGlobalExtraCosts.length > 0);
    }
    set selectedWorkOrderName(value: string) {
        if (this.selectedWorkOrder) {
            this.selectedWorkOrder.name = value;
        }
    }

    get selectedWorkOrderStatus(): string {
        return this.selectedWorkOrder?.status || '';
    }
    set selectedWorkOrderStatus(value: string) {
        if (this.selectedWorkOrder) {
            this.selectedWorkOrder.status = value;
            // Actualizar statusId cuando cambia el status
            this.selectedWorkOrder.statusId = this.getStatusIdFromName(value);
        }
    }

    get selectedWorkOrderDescription(): string {
        return this.selectedWorkOrder?.description || '';
    }
    set selectedWorkOrderDescription(value: string) {
        if (this.selectedWorkOrder) {
            this.selectedWorkOrder.description = value;
        }
    }


    get selectedWorkOrderActivityId(): number {
        return this.selectedWorkOrder?.activityId || 0;
    }
    set selectedWorkOrderActivityId(value: number) {
        if (this.selectedWorkOrder) {
            this.selectedWorkOrder.activityId = value;
        }
    }

    get selectedWorkOrderCustomDate(): string {
        return this.selectedWorkOrder?.customDate ? this.selectedWorkOrder.customDate.toISOString().split('T')[0] : '';
    }
    set selectedWorkOrderCustomDate(value: string) {
        if (this.selectedWorkOrder) {
            this.selectedWorkOrder.customDate = value ? new Date(value) : null;
        }
    }

    // Datos de referencia con DTOs específicos
    employees: EmployeeResponseDto[] = [];
    materials: ProductResponseDto[] = [];
    extraCosts: ExtraCostResponseDto[] = [];
    activities: ActivityResponseDto[] = [];
    regionLots: RegionLotResponseDto[] = [];
    biologicalPhaseStatuses: BiologicalPhaseStatusDto[] = [];
    selectedActivity: ActivityResponseDto | null = null;

    // Propiedades computadas para dropdowns
    get employeesForDropdown() {
        return this.employees.map(emp => ({
            ...emp,
            name: `${emp.firstName} ${emp.lastName}`,
            position: emp.positionName || ''
        }));
    }

    get materialsForDropdown() {
        return this.materials.map(mat => ({
            ...mat,
            unit: mat.unitName || 'Sin unidad'
        }));
    }

    get extraCostsForDropdown() {
        return this.extraCosts.map(ec => ({
            ...ec,
            unit: ec.unitName || 'Sin unidad'
        }));
    }

    get activitiesForDropdown() {
        // Filtrar actividades según el tipo de fase
        if (!this.selectedPhase) {
            return this.activities;
        }
        
        // Si la fase es "Cosecha" (por defecto), mostrar solo actividades tipo Cosecha
        if (this.selectedPhase.isDefault) {
            return this.activities.filter(a => {
                const type = typeof a.type === 'string' 
                    ? (a.type === 'Cosecha' ? ActivityType.Cosecha : ActivityType.ActividadesVarias)
                    : a.type;
                return type === ActivityType.Cosecha;
            });
        }
        
        // Para otras fases, mostrar solo actividades tipo Actividades Varias
        return this.activities.filter(a => {
            const type = typeof a.type === 'string' 
                ? (a.type === 'Cosecha' ? ActivityType.Cosecha : ActivityType.ActividadesVarias)
                : a.type;
            return type === ActivityType.ActividadesVarias;
        });
    }

    get regionLotsForDropdown() {
        return this.regionLots;
    }

    get biologicalPhaseStatusesForDropdown() {
        return this.biologicalPhaseStatuses;
    }

    // Obtener opciones de estatus filtradas según el estatus actual
    get availableStatusOptions() {
        if (!this.selectedWorkOrder) {
            return this.biologicalPhaseStatuses;
        }
        
        const currentStatusId = this.selectedWorkOrder.statusId || this.getStatusIdFromName(this.selectedWorkOrder.status);
        
        // Si está Completada (3), solo permitir Cancelada (4)
        if (currentStatusId === 3) {
            return this.biologicalPhaseStatuses.filter(s => s.id === 4); // Solo Cancelada
        }
        
        // Si está Cancelada (4), no permitir cambios
        if (currentStatusId === 4) {
            return []; // No se puede cambiar
        }
        
        // Para otros estatus, permitir todos excepto Cancelada (solo se puede cancelar desde Completada)
        return this.biologicalPhaseStatuses.filter(s => s.id !== 4);
    }

    // Verificar si la orden está completada o cancelada
    get isWorkOrderCompletedOrCancelled(): boolean {
        if (!this.selectedWorkOrder) return false;
        const statusId = this.selectedWorkOrder.statusId || this.getStatusIdFromName(this.selectedWorkOrder.status);
        return statusId === 3 || statusId === 4; // Completada o Cancelada
    }

    // Verificar si la orden está cancelada
    get isWorkOrderCancelled(): boolean {
        if (!this.selectedWorkOrder) return false;
        const statusId = this.selectedWorkOrder.statusId || this.getStatusIdFromName(this.selectedWorkOrder.status);
        return statusId === 4; // Cancelada
    }

    constructor(
        private workOrderService: WorkOrderService,
        private employeeService: EmployeeService,
        private activityService: ActivityService,
        private productService: ProductService,
        private extraCostService: ExtraCostService,
        private regionLotService: RegionLotService,
        private biologicalPhaseStatusService: BiologicalPhaseStatusService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadReferenceData();
    }

    ngOnChanges() {
        if (this.selectedPhase && this.workOrdersDialog) {
            this.loadWorkOrders(this.selectedPhase.id);
        }
    }

    loadWorkOrders(phaseId: number) {
        this.workOrderService.getAll({ biologicalProductPhaseId: phaseId }).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    console.log('🔍 Cargando órdenes de trabajo:', response.data);
                    // Convertir a formato TreeNode para p-treeTable
                    const treeData = response.data.map((order, index) => ({
                        key: order.id.toString(),
                        data: {
                            id: order.id,
                            name: order.name,
                            description: order.description,
                            status: order.status,
                            totalCost: order.totalCost
                        },
                        children: []
                    }));
                    this.workOrders.set(treeData as any);
                    this.workOrderSearchTerm = '';
                    this.filterWorkOrders();
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: response.message || 'Error al cargar órdenes de trabajo',
                        life: 3000
                    });
                }
            },
            error: (error) => {
                console.error('Error loading work orders:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error de conexión al cargar órdenes de trabajo',
                    life: 3000
                });
            }
        });
    }

    filterWorkOrders() {
        const searchTerm = this.workOrderSearchTerm.toLowerCase().trim();
        if (!searchTerm) {
            this.filteredWorkOrders.set(this.workOrders());
            return;
        }
        
        const filtered = this.workOrders().filter(order => {
            const data = order.data;
            return (
                (data.name && data.name.toLowerCase().includes(searchTerm)) ||
                (data.description && data.description.toLowerCase().includes(searchTerm)) ||
                (data.status && data.status.toLowerCase().includes(searchTerm))
            );
        });
        
        this.filteredWorkOrders.set(filtered);
    }

    loadReferenceData(): Promise<void> {
        return new Promise((resolve) => {
            const promises = [
                this.loadEmployeesPromise(),
                this.loadMaterialsPromise(),
                this.loadExtraCostsPromise(),
                this.loadActivitiesPromise(),
                this.loadRegionLotsPromise(),
                this.loadBiologicalPhaseStatusesPromise()
            ];
            
            Promise.all(promises).then(() => {
                console.log('✅ Todos los datos de referencia cargados');
                resolve();
            }).catch((error) => {
                console.error('Error loading reference data:', error);
                resolve();
            });
        });
    }

    private loadEmployeesPromise(): Promise<void> {
        return new Promise((resolve) => {
            this.employeeService.getAll().subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        this.employees = response.data;
                        console.log('👥 Empleados cargados:', response.data.length, response.data);
                        resolve();
                    } else {
                        console.error('Error loading employees:', response.message);
                        resolve();
                    }
                },
                error: (error) => {
                    console.error('Error loading employees:', error);
                    resolve();
                }
            });
        });
    }

    private loadMaterialsPromise(): Promise<void> {
        return new Promise((resolve) => {
            this.productService.getAll().subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        this.materials = response.data;
                        console.log('📦 Materiales cargados:', response.data.length, response.data);
                        resolve();
                    } else {
                        console.error('Error loading materials:', response.message);
                        resolve();
                    }
                },
                error: (error) => {
                    console.error('Error loading materials:', error);
                    resolve();
                }
            });
        });
    }

    private loadExtraCostsPromise(): Promise<void> {
        return new Promise((resolve) => {
            this.extraCostService.getAll().subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        this.extraCosts = response.data;
                        console.log('💰 Costos extra cargados:', response.data.length, response.data);
                        resolve();
                    } else {
                        console.error('Error loading extra costs:', response.message);
                        resolve();
                    }
                },
                error: (error) => {
                    console.error('Error loading extra costs:', error);
                    resolve();
                }
            });
        });
    }

    private loadActivitiesPromise(): Promise<void> {
        return new Promise((resolve) => {
            this.activityService.getAll().subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        // Convertir el tipo de string a número si viene como string del backend
                        this.activities = response.data.map(activity => {
                            let activityType: ActivityType;
                            if (typeof activity.type === 'string') {
                                activityType = activity.type === 'Cosecha' ? ActivityType.Cosecha : ActivityType.ActividadesVarias;
                            } else {
                                activityType = activity.type;
                            }
                            return {
                                ...activity,
                                type: activityType
                            };
                        });
                        console.log('🏃 Actividades cargadas:', this.activities.length, this.activities);
                        resolve();
                    } else {
                        console.error('Error loading activities:', response.message);
                        resolve();
                    }
                },
                error: (error) => {
                    console.error('Error loading activities:', error);
                    resolve();
                }
            });
        });
    }

    private loadRegionLotsPromise(): Promise<void> {
        return new Promise((resolve) => {
            this.regionLotService.getAll().subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        this.regionLots = response.data;
                        console.log('🌍 Regiones cargadas:', response.data.length, response.data);
                        resolve();
                    } else {
                        console.error('Error loading region lots:', response.message);
                        resolve();
                    }
                },
                error: (error) => {
                    console.error('Error loading region lots:', error);
                    resolve();
                }
            });
        });
    }

    private loadBiologicalPhaseStatusesPromise(): Promise<void> {
        return new Promise((resolve) => {
            this.biologicalPhaseStatusService.getAll().subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        this.biologicalPhaseStatuses = response.data;
                        console.log('📊 Estados de fase cargados:', response.data.length, response.data);
                        resolve();
                    } else {
                        console.error('Error loading biological phase statuses:', response.message);
                        resolve();
                    }
                },
                error: (error) => {
                    console.error('Error loading biological phase statuses:', error);
                    resolve();
                }
            });
        });
    }

    openWorkOrderDetail(workOrder: any) {
        this.loadWorkOrderDetails(workOrder.id);
    }

    loadWorkOrderDetails(workOrderId: number) {
        this.workOrderService.getById(workOrderId).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    const workOrder = response.data;
                    console.log('📋 Datos de la orden recibidos:', workOrder);
                    
                    // Mapear directamente a WorkOrderDto
                    const statusId = (workOrder as any).statusId || this.getStatusIdFromName(workOrder.status);
                    const statusName = workOrder.status || this.getStatusNameFromId(statusId); // Asegurar que el status esté correcto
                    
                    this.selectedWorkOrder = {
                        name: workOrder.name,
                        description: workOrder.description,
                        customDate: workOrder.customDate ? new Date(workOrder.customDate) : null, // Nueva fecha personalizada
                        status: statusName, // Usar el nombre correcto del status
                        statusId: statusId, // Agregar statusId
                        totalCost: workOrder.totalCost,
                        biologicalProductPhaseId: workOrder.biologicalProductPhaseId,
                        activityId: workOrder.activityId,
                        regionLotId: workOrder.regionLotId,
                        employees: workOrder.employees || [],
                        id: workOrder.id
                    };
                    
                    console.log('📋 Status mapeado:', { statusId, statusName, originalStatus: workOrder.status });
                    
                    // Mapear empleados para compatibilidad con el HTML
                    this.workOrderEmployees = (workOrder.employees || []).map((emp: any) => ({
                            employeeId: emp.employeeId,
                        employeeName: emp.employeeName || `Empleado ${emp.employeeId}`,
                            position: emp.position || '',
                            regionLotId: emp.regionLotId,
                            regionLotName: emp.regionLotName || '',
                            unit: emp.unitName || 'Sin unidad',
                            unitId: emp.unitId || 0,
                        quantity: emp.quantity || 0,
                        unitCost: emp.unitCost || 0,
                        totalCost: emp.totalCost || 0,
                        costCalculationMode: typeof emp.costCalculationMode === 'number' ? emp.costCalculationMode : (emp.costCalculationMode !== undefined ? CostCalculationMode[emp.costCalculationMode as keyof typeof CostCalculationMode] : undefined), // Convertir correctamente
                        days: emp.days,
                        materials: emp.materials || [],
                        extraCosts: emp.extraCosts || []
                    }));
                    
                    // Mapear materiales globales
                    this.workOrderGlobalMaterials = (workOrder.globalMaterials || []).map((mat: any) => ({
                        productId: mat.productId,
                        materialName: mat.materialName || '',
                        unit: mat.unitName || 'Sin unidad',
                        unitId: mat.unitId || 0,
                        quantity: mat.quantity || 0,
                        unitCost: mat.unitCost || 0,
                        totalCost: mat.totalCost || 0
                    }));
                    
                    // Mapear costos extra globales
                    this.workOrderGlobalExtraCosts = (workOrder.globalExtraCosts || []).map((ec: any) => ({
                        extraCostId: ec.extraCostId,
                        extraCostName: ec.extraCostName || '',
                        unit: ec.unitName || 'Sin unidad',
                        unitId: ec.unitId || 0,
                        quantity: ec.quantity || 0,
                        unitCost: ec.unitCost || 0,
                        totalCost: ec.totalCost || 0
                    }));
                    
                    // Cargar región/lote seleccionada
                    if (workOrder.regionLotId) {
                        this.selectedRegionLot = this.regionLots.find(rl => rl.id === workOrder.regionLotId) || null;
                    } else {
                        this.selectedRegionLot = null;
                    }
                    
                    this.workOrderDetailDialog = true;
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: response.message || 'Error al cargar detalles de la orden',
                        life: 3000
                    });
                }
            },
            error: (error) => {
                console.error('Error loading work order details:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error de conexión al cargar detalles de la orden',
                    life: 3000
                });
            }
        });
    }

    hideWorkOrderDetailDialog() {
        this.workOrderDetailDialog = false;
        this.submitted = false;
        // Limpiar todos los datos de la orden de trabajo seleccionada
        this.selectedWorkOrder = null;
        this.workOrderEmployees = [];
        this.workOrderGlobalMaterials = [];
        this.workOrderGlobalExtraCosts = [];
        this.selectedRegionLot = null;
        // Limpiar campos del formulario
        this.selectedWorkOrderName = '';
        this.selectedWorkOrderDescription = '';
        this.selectedWorkOrderStatus = 'Pendiente';
        this.selectedWorkOrderActivityId = 0;
        this.selectedWorkOrderCustomDate = '';
    }

    openNewWorkOrder() {
        this.newWorkOrder = {
            name: '',
            description: '',
            customDate: null, // Nueva fecha personalizada
            status: 'Pendiente',
            totalCost: 0,
            biologicalProductPhaseId: this.selectedPhase?.id || 0,
            activityId: 0,
            employees: []
        };
        this.newWorkOrderEmployees = [];
        this.newWorkOrderGlobalMaterials = [];
        this.newWorkOrderGlobalExtraCosts = [];
        this.newWorkOrderRegionLot = null;
        this.workOrderSubmitted = false;
        this.newWorkOrderDialog = true;
    }

    hideNewWorkOrderDialog() {
        this.newWorkOrderDialog = false;
        this.workOrderSubmitted = false;
        // Limpiar todos los datos de la nueva orden de trabajo
        this.newWorkOrderEmployees = [];
        this.newWorkOrderGlobalMaterials = [];
        this.newWorkOrderGlobalExtraCosts = [];
        this.newWorkOrderRegionLot = null;
        this.newWorkOrder = {
            name: '',
            description: '',
            status: 'Pendiente',
            activityId: 0,
            biologicalProductPhaseId: this.selectedPhase?.id || 0,
            regionLotId: undefined,
            customDate: undefined
        } as WorkOrderDto;
    }

    // Métodos de utilidad
    /**
     * Calcula el total de todas las órdenes de trabajo
     */
    getTotalWorkOrdersCost(): number {
        const orders = this.workOrders();
        if (!orders || orders.length === 0) return 0;
        return orders.reduce((total, order) => {
            const orderCost = order.data?.totalCost || 0;
            return total + orderCost;
        }, 0);
    }

    getSeverity(status: string) {
        switch (status) {
            case 'Pendiente':
                return 'warning';
            case 'En Progreso':
                return 'info';
            case 'Completada':
                return 'success';
            case 'Cancelada':
                return 'danger';
            default:
                return 'secondary';
        }
    }

    isWorkOrderEditable(workOrder: any): boolean {
        if (!workOrder) { return true; }
        return workOrder.status === 'Pendiente' || workOrder.status === 'En Progreso';
    }

    // Métodos para cerrar diálogos
    hideWorkOrdersDialog() {
        this.workOrdersDialogChange.emit(false);
    }

    // Métodos para nueva orden de trabajo
    calculateNewWorkOrderTotalCost(): number {
        const employeesCost = this.newWorkOrderEmployees.reduce((total, emp) => {
            const workCost = (emp.quantity || 0) * (emp.unitCost || 0);
            const materialsCost = (emp.materials || []).reduce((matTotal: number, mat: any) => 
                matTotal + ((mat.quantity || 0) * (mat.unitCost || 0)), 0);
            const extraCostsCost = (emp.extraCosts || []).reduce((ecTotal: number, ec: any) => 
                ecTotal + ((ec.quantity || 0) * (ec.unitCost || 0)), 0);
            return total + workCost + materialsCost + extraCostsCost;
        }, 0);

        const globalMaterialsCost = this.newWorkOrderGlobalMaterials.reduce((total, mat) => 
            total + ((mat.quantity || 0) * (mat.unitCost || 0)), 0);

        const globalExtraCostsCost = this.newWorkOrderGlobalExtraCosts.reduce((total, ec) => 
            total + ((ec.quantity || 0) * (ec.unitCost || 0)), 0);

        return employeesCost + globalMaterialsCost + globalExtraCostsCost;
    }

    onNewWorkOrderActivitySelected(activityId: number) {
        this.newWorkOrder.activityId = activityId;
        
        // Buscar la actividad seleccionada
        const selectedActivity = this.activities.find(act => act.id === activityId);
        if (selectedActivity) {
            console.log('🎯 Actividad seleccionada:', selectedActivity);
            
            // Aplicar costo y unidad de la actividad a todos los empleados existentes
            this.newWorkOrderEmployees.forEach(emp => {
                emp.unitCost = selectedActivity.unitCost || 0;
                emp.unit = selectedActivity.unitName || 'Sin unidad';
                emp.totalCost = (emp.quantity || 0) * (emp.unitCost || 0);
                emp.unitId = selectedActivity.unitId;
            });
            
            // Si el modal de empleado está abierto, actualizar también el empleado en edición
            if (this.employeesManagementDialog && this.selectedEmployeeForEdit && !this.isEditingEmployee) {
                this.selectedEmployeeForEdit.unitCost = selectedActivity.unitCost || 0;
                this.selectedEmployeeForEdit.unit = selectedActivity.unitName || 'Sin unidad';
                this.selectedEmployeeForEdit.unitId = selectedActivity.unitId || 0;
            }
            
            console.log('✅ Costos y unidades aplicados a empleados:', this.newWorkOrderEmployees);
        }
    }

    // Método legacy - ahora abre el modal de gestión
    addNewWorkOrderEmployee() {
        this.openEmployeesManagementDialog();
    }

    onNewWorkOrderEmployeeSelected(index: number, employeeId: number) {
        const employee = this.employees.find(emp => emp.id === employeeId);
        if (employee) {
            this.newWorkOrderEmployees[index].employeeId = employeeId;
            this.newWorkOrderEmployees[index].employeeName = `${employee.firstName} ${employee.lastName}`;
            this.newWorkOrderEmployees[index].position = employee.positionName || '';
        }
    }

    removeNewWorkOrderEmployee(index: number) {
        this.newWorkOrderEmployees.splice(index, 1);
    }

    onNewWorkOrderRegionLotSelected(index: number, regionLotId: number) {
        const regionLot = this.regionLots.find(rl => rl.id === regionLotId);
        if (regionLot) {
            this.newWorkOrderEmployees[index].regionLotId = regionLotId;
            this.newWorkOrderEmployees[index].regionLotName = regionLot.name;
        }
    }

    onNewWorkOrderQuantityChanged(index: number) {
        const emp = this.newWorkOrderEmployees[index];
        // Recalcular según el modo de cálculo si es fase Cosecha
        emp.totalCost = this.calculateNewWorkOrderEmployeeWorkCost(emp);
    }

    addNewWorkOrderMaterial(employeeIndex: number) {
        this.newWorkOrderEmployees[employeeIndex].materials.push({
            productId: 0,
            materialName: '',
            unit: 'Sin unidad',
            quantity: 0,
            unitCost: 0,
            totalCost: 0
        });
    }

    onNewWorkOrderMaterialSelected(employeeIndex: number, materialIndex: number, productId: number) {
        const material = this.materials.find(mat => mat.id === productId);
        if (material) {
            this.newWorkOrderEmployees[employeeIndex].materials[materialIndex].productId = productId;
            this.newWorkOrderEmployees[employeeIndex].materials[materialIndex].materialName = material.name;
            this.newWorkOrderEmployees[employeeIndex].materials[materialIndex].unit = material.unitName || 'Sin unidad';
            this.newWorkOrderEmployees[employeeIndex].materials[materialIndex].unitCost = material.cost || 0;
            this.newWorkOrderEmployees[employeeIndex].materials[materialIndex].unitId = material.unitId;
            // Recalcular subtotal
            this.newWorkOrderEmployees[employeeIndex].materials[materialIndex].subtotal = 
                (this.newWorkOrderEmployees[employeeIndex].materials[materialIndex].quantity || 0) * 
                (this.newWorkOrderEmployees[employeeIndex].materials[materialIndex].unitCost || 0);
            
            console.log('📦 Material seleccionado:', material, 'Costo aplicado:', material.cost);
        }
    }

    calculateNewWorkOrderMaterialSubtotal(employeeIndex: number, materialIndex: number): number {
        const material = this.newWorkOrderEmployees[employeeIndex].materials[materialIndex];
        return (material.quantity || 0) * (material.unitCost || 0);
    }

    removeNewWorkOrderMaterial(employeeIndex: number, materialIndex: number) {
        this.newWorkOrderEmployees[employeeIndex].materials.splice(materialIndex, 1);
    }

    addNewWorkOrderExtraCost(employeeIndex: number) {
        this.newWorkOrderEmployees[employeeIndex].extraCosts.push({
            extraCostId: 0,
            extraCostName: '',
            unit: 'Sin unidad',
            quantity: 0,
            unitCost: 0,
            totalCost: 0
        });
    }

    onNewWorkOrderExtraCostSelected(employeeIndex: number, extraCostIndex: number, extraCostId: number) {
        const extraCost = this.extraCosts.find(ec => ec.id === extraCostId);
        if (extraCost) {
            this.newWorkOrderEmployees[employeeIndex].extraCosts[extraCostIndex].extraCostId = extraCostId;
            this.newWorkOrderEmployees[employeeIndex].extraCosts[extraCostIndex].extraCostName = extraCost.name;
            this.newWorkOrderEmployees[employeeIndex].extraCosts[extraCostIndex].unit = extraCost.unitName || 'Sin unidad';
            this.newWorkOrderEmployees[employeeIndex].extraCosts[extraCostIndex].unitCost = extraCost.unitCost || 0;
            this.newWorkOrderEmployees[employeeIndex].extraCosts[extraCostIndex].unitId = extraCost.unitId;
            // Recalcular subtotal
            this.newWorkOrderEmployees[employeeIndex].extraCosts[extraCostIndex].subtotal = 
                (this.newWorkOrderEmployees[employeeIndex].extraCosts[extraCostIndex].quantity || 0) * 
                (this.newWorkOrderEmployees[employeeIndex].extraCosts[extraCostIndex].unitCost || 0);
            
            console.log('💰 Costo extra seleccionado:', extraCost, 'Costo aplicado:', extraCost.unitCost);
        }
    }

    calculateNewWorkOrderExtraCostSubtotal(employeeIndex: number, extraCostIndex: number): number {
        const extraCost = this.newWorkOrderEmployees[employeeIndex].extraCosts[extraCostIndex];
        return (extraCost.quantity || 0) * (extraCost.unitCost || 0);
    }

    removeNewWorkOrderExtraCost(employeeIndex: number, extraCostIndex: number) {
        this.newWorkOrderEmployees[employeeIndex].extraCosts.splice(extraCostIndex, 1);
    }

    // Métodos para materiales globales en nueva orden
    addNewWorkOrderGlobalMaterial() {
        this.newWorkOrderGlobalMaterials.push({
            productId: 0,
            materialName: '',
            unit: 'Sin unidad',
            unitId: 0,
            quantity: 0,
            unitCost: 0,
            totalCost: 0
        });
    }

    onNewWorkOrderGlobalMaterialSelected(materialIndex: number, productId: number) {
        const material = this.materials.find(mat => mat.id === productId);
        if (material) {
            this.newWorkOrderGlobalMaterials[materialIndex].productId = productId;
            this.newWorkOrderGlobalMaterials[materialIndex].materialName = material.name;
            this.newWorkOrderGlobalMaterials[materialIndex].unit = material.unitName || 'Sin unidad';
            this.newWorkOrderGlobalMaterials[materialIndex].unitCost = material.cost || 0;
            this.newWorkOrderGlobalMaterials[materialIndex].unitId = material.unitId;
            this.newWorkOrderGlobalMaterials[materialIndex].totalCost = 
                (this.newWorkOrderGlobalMaterials[materialIndex].quantity || 0) * 
                (this.newWorkOrderGlobalMaterials[materialIndex].unitCost || 0);
        }
    }

    calculateNewWorkOrderGlobalMaterialTotal(materialIndex: number): number {
        const material = this.newWorkOrderGlobalMaterials[materialIndex];
        return (material.quantity || 0) * (material.unitCost || 0);
    }

    removeNewWorkOrderGlobalMaterial(materialIndex: number) {
        this.newWorkOrderGlobalMaterials.splice(materialIndex, 1);
    }

    // Métodos para costos extra globales en nueva orden
    addNewWorkOrderGlobalExtraCost() {
        this.newWorkOrderGlobalExtraCosts.push({
            extraCostId: 0,
            extraCostName: '',
            unit: 'Sin unidad',
            unitId: 0,
            quantity: 0,
            unitCost: 0,
            totalCost: 0
        });
    }

    onNewWorkOrderGlobalExtraCostSelected(extraCostIndex: number, extraCostId: number) {
        const extraCost = this.extraCosts.find(ec => ec.id === extraCostId);
        if (extraCost) {
            this.newWorkOrderGlobalExtraCosts[extraCostIndex].extraCostId = extraCostId;
            this.newWorkOrderGlobalExtraCosts[extraCostIndex].extraCostName = extraCost.name;
            this.newWorkOrderGlobalExtraCosts[extraCostIndex].unit = extraCost.unitName || 'Sin unidad';
            this.newWorkOrderGlobalExtraCosts[extraCostIndex].unitCost = extraCost.unitCost || 0;
            this.newWorkOrderGlobalExtraCosts[extraCostIndex].unitId = extraCost.unitId;
            this.newWorkOrderGlobalExtraCosts[extraCostIndex].totalCost = 
                (this.newWorkOrderGlobalExtraCosts[extraCostIndex].quantity || 0) * 
                (this.newWorkOrderGlobalExtraCosts[extraCostIndex].unitCost || 0);
        }
    }

    calculateNewWorkOrderGlobalExtraCostTotal(extraCostIndex: number): number {
        const extraCost = this.newWorkOrderGlobalExtraCosts[extraCostIndex];
        return (extraCost.quantity || 0) * (extraCost.unitCost || 0);
    }

    removeNewWorkOrderGlobalExtraCost(extraCostIndex: number) {
        this.newWorkOrderGlobalExtraCosts.splice(extraCostIndex, 1);
    }

    calculateNewWorkOrderEmployeeWorkCost(employee: any): number {
        // Solo aplicar lógica especial si es fase Cosecha
        if (this.selectedPhase?.isDefault && employee.costCalculationMode !== undefined) {
            const selectedActivity = this.activities.find(act => act.id === this.newWorkOrder.activityId);
            const mode = employee.costCalculationMode ?? CostCalculationMode.No;
            const days = employee.days || 0;
            const dailyActivityCost = selectedActivity?.dailyActivityCost || 0;
            
            switch (mode) {
                case CostCalculationMode.No:
                    // Funciona como está actualmente
                    return (employee.quantity || 0) * (employee.unitCost || 0);
                case CostCalculationMode.OnlyDailyCost:
                    // Solo costo por día: días * costo diario
                    return days * dailyActivityCost;
                case CostCalculationMode.Combine:
                    // Combinar ambos: (cantidad * costo unitario) + (días * costo diario)
                    return ((employee.quantity || 0) * (employee.unitCost || 0)) + (days * dailyActivityCost);
                default:
                    return (employee.quantity || 0) * (employee.unitCost || 0);
            }
        }
        // Otras fases: funciona como está actualmente
        return (employee.quantity || 0) * (employee.unitCost || 0);
    }

    calculateNewWorkOrderEmployeeMaterialsCost(employee: any): number {
        return employee.materials?.reduce((total: number, material: any) => 
            total + ((material.quantity || 0) * (material.unitCost || 0)), 0) || 0;
    }

    calculateNewWorkOrderEmployeeExtraCostsCost(employee: any): number {
        return employee.extraCosts?.reduce((total: number, extraCost: any) => 
            total + ((extraCost.quantity || 0) * (extraCost.unitCost || 0)), 0) || 0;
    }

    calculateNewWorkOrderEmployeeTotal(employee: any): number {
        return this.calculateNewWorkOrderEmployeeWorkCost(employee) + 
               this.calculateNewWorkOrderEmployeeMaterialsCost(employee) + 
               this.calculateNewWorkOrderEmployeeExtraCostsCost(employee);
    }

    saveNewWorkOrder() {
        this.workOrderSubmitted = true;
        
        if (this.newWorkOrder.name?.trim() && this.selectedPhase) {
            // Mapear empleados
            this.newWorkOrder.employees = this.newWorkOrderEmployees.map(emp => ({
                employeeId: emp.employeeId,
                regionLotId: emp.regionLotId,
                quantity: emp.quantity,
                unitCost: emp.unitCost,
                unitId: emp.unitId,
                totalCost: emp.totalCost,
                costCalculationMode: typeof emp.costCalculationMode === 'number' ? emp.costCalculationMode : (emp.costCalculationMode !== undefined ? CostCalculationMode[emp.costCalculationMode as keyof typeof CostCalculationMode] : undefined), // Asegurar que sea número
                days: emp.days,
                materials: emp.materials.map((mat: any) => ({
                    productId: mat.productId,
                    quantity: mat.quantity,
                    unitCost: mat.unitCost,
                    unitId: mat.unitId
                })),
                extraCosts: emp.extraCosts.map((ec: any) => ({
                    extraCostId: ec.extraCostId,
                    quantity: ec.quantity,
                    unitCost: ec.unitCost,
                    unitId: ec.unitId
                }))
            }));

            // Mapear materiales globales
            this.newWorkOrder.globalMaterials = this.newWorkOrderGlobalMaterials.map((mat: any) => ({
                productId: mat.productId,
                quantity: mat.quantity,
                unitCost: mat.unitCost,
                unitId: mat.unitId,
                totalCost: (mat.quantity || 0) * (mat.unitCost || 0)
            }));

            // Mapear costos extra globales
            this.newWorkOrder.globalExtraCosts = this.newWorkOrderGlobalExtraCosts.map((ec: any) => ({
                extraCostId: ec.extraCostId,
                quantity: ec.quantity,
                unitCost: ec.unitCost,
                unitId: ec.unitId,
                totalCost: (ec.quantity || 0) * (ec.unitCost || 0)
            }));

            this.newWorkOrder.totalCost = this.calculateNewWorkOrderTotalCost();
            this.newWorkOrder.biologicalProductPhaseId = this.selectedPhase.id;
            this.newWorkOrder.statusId = this.newWorkOrder.statusId || this.getStatusIdFromName(this.newWorkOrder.status); // Agregar statusId

            this.workOrderService.create(this.newWorkOrder).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: response.message || 'Orden de trabajo creada',
                            life: 3000
                        });
                        this.hideNewWorkOrderDialog();
                        this.loadWorkOrders(this.selectedPhase!.id);
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: response.message || 'Error al crear orden de trabajo',
                            life: 3000
                        });
                    }
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error de conexión al crear orden de trabajo',
                        life: 3000
                    });
                    console.error('Error creating work order:', error);
                }
            });
        }
    }

    // Métodos para detalles de orden de trabajo
    calculateTotalCost(): number {
        const employeesCost = this.workOrderEmployees.reduce((total, emp) => {
            const workCost = (emp.quantity || 0) * (emp.unitCost || 0);
            const materialsCost = (emp.materials || []).reduce((matTotal: number, mat: any) => 
                matTotal + ((mat.quantity || 0) * (mat.unitCost || 0)), 0);
            const extraCostsCost = (emp.extraCosts || []).reduce((ecTotal: number, ec: any) => 
                ecTotal + ((ec.quantity || 0) * (ec.unitCost || 0)), 0);
            return total + workCost + materialsCost + extraCostsCost;
        }, 0);

        const globalMaterialsCost = this.workOrderGlobalMaterials.reduce((total, mat) => 
            total + ((mat.quantity || 0) * (mat.unitCost || 0)), 0);

        const globalExtraCostsCost = this.workOrderGlobalExtraCosts.reduce((total, ec) => 
            total + ((ec.quantity || 0) * (ec.unitCost || 0)), 0);

        return employeesCost + globalMaterialsCost + globalExtraCostsCost;
    }

    onActivitySelected(activityId: number) {
        this.selectedWorkOrderActivityId = activityId;
        
        // Buscar la actividad seleccionada
        const selectedActivity = this.activities.find(act => act.id === activityId);
        if (selectedActivity) {
            console.log('🎯 Actividad seleccionada en detalles:', selectedActivity);
            
            // Aplicar costo y unidad de la actividad a todos los empleados existentes
            this.workOrderEmployees.forEach(emp => {
                emp.unitCost = selectedActivity.unitCost || 0;
                emp.unit = selectedActivity.unitName || 'Sin unidad';
                emp.unitId = selectedActivity.unitId || 0;
                emp.totalCost = (emp.quantity || 0) * (emp.unitCost || 0);
            });
            
            console.log('✅ Costos y unidades aplicados a empleados en detalles:', this.workOrderEmployees);
        }
    }

    // Abrir modal de formulario de empleado (agregar nuevo)
    openEmployeeFormDialog() {
        // Buscar la actividad seleccionada para aplicar sus costos y unidad
        const activityId = this.workOrderDetailDialog ? this.selectedWorkOrderActivityId : this.newWorkOrder.activityId;
        const selectedActivity = this.activities.find(act => act.id === activityId);
        
        // Si no hay actividad, mostrar advertencia pero permitir abrir el modal
        if (!selectedActivity) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Actividad No Seleccionada',
                detail: 'Se recomienda seleccionar una actividad primero. Los valores se actualizarán automáticamente al seleccionar la actividad.',
                life: 4000
            });
        }
        
        const newEmployee = {
            employeeId: 0,
            employeeName: '',
            position: '',
            regionLotId: 0,
            regionLotName: '',
            unit: selectedActivity?.unitName || 'Sin unidad',
            unitId: selectedActivity?.unitId || 0,
            quantity: 0,
            unitCost: selectedActivity?.unitCost || 0,
            totalCost: 0,
            costCalculationMode: this.selectedPhase?.isDefault ? CostCalculationMode.No : undefined,
            days: undefined,
            materials: [],
            extraCosts: []
        };
        
        this.selectedEmployeeForEdit = { ...newEmployee };
        this.isEditingEmployee = false;
        this.currentEmployeeIndex = -1;
        this.employeesManagementDialog = true;
    }
    
    // Abrir modal de gestión de empleados (legacy - ahora solo abre formulario)
    openEmployeesManagementDialog() {
        this.openEmployeeFormDialog();
    }
    
    // Cerrar modal de gestión de empleados
    closeEmployeesManagementDialog() {
        this.employeesManagementDialog = false;
        this.isEditingEmployee = false;
        this.selectedEmployeeForEdit = null;
        this.currentEmployeeIndex = -1;
    }
    
    // Cancelar edición de empleado
    cancelEmployeeEdit() {
        this.closeEmployeesManagementDialog();
    }
    
    // Agregar nuevo empleado desde el modal
    addEmployeeFromModal() {
        // Si ya está editando, cancelar primero
        if (this.isEditingEmployee) {
            this.cancelEmployeeEdit();
        }
        
        // Buscar la actividad seleccionada para aplicar sus costos y unidad
        const activityId = this.workOrderDetailDialog ? this.selectedWorkOrderActivityId : this.newWorkOrder.activityId;
        const selectedActivity = this.activities.find(act => act.id === activityId);
        
        if (!selectedActivity && !this.workOrderDetailDialog) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Actividad Requerida',
                detail: 'Debe seleccionar una actividad antes de agregar empleados',
                life: 3000
            });
            return;
        }
        
        const newEmployee = {
            employeeId: 0,
            employeeName: '',
            position: '',
            regionLotId: 0,
            regionLotName: '',
            unit: selectedActivity?.unitName || 'Sin unidad',
            unitId: selectedActivity?.unitId || 0,
            quantity: 0,
            unitCost: selectedActivity?.unitCost || 0,
            totalCost: 0,
            costCalculationMode: this.selectedPhase?.isDefault ? CostCalculationMode.No : undefined,
            days: undefined,
            materials: [],
            extraCosts: []
        };
        
        this.currentEmployeesList.push(newEmployee);
        this.isEditingEmployee = true;
        this.currentEmployeeIndex = this.currentEmployeesList.length - 1;
        this.selectedEmployeeForEdit = { ...newEmployee };
    }
    
    // Editar empleado desde la tabla (en modal principal)
    editEmployeeFromTable(index: number) {
        const actualIndex = this.employeesTableFirst + index;
        const list = this.workOrderDetailDialog ? this.workOrderEmployees : this.newWorkOrderEmployees;
        
        if (actualIndex >= 0 && actualIndex < list.length) {
            this.isEditingEmployee = true;
            this.currentEmployeeIndex = actualIndex;
            // Crear una copia profunda del empleado para editar
            const employee = list[actualIndex];
            this.selectedEmployeeForEdit = {
                ...employee,
                materials: employee.materials ? employee.materials.map((m: any) => ({ ...m })) : [],
                extraCosts: employee.extraCosts ? employee.extraCosts.map((ec: any) => ({ ...ec })) : []
            };
            this.employeesManagementDialog = true;
        }
    }
    
    // Guardar cambios del empleado editado
    saveEmployeeChanges() {
        // Validar que tenga empleado seleccionado
        if (!this.selectedEmployeeForEdit.employeeId || this.selectedEmployeeForEdit.employeeId === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'Debe seleccionar un empleado',
                life: 3000
            });
            return;
        }
        
        const list = this.workOrderDetailDialog ? this.workOrderEmployees : this.newWorkOrderEmployees;
        
        // Si tiene empleado seleccionado, actualizar nombre y posición
        if (this.selectedEmployeeForEdit.employeeId) {
            const employee = this.employees.find(emp => emp.id === this.selectedEmployeeForEdit.employeeId);
            if (employee) {
                this.selectedEmployeeForEdit.employeeName = `${employee.firstName} ${employee.lastName}`;
                this.selectedEmployeeForEdit.position = employee.positionName || '';
            }
        }
        
        // Si tiene región/lote seleccionado, actualizar nombre
        if (this.selectedEmployeeForEdit.regionLotId) {
            const regionLot = this.regionLots.find(rl => rl.id === this.selectedEmployeeForEdit.regionLotId);
            if (regionLot) {
                this.selectedEmployeeForEdit.regionLotName = regionLot.name;
            }
        }
        
        // Recalcular total del empleado
        const workCost = (this.selectedEmployeeForEdit.quantity || 0) * (this.selectedEmployeeForEdit.unitCost || 0);
        const materialsCost = (this.selectedEmployeeForEdit.materials || []).reduce((sum: number, mat: any) => {
            return sum + ((mat.quantity || 0) * (mat.unitCost || 0));
        }, 0);
        const extraCostsCost = (this.selectedEmployeeForEdit.extraCosts || []).reduce((sum: number, ec: any) => {
            return sum + ((ec.quantity || 0) * (ec.unitCost || 0));
        }, 0);
        this.selectedEmployeeForEdit.totalCost = workCost + materialsCost + extraCostsCost;
        
        if (this.currentEmployeeIndex >= 0) {
            // Editar empleado existente
            list[this.currentEmployeeIndex] = { ...this.selectedEmployeeForEdit };
            this.messageService.add({
                severity: 'success',
                summary: 'Empleado Actualizado',
                detail: 'Los cambios del empleado han sido guardados',
                life: 3000
            });
        } else {
            // Agregar nuevo empleado
            list.push({ ...this.selectedEmployeeForEdit });
            this.messageService.add({
                severity: 'success',
                summary: 'Empleado Agregado',
                detail: 'El empleado ha sido agregado a la orden',
                life: 3000
            });
        }
        
        // Cerrar modal
        this.closeEmployeesManagementDialog();
    }
    
    
    // Eliminar empleado desde la tabla (en modal principal)
    removeEmployeeFromTable(index: number) {
        const actualIndex = this.employeesTableFirst + index;
        const list = this.workOrderDetailDialog ? this.workOrderEmployees : this.newWorkOrderEmployees;
        
        if (actualIndex >= 0 && actualIndex < list.length) {
            const employee = list[actualIndex];
            const employeeName = employee.employeeName || 'este empleado';
            
            this.confirmationService.confirm({
                message: `¿Está seguro de eliminar a ${employeeName} de la orden?`,
                header: 'Confirmar Eliminación',
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    list.splice(actualIndex, 1);
                    
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Empleado Eliminado',
                        detail: 'El empleado ha sido eliminado de la orden',
                        life: 3000
                    });
                }
            });
        }
    }
    
    // Recalcular total de un empleado
    recalculateEmployeeTotal(index: number) {
        const employee = this.currentEmployeesList[index];
        if (!employee) return;
        
        // Calcular costo de trabajo
        const workCost = (employee.quantity || 0) * (employee.unitCost || 0);
        
        // Calcular costo de materiales
        const materialsCost = (employee.materials || []).reduce((sum: number, mat: any) => {
            return sum + ((mat.quantity || 0) * (mat.unitCost || 0));
        }, 0);
        
        // Calcular costo de costos extra
        const extraCostsCost = (employee.extraCosts || []).reduce((sum: number, ec: any) => {
            return sum + ((ec.quantity || 0) * (ec.unitCost || 0));
        }, 0);
        
        employee.totalCost = workCost + materialsCost + extraCostsCost;
    }
    
    // Método legacy para compatibilidad (ahora abre el modal)
    addEmployee() {
        this.openEmployeesManagementDialog();
    }
    
    // Método legacy para compatibilidad
    removeEmployee(index: number) {
        this.workOrderEmployees.splice(index, 1);
    }

    onEmployeeSelected(index: number, employeeId: number) {
        const employee = this.employees.find(emp => emp.id === employeeId);
        if (employee) {
            this.workOrderEmployees[index].employeeId = employeeId;
            this.workOrderEmployees[index].employeeName = `${employee.firstName} ${employee.lastName}`;
            this.workOrderEmployees[index].position = employee.positionName || '';
        }
    }

    onRegionLotSelected(index: number, regionLotId: number) {
        const regionLot = this.regionLots.find(rl => rl.id === regionLotId);
        if (regionLot) {
            this.workOrderEmployees[index].regionLotId = regionLotId;
            this.workOrderEmployees[index].regionLotName = regionLot.name;
        }
    }

    // Métodos para manejar región/lote de la orden de trabajo
    onNewWorkOrderRegionLotSelectedForOrder(regionLotId: number) {
        const regionLot = this.regionLots.find(rl => rl.id === regionLotId);
        if (regionLot) {
            this.newWorkOrderRegionLot = regionLot;
            this.newWorkOrder.regionLotId = regionLotId;
        }
    }

    onWorkOrderRegionLotSelected(regionLotId: number) {
        const regionLot = this.regionLots.find(rl => rl.id === regionLotId);
        if (regionLot) {
            this.selectedRegionLot = regionLot;
            if (this.selectedWorkOrder) {
                this.selectedWorkOrder.regionLotId = regionLotId;
            }
        }
    }

    onQuantityChanged(index: number) {
        const emp = this.workOrderEmployees[index];
        // Recalcular según el modo de cálculo si es fase Cosecha
        emp.totalCost = this.calculateEmployeeWorkCost(emp);
    }

    onCostCalculationModeChanged(index: number) {
        const emp = this.newWorkOrderEmployees[index];
        // Recalcular cuando cambia el modo de cálculo
        emp.totalCost = this.calculateNewWorkOrderEmployeeWorkCost(emp);
    }

    onCostCalculationModeChangedDetails(index: number) {
        const emp = this.workOrderEmployees[index];
        // Recalcular cuando cambia el modo de cálculo
        emp.totalCost = this.calculateEmployeeWorkCost(emp);
    }

    onDaysChanged(index: number) {
        const emp = this.newWorkOrderEmployees[index];
        // Recalcular cuando cambian los días
        emp.totalCost = this.calculateNewWorkOrderEmployeeWorkCost(emp);
    }

    onDaysChangedDetails(index: number) {
        const emp = this.workOrderEmployees[index];
        // Recalcular cuando cambian los días
        emp.totalCost = this.calculateEmployeeWorkCost(emp);
    }

    get costCalculationModeOptions() {
        return [
            { label: 'No', value: CostCalculationMode.No },
            { label: 'Solo aplicar por el costo por día', value: CostCalculationMode.OnlyDailyCost },
            { label: 'Combinar', value: CostCalculationMode.Combine }
        ];
    }

    // Exponer el enum para usar en el template
    CostCalculationMode = CostCalculationMode;

    // Helper para convertir nombre de status a statusId
    getStatusIdFromName(statusName: string): number {
        if (!statusName) return 1;
        const normalized = statusName.trim();
        switch (normalized) {
            case 'Pendiente':
                return 1;
            case 'En Progreso':
                return 2;
            case 'Completada':
                return 3;
            case 'Cancelada':
                return 4;
            default:
                return 1; // Por defecto Pendiente
        }
    }

    // Helper para convertir statusId a nombre de status
    getStatusNameFromId(statusId: number): string {
        switch (statusId) {
            case 1:
                return 'Pendiente';
            case 2:
                return 'En Progreso';
            case 3:
                return 'Completada';
            case 4:
                return 'Cancelada';
            default:
                return 'Pendiente';
        }
    }

    // Handler para cuando cambia el status en nueva orden
    onNewWorkOrderStatusChanged(statusName: string) {
        this.newWorkOrder.statusId = this.getStatusIdFromName(statusName);
    }

    // Handler para cuando cambia el status en detalles de orden
    onWorkOrderStatusChanged(statusName: string) {
        // El setter selectedWorkOrderStatus ya actualiza el statusId, pero lo hacemos explícito por si acaso
        if (this.selectedWorkOrder) {
            this.selectedWorkOrder.statusId = this.getStatusIdFromName(statusName);
        }
    }

    addMaterial(employeeIndex: number) {
        this.workOrderEmployees[employeeIndex].materials.push({
            productId: 0,
            materialName: '',
            unit: 'Sin unidad',
            quantity: 0,
            unitCost: 0,
            totalCost: 0
        });
    }

    onMaterialSelected(employeeIndex: number, materialIndex: number, productId: number) {
        const material = this.materials.find(mat => mat.id === productId);
        if (material) {
            this.workOrderEmployees[employeeIndex].materials[materialIndex].productId = productId;
            this.workOrderEmployees[employeeIndex].materials[materialIndex].materialName = material.name;
            this.workOrderEmployees[employeeIndex].materials[materialIndex].unit = material.unitName || 'Sin unidad';
            this.workOrderEmployees[employeeIndex].materials[materialIndex].unitCost = material.cost || 0;
            this.workOrderEmployees[employeeIndex].materials[materialIndex].unitId = material.unitId;
            
            // Recalcular subtotal
            this.workOrderEmployees[employeeIndex].materials[materialIndex].subtotal = 
                (this.workOrderEmployees[employeeIndex].materials[materialIndex].quantity || 0) * 
                (this.workOrderEmployees[employeeIndex].materials[materialIndex].unitCost || 0);
            
            console.log('📦 Material seleccionado en detalles:', material, 'Costo aplicado:', material.cost, 'UnitId:', material.unitId);
        }
    }

    calculateMaterialSubtotal(employeeIndex: number, materialIndex: number): number {
        const material = this.workOrderEmployees[employeeIndex].materials[materialIndex];
        return (material.quantity || 0) * (material.unitCost || 0);
    }

    removeMaterial(employeeIndex: number, materialIndex: number) {
        this.workOrderEmployees[employeeIndex].materials.splice(materialIndex, 1);
    }

    addExtraCost(employeeIndex: number) {
        this.workOrderEmployees[employeeIndex].extraCosts.push({
            extraCostId: 0,
            extraCostName: '',
            unit: 'Sin unidad',
            quantity: 0,
            unitCost: 0,
            totalCost: 0
        });
    }

    onExtraCostSelected(employeeIndex: number, extraCostIndex: number, extraCostId: number) {
        const extraCost = this.extraCosts.find(ec => ec.id === extraCostId);
        if (extraCost) {
            this.workOrderEmployees[employeeIndex].extraCosts[extraCostIndex].extraCostId = extraCostId;
            this.workOrderEmployees[employeeIndex].extraCosts[extraCostIndex].extraCostName = extraCost.name;
            this.workOrderEmployees[employeeIndex].extraCosts[extraCostIndex].unit = extraCost.unitName || 'Sin unidad';
            this.workOrderEmployees[employeeIndex].extraCosts[extraCostIndex].unitCost = extraCost.unitCost || 0;
            this.workOrderEmployees[employeeIndex].extraCosts[extraCostIndex].unitId = extraCost.unitId;
            
            // Recalcular subtotal
            this.workOrderEmployees[employeeIndex].extraCosts[extraCostIndex].subtotal = 
                (this.workOrderEmployees[employeeIndex].extraCosts[extraCostIndex].quantity || 0) * 
                (this.workOrderEmployees[employeeIndex].extraCosts[extraCostIndex].unitCost || 0);
            
            console.log('💰 Costo extra seleccionado en detalles:', extraCost, 'Costo aplicado:', extraCost.unitCost, 'UnitId:', extraCost.unitId);
        }
    }

    calculateExtraCostSubtotal(employeeIndex: number, extraCostIndex: number): number {
        const extraCost = this.workOrderEmployees[employeeIndex].extraCosts[extraCostIndex];
        return (extraCost.quantity || 0) * (extraCost.unitCost || 0);
    }

    removeExtraCost(employeeIndex: number, extraCostIndex: number) {
        this.workOrderEmployees[employeeIndex].extraCosts.splice(extraCostIndex, 1);
    }

    // Métodos para materiales globales en edición
    addGlobalMaterial() {
        this.workOrderGlobalMaterials.push({
            productId: 0,
            materialName: '',
            unit: 'Sin unidad',
            unitId: 0,
            quantity: 0,
            unitCost: 0,
            totalCost: 0
        });
    }

    onGlobalMaterialSelected(materialIndex: number, productId: number) {
        const material = this.materials.find(mat => mat.id === productId);
        if (material) {
            this.workOrderGlobalMaterials[materialIndex].productId = productId;
            this.workOrderGlobalMaterials[materialIndex].materialName = material.name;
            this.workOrderGlobalMaterials[materialIndex].unit = material.unitName || 'Sin unidad';
            this.workOrderGlobalMaterials[materialIndex].unitCost = material.cost || 0;
            this.workOrderGlobalMaterials[materialIndex].unitId = material.unitId;
            this.workOrderGlobalMaterials[materialIndex].totalCost = 
                (this.workOrderGlobalMaterials[materialIndex].quantity || 0) * 
                (this.workOrderGlobalMaterials[materialIndex].unitCost || 0);
        }
    }

    calculateGlobalMaterialTotal(materialIndex: number): number {
        const material = this.workOrderGlobalMaterials[materialIndex];
        return (material.quantity || 0) * (material.unitCost || 0);
    }

    removeGlobalMaterial(materialIndex: number) {
        this.workOrderGlobalMaterials.splice(materialIndex, 1);
    }

    // Métodos para costos extra globales en edición
    addGlobalExtraCost() {
        this.workOrderGlobalExtraCosts.push({
            extraCostId: 0,
            extraCostName: '',
            unit: 'Sin unidad',
            unitId: 0,
            quantity: 0,
            unitCost: 0,
            totalCost: 0
        });
    }

    onGlobalExtraCostSelected(extraCostIndex: number, extraCostId: number) {
        const extraCost = this.extraCosts.find(ec => ec.id === extraCostId);
        if (extraCost) {
            this.workOrderGlobalExtraCosts[extraCostIndex].extraCostId = extraCostId;
            this.workOrderGlobalExtraCosts[extraCostIndex].extraCostName = extraCost.name;
            this.workOrderGlobalExtraCosts[extraCostIndex].unit = extraCost.unitName || 'Sin unidad';
            this.workOrderGlobalExtraCosts[extraCostIndex].unitCost = extraCost.unitCost || 0;
            this.workOrderGlobalExtraCosts[extraCostIndex].unitId = extraCost.unitId;
            this.workOrderGlobalExtraCosts[extraCostIndex].totalCost = 
                (this.workOrderGlobalExtraCosts[extraCostIndex].quantity || 0) * 
                (this.workOrderGlobalExtraCosts[extraCostIndex].unitCost || 0);
        }
    }

    calculateGlobalExtraCostTotal(extraCostIndex: number): number {
        const extraCost = this.workOrderGlobalExtraCosts[extraCostIndex];
        return (extraCost.quantity || 0) * (extraCost.unitCost || 0);
    }

    removeGlobalExtraCost(extraCostIndex: number) {
        this.workOrderGlobalExtraCosts.splice(extraCostIndex, 1);
    }

    calculateEmployeeWorkCost(employee: any): number {
        // Solo aplicar lógica especial si es fase Cosecha
        if (this.selectedPhase?.isDefault && employee.costCalculationMode !== undefined) {
            const selectedActivity = this.activities.find(act => act.id === (this.selectedWorkOrder?.activityId || this.newWorkOrder.activityId));
            const mode = employee.costCalculationMode ?? CostCalculationMode.No;
            const days = employee.days || 0;
            const dailyActivityCost = selectedActivity?.dailyActivityCost || 0;
            
            switch (mode) {
                case CostCalculationMode.No:
                    // Funciona como está actualmente
                    return (employee.quantity || 0) * (employee.unitCost || 0);
                case CostCalculationMode.OnlyDailyCost:
                    // Solo costo por día: días * costo diario
                    return days * dailyActivityCost;
                case CostCalculationMode.Combine:
                    // Combinar ambos: (cantidad * costo unitario) + (días * costo diario)
                    return ((employee.quantity || 0) * (employee.unitCost || 0)) + (days * dailyActivityCost);
                default:
                    return (employee.quantity || 0) * (employee.unitCost || 0);
            }
        }
        // Otras fases: funciona como está actualmente
        return (employee.quantity || 0) * (employee.unitCost || 0);
    }

    calculateEmployeeMaterialsCost(employee: any): number {
        return employee.materials?.reduce((total: number, material: any) => 
            total + ((material.quantity || 0) * (material.unitCost || 0)), 0) || 0;
    }

    calculateEmployeeExtraCostsCost(employee: any): number {
        return employee.extraCosts?.reduce((total: number, extraCost: any) => 
            total + ((extraCost.quantity || 0) * (extraCost.unitCost || 0)), 0) || 0;
    }

    calculateEmployeeTotal(employee: any): number {
        return this.calculateEmployeeWorkCost(employee) + 
               this.calculateEmployeeMaterialsCost(employee) +
               this.calculateEmployeeExtraCostsCost(employee);
    }
    
    // Métodos para calcular totales de todos los empleados
    calculateTotalEmployeesWorkCost(): number {
        const list = this.workOrderDetailDialog ? this.workOrderEmployees : this.newWorkOrderEmployees;
        return list.reduce((total, emp) => total + this.calculateEmployeeWorkCost(emp), 0);
    }
    
    calculateTotalEmployeesMaterialsCost(): number {
        const list = this.workOrderDetailDialog ? this.workOrderEmployees : this.newWorkOrderEmployees;
        return list.reduce((total, emp) => total + this.calculateEmployeeMaterialsCost(emp), 0);
    }
    
    calculateTotalEmployeesExtraCostsCost(): number {
        const list = this.workOrderDetailDialog ? this.workOrderEmployees : this.newWorkOrderEmployees;
        return list.reduce((total, emp) => total + this.calculateEmployeeExtraCostsCost(emp), 0);
    }
    
    calculateTotalEmployeesCost(): number {
        const list = this.workOrderDetailDialog ? this.workOrderEmployees : this.newWorkOrderEmployees;
        return list.reduce((total, emp) => total + this.calculateEmployeeTotal(emp), 0);
    }
    
    // Expandir/colapsar fila de empleado
    toggleEmployeeRow(employeeIndex: number) {
        const actualIndex = this.employeesTableFirst + employeeIndex;
        this.expandedRows[actualIndex] = !this.expandedRows[actualIndex];
    }
    
    isRowExpanded(employeeIndex: number): boolean {
        const actualIndex = this.employeesTableFirst + employeeIndex;
        return !!this.expandedRows[actualIndex];
    }
    
    // Agregar material a empleado desde la tabla
    addMaterialToEmployee(employeeIndex: number) {
        const actualIndex = this.employeesTableFirst + employeeIndex;
        if (actualIndex >= 0 && actualIndex < this.currentEmployeesList.length) {
            const employee = this.currentEmployeesList[actualIndex];
            if (!employee.materials) {
                employee.materials = [];
            }
            employee.materials.push({
                productId: 0,
                materialName: '',
                unit: 'Sin unidad',
                quantity: 0,
                unitCost: 0,
                unitId: 0,
                subtotal: 0
            });
            // Expandir la fila si no está expandida
            this.expandedRows[actualIndex] = true;
        }
    }
    
    // Agregar costo extra a empleado desde la tabla
    addExtraCostToEmployee(employeeIndex: number) {
        const actualIndex = this.employeesTableFirst + employeeIndex;
        if (actualIndex >= 0 && actualIndex < this.currentEmployeesList.length) {
            const employee = this.currentEmployeesList[actualIndex];
            if (!employee.extraCosts) {
                employee.extraCosts = [];
            }
            employee.extraCosts.push({
                extraCostId: 0,
                extraCostName: '',
                unit: 'Sin unidad',
                quantity: 0,
                unitCost: 0,
                unitId: 0,
                subtotal: 0
            });
            // Expandir la fila si no está expandida
            this.expandedRows[actualIndex] = true;
        }
    }
    
    // Seleccionar material para empleado
    onMaterialSelectedForEmployee(employeeIndex: number, materialIndex: number, productId: number) {
        const actualIndex = this.employeesTableFirst + employeeIndex;
        if (actualIndex >= 0 && actualIndex < this.currentEmployeesList.length) {
            const material = this.materials.find(mat => mat.id === productId);
            if (material) {
                const employee = this.currentEmployeesList[actualIndex];
                employee.materials[materialIndex].productId = productId;
                employee.materials[materialIndex].materialName = material.name;
                employee.materials[materialIndex].unit = material.unitName || 'Sin unidad';
                employee.materials[materialIndex].unitCost = material.cost || 0;
                employee.materials[materialIndex].unitId = material.unitId;
                
                // Recalcular subtotal
                employee.materials[materialIndex].subtotal = 
                    (employee.materials[materialIndex].quantity || 0) * 
                    (employee.materials[materialIndex].unitCost || 0);
                
                // Recalcular total del empleado
                this.recalculateEmployeeTotal(actualIndex);
            }
        }
    }
    
    // Seleccionar costo extra para empleado
    onExtraCostSelectedForEmployee(employeeIndex: number, extraCostIndex: number, extraCostId: number) {
        const actualIndex = this.employeesTableFirst + employeeIndex;
        if (actualIndex >= 0 && actualIndex < this.currentEmployeesList.length) {
            const extraCost = this.extraCosts.find(ec => ec.id === extraCostId);
            if (extraCost) {
                const employee = this.currentEmployeesList[actualIndex];
                employee.extraCosts[extraCostIndex].extraCostId = extraCostId;
                employee.extraCosts[extraCostIndex].extraCostName = extraCost.name;
                employee.extraCosts[extraCostIndex].unit = extraCost.unitName || 'Sin unidad';
                employee.extraCosts[extraCostIndex].unitCost = extraCost.unitCost || 0;
                employee.extraCosts[extraCostIndex].unitId = extraCost.unitId;
                
                // Recalcular subtotal
                employee.extraCosts[extraCostIndex].subtotal = 
                    (employee.extraCosts[extraCostIndex].quantity || 0) * 
                    (employee.extraCosts[extraCostIndex].unitCost || 0);
                
                // Recalcular total del empleado
                this.recalculateEmployeeTotal(actualIndex);
            }
        }
    }
    
    // Calcular subtotal de material
    calculateMaterialSubtotalForEmployee(employeeIndex: number, materialIndex: number): number {
        const actualIndex = this.employeesTableFirst + employeeIndex;
        if (actualIndex >= 0 && actualIndex < this.currentEmployeesList.length) {
            const material = this.currentEmployeesList[actualIndex].materials[materialIndex];
            if (material) {
                const subtotal = (material.quantity || 0) * (material.unitCost || 0);
                material.subtotal = subtotal;
                // Recalcular total del empleado
                this.recalculateEmployeeTotal(actualIndex);
                return subtotal;
            }
        }
        return 0;
    }
    
    // Calcular subtotal de costo extra
    calculateExtraCostSubtotalForEmployee(employeeIndex: number, extraCostIndex: number): number {
        const actualIndex = this.employeesTableFirst + employeeIndex;
        if (actualIndex >= 0 && actualIndex < this.currentEmployeesList.length) {
            const extraCost = this.currentEmployeesList[actualIndex].extraCosts[extraCostIndex];
            if (extraCost) {
                const subtotal = (extraCost.quantity || 0) * (extraCost.unitCost || 0);
                extraCost.subtotal = subtotal;
                // Recalcular total del empleado
                this.recalculateEmployeeTotal(actualIndex);
                return subtotal;
            }
        }
        return 0;
    }
    
    // Eliminar material de empleado
    removeMaterialFromEmployee(employeeIndex: number, materialIndex: number) {
        const actualIndex = this.employeesTableFirst + employeeIndex;
        if (actualIndex >= 0 && actualIndex < this.currentEmployeesList.length) {
            this.currentEmployeesList[actualIndex].materials.splice(materialIndex, 1);
            this.recalculateEmployeeTotal(actualIndex);
        }
    }
    
    // Eliminar costo extra de empleado
    removeExtraCostFromEmployee(employeeIndex: number, extraCostIndex: number) {
        const actualIndex = this.employeesTableFirst + employeeIndex;
        if (actualIndex >= 0 && actualIndex < this.currentEmployeesList.length) {
            this.currentEmployeesList[actualIndex].extraCosts.splice(extraCostIndex, 1);
            this.recalculateEmployeeTotal(actualIndex);
        }
    }
    
    // Métodos para manejar materiales y costos extra en el formulario del modal
    addMaterialToEmployeeForm() {
        if (!this.selectedEmployeeForEdit.materials) {
            this.selectedEmployeeForEdit.materials = [];
        }
        this.selectedEmployeeForEdit.materials.push({
            productId: 0,
            materialName: '',
            unit: 'Sin unidad',
            quantity: 0,
            unitCost: 0,
            unitId: 0,
            subtotal: 0
        });
    }
    
    addExtraCostToEmployeeForm() {
        if (!this.selectedEmployeeForEdit.extraCosts) {
            this.selectedEmployeeForEdit.extraCosts = [];
        }
        this.selectedEmployeeForEdit.extraCosts.push({
            extraCostId: 0,
            extraCostName: '',
            unit: 'Sin unidad',
            quantity: 0,
            unitCost: 0,
            unitId: 0,
            subtotal: 0
        });
    }
    
    onMaterialSelectedForEmployeeForm(materialIndex: number, productId: number) {
        const material = this.materials.find(mat => mat.id === productId);
        if (material && this.selectedEmployeeForEdit.materials) {
            this.selectedEmployeeForEdit.materials[materialIndex].productId = productId;
            this.selectedEmployeeForEdit.materials[materialIndex].materialName = material.name;
            this.selectedEmployeeForEdit.materials[materialIndex].unit = material.unitName || 'Sin unidad';
            this.selectedEmployeeForEdit.materials[materialIndex].unitCost = material.cost || 0;
            this.selectedEmployeeForEdit.materials[materialIndex].unitId = material.unitId;
            
            // Recalcular subtotal
            this.calculateMaterialSubtotalForEmployeeForm(materialIndex);
        }
    }
    
    onExtraCostSelectedForEmployeeForm(extraCostIndex: number, extraCostId: number) {
        const extraCost = this.extraCosts.find(ec => ec.id === extraCostId);
        if (extraCost && this.selectedEmployeeForEdit.extraCosts) {
            this.selectedEmployeeForEdit.extraCosts[extraCostIndex].extraCostId = extraCostId;
            this.selectedEmployeeForEdit.extraCosts[extraCostIndex].extraCostName = extraCost.name;
            this.selectedEmployeeForEdit.extraCosts[extraCostIndex].unit = extraCost.unitName || 'Sin unidad';
            this.selectedEmployeeForEdit.extraCosts[extraCostIndex].unitCost = extraCost.unitCost || 0;
            this.selectedEmployeeForEdit.extraCosts[extraCostIndex].unitId = extraCost.unitId;
            
            // Recalcular subtotal
            this.calculateExtraCostSubtotalForEmployeeForm(extraCostIndex);
        }
    }
    
    calculateMaterialSubtotalForEmployeeForm(materialIndex: number): number {
        if (!this.selectedEmployeeForEdit.materials || !this.selectedEmployeeForEdit.materials[materialIndex]) {
            return 0;
        }
        const material = this.selectedEmployeeForEdit.materials[materialIndex];
        const subtotal = (material.quantity || 0) * (material.unitCost || 0);
        material.subtotal = subtotal;
        return subtotal;
    }
    
    calculateExtraCostSubtotalForEmployeeForm(extraCostIndex: number): number {
        if (!this.selectedEmployeeForEdit.extraCosts || !this.selectedEmployeeForEdit.extraCosts[extraCostIndex]) {
            return 0;
        }
        const extraCost = this.selectedEmployeeForEdit.extraCosts[extraCostIndex];
        const subtotal = (extraCost.quantity || 0) * (extraCost.unitCost || 0);
        extraCost.subtotal = subtotal;
        return subtotal;
    }
    
    removeMaterialFromEmployeeForm(materialIndex: number) {
        if (this.selectedEmployeeForEdit.materials) {
            this.selectedEmployeeForEdit.materials.splice(materialIndex, 1);
        }
    }
    
    removeExtraCostFromEmployeeForm(extraCostIndex: number) {
        if (this.selectedEmployeeForEdit.extraCosts) {
            this.selectedEmployeeForEdit.extraCosts.splice(extraCostIndex, 1);
        }
    }

    saveWorkOrderDetails() {
        this.submitted = true;
        
        if (!this.selectedWorkOrder) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No hay orden de trabajo seleccionada',
                life: 3000
            });
            return;
        }

        // Mapear empleados
            const workOrderData: WorkOrderDto = {
            name: this.selectedWorkOrder.name,
            description: this.selectedWorkOrder.description,
            customDate: this.selectedWorkOrder.customDate, // Nueva fecha personalizada
            status: this.selectedWorkOrder.status,
            statusId: this.selectedWorkOrder.statusId || this.getStatusIdFromName(this.selectedWorkOrder.status), // Agregar statusId
            totalCost: this.calculateTotalCost(),
            biologicalProductPhaseId: this.selectedPhase!.id,
            activityId: this.selectedWorkOrder.activityId,
            regionLotId: this.selectedWorkOrder.regionLotId,
            employees: this.workOrderEmployees.map(emp => ({
                employeeId: emp.employeeId,
                    regionLotId: emp.regionLotId,
                    quantity: emp.quantity,
                    unitCost: emp.unitCost,
                    totalCost: emp.totalCost,
                    unitId: emp.unitId,
                    costCalculationMode: typeof emp.costCalculationMode === 'number' ? emp.costCalculationMode : (emp.costCalculationMode !== undefined ? CostCalculationMode[emp.costCalculationMode as keyof typeof CostCalculationMode] : undefined), // Asegurar que sea número
                    days: emp.days,
                    materials: emp.materials.map((mat: any) => ({
                    productId: mat.productId,
                        quantity: mat.quantity,
                    unitCost: mat.unitCost,
                    unitId: mat.unitId
                    })),
                    extraCosts: emp.extraCosts.map((ec: any) => ({
                    extraCostId: ec.extraCostId,
                        quantity: ec.quantity,
                    unitCost: ec.unitCost,
                    unitId: ec.unitId
                    }))
                })),
            globalMaterials: this.workOrderGlobalMaterials.map((mat: any) => ({
                productId: mat.productId,
                quantity: mat.quantity,
                unitCost: mat.unitCost,
                unitId: mat.unitId,
                totalCost: (mat.quantity || 0) * (mat.unitCost || 0)
            })),
            globalExtraCosts: this.workOrderGlobalExtraCosts.map((ec: any) => ({
                extraCostId: ec.extraCostId,
                quantity: ec.quantity,
                unitCost: ec.unitCost,
                unitId: ec.unitId,
                totalCost: (ec.quantity || 0) * (ec.unitCost || 0)
            }))
            };
            debugger;
        if ((this.selectedWorkOrder as any).id) {
            // Update existing work order
            this.workOrderService.update((this.selectedWorkOrder as any).id, workOrderData).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: response.message || 'Orden de trabajo actualizada',
                            life: 3000
                        });
                        this.hideWorkOrderDetailDialog();
                        this.loadWorkOrders(this.selectedPhase!.id);
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: response.message || 'Error al actualizar orden de trabajo',
                            life: 3000
                        });
                    }
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error de conexión al actualizar orden de trabajo',
                        life: 3000
                    });
                    console.error('Error updating work order:', error);
                }
            });
        } else {
            // Create new work order
            this.workOrderService.create(workOrderData).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: response.message || 'Orden de trabajo creada',
                            life: 3000
                        });
                        this.hideWorkOrderDetailDialog();
                        this.loadWorkOrders(this.selectedPhase!.id);
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: response.message || 'Error al crear orden de trabajo',
                            life: 3000
                        });
                    }
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error de conexión al crear orden de trabajo',
                        life: 3000
                    });
                    console.error('Error creating work order:', error);
                }
            });
        }
    }
    }