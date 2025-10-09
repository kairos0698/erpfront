export interface EmployeeTypeDto {
  name: string;
  description?: string;
}

export interface EmployeeTypeResponseDto extends EmployeeTypeDto {
  id: number;
  organizationId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeTypeFilters {
  search?: string;
  isActive?: boolean;
}
