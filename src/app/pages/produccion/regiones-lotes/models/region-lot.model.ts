export interface RegionLotDto {
    name: string;
    region: string;
    area: number;
    location?: string;
    isActive: boolean;
}

export interface RegionLotResponseDto extends RegionLotDto {
    id: number;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface RegionLotFilters {
    search?: string;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
}
