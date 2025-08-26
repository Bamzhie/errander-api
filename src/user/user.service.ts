import { Injectable } from '@nestjs/common';
import { CreateDeliveryRequestDto } from './dto/create-delievery.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateErranderDto } from './dto/create-errander.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  async createDeliveryRequest(dto: CreateDeliveryRequestDto) {
    let user = await this.prisma.user.findFirst({
      where: {
        phoneNumber1: dto.phoneNumber1,
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          fullName: dto.fullName,
          phoneNumber1: dto.phoneNumber1,
          phoneNumber2: dto.phoneNumber2,
          email: dto.email,
        },
      });
    }

    const delivery = await this.prisma.delivery.create({
      data: {
        senderId: user.id,
        senderName: dto.fullName,
        senderPhone1: dto.phoneNumber1,
        senderPhone2: dto.phoneNumber2,
        itemType: dto.itemType,
        itemDescription: dto.itemDescription,
        deliveryAddress: dto.deliveryAddress,
        recipientName: dto.recipientName,
        recipientPhoneNumber: dto.recipientPhoneNumber,
        specialInstructions: dto.specialInstructions,
        status: dto.status || 'pending',
      },
      include: {
        sender: true,
      },
    });

    return {
      success: true,
      message: 'Delivery request created successfully',
      data: {
        delivery,
        trackingNumber: delivery.trackingNumber,
      },
    };
  }

  findAll() {
    return `This action returns all user`;
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: id,
      },
    });

    return user;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async createErrander(dto: CreateErranderDto, idCardUrl?: string) {
    let user = await this.prisma.user.findFirst({
      where: {
        phoneNumber1: dto.phoneNumber,
        userType: 'errander',
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          fullName: dto.fullName,
          phoneNumber1: dto.phoneNumber,
          phoneNumber2: dto.whatsappNumber,
          email: dto.email,
          userType: 'errander',
        },
      });
    }

    const existingErrander = await this.prisma.errander.findFirst({
      where: { userId: user.id },
    });

    if (existingErrander) {
      return {
        success: true,
        statuscode: '00',
        status: 'SUCCESS',
        message: 'Errander with email already exist ',
      };
    }

    const errander = await this.prisma.errander.create({
      data: {
        userId: user.id,
        fullName: dto.fullName,
        phoneNumber: dto.phoneNumber,
        whatsappNumber: dto.whatsappNumber,
        email: dto.email,
        school: dto.school,
        homeAddress: dto.homeAddress,
        idCardUrl,
        idCardFileName: idCardUrl ? idCardUrl.split('/').pop() : undefined,
        status: dto.status || 'pending',
      },
    });

    return {
      success: true,
      statuscode: '00',
      status: 'SUCCESS',
      message: 'Errander application submitted successfully',
      data: {
        user,
        errander,
        applicationId: errander.id,
      },
    };
  }

  async getErranderByUserId(userId: string) {
    return await this.prisma.errander.findFirst({
      where: { userId },
      include: {
        user: true,
      },
    });
  }

  async updateErranderStatus(
    erranderId: string,
    status: string,
    adminId?: string,
  ) {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'approved') {
      updateData.isVerified = true;
      updateData.verifiedAt = new Date();
      if (adminId) {
        updateData.verifiedBy = adminId;
      }
    }

    return await this.prisma.errander.update({
      where: { id: erranderId },
      data: updateData,
      include: {
        user: true,
      },
    });
  }

  async getAllErranders(status?: string) {
    const where = status ? { status } : {};

    return await this.prisma.errander.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
