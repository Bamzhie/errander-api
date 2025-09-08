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

  async findAll() {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          userType: 'customer',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Calculate statistics for each user
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          // Get total orders count
          const totalOrders = await this.prisma.delivery.count({
            where: { senderId: user.id },
          });

          // Calculate total spent by summing all delivery fees (not amount from delivery, but from user.amount or deliveryFee)
          const deliveries = await this.prisma.delivery.findMany({
            where: { senderId: user.id },
            select: { deliveryFee: true },
          });
          const totalSpent = deliveries.reduce(
            (sum, delivery) => sum + (delivery.deliveryFee || 0),
            0,
          );

          // Get last order date
          const lastOrder = await this.prisma.delivery.findFirst({
            where: { senderId: user.id },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          });
          const lastOrderDate = lastOrder?.createdAt;

          // Determine user status based on activity
          const status = this.determineUserStatus(totalOrders, lastOrderDate);

          return {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phoneNumber1: user.phoneNumber1,
            phoneNumber2: user.phoneNumber2,
            userType: user.userType,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            totalOrders,
            totalSpent,
            lastOrderDate,
            status,
          };
        }),
      );

      return {
        success: true,
        message: 'Users fetched successfully',
        data: usersWithStats,
      };
    } catch (error) {
      return {
        statuscode: '01',
        status: 'FAILED',
        message: 'Failed to fetch users: ' + error.message,
      };
    }
  }

  private determineUserStatus(
    totalOrders: number,
    lastOrderDate?: Date,
  ): string {
    // Customize this logic based on your business rules
    if (totalOrders === 0) return 'inactive';

    // Check if user has been inactive for 30 days
    if (lastOrderDate) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      if (lastOrderDate < thirtyDaysAgo) {
        return 'inactive';
      }
    }

    return 'active';
  }

  async findOne(id: string) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id: id,
        },
      });

      if (!user) {
        return {
          statuscode: '01',
          status: 'FAILED',
          message: 'User not found',
        };
      }
      // Calculate statistics for the user
      const totalOrders = await this.prisma.delivery.count({
        where: { senderId: user.id },
      });

      const deliveries = await this.prisma.delivery.findMany({
        where: { senderId: user.id },
        select: { deliveryFee: true },
      });
      const totalSpent = deliveries.reduce(
        (sum, delivery) => sum + (delivery.deliveryFee || 0),
        0,
      );

      const lastOrder = await this.prisma.delivery.findFirst({
        where: { senderId: user.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });
      const lastOrderDate = lastOrder?.createdAt;

      const status = this.determineUserStatus(totalOrders, lastOrderDate);

      return {
        statuscode: '00',
        status: 'SUCCESS',
        message: 'User fetched successfully',
        data: {
          id: user.id,
          fullName: user.fullName,
          email: user.email || '',
          phoneNumber1: user.phoneNumber1,
          phoneNumber2: user.phoneNumber2,
          userType: user.userType,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
          totalOrders,
          totalSpent,
          lastOrderDate: lastOrderDate
            ? lastOrderDate.toISOString()
            : undefined,
          status,
        },
      };
    } catch (error) {
      return {
        statuscode: '01',
        status: 'FAILED',
        message: 'Failed to fetch user: ' + error.message,
      };
    }
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

  async findAllErranders() {
    try {
      const erranders = await this.prisma.errander.findMany({
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const errandersWithStats = await Promise.all(
        erranders.map(async (errander) => {
          // Count deliveries where this errander was assigned
          const totalDeliveries = await this.prisma.delivery.count({
            where: {
              erranderId: errander.id,
            },
          });

          // Calculate earnings from deliveries assigned to this errander
          const deliveries = await this.prisma.delivery.findMany({
            where: {
              erranderId: errander.id,
            },
            select: { deliveryFee: true },
          });
          const earnings = deliveries.reduce(
            (sum, delivery) => sum + (delivery.deliveryFee || 0),
            0,
          );

          // Get last delivery date for this errander
          const lastDelivery = await this.prisma.delivery.findFirst({
            where: {
              erranderId: errander.id,
            },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          });
          const lastActive = lastDelivery?.createdAt;

          // Map errander status to display status
          let status: string;
          switch (errander.status.toLowerCase()) {
            case 'approved':
              status = 'available';
              break;
            case 'on-delivery':
              status = 'on-trip';
              break;
            case 'suspended':
            case 'rejected':
            case 'pending':
              status = 'offline';
              break;
            default:
              status = 'offline';
          }

          // Format last active time
          let lastActiveFormatted = 'Never';
          if (lastActive) {
            const timeDiff = Date.now() - lastActive.getTime();
            if (timeDiff < 3600000) { // Less than 1 hour
              lastActiveFormatted = 'Recent';
            } else {
              lastActiveFormatted = lastActive.toISOString().split('T')[0];
            }
          }

          return {
            id: errander.id,
            name: errander.fullName,
            email: errander.email || '',
            phone: errander.phoneNumber,
            address: errander.homeAddress,
            status,
            totalDeliveries,
            joinDate: errander.user
              ? errander.user.createdAt.toISOString().split('T')[0]
              : errander.createdAt.toISOString().split('T')[0],
            lastActive: lastActiveFormatted,
            earnings,
            idCardUrl: errander.idCardUrl,
          };
        }),
      );

      return {
        success: true,
        message: 'Erranders fetched successfully',
        data: errandersWithStats,
      };
    } catch (error) {
      return {
        statuscode: '01',
        status: 'FAILED',
        message: 'Failed to fetch erranders: ' + error.message,
      };
    }
  }
}