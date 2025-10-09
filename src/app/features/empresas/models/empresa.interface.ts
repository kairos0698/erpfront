export interface Empresa {
  id?: string;
  nombre?: string;
  ruc?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  estado?: 'ACTIVA' | 'INACTIVA';
  fechaCreacion?: Date;
  fechaModificacion?: Date;
}
