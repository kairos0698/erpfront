export interface Producto {
  id?: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria: string;
  estado: 'ACTIVO' | 'INACTIVO';
  fechaCreacion?: Date;
  fechaModificacion?: Date;
}
