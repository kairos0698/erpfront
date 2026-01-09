export interface SupplierPhoneDto {
  supplierId: number;
  phoneNumber: string;
  phoneLabel?: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface SupplierPhoneResponseDto extends SupplierPhoneDto {
  id: number;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  supplierName?: string;
}
