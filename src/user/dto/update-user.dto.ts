import { PartialType } from '@nestjs/mapped-types';
import { CreateDeliveryRequestDto } from './create-delievery.dto';

export class UpdateUserDto extends PartialType(CreateDeliveryRequestDto) {}
