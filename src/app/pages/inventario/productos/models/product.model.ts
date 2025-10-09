export interface ProductDto {
    name: string;
    description?: string;
    sku: string;
    type: ProductType;
    productClassificationId: number;
    unitId: number;
    price: number;
    cost: number;
    stockQuantity: number;
    minStock: number;
    isActive: boolean;
    productFamilyId?: number;
    productSubfamilyId?: number;
    warehouseId?: number;
}

export interface ProductResponseDto extends ProductDto {
    id: number;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
    // Campos de relación
    productClassificationName?: string;
    unitName?: string;
    warehouseName?: string;
}

export enum ProductType {
    RawMaterial = 0,
    FinishedProduct = 1,
    RawMaterialAndFinishedProduct = 2,
    Service = 3,
    BiologicalProduct = 4,
    MaterialsAndSupplies = 5
}

export interface ProductFilters {
    search?: string;
    type?: ProductType;
    productClassificationId?: number;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
}
