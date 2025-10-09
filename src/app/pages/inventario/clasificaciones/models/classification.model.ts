export interface ProductClassificationDto {
    name: string;
    description?: string;
    isActive: boolean;
}

export interface ProductClassificationResponseDto extends ProductClassificationDto {
    id: number;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
}
