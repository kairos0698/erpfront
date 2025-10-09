export interface PositionDto {
  name: string;
  suggestedSalary: number;
  description?: string;
}

export interface PositionResponseDto extends PositionDto {
  id: number;
  organizationId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PositionFilters {
  search?: string;
  isActive?: boolean;
}
