export interface CustomerDeliveryAddressDto {
  customerId: number;
  addressName: string;
  street: string;
  externalNumber: string;
  internalNumber?: string;
  neighborhood: string;
  municipality: string;
  state: string;
  postalCode: string;
  country: string;
  deliveryInstructions?: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface CustomerDeliveryAddressResponseDto extends CustomerDeliveryAddressDto {
  id: number;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  customerName?: string;
}

