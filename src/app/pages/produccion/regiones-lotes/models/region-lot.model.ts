export interface CropDto {
    id: number;
    name: string;
    description?: string;
    isActive: boolean;
}

export interface RegionLotDto {
    regionCode: string;
    name: string;
    season?: string;
    regionStatusId?: number;
    location: string;
    surface: number;
    productTypeId?: number;
    creationYear?: number;
    density?: number;
    isActive: boolean;
    cropIds: number[];
}

export interface RegionLotResponseDto extends RegionLotDto {
    id: number;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
    regionStatusName?: string;
    productTypeName?: string;
    crops: CropDto[];
}

export interface RegionLotFilters {
    search?: string;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
}

export interface RegionStatusDto {
    id: number;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdByUserId: string;
    modifiedByUserId: string;
    organizationId: string;
    isDeleted: boolean;
}

export interface CreateRegionStatusDto {
    name: string;
    description?: string;
    isActive?: boolean;
}

export interface UpdateRegionStatusDto {
    id: number;
    name: string;
    description?: string;
    isActive: boolean;
}
