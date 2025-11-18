export enum ActivityType {
  Cosecha = 0,
  ActividadesVarias = 1
}

export interface CropDto {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface ActivityDto {
  name: string;
  description?: string;
  unitId?: number;
  unitCost: number;
  dailyActivityCost?: number; // Costo de actividad por día (solo para tipo Cosecha)
  isActive: boolean;
  type: ActivityType;
}

export interface ActivityResponseDto extends ActivityDto {
  id: number;
  organizationId: string;
  unitName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ActivityFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}
