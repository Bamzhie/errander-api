import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

export class CreateDeliveryRequestDto {
  // Sender Information
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsString()
  phoneNumber1: string;

  @IsOptional()
  @IsString()
  phoneNumber2?: string;

  @IsOptional()
  @IsString()
  email?: string;

  // Item Information
  @IsNotEmpty()
  @IsString()
  itemType: string;

  @IsOptional()
  @IsString()
  itemDescription?: string;

  // Delivery Information
  @IsNotEmpty()
  @IsString()
  deliveryAddress: string;

  @IsNotEmpty()
  @IsString()
  recipientName: string;

  @IsNotEmpty()
  @IsString()
  recipientPhoneNumber: string;

  // Optional fields
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @IsOptional()
  @IsString()
  @IsIn([
    'pending',
    'confirmed', 
    'picked_up',
    'delievered',
    'failed_delievery',
    'cancelled',
  ])
  status?: string = 'pending';
}