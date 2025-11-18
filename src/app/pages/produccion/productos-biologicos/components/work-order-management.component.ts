import { Component, EventEmitter, Input, Output, OnInit, OnChanges, signal } from '@angular/core';
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
        ConfirmDialogModule
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
    newWorkOrderDialog: boolean = false;
    workOrderDetailDialog: boolean = false;
    workOrderSubmitted: boolean = false;
    submitted: boolean = false;

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
            
            console.log('✅ Costos y unidades aplicados a empleados:', this.newWorkOrderEmployees);
        }
    }

    addNewWorkOrderEmployee() {
        // Buscar la actividad seleccionada para aplicar sus costos y unidad
        const selectedActivity = this.activities.find(act => act.id === this.newWorkOrder.activityId);
        
        const newEmployee = {
            employeeId: 0,
            employeeName: '',
            position: '',
            regionLotId: 0,
            regionLotName: '',
            unit: selectedActivity?.unitName || 'Sin unidad',
            quantity: 0,
            unitCost: selectedActivity?.unitCost || 0,
            totalCost: 0,
            costCalculationMode: this.selectedPhase?.isDefault ? CostCalculationMode.No : undefined, // Solo para fase Cosecha
            days: undefined, // Número de días (solo para fase Cosecha con OnlyDailyCost o Combine)
            materials: [],
            extraCosts: []
        };
        
        this.newWorkOrderEmployees.push(newEmployee);
        console.log('👤 Nuevo empleado agregado con datos de actividad:', newEmployee);
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

    addEmployee() {
        // Buscar la actividad seleccionada para aplicar sus costos y unidad
        const selectedActivity = this.activities.find(act => act.id === this.selectedWorkOrderActivityId);
        
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
            costCalculationMode: this.selectedPhase?.isDefault ? CostCalculationMode.No : undefined, // Solo para fase Cosecha
            days: undefined, // Número de días (solo para fase Cosecha con OnlyDailyCost o Combine)
            materials: [],
            extraCosts: []
        };
        
        this.workOrderEmployees.push(newEmployee);
        console.log('👤 Nuevo empleado agregado en detalles con datos de actividad:', newEmployee);
    }

    onEmployeeSelected(index: number, employeeId: number) {
        const employee = this.employees.find(emp => emp.id === employeeId);
        if (employee) {
            this.workOrderEmployees[index].employeeId = employeeId;
            this.workOrderEmployees[index].employeeName = `${employee.firstName} ${employee.lastName}`;
            this.workOrderEmployees[index].position = employee.positionName || '';
        }
    }

    removeEmployee(index: number) {
        this.workOrderEmployees.splice(index, 1);
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