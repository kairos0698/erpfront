import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { EmpresaService } from '../../services/empresa';
import { Empresa } from '../../models/empresa.interface';

@Component({
  selector: 'app-empresa-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    RippleModule,
    ToastModule,
    ToolbarModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    DialogModule,
    TagModule,
    InputIconModule,
    IconFieldModule,
    ConfirmDialogModule
  ],
  templateUrl: './empresa-list.html',
  styleUrls: ['./empresa-list.scss'],
  providers: [MessageService, ConfirmationService]
})
export class EmpresaListComponent implements OnInit {
  empresas = signal<Empresa[]>([]);
  empresa: Empresa = {};
  selectedEmpresas: Empresa[] = [];
  empresaDialog: boolean = false;
  submitted: boolean = false;
  estados: any[] = [
    { label: 'ACTIVA', value: 'ACTIVA' },
    { label: 'INACTIVA', value: 'INACTIVA' }
  ];

  @ViewChild('dt') dt!: Table;

  constructor(
    private empresaService: EmpresaService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.cargarEmpresas();
  }

  cargarEmpresas() {
    this.empresaService.getEmpresas().subscribe({
      next: (empresas) => {
        this.empresas.set(empresas);
      },
      error: (error) => {
        console.error('Error al cargar empresas:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las empresas',
          life: 3000
        });
      }
    });
  }

  openNew() {
    this.empresa = {};
    this.submitted = false;
    this.empresaDialog = true;
  }

  editEmpresa(empresa: Empresa) {
    this.empresa = { ...empresa };
    this.empresaDialog = true;
  }

  deleteEmpresa(empresa: Empresa) {
    this.confirmationService.confirm({
      message: '¿Está seguro de que desea eliminar ' + empresa.nombre + '?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.empresaService.deleteEmpresa(empresa.id!).subscribe({
          next: () => {
            this.empresas.set(this.empresas().filter((val) => val.id !== empresa.id));
            this.messageService.add({
              severity: 'success',
              summary: 'Exitoso',
              detail: 'Empresa Eliminada',
              life: 3000
            });
          },
          error: (error) => {
            console.error('Error al eliminar empresa:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar la empresa',
              life: 3000
            });
          }
        });
      }
    });
  }

  deleteSelectedEmpresas() {
    this.confirmationService.confirm({
      message: '¿Está seguro de que desea eliminar las empresas seleccionadas?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.selectedEmpresas.forEach(empresa => {
          this.empresaService.deleteEmpresa(empresa.id!).subscribe({
            next: () => {
              this.empresas.set(this.empresas().filter((val) => val.id !== empresa.id));
            },
            error: (error) => {
              console.error('Error al eliminar empresa:', error);
            }
          });
        });
        this.selectedEmpresas = [];
        this.messageService.add({
          severity: 'success',
          summary: 'Exitoso',
          detail: 'Empresas Eliminadas',
          life: 3000
        });
      }
    });
  }

  hideDialog() {
    this.empresaDialog = false;
    this.submitted = false;
  }

  saveEmpresa() {
    this.submitted = true;

    if (this.empresa.nombre?.trim()) {
      if (this.empresa.id) {
        // Actualizar
        this.empresaService.updateEmpresa(this.empresa.id, this.empresa).subscribe({
          next: (empresaActualizada) => {
            const index = this.empresas().findIndex(e => e.id === empresaActualizada.id);
            if (index !== -1) {
              const empresas = [...this.empresas()];
              empresas[index] = empresaActualizada;
              this.empresas.set(empresas);
            }
            this.messageService.add({
              severity: 'success',
              summary: 'Exitoso',
              detail: 'Empresa Actualizada',
              life: 3000
            });
            this.empresaDialog = false;
            this.empresa = {};
          },
          error: (error) => {
            console.error('Error al actualizar empresa:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo actualizar la empresa',
              life: 3000
            });
          }
        });
      } else {
        // Crear
        this.empresaService.createEmpresa(this.empresa).subscribe({
          next: (nuevaEmpresa) => {
            this.empresas.set([...this.empresas(), nuevaEmpresa]);
            this.messageService.add({
              severity: 'success',
              summary: 'Exitoso',
              detail: 'Empresa Creada',
              life: 3000
            });
            this.empresaDialog = false;
            this.empresa = {};
          },
          error: (error) => {
            console.error('Error al crear empresa:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo crear la empresa',
              life: 3000
            });
          }
        });
      }
    }
  }

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  getSeverity(estado: string) {
    switch (estado) {
      case 'ACTIVA':
        return 'success';
      case 'INACTIVA':
        return 'danger';
      default:
        return 'info';
    }
  }

  exportCSV() {
    this.dt.exportCSV();
  }
}