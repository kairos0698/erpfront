export interface Usuario {
  id?: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol: 'ADMIN' | 'USUARIO' | 'VENDEDOR';
  estado: 'ACTIVO' | 'INACTIVO';
  fechaCreacion?: Date;
  fechaModificacion?: Date;
}
