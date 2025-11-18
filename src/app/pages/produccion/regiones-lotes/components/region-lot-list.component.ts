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
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { RegionLotService } from '../services/region-lot.service';
import { RegionStatusService } from '../services/region-status.service';
import { ClassificationService } from '../../../inventario/clasificaciones/services/classification.service';
import { AuthService } from '../../../../auth.service';
import { CropService } from '../../activity/services/crop.service';
import { RegionLotResponseDto, RegionLotDto, RegionStatusDto, CreateRegionStatusDto, UpdateRegionStatusDto, CropDto } from '../models/region-lot.model';
import { ProductClassificationResponseDto } from '../../../inventario/clasificaciones/models/classification.model';

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
    selector: 'app-region-lot-list',
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
        SelectModule,
        MultiSelectModule
    ],
    templateUrl: './region-lot-list.component.html',
    providers: [MessageService, RegionLotService, RegionStatusService, ClassificationService, ConfirmationService]
})
export class RegionLotListComponent implements OnInit {
    regionLotDialog: boolean = false;
    regionStatusDialog: boolean = false;
    regionLots = signal<RegionLotResponseDto[]>([]);
    regionLot: RegionLotResponseDto = {} as RegionLotResponseDto;
    selectedRegionLots!: RegionLotResponseDto[] | null;
    submitted: boolean = false;
    statusSubmitted: boolean = false;

    // Datos para dropdowns
    regionStatuses: RegionStatusDto[] = [];
    productClassifications: ProductClassificationResponseDto[] = [];
    crops: CropDto[] = [];
    regionStatus: RegionStatusDto = {} as RegionStatusDto;

    // Para validación de edición/eliminación
    private readonly systemOrganizationId = '00000000-0000-0000-0000-000000000001';
    currentUserOrganizationId: string | null = null;

    @ViewChild('dt') dt!: Table;
    exportColumns!: ExportColumn[];
    cols!: Column[];

    constructor(
        private regionLotService: RegionLotService,
        private regionStatusService: RegionStatusService,
        private classificationService: ClassificationService,
        private cropService: CropService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private authService: AuthService
    ) {
        // Obtener el organizationId del usuario actual
        const currentUser = this.authService.getCurrentUser();
        this.currentUserOrganizationId = currentUser?.organizationId || null;
    }

    ngOnInit() {
        this.loadRegionLots();
        this.loadReferenceData();
        this.setupColumns();
    }

    loadReferenceData() {
        // Cargar estados de región
        this.regionStatusService.getAll().subscribe({
            next: (data) => {
                this.regionStatuses = Array.isArray(data) ? data : [];
            },
            error: (error) => {
                console.error('Error loading region statuses:', error);
                this.regionStatuses = [];
            }
        });

        // Cargar clasificaciones de productos
        this.classificationService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.productClassifications = response.data;
                }
            },
            error: (error) => {
                console.error('Error loading product classifications:', error);
                this.productClassifications = [];
            }
        });

        // Cargar cultivos
        this.cropService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.crops = response.data;
                } else {
                    this.crops = [];
                }
            },
            error: (error) => {
                console.error('Error loading crops:', error);
                this.crops = [];
            }
        });
    }

    loadRegionLots() {
        this.regionLotService.getAll().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.regionLots.set(response.data);
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: response.message || 'Error al cargar regiones/lotes',
                        life: 3000
                    });
                }
            },
            error: (error) => {
                console.error('Error loading region lots:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error de conexión al cargar regiones/lotes',
                    life: 3000
                });
            }
        });
    }

    setupColumns() {
        this.cols = [
            { field: 'regionCode', header: 'Código', customExportHeader: 'Código de Región' },
            { field: 'name', header: 'Nombre', customExportHeader: 'Nombre de la Región' },
            { field: 'season', header: 'Temporada' },
            { field: 'regionStatusName', header: 'Estado Actual' },
            { field: 'location', header: 'Ubicación' },
            { field: 'surface', header: 'Superficie (ha)' },
            { field: 'productTypeName', header: 'Tipo de Producto' },
            { field: 'creationYear', header: 'Año de Creación' },
            { field: 'density', header: 'Densidad' },
            { field: 'isActive', header: 'Estado' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.regionLot = {
            id: 0,
            regionCode: '',
            name: '',
            season: '',
            regionStatusId: undefined,
            location: '',
            surface: 0,
            productTypeId: undefined,
            creationYear: undefined,
            density: undefined,
            isActive: true,
            cropIds: [],
            crops: [],
            organizationId: '',
            createdAt: new Date(),
            updatedAt: new Date()
        } as RegionLotResponseDto;
        this.submitted = false;
        this.regionLotDialog = true;
    }

    editRegionLot(regionLot: RegionLotResponseDto) {
        // Mapear los cultivos a cropIds para el formulario
        this.regionLot = { 
            ...regionLot,
            cropIds: regionLot.crops ? regionLot.crops.map(c => c.id) : []
        };
        this.regionLotDialog = true;
    }

    deleteSelectedRegionLots() {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar las regiones seleccionadas?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const selectedIds = this.selectedRegionLots?.map(rl => rl.id) || [];
                selectedIds.forEach(id => {
                    this.regionLotService.delete(id).subscribe({
                        next: () => {
                            this.loadRegionLots();
                        },
                        error: (error) => {
                            console.error('Error deleting region:', error);
                        }
                    });
                });
                this.selectedRegionLots = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Exitoso',
                    detail: 'Regiones Eliminadas',
                    life: 3000
                });
            }
        });
    }

    hideDialog() {
        this.regionLotDialog = false;
        this.submitted = false;
    }

    deleteRegionLot(regionLot: RegionLotResponseDto) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar la región "' + regionLot.name + '"?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.regionLotService.delete(regionLot.id).subscribe({
                    next: () => {
                        this.loadRegionLots();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Región Eliminada',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al eliminar región',
                            life: 3000
                        });
                        console.error('Error deleting region:', error);
                    }
                });
            }
        });
    }

    getSeverity(isActive: boolean) {
        return isActive ? 'success' : 'danger';
    }

    saveRegionLot() {
        this.submitted = true;

        if (this.regionLot.regionCode?.trim() && this.regionLot.name?.trim()) {
            const regionLotData: RegionLotDto = {
                regionCode: this.regionLot.regionCode,
                name: this.regionLot.name,
                season: this.regionLot.season,
                regionStatusId: this.regionLot.regionStatusId,
                location: this.regionLot.location || '',
                surface: this.regionLot.surface,
                productTypeId: this.regionLot.productTypeId,
                creationYear: this.regionLot.creationYear,
                density: this.regionLot.density,
                isActive: this.regionLot.isActive,
                cropIds: this.regionLot.cropIds ?? []
            };

            if (this.regionLot.id) {
                // Update existing region lot
                this.regionLotService.update(this.regionLot.id, regionLotData).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadRegionLots();
                            this.regionLotDialog = false;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Región Actualizada',
                                life: 3000
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al actualizar región',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al actualizar región',
                            life: 3000
                        });
                        console.error('Error updating region:', error);
                    }
                });
            } else {
                // Create new region lot
                this.regionLotService.create(regionLotData).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loadRegionLots();
                            this.regionLotDialog = false;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Región Creada',
                                life: 3000
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.message || 'Error al crear región',
                                life: 3000
                            });
                        }
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al crear región',
                            life: 3000
                        });
                        console.error('Error creating region:', error);
                    }
                });
            }
        }
    }

    // Mini CRUD para RegionStatus
    openNewStatus() {
        this.regionStatus = {
            name: '',
            description: '',
            isActive: true
        } as RegionStatusDto;
        this.statusSubmitted = false;
        this.regionStatusDialog = true;
    }

    editRegionStatus(status: RegionStatusDto) {
        this.regionStatus = { ...status };
        this.regionStatusDialog = true;
    }

    hideStatusDialog() {
        this.regionStatusDialog = false;
        this.statusSubmitted = false;
    }

    saveRegionStatus() {
        this.statusSubmitted = true;

        if (this.regionStatus.name?.trim()) {
            if (this.regionStatus.id) {
                // Update
                const updateDto: UpdateRegionStatusDto = {
                    id: this.regionStatus.id,
                    name: this.regionStatus.name,
                    description: this.regionStatus.description,
                    isActive: this.regionStatus.isActive
                };
                this.regionStatusService.update(this.regionStatus.id, updateDto).subscribe({
                    next: () => {
                        this.loadReferenceData();
                        this.hideStatusDialog();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Estado de Región Actualizado',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al actualizar estado de región',
                            life: 3000
                        });
                        console.error('Error updating region status:', error);
                    }
                });
            } else {
                // Create
                const createDto: CreateRegionStatusDto = {
                    name: this.regionStatus.name,
                    description: this.regionStatus.description,
                    isActive: this.regionStatus.isActive ?? true
                };
                this.regionStatusService.create(createDto).subscribe({
                    next: () => {
                        this.loadReferenceData();
                        this.hideStatusDialog();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Estado de Región Creado',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al crear estado de región',
                            life: 3000
                        });
                        console.error('Error creating region status:', error);
                    }
                });
            }
        }
    }

    deleteRegionStatus(status: RegionStatusDto) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar el estado "' + status.name + '"?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.regionStatusService.delete(status.id).subscribe({
                    next: () => {
                        this.loadReferenceData();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Estado de Región Eliminado',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al eliminar estado de región',
                            life: 3000
                        });
                        console.error('Error deleting region status:', error);
                    }
                });
            }
        });
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    // Helper method to check if an item can be edited/deleted (belongs to user's organization, not system)
    canEditItem(organizationId: string | undefined): boolean {
        if (!organizationId || !this.currentUserOrganizationId) return false;
        return organizationId !== this.systemOrganizationId && organizationId === this.currentUserOrganizationId;
    }
}
