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
import { ClassificationService } from '../services/classification.service';
import { ProductClassificationResponseDto, ProductClassificationDto } from '../models/classification.model';

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
    selector: 'app-classification-list',
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
    templateUrl: './classification-list.component.html',
    providers: [MessageService, ClassificationService, ConfirmationService]
})
export class ClassificationListComponent implements OnInit {
    classificationDialog: boolean = false;
    classifications = signal<ProductClassificationResponseDto[]>([]);
    classification: ProductClassificationResponseDto = {} as ProductClassificationResponseDto;
    selectedClassifications!: ProductClassificationResponseDto[] | null;
    submitted: boolean = false;

    @ViewChild('dt') dt!: Table;
    exportColumns!: ExportColumn[];
    cols!: Column[];

    constructor(
        private classificationService: ClassificationService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadClassifications();
        this.setupColumns();
    }

    loadClassifications() {
        this.classificationService.getAll().subscribe({
            next: (data) => this.classifications.set(data),
            error: (error) => {
                console.error('Error loading classifications:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar clasificaciones',
                    life: 3000
                });
            }
        });
    }

    setupColumns() {
        this.cols = [
            { field: 'name', header: 'Nombre', customExportHeader: 'Nombre de la Clasificación' },
            { field: 'description', header: 'Descripción' },
            { field: 'isActive', header: 'Estado' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.classification = {
            name: '',
            description: '',
            isActive: true
        } as ProductClassificationResponseDto;
        this.submitted = false;
        this.classificationDialog = true;
    }

    editClassification(classification: ProductClassificationResponseDto) {
        this.classification = { ...classification };
        this.classificationDialog = true;
    }

    deleteSelectedClassifications() {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar las clasificaciones seleccionadas?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const selectedIds = this.selectedClassifications?.map(c => c.id) || [];
                selectedIds.forEach(id => {
                    this.classificationService.delete(id).subscribe({
                        next: () => {
                            this.loadClassifications();
                        },
                        error: (error) => {
                            console.error('Error deleting classification:', error);
                        }
                    });
                });
                this.selectedClassifications = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Exitoso',
                    detail: 'Clasificaciones Eliminadas',
                    life: 3000
                });
            }
        });
    }

    hideDialog() {
        this.classificationDialog = false;
        this.submitted = false;
    }

    deleteClassification(classification: ProductClassificationResponseDto) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que quieres eliminar la clasificación "' + classification.name + '"?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.classificationService.delete(classification.id).subscribe({
                    next: () => {
                        this.loadClassifications();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Clasificación Eliminada',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al eliminar clasificación',
                            life: 3000
                        });
                        console.error('Error deleting classification:', error);
                    }
                });
            }
        });
    }

    getSeverity(isActive: boolean) {
        return isActive ? 'success' : 'danger';
    }

    saveClassification() {
        this.submitted = true;
        
        if (this.classification.name?.trim()) {
            const classificationData: ProductClassificationDto = {
                name: this.classification.name,
                description: this.classification.description,
                isActive: this.classification.isActive
            };

            if (this.classification.id) {
                // Update existing classification
                this.classificationService.update(this.classification.id, classificationData).subscribe({
                    next: () => {
                        this.loadClassifications();
                        this.classificationDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Clasificación Actualizada',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al actualizar clasificación',
                            life: 3000
                        });
                        console.error('Error updating classification:', error);
                    }
                });
            } else {
                // Create new classification
                this.classificationService.create(classificationData).subscribe({
                    next: () => {
                        this.loadClassifications();
                        this.classificationDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exitoso',
                            detail: 'Clasificación Creada',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Error al crear clasificación',
                            life: 3000
                        });
                        console.error('Error creating classification:', error);
                    }
                });
            }
        }
    }

    exportCSV() {
        this.dt.exportCSV();
    }
}
