export interface ActivityDto {
  name: string;
  description?: string;
  unitId?: number;
  unitCost: number;
  isActive: boolean;
}

export interface ActivityResponseDto extends ActivityDto {
  id: number;
  organizationId: string;
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
