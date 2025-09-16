import { IsOptional, IsEnum, IsPositive, Min } from 'class-validator';

export const ValidStatuses = ['pending', 'confirmed', 'picked_up', 'in-transit', 'delivered', 'failed_delivery', 'cancelled'] as const;
export type DeliveryStatus = typeof ValidStatuses[number];

export class UpdateDeliveryDto {
  @IsOptional()
  @IsEnum(ValidStatuses, { message: 'Status must be one of: ' + ValidStatuses.join(', ') })
  status?: DeliveryStatus;

  @IsOptional()
  erranderId?: string;

  @IsOptional()
  @IsPositive({ message: 'Delivery fee must be a positive number' })
  @Min(1, { message: 'Delivery fee must be at least 1' })
  deliveryFee?: number;
}