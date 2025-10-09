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
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TreeTableModule } from 'primeng/treetable';
import { SelectModule } from 'primeng/select';
import { BiologicalProductService } from '../services/biological-product.service';
import { BiologicalPhaseService, BiologicalPhaseResponseDto, BiologicalPhaseDto } from '../services/biological-phase.service';
import { WorkOrderService, WorkOrderDto, WorkOrderResponseDto } from '../services/work-order.service';
import { BiologicalProductResponseDto, BiologicalProductDto } from '../models/biological-product.model';
import { EmployeeService } from '../../../rh/employee/services/employee.service';
import { ActivityService } from '../../../rh/activity/services/activity.service';
import { ProductService } from '../../../inventario/productos/services/product.service';
import { ExtraCostService } from '../../costos-extra/services/extra-cost.service';
import { RegionLotService } from '../../regiones-lotes/services/region-lot.service';

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
    selector: 'app-biological-product-list',
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
        InputNumberModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        TreeTableModule,
        SelectModule
    ],
    templateUrl: './biological-product-list.component.html',
    providers: [MessageService, BiologicalProductService, BiologicalPhaseService, WorkOrderService, ConfirmationService]
})
export class BiologicalProductListComponent implements OnInit {
    biologicalProductDialog: boolean = false;
    phasesDialog: boolean = false;
    biologicalProducts = signal<BiologicalProductResponseDto[]>([]);
    biologicalProduct: BiologicalProductResponseDto = {} as BiologicalProductResponseDto;
    selectedBiologicalProducts!: BiologicalProductResponseDto[] | null;
    submitted: boolean = false;

    // Datos para el modal de fases
    phases: BiologicalPhaseResponseDto[] = [];
    selectedProduct: BiologicalProductResponseDto | null = null;
    
    // Datos para el modal de nueva fase
    newPhaseDialog: boolean = false;
    newPhase: BiologicalPhaseDto = {} as BiologicalPhaseDto;
    
    // Datos para edición de fase
    editingPhase: boolean = false;
    
    // Datos para órdenes de trabajo
    workOrdersDialog: boolean = false;
    selectedPhase: BiologicalPhaseResponseDto | null = null;
    workOrders: any[] = []; // TreeDemo data structure
    
    // Datos para nueva orden de trabajo
    newWorkOrderDialog: boolean = false;
    newWorkOrder: any = {};
    workOrderSubmitted: boolean = false;
    
    // Datos para modal detallado de orden de trabajo
    workOrderDetailDialog: boolean = false;
    selectedWorkOrder: any = null;
    workOrderEmployees: any[] = [];
    workOrderMaterials: any[] = [];
    workOrderExtraCosts: any[] = [];
    
    // Datos de referencia para empleados, materiales y costos
    employees: any[] = [];
    materials: any[] = [];
    extraCosts: any[] = [];
    activities: any[] = [];
    regionLots: any[] = [];
    
    // Filtros para búsquedas
    employeeFilter: string = '';
    activityFilter: string = '';
    materialFilter: string = '';
    extraCostFilter: string = '';
    
    // Listas filtradas
    filteredEmployees: any[] = [];
    filteredActivities: any[] = [];
    filteredMaterials: any[] = [];
    filteredExtraCosts: any[] = [];
    
    // Estas propiedades ya no se usan con p-dropdown

    @ViewChild('dt') dt!: Table;
    exportColumns!: ExportColumn[];
    cols!: Column[];

    constructor(
        private biologicalProductService: BiologicalProductService,
        private biologicalPhaseService: BiologicalPhaseService,
        private workOrderService: WorkOrderService,
        private employeeService: EmployeeService,
        private activityService: ActivityService,
        private productService: ProductService,
        private extraCostService: ExtraCostService,
        private regionLotService: RegionLotService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadBiologicalProducts();
        this.setupColumns();
    }

    loadBiologicalProducts() {
        this.biologicalProductService.getAll().subscribe({
            next: (data) => this.biologicalProducts.set(data),
            error: (error) => {
                console.error('Error loading biological products:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar productos biológicos',
                    life: 3000
                });
            }
        });
    }

    setupColumns() {
        this.cols = [
            { field: 'name', header: 'Nombre', customExportHeader: 'Nombre del Producto' },
            { field: 'sku', header: 'SKU' },
            { field: 'description', header: 'Descripción' },
            { field: 'price', header: 'Precio' },
            { field: 'stockQuantity', header: 'Stock' },
            { field: 'isActive', header: 'Estado' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.biologicalProduct = {
            name: '',
            description: '',
            sku: '',
            price: 0,
            stockQuantity: 0,
            isActive: true
        } as BiologicalProductResponseDto;
        this.submitted = false;
        this.biologicalProductDialog = true;
    }

    editBiologicalProduct(biologicalProduct: BiologicalProductResponseDto) {
        this.biologicalProduct = { ...biologicalProduct };
        this.biologicalProductDialog = true;
    }

    viewPhases(biologicalProduct: BiologicalProductResponseDto) {
        this.selectedProduct = biologicalProduct;
        this.loadPhases(biologicalProduct.id);
        this.phasesDialog = true;
    }

    loadPhases(productId: number) {
        this.biologicalPhaseService.getByProductId(productId).subscribe({
            next: (data) => this.phases = data,
            error: (error) => {
                console.error('Error loading phases:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar fases del producto',
                    life: 3000
                });
            }
        });
    }

    openNewPhase() {
        if (this.selectedProduct) {
            this.newPhase = {
                name: '',
                description: '',
                phaseDate: undefined,
                productId: this.selectedProduct.id,
                isActive: true
            };
            this.submitted = false;
            this.newPhaseDialog = true;
        }
    }

    savePhase() {
        this.submitted = true;

        if (this.newPhase.name?.trim() && this.selectedProduct) {
            if (this.editingPhase) {
                // Actualizar fase existente
                this.biologicalPhaseService.update(this.newPhase.id!, this.newPhase).subscribe({
                    next: () => {
                        this.loadPhases(this.selectedProduct!.id);
                        this.newPhaseDialog = false;
                        this.editingPhase = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Fase Actualizada',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al actualizar fase',
                            life: 3000
                        });
                        console.error('Error updating phase:', error);
                    }
                });
            } else {
                // Crear nueva fase
                this.biologicalPhaseService.create(this.newPhase).subscribe({
                    next: () => {
                        this.loadPhases(this.selectedProduct!.id);
                        this.newPhaseDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Fase Creada',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al crear fase',
                            life: 3000
                        });
                        console.error('Error creating phase:', error);
                    }
                });
            }
        }
    }

    hideNewPhaseDialog() {
        this.newPhaseDialog = false;
        this.submitted = false;
        this.editingPhase = false;
    }

    deleteSelectedBiologicalProducts() {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar los productos biológicos seleccionados?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const selectedIds = this.selectedBiologicalProducts?.map(bp => bp.id) || [];
                selectedIds.forEach(id => {
                    this.biologicalProductService.delete(id).subscribe({
                        next: () => {
                            this.loadBiologicalProducts();
                        },
                        error: (error) => {
                            console.error('Error deleting biological product:', error);
                        }
                    });
                });
                this.selectedBiologicalProducts = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Exitoso',
                    detail: 'Productos Biológicos Eliminados',
                    life: 3000
                });
            }
        });
    }

    hideDialog() {
        this.biologicalProductDialog = false;
        this.submitted = false;
    }

    hidePhasesDialog() {
        this.phasesDialog = false;
        this.selectedProduct = null;
        this.phases = [];
    }

    deleteBiologicalProduct(biologicalProduct: BiologicalProductResponseDto) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar el producto biológico "' + biologicalProduct.name + '"?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.biologicalProductService.delete(biologicalProduct.id).subscribe({
                    next: () => {
                        this.loadBiologicalProducts();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Producto Biológico Eliminado',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al eliminar producto biológico',
                            life: 3000
                        });
                        console.error('Error deleting biological product:', error);
                    }
                });
            }
        });
    }

    getSeverity(isActive: boolean) {
        return isActive ? 'success' : 'danger';
    }

    saveBiologicalProduct() {
        this.submitted = true;

        if (this.biologicalProduct.name?.trim() && this.biologicalProduct.sku?.trim()) {
            const biologicalProductData: BiologicalProductDto = {
                name: this.biologicalProduct.name,
                description: this.biologicalProduct.description,
                sku: this.biologicalProduct.sku,
                price: this.biologicalProduct.price,
                stockQuantity: this.biologicalProduct.stockQuantity,
                isActive: this.biologicalProduct.isActive
            };

            if (this.biologicalProduct.id) {
                // Update existing biological product
                this.biologicalProductService.update(this.biologicalProduct.id, biologicalProductData).subscribe({
                    next: () => {
                        this.loadBiologicalProducts();
                        this.biologicalProductDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Producto Biológico Actualizado',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al actualizar producto biológico',
                            life: 3000
                        });
                        console.error('Error updating biological product:', error);
                    }
                });
            } else {
                // Create new biological product
                this.biologicalProductService.create(biologicalProductData).subscribe({
                    next: () => {
                        this.loadBiologicalProducts();
                        this.biologicalProductDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Producto Biológico Creado',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al crear producto biológico',
                            life: 3000
                        });
                        console.error('Error creating biological product:', error);
                    }
                });
            }
        }
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    // Métodos para gestión de fases

    editPhase(phase: BiologicalPhaseResponseDto) {
        this.newPhase = {
            id: phase.id,
            name: phase.name,
            description: phase.description,
            phaseDate: phase.phaseDate,
            productId: phase.productId,
            isActive: phase.isActive
        };
        this.editingPhase = true;
        this.submitted = false;
        this.newPhaseDialog = true;
    }

    deletePhase(phase: BiologicalPhaseResponseDto) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar la fase "' + phase.name + '"?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.biologicalPhaseService.delete(phase.id).subscribe({
                    next: () => {
                        this.loadPhases(this.selectedProduct!.id);
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Fase Eliminada',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al eliminar fase',
                            life: 3000
                        });
                        console.error('Error deleting phase:', error);
                    }
                });
            }
        });
    }

    viewWorkOrders(phase: BiologicalPhaseResponseDto) {
        this.selectedPhase = phase;
        this.loadWorkOrders(phase.id);
        this.workOrdersDialog = true;
    }

    loadWorkOrders(phaseId: number) {
        this.workOrderService.getAll({ biologicalProductPhaseId: phaseId }).subscribe({
            next: (workOrders) => {
                // Convertir a formato TreeDemo
                this.workOrders = workOrders.map((order, index) => ({
                    key: order.id.toString(),
                    data: {
                        name: order.name,
                        description: order.description,
                        status: order.status,
                        startDate: order.startDate,
                        endDate: order.endDate,
                        totalCost: order.totalCost
                    },
                    children: []
                }));
            },
            error: (error) => {
                console.error('Error loading work orders:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar órdenes de trabajo',
                    life: 3000
                });
            }
        });
    }

    hideWorkOrdersDialog() {
        this.workOrdersDialog = false;
        this.selectedPhase = null;
        this.workOrders = [];
    }

    createWorkOrder() {
        this.newWorkOrder = {
            name: '',
            description: '',
            startDate: new Date(),
            endDate: new Date(),
            status: 'Pendiente',
            totalCost: 0
        };
        this.workOrderSubmitted = false;
        this.newWorkOrderDialog = true;
    }

    saveWorkOrder() {
        this.workOrderSubmitted = true;

        if (this.newWorkOrder.name?.trim() && this.selectedPhase) {
            const workOrderData: WorkOrderDto = {
                name: this.newWorkOrder.name,
                description: this.newWorkOrder.description,
                startDate: this.newWorkOrder.startDate,
                endDate: this.newWorkOrder.endDate,
                status: this.newWorkOrder.status,
                totalCost: this.newWorkOrder.totalCost,
                biologicalProductPhaseId: this.selectedPhase.id
            };

            this.workOrderService.create(workOrderData).subscribe({
                next: (createdOrder) => {
                    // Recargar las órdenes de trabajo
                    this.loadWorkOrders(this.selectedPhase!.id);
                    this.newWorkOrderDialog = false;
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Exitoso',
                        detail: 'Orden de Trabajo Creada',
                        life: 3000
                    });
                },
                error: (error) => {
                    console.error('Error creating work order:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error al crear orden de trabajo',
                        life: 3000
                    });
                }
            });
        }
    }

    hideNewWorkOrderDialog() {
        this.newWorkOrderDialog = false;
        this.workOrderSubmitted = false;
    }

    // Métodos para modal detallado de orden de trabajo
    openWorkOrderDetail(workOrder: any) {
        this.selectedWorkOrder = workOrder;
        this.workOrderDetailDialog = true;
        this.loadWorkOrderDetails(workOrder.id);
    }

    openNewWorkOrderDetail() {
        this.selectedWorkOrder = {
            id: null,
            name: '',
            description: '',
            startDate: new Date(),
            endDate: new Date(),
            status: 'Pendiente',
            totalCost: 0,
            phaseId: this.selectedPhase?.id
        };
        this.workOrderDetailDialog = true;
        this.workOrderEmployees = [];
        this.addEmployee(); // Agregar un empleado vacío por defecto
        this.loadReferenceData();
    }

    loadWorkOrderDetails(workOrderId: number) {
        this.workOrderService.getById(workOrderId).subscribe({
            next: (workOrder) => {
                // Cargar empleados de la orden
                this.workOrderEmployees = (workOrder as any).employees?.map((emp: any) => ({
                    employeeId: emp.employeeId,
                    employeeName: emp.employeeName || '',
                    position: emp.position || '',
                    regionLotId: emp.regionLotId,
                    regionLotName: emp.regionLotName || '',
                    activityId: emp.activityId,
                    activityName: emp.activityName || '',
                    unit: emp.unit || 'Sin unidad',
                    quantity: emp.quantity,
                    unitCost: emp.unitCost,
                    totalCost: emp.totalCost,
                    materials: emp.materials?.map((mat: any) => ({
                        productId: mat.productId,
                        materialName: mat.materialName || '',
                        quantity: mat.quantity,
                        unit: mat.unit || 'Sin unidad',
                        unitCost: mat.unitCost,
                        totalCost: mat.totalCost
                    })) || [],
                    extraCosts: emp.extraCosts?.map((ec: any) => ({
                        extraCostId: ec.extraCostId,
                        extraCostName: ec.extraCostName || '',
                        quantity: ec.quantity,
                        unit: ec.unit || 'Sin unidad',
                        unitCost: ec.unitCost,
                        totalCost: ec.totalCost
                    })) || []
                })) || [];
            },
            error: (error) => {
                console.error('Error loading work order details:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar detalles de la orden',
                    life: 3000
                });
            }
        });
        
        // Cargar datos de referencia
        this.loadReferenceData();
    }

    loadReferenceData() {
        // Cargar empleados
        this.loadEmployees();
        
        // Cargar actividades
        this.loadActivities();
        
        // Cargar materiales (productos de inventario)
        this.loadMaterials();
        
        // Cargar costos extra
        this.loadExtraCosts();
        
        // Cargar regiones/lotes
        this.loadRegionLots();
    }

    loadEmployees() {
        this.employeeService.getAll().subscribe({
            next: (data) => {
                this.employees = data.map(emp => ({
                    id: emp.id,
                    name: `${emp.firstName} ${emp.lastName}`,
                    position: emp.positionName || 'Sin posición'
                }));
            },
            error: (error) => {
                console.error('Error loading employees:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar empleados',
                    life: 3000
                });
            }
        });
    }

    loadActivities() {
        this.activityService.getAll().subscribe({
            next: (data) => {
                this.activities = data.map(act => ({
                    id: act.id,
                    name: act.name,
                    unit: 'Hora', // Por defecto, ya que no tenemos unitName en ActivityResponseDto
                    unitCost: act.unitCost || 0
                }));
            },
            error: (error) => {
                console.error('Error loading activities:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar actividades',
                    life: 3000
                });
            }
        });
    }

    loadMaterials() {
        this.productService.getAll().subscribe({
            next: (data) => {
                this.materials = data.map(prod => ({
                    id: prod.id,
                    name: prod.name,
                    unit: prod.unitName || 'Sin unidad',
                    unitCost: prod.cost || 0
                }));
            },
            error: (error) => {
                console.error('Error loading materials:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar materiales',
                    life: 3000
                });
            }
        });
    }

    loadExtraCosts() {
        this.extraCostService.getAll().subscribe({
            next: (data) => {
                this.extraCosts = data.map(ec => ({
                    id: ec.id,
                    name: ec.name,
                    unit: ec.unitName || 'Sin unidad',
                    unitCost: ec.unitCost || 0
                }));
            },
            error: (error) => {
                console.error('Error loading extra costs:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar costos extra',
                    life: 3000
                });
            }
        });
    }

    loadRegionLots() {
        this.regionLotService.getAll().subscribe({
            next: (data) => {
                this.regionLots = data.map(rl => ({
                    id: rl.id,
                    name: rl.name,
                    region: rl.region || '',
                    location: rl.location || ''
                }));
            },
            error: (error) => {
                console.error('Error loading region lots:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar regiones/lotes',
                    life: 3000
                });
            }
        });
    }

    hideWorkOrderDetailDialog() {
        this.workOrderDetailDialog = false;
        this.selectedWorkOrder = null;
        this.workOrderEmployees = [];
        this.workOrderMaterials = [];
        this.workOrderExtraCosts = [];
    }

    // Métodos para agregar empleados
    addEmployee() {
        const newEmployee = {
            employeeId: null,
            employeeName: '',
            position: '',
            regionLotId: null,
            regionLotName: '',
            activityId: null,
            activityName: '',
            unit: 'Sin unidad',
            quantity: 0,
            unitCost: 0,
            totalCost: 0,
            materials: [],
            extraCosts: []
        };
        this.workOrderEmployees.push(newEmployee);
    }

    removeEmployee(index: number) {
        this.workOrderEmployees.splice(index, 1);
    }

    // Métodos para agregar materiales
    addMaterial(employeeIndex: number) {
        const newMaterial = {
            productId: null,
            materialName: '',
            quantity: 0,
            unit: 'Sin unidad',
            unitCost: 0,
            totalCost: 0
        };
        this.workOrderEmployees[employeeIndex].materials.push(newMaterial);
    }

    removeMaterial(employeeIndex: number, materialIndex: number) {
        this.workOrderEmployees[employeeIndex].materials.splice(materialIndex, 1);
    }

    // Métodos para agregar costos extra
    addExtraCost(employeeIndex: number) {
        const newExtraCost = {
            extraCostId: null,
            extraCostName: '',
            quantity: 0,
            unit: 'Sin unidad',
            unitCost: 0,
            totalCost: 0
        };
        this.workOrderEmployees[employeeIndex].extraCosts.push(newExtraCost);
    }

    removeExtraCost(employeeIndex: number, extraCostIndex: number) {
        this.workOrderEmployees[employeeIndex].extraCosts.splice(extraCostIndex, 1);
    }

    // Calcular costos automáticamente
    calculateEmployeeTotal(employee: any) {
        let total = (employee.quantity || 0) * (employee.unitCost || 0);
        
        // Sumar materiales
        employee.materials?.forEach((material: any) => {
            total += (material.quantity || 0) * (material.unitCost || 0);
        });
        
        // Sumar costos extra
        employee.extraCosts?.forEach((extraCost: any) => {
            total += (extraCost.quantity || 0) * (extraCost.unitCost || 0);
        });
        
        employee.totalCost = total;
        return total;
    }

    calculateWorkOrderTotal() {
        let total = 0;
        this.workOrderEmployees.forEach(employee => {
            total += this.calculateEmployeeTotal(employee);
        });
        return total;
    }

    calculateTotalCost(): number {
        return this.calculateWorkOrderTotal();
    }

    saveWorkOrderDetails() {
        if (!this.selectedWorkOrder) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No hay orden de trabajo seleccionada',
                life: 3000
            });
            return;
        }

        // Preparar los datos para enviar al backend
        const workOrderData: WorkOrderDto = {
            name: this.selectedWorkOrder.name,
            description: this.selectedWorkOrder.description,
            startDate: this.selectedWorkOrder.startDate,
            endDate: this.selectedWorkOrder.endDate,
            status: this.selectedWorkOrder.status,
            totalCost: this.calculateTotalCost(),
            biologicalProductPhaseId: this.selectedPhase!.id,
            employees: this.workOrderEmployees.map(emp => ({
                employeeId: emp.employeeId!,
                regionLotId: emp.regionLotId,
                activityId: emp.activityId!,
                quantity: emp.quantity,
                unitCost: emp.unitCost,
                totalCost: emp.totalCost,
                materials: emp.materials.map((mat: any) => ({
                    productId: mat.productId!,
                    quantity: mat.quantity,
                    unitCost: mat.unitCost,
                    totalCost: mat.totalCost
                })),
                extraCosts: emp.extraCosts.map((ec: any) => ({
                    extraCostId: ec.extraCostId!,
                    quantity: ec.quantity,
                    unitCost: ec.unitCost,
                    totalCost: ec.totalCost
                }))
            }))
        };

        if (this.selectedWorkOrder.id) {
            // Actualizar orden existente
            this.workOrderService.update(this.selectedWorkOrder.id, workOrderData).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Exitoso',
                        detail: 'Orden de trabajo actualizada',
                        life: 3000
                    });
                    this.hideWorkOrderDetailDialog();
                    this.loadWorkOrders(this.selectedPhase!.id);
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error al actualizar orden de trabajo',
                        life: 3000
                    });
                    console.error('Error updating work order:', error);
                }
            });
        } else {
            // Crear nueva orden
            this.workOrderService.create(workOrderData).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Exitoso',
                        detail: 'Orden de trabajo creada',
                        life: 3000
                    });
                    this.hideWorkOrderDetailDialog();
                    this.loadWorkOrders(this.selectedPhase!.id);
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error al crear orden de trabajo',
                        life: 3000
                    });
                    console.error('Error creating work order:', error);
                }
            });
        }
    }

    // Métodos de filtrado - ya no se usan con el nuevo sistema
    filterEmployees() {
        // Este método ya no se usa con el nuevo sistema de dropdowns independientes
        this.filteredEmployees = this.employees.filter(emp => 
            emp.name.toLowerCase().includes(this.employeeFilter.toLowerCase()) ||
            emp.position.toLowerCase().includes(this.employeeFilter.toLowerCase())
        );
    }

    filterActivities() {
        // Este método ya no se usa con el nuevo sistema de dropdowns independientes
        this.filteredActivities = this.activities.filter(act => 
            act.name.toLowerCase().includes(this.activityFilter.toLowerCase())
        );
    }

    filterMaterials() {
        // Este método ya no se usa con el nuevo sistema de dropdowns independientes
        this.filteredMaterials = this.materials.filter(mat => 
            mat.name.toLowerCase().includes(this.materialFilter.toLowerCase())
        );
    }

    filterExtraCosts() {
        // Este método ya no se usa con el nuevo sistema de dropdowns independientes
        this.filteredExtraCosts = this.extraCosts.filter(ec => 
            ec.name.toLowerCase().includes(this.extraCostFilter.toLowerCase())
        );
    }

    // Métodos para actualizar datos cuando se selecciona un elemento
    onEmployeeSelected(employeeIndex: number, selectedEmployeeId: number) {
        const employee = this.workOrderEmployees[employeeIndex];
        const selectedEmployee = this.employees.find(emp => emp.id === selectedEmployeeId);
        
        if (selectedEmployee) {
            employee.employeeId = selectedEmployee.id;
            employee.employeeName = selectedEmployee.name;
            employee.position = selectedEmployee.position;
        }
    }

    onRegionLotSelected(employeeIndex: number, selectedRegionLotId: number) {
        const employee = this.workOrderEmployees[employeeIndex];
        const selectedRegionLot = this.regionLots.find(rl => rl.id === selectedRegionLotId);
        
        if (selectedRegionLot) {
            employee.regionLotId = selectedRegionLot.id;
            employee.regionLotName = selectedRegionLot.name;
        }
    }

    onActivitySelected(employeeIndex: number, selectedActivityId: number) {
        const employee = this.workOrderEmployees[employeeIndex];
        const selectedActivity = this.activities.find(act => act.id === selectedActivityId);
        
        if (selectedActivity) {
            employee.activityId = selectedActivity.id;
            employee.activityName = selectedActivity.name;
            employee.unit = selectedActivity.unit;
            employee.unitCost = selectedActivity.unitCost;
        }
    }

    onMaterialSelected(employeeIndex: number, materialIndex: number, selectedMaterialId: number) {
        const material = this.workOrderEmployees[employeeIndex].materials[materialIndex];
        const selectedMaterial = this.materials.find(mat => mat.id === selectedMaterialId);
        
        if (selectedMaterial) {
            material.productId = selectedMaterial.id;
            material.materialName = selectedMaterial.name;
            material.unit = selectedMaterial.unit;
            material.unitCost = selectedMaterial.unitCost;
        }
    }

    onExtraCostSelected(employeeIndex: number, extraCostIndex: number, selectedExtraCostId: number) {
        const extraCost = this.workOrderEmployees[employeeIndex].extraCosts[extraCostIndex];
        const selectedExtraCost = this.extraCosts.find(ec => ec.id === selectedExtraCostId);
        
        if (selectedExtraCost) {
            extraCost.extraCostId = selectedExtraCost.id;
            extraCost.extraCostName = selectedExtraCost.name;
            extraCost.unit = selectedExtraCost.unit;
            extraCost.unitCost = selectedExtraCost.unitCost;
        }
    }

    // Métodos de cálculo
    calculateMaterialSubtotal(employeeIndex: number, materialIndex: number): number {
        const material = this.workOrderEmployees[employeeIndex].materials[materialIndex];
        return (material.quantity || 0) * (material.unitCost || 0);
    }

    calculateExtraCostSubtotal(employeeIndex: number, extraCostIndex: number): number {
        const extraCost = this.workOrderEmployees[employeeIndex].extraCosts[extraCostIndex];
        return (extraCost.quantity || 0) * (extraCost.unitCost || 0);
    }

    calculateEmployeeWorkCost(employee: any): number {
        return (employee.quantity || 0) * (employee.unitCost || 0);
    }

    calculateEmployeeMaterialsCost(employee: any): number {
        return employee.materials?.reduce((total: number, material: any) => 
            total + this.calculateMaterialSubtotal(this.workOrderEmployees.indexOf(employee), employee.materials.indexOf(material)), 0) || 0;
    }

    calculateEmployeeExtraCostsCost(employee: any): number {
        return employee.extraCosts?.reduce((total: number, extraCost: any) => 
            total + this.calculateExtraCostSubtotal(this.workOrderEmployees.indexOf(employee), employee.extraCosts.indexOf(extraCost)), 0) || 0;
    }

    // Estos métodos ya no se usan con p-select

    // Este método ya no se usa con p-select

    // Estos métodos ya no se usan con p-select
}
