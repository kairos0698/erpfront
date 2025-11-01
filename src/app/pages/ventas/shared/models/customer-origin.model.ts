export interface CustomerOriginDto {
  name: string;
  description?: string;
  isActive: boolean;
}

export interface CustomerOriginResponseDto extends CustomerOriginDto {
  id: number;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  customersCount: number;
}

