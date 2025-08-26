import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

export class CreateErranderDto {
  // Personal Information
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  @IsOptional()
  @IsString()
  email?: string;

  // School Information
  @IsNotEmpty()
  @IsString()
  school: string;

  // Address
  @IsNotEmpty()
  @IsString()
  homeAddress: string;

  // ID Card (handled separately in file upload)
  @IsOptional()
  @IsString()
  idCardUrl?: string;

  @IsOptional()
  @IsString()
  idCardFileName?: string;

  // Optional status
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'approved', 'rejected', 'suspended'])
  status?: string = 'pending';
}