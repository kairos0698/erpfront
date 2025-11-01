export interface CustomerFiscalDataDto {
  customerId: number;
  hasFiscalData: boolean;
  legalName?: string;
  commercialName?: string;
  fiscalRFC?: string;
  fiscalAddress?: string;
  cfdiUsage?: string;
  fiscalRegime?: string;
  accountNumber?: string;
}

export interface CustomerFiscalDataResponseDto extends CustomerFiscalDataDto {
  id: number;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  customerName?: string;
}

