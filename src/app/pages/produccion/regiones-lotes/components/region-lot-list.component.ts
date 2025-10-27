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
import { RegionLotService } from '../services/region-lot.service';
import { RegionLotResponseDto, RegionLotDto } from '../models/region-lot.model';

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
        ConfirmDialogModule
    ],
    templateUrl: './region-lot-list.component.html',
    providers: [MessageService, RegionLotService, ConfirmationService]
})
export class RegionLotListComponent implements OnInit {
    regionLotDialog: boolean = false;
    regionLots = signal<RegionLotResponseDto[]>([]);
    regionLot: RegionLotResponseDto = {} as RegionLotResponseDto;
    selectedRegionLots!: RegionLotResponseDto[] | null;
    submitted: boolean = false;

    @ViewChild('dt') dt!: Table;
    exportColumns!: ExportColumn[];
    cols!: Column[];

    constructor(
        private regionLotService: RegionLotService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadRegionLots();
        this.setupColumns();
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
            { field: 'name', header: 'Nombre', customExportHeader: 'Nombre de la Región/Lote' },
            { field: 'region', header: 'Región' },
            { field: 'area', header: 'Área (m²)' },
            { field: 'location', header: 'Ubicación' },
            { field: 'isActive', header: 'Estado' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.regionLot = {
            name: '',
            region: '',
            area: 0,
            location: '',
            isActive: true
        } as RegionLotResponseDto;
        this.submitted = false;
        this.regionLotDialog = true;
    }

    editRegionLot(regionLot: RegionLotResponseDto) {
        this.regionLot = { ...regionLot };
        this.regionLotDialog = true;
    }

    deleteSelectedRegionLots() {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar las regiones/lotes seleccionados?',
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
                            console.error('Error deleting region lot:', error);
                        }
                    });
                });
                this.selectedRegionLots = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Exitoso',
                    detail: 'Regiones/Lotes Eliminados',
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
            message: '¿Estás seguro de que quieres eliminar la región/lote "' + regionLot.name + '"?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.regionLotService.delete(regionLot.id).subscribe({
                    next: () => {
                        this.loadRegionLots();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Región/Lote Eliminada',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al eliminar región/lote',
                            life: 3000
                        });
                        console.error('Error deleting region lot:', error);
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

        if (this.regionLot.name?.trim() && this.regionLot.region?.trim()) {
            const regionLotData: RegionLotDto = {
                name: this.regionLot.name,
                region: this.regionLot.region,
                area: this.regionLot.area,
                location: this.regionLot.location,
                isActive: this.regionLot.isActive
            };

            if (this.regionLot.id) {
                // Update existing region lot
                this.regionLotService.update(this.regionLot.id, regionLotData).subscribe({
                    next: () => {
                        this.loadRegionLots();
                        this.regionLotDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Región/Lote Actualizada',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al actualizar región/lote',
                            life: 3000
                        });
                        console.error('Error updating region lot:', error);
                    }
                });
            } else {
                // Create new region lot
                this.regionLotService.create(regionLotData).subscribe({
                    next: () => {
                        this.loadRegionLots();
                        this.regionLotDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Región/Lote Creada',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al crear región/lote',
                            life: 3000
                        });
                        console.error('Error creating region lot:', error);
                    }
                });
            }
        }
    }

    exportCSV() {
        this.dt.exportCSV();
    }
}
