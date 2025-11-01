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
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { JobPositionService } from '../services/job-position.service';
import { AreaService } from '../services/area.service';
import { HierarchicalLevelService } from '../services/hierarchical-level.service';
import { ContractTypeService } from '../services/contract-type.service';
import { WorkShiftService } from '../services/work-shift.service';
import { LaborRiskService } from '../services/labor-risk.service';
import { ShiftService } from '../services/shift.service';
import { PaymentPeriodService } from '../services/payment-period.service';
import { PaymentUnitService } from '../services/payment-unit.service';
import { 
  JobPositionDto, 
  CreateJobPositionDto, 
  UpdateJobPositionDto,
  AreaDto,
  HierarchicalLevelDto,
  ContractTypeDto,
  WorkShiftDto,
  LaborRiskDto,
  ShiftDto,
  PaymentPeriodDto,
  PaymentUnitDto,
  RISK_LEVEL_OPTIONS
} from '../models/job-position.model';

@Component({
  selector: 'app-job-position-list',
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
    SelectModule,
    CheckboxModule,
    InputNumberModule,
    DialogModule,
    TagModule,
    InputIconModule,
    IconFieldModule,
    ConfirmDialogModule
  ],
  templateUrl: './job-position-list.component.html',
  styleUrls: ['./job-position-list.component.scss']
})
export class JobPositionListComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  jobPositions = signal<JobPositionDto[]>([]);
  selectedJobPositions = signal<JobPositionDto[]>([]);
  jobPosition = signal<JobPositionDto>({} as JobPositionDto);
  jobPositionDialog = signal(false);
  deleteJobPositionDialog = signal(false);
  deleteJobPositionsDialog = signal(false);
  submitted = signal(false);

  // Datos para los dropdowns
  areas = signal<AreaDto[]>([]);
  hierarchicalLevels = signal<HierarchicalLevelDto[]>([]);
  contractTypes = signal<ContractTypeDto[]>([]);
  workShifts = signal<WorkShiftDto[]>([]);
  laborRisks = signal<LaborRiskDto[]>([]);
  shifts = signal<ShiftDto[]>([]);
  paymentPeriods = signal<PaymentPeriodDto[]>([]);
  paymentUnits = signal<PaymentUnitDto[]>([]);

  riskLevelOptions = RISK_LEVEL_OPTIONS;

  constructor(
    private jobPositionService: JobPositionService,
    private areaService: AreaService,
    private hierarchicalLevelService: HierarchicalLevelService,
    private contractTypeService: ContractTypeService,
    private workShiftService: WorkShiftService,
    private laborRiskService: LaborRiskService,
    private shiftService: ShiftService,
    private paymentPeriodService: PaymentPeriodService,
    private paymentUnitService: PaymentUnitService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadJobPositions();
    this.loadDropdownData();
  }

  loadJobPositions() {
    this.jobPositionService.getAll().subscribe({
      next: (data) => {
        this.jobPositions.set(data);
      },
      error: (error) => {
        console.error('Error loading job positions:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar los puestos de trabajo'
        });
      }
    });
  }

  loadDropdownData() {
    // Cargar todas las entidades auxiliares
    this.areaService.getAll().subscribe(data => this.areas.set(data));
    this.hierarchicalLevelService.getAll().subscribe(data => this.hierarchicalLevels.set(data));
    this.contractTypeService.getAll().subscribe(data => this.contractTypes.set(data));
    this.workShiftService.getAll().subscribe(data => this.workShifts.set(data));
    this.laborRiskService.getAll().subscribe(data => this.laborRisks.set(data));
    this.shiftService.getAll().subscribe(data => this.shifts.set(data));
    this.paymentPeriodService.getAll().subscribe(data => this.paymentPeriods.set(data));
    this.paymentUnitService.getAll().subscribe(data => this.paymentUnits.set(data));
  }

  openNew() {
    this.jobPosition.set({} as JobPositionDto);
    this.submitted.set(false);
    this.jobPositionDialog.set(true);
  }

  deleteSelectedJobPositions() {
    this.deleteJobPositionsDialog.set(true);
  }

  editJobPosition(jobPosition: JobPositionDto) {
    this.jobPosition.set({ ...jobPosition });
    this.jobPositionDialog.set(true);
  }

  deleteJobPosition(jobPosition: JobPositionDto) {
    this.deleteJobPositionDialog.set(true);
    this.jobPosition.set({ ...jobPosition });
  }

  confirmDeleteSelected() {
    this.deleteJobPositionsDialog.set(false);
    const selected = this.selectedJobPositions();
    
    selected.forEach(jobPosition => {
      this.jobPositionService.delete(jobPosition.id).subscribe({
        next: () => {
          this.jobPositions.update(jobPositions => 
            jobPositions.filter(p => p.id !== jobPosition.id)
          );
        },
        error: (error) => {
          console.error('Error deleting job position:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al eliminar el puesto de trabajo'
          });
        }
      });
    });

    this.messageService.add({
      severity: 'success',
      summary: 'Exitoso',
      detail: 'Puestos de trabajo eliminados'
    });
    this.selectedJobPositions.set([]);
  }

  confirmDelete() {
    this.deleteJobPositionDialog.set(false);
    const jobPosition = this.jobPosition();
    
    this.jobPositionService.delete(jobPosition.id).subscribe({
      next: () => {
        this.jobPositions.update(jobPositions => 
          jobPositions.filter(p => p.id !== jobPosition.id)
        );
        this.messageService.add({
          severity: 'success',
          summary: 'Exitoso',
          detail: 'Puesto de trabajo eliminado'
        });
      },
      error: (error) => {
        console.error('Error deleting job position:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al eliminar el puesto de trabajo'
        });
      }
    });
  }

  hideDialog() {
    this.jobPositionDialog.set(false);
    this.submitted.set(false);
  }

  saveJobPosition() {
    this.submitted.set(true);
    const jobPosition = this.jobPosition();

    if (jobPosition.name?.trim()) {
      if (jobPosition.id) {
        // Actualizar
        const updateDto: UpdateJobPositionDto = {
          id: jobPosition.id,
          name: jobPosition.name,
          description: jobPosition.description,
          areaId: jobPosition.areaId,
          hierarchicalLevelId: jobPosition.hierarchicalLevelId,
          contractTypeId: jobPosition.contractTypeId,
          workShiftId: jobPosition.workShiftId,
          laborRiskId: jobPosition.laborRiskId,
          shiftId: jobPosition.shiftId,
          paymentPeriodId: jobPosition.paymentPeriodId,
          paymentUnitId: jobPosition.paymentUnitId,
          baseSalary: jobPosition.baseSalary,
          isActive: jobPosition.isActive
        };

        this.jobPositionService.update(jobPosition.id, updateDto).subscribe({
          next: (updatedJobPosition) => {
            this.jobPositions.update(jobPositions => 
              jobPositions.map(p => p.id === jobPosition.id ? updatedJobPosition : p)
            );
            this.messageService.add({
              severity: 'success',
              summary: 'Exitoso',
              detail: 'Puesto de trabajo actualizado'
            });
            this.hideDialog();
          },
          error: (error) => {
            console.error('Error updating job position:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al actualizar el puesto de trabajo'
            });
          }
        });
      } else {
        // Crear
        const createDto: CreateJobPositionDto = {
          name: jobPosition.name,
          description: jobPosition.description,
          areaId: jobPosition.areaId,
          hierarchicalLevelId: jobPosition.hierarchicalLevelId,
          contractTypeId: jobPosition.contractTypeId,
          workShiftId: jobPosition.workShiftId,
          laborRiskId: jobPosition.laborRiskId,
          shiftId: jobPosition.shiftId,
          paymentPeriodId: jobPosition.paymentPeriodId,
          paymentUnitId: jobPosition.paymentUnitId,
          baseSalary: jobPosition.baseSalary,
          isActive: jobPosition.isActive
        };

        this.jobPositionService.create(createDto).subscribe({
          next: (newJobPosition) => {
            this.jobPositions.update(jobPositions => [...jobPositions, newJobPosition]);
            this.messageService.add({
              severity: 'success',
              summary: 'Exitoso',
              detail: 'Puesto de trabajo creado'
            });
            this.hideDialog();
          },
          error: (error) => {
            console.error('Error creating job position:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al crear el puesto de trabajo'
            });
          }
        });
      }
    }
  }

  findIndexById(id: number): number {
    let index = -1;
    const jobPositions = this.jobPositions();
    for (let i = 0; i < jobPositions.length; i++) {
      if (jobPositions[i].id === id) {
        index = i;
        break;
      }
    }
    return index;
  }

  createId(): string {
    let id = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 5; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  exportCSV() {
    this.dt.exportCSV();
  }

  onGlobalFilter(event: Event, dt: Table) {
    const target = event.target as HTMLInputElement;
    dt.filterGlobal(target.value, 'contains');
  }
}
