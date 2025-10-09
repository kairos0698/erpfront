export interface ExtraCostDto {
    name: string;
    description?: string;
    unitId: number;
    unitCost: number;
    isActive: boolean;
}

export interface ExtraCostResponseDto extends ExtraCostDto {
    id: number;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
    unitName?: string;
}

export interface ExtraCostFilters {
    search?: string;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
}
