export interface WarehouseDto {
    name: string;
    location?: string;
    type?: string;
    responsiblePerson?: string;
    isActive: boolean;
}

export interface WarehouseResponseDto extends WarehouseDto {
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

export interface WarehouseFilters {
    search?: string;
    type?: string;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
}
