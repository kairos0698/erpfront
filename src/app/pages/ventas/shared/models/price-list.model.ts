export interface PriceListDto {
  name: string;
  description?: string;
  isActive: boolean;
}

export interface PriceListResponseDto extends PriceListDto {
  id: number;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  itemsCount: number;
  customersCount: number;
}

