export interface BiologicalProductDto {
    name: string;
    description?: string;
    sku?: string;
    price?: number; // Mantener por compatibilidad, pero usar cost
    cost?: number; // Campo principal del backend
    isFixedCost?: boolean; // true = costo fijo, false = costo promedio
    stockQuantity: number;
    isActive: boolean;
}

export interface BiologicalProductResponseDto extends BiologicalProductDto {
    id: number;
    type: ProductType | string; // El backend puede devolverlo como string o número
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
    // Campos adicionales para el contexto
    productClassificationName?: string;
    unitName?: string;
}

export interface BiologicalProductFilters {
    search?: string;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
}

// Enums para tipos de producto
export enum ProductType {
    RawMaterial = 0,
    FinishedProduct = 1,
    RawMaterialAndFinishedProduct = 2,
    Service = 3,
    BiologicalProduct = 4,
    MaterialsAndSupplies = 5
}
