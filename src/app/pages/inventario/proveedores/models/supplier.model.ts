export interface SupplierDto {
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    rfc?: string;
    isActive: boolean;
}

export interface SupplierResponseDto extends SupplierDto {
    id: number;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
}
