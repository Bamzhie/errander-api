import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateDeliveryRequestDto } from './dto/create-delievery.dto';
import multer from 'multer';
import { multerConfig } from 'src/file/multer.config';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CreateErranderDto } from './dto/create-errander.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create-delievery')
  create(@Body() createUserDto: CreateDeliveryRequestDto) {
    return this.userService.createDeliveryRequest(createUserDto);
  }

 @Post('errander')
@UseInterceptors(
  FileFieldsInterceptor([{ name: 'idCard', maxCount: 1 }], multerConfig),
)
async erranderSetup(
  @UploadedFiles()
  files: {
    idCard?: Express.Multer.File[];
  },
  @Body() dto: CreateErranderDto,
) {
  if (!files.idCard)
    return {
      statuscode: '01',
      status: 'FAILED',
      message: 'ID Card file is required for errander application',
    };

  const baseUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/uploads`;
  const idCardUrl = `${baseUrl}/${files.idCard[0].filename}`;

  try {
    return await this.userService.createErrander(dto, idCardUrl);
  } catch (error) {
    return {
      statuscode: '01',
      status: 'FAILED',
      message: error.message || 'Failed to create errander application',
    };
  }
}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }



  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
