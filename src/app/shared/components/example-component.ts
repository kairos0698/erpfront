import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { ExampleApiService, ExampleResponseDto } from '../services/example-api.service';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h2>Ejemplo de Componente</h2>
      <button (click)="loadData()">Cargar Datos</button>
      <button (click)="createData()">Crear Datos</button>
      
      <div *ngIf="data">
        <h3>Datos:</h3>
        <pre>{{ data | json }}</pre>
      </div>
    </div>
  `
})
export class ExampleComponent implements OnInit {
  data: ExampleResponseDto[] = [];

  constructor(
    private exampleService: ExampleApiService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.exampleService.getAll().subscribe({
      next: (data) => {
        this.data = data;
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Datos cargados correctamente',
          life: 3000
        });
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error al cargar datos: ${error.message}`,
          life: 5000
        });
      }
    });
  }

  createData() {
    const newData: any = {
      name: 'Nuevo Item',
      description: 'Descripción del nuevo item'
    };

    this.exampleService.create(newData).subscribe({
      next: (data) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Datos creados correctamente',
          life: 3000
        });
        this.loadData(); // Recargar datos
      },
      error: (error) => {
        console.error('Error creating data:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error al crear datos: ${error.message}`,
          life: 5000
        });
      }
    });
  }
}
