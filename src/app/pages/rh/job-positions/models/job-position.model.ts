export interface AreaDto {
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

export interface CreateAreaDto {
  name: string;
  description?: string;
  isActive: boolean;
}

export interface UpdateAreaDto {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface HierarchicalLevelDto {
  id: number;
  name: string;
  description?: string;
  level: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdByUserId: string;
  modifiedByUserId: string;
  organizationId: string;
  isDeleted: boolean;
}

export interface CreateHierarchicalLevelDto {
  name: string;
  description?: string;
  level: number;
  isActive: boolean;
}

export interface UpdateHierarchicalLevelDto {
  id: number;
  name: string;
  description?: string;
  level: number;
  isActive: boolean;
}

export interface ContractTypeDto {
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

export interface CreateContractTypeDto {
  name: string;
  description?: string;
  isActive: boolean;
}

export interface UpdateContractTypeDto {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface WorkShiftDto {
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

export interface CreateWorkShiftDto {
  name: string;
  description?: string;
  isActive: boolean;
}

export interface UpdateWorkShiftDto {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface LaborRiskDto {
  id: number;
  name: string;
  description?: string;
  riskLevel: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdByUserId: string;
  modifiedByUserId: string;
  organizationId: string;
  isDeleted: boolean;
}

export interface CreateLaborRiskDto {
  name: string;
  description?: string;
  riskLevel: string;
  isActive: boolean;
}

export interface UpdateLaborRiskDto {
  id: number;
  name: string;
  description?: string;
  riskLevel: string;
  isActive: boolean;
}

export interface ShiftDto {
  id: number;
  name: string;
  description?: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdByUserId: string;
  modifiedByUserId: string;
  organizationId: string;
  isDeleted: boolean;
}

export interface CreateShiftDto {
  name: string;
  description?: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface UpdateShiftDto {
  id: number;
  name: string;
  description?: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface PaymentPeriodDto {
  id: number;
  name: string;
  description?: string;
  days: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdByUserId: string;
  modifiedByUserId: string;
  organizationId: string;
  isDeleted: boolean;
}

export interface CreatePaymentPeriodDto {
  name: string;
  description?: string;
  days: number;
  isActive: boolean;
}

export interface UpdatePaymentPeriodDto {
  id: number;
  name: string;
  description?: string;
  days: number;
  isActive: boolean;
}

export interface PaymentUnitDto {
  id: number;
  name: string;
  description?: string;
  symbol: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdByUserId: string;
  modifiedByUserId: string;
  organizationId: string;
  isDeleted: boolean;
}

export interface CreatePaymentUnitDto {
  name: string;
  description?: string;
  symbol: string;
  isActive: boolean;
}

export interface UpdatePaymentUnitDto {
  id: number;
  name: string;
  description?: string;
  symbol: string;
  isActive: boolean;
}

export interface JobPositionDto {
  id: number;
  name: string;
  description?: string;
  areaId?: number;
  areaName?: string;
  hierarchicalLevelId?: number;
  hierarchicalLevelName?: string;
  contractTypeId?: number;
  contractTypeName?: string;
  workShiftId?: number;
  workShiftName?: string;
  laborRiskId?: number;
  laborRiskName?: string;
  shiftId?: number;
  shiftName?: string;
  paymentPeriodId?: number;
  paymentPeriodName?: string;
  paymentUnitId?: number;
  paymentUnitName?: string;
  baseSalary: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdByUserId: string;
  modifiedByUserId: string;
  organizationId: string;
  isDeleted: boolean;
}

export interface CreateJobPositionDto {
  name: string;
  description?: string;
  areaId?: number;
  hierarchicalLevelId?: number;
  contractTypeId?: number;
  workShiftId?: number;
  laborRiskId?: number;
  shiftId?: number;
  paymentPeriodId?: number;
  paymentUnitId?: number;
  baseSalary: number;
  isActive: boolean;
}

export interface UpdateJobPositionDto {
  id: number;
  name: string;
  description?: string;
  areaId?: number;
  hierarchicalLevelId?: number;
  contractTypeId?: number;
  workShiftId?: number;
  laborRiskId?: number;
  shiftId?: number;
  paymentPeriodId?: number;
  paymentUnitId?: number;
  baseSalary: number;
  isActive: boolean;
}

// Opciones para niveles de riesgo
export const RISK_LEVEL_OPTIONS = [
  { label: 'Bajo', value: 'bajo' },
  { label: 'Medio', value: 'medio' },
  { label: 'Alto', value: 'alto' }
];
