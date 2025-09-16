import { Injectable } from '@nestjs/common';
import { CreateDeliveryRequestDto } from './dto/create-delievery.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateErranderDto } from './dto/create-errander.dto';
import { UpdateDeliveryDto } from './dto/update-delievery.dto';

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
        itemType: dto.itemType,
        itemDescription: dto.itemDescription,
        deliveryAddress: dto.deliveryAddress,
        recipientName: dto.recipientName,
        recipientPhoneNumber: dto.recipientPhoneNumber,
        specialInstructions: dto.specialInstructions,
        status: dto.status || 'PENDING',
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
      const usersWithStats = await this.prisma.user.findMany({
        where: {
          userType: 'customer',
        },
        include: {
          sentDeliveries: {
            select: {
              deliveryFee: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const formattedUsers = usersWithStats.map((user) => {
        const deliveries = user.sentDeliveries;
        const totalOrders = deliveries.length;

        const totalSpent = deliveries.reduce(
          (sum, delivery) => sum + (delivery.deliveryFee || 0),
          0,
        );

        const lastOrderDate = deliveries[0]?.createdAt;

        const status = this.determineUserStatus(totalOrders, lastOrderDate);

        return {
          id: user.id,
          fullName: user.fullName,
          email: user.email || '',
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
      });

      return {
        success: true,
        message: 'Users fetched successfully',
        data: formattedUsers,
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
    if (totalOrders === 0) return 'inactive';

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
      const userWithStats = await this.prisma.user.findFirst({
        where: {
          id: id,
        },
        include: {
          sentDeliveries: {
            select: {
              deliveryFee: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!userWithStats) {
        return {
          statuscode: '01',
          status: 'FAILED',
          message: 'User not found',
        };
      }

      const { sentDeliveries, ...user } = userWithStats;

      const totalOrders = sentDeliveries.length;
      const totalSpent = sentDeliveries.reduce(
        (sum, delivery) => sum + (delivery.deliveryFee || 0),
        0,
      );
      const lastOrderDate = sentDeliveries[0]?.createdAt;

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

  async findAllDeliveries() {
    try {
      const deliveries = await this.prisma.delivery.findMany({
        include: {
          sender: {
            select: {
              fullName: true,
              email: true,
              phoneNumber1: true,
              phoneNumber2: true,
            },
          },
          errander: {
            select: { fullName: true, id: true, email: true, whatsappNumber: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const mappedDeliveries = deliveries.map((delivery) => ({
        id: delivery.id,
        orderNumber: delivery.trackingNumber,
        sender:
          delivery.sender?.fullName || delivery.senderName || 'Unknown Sender',
        senderEmail: delivery.sender?.email || 'N/A',
        senderPhone1:
          delivery.sender?.phoneNumber1 || delivery.senderPhone1 || 'N/A',
        senderPhone2: delivery.sender?.phoneNumber2 || 'N/A',
        receiver: delivery.recipientName,
        receiverPhone: delivery.recipientPhoneNumber,
        deliveryAddress: delivery.deliveryAddress,
        
        itemType: delivery.itemType,
        itemDescription: delivery.itemDescription || 'N/A',
        specialInstructions: delivery.specialInstructions || 'None',
        status: delivery.status.toLowerCase() as
          | 'pending'
          | 'in-transit'
          | 'delivered'
          | 'cancelled',
        createdAt: delivery.createdAt.toISOString(),
        estimatedDeliveryDate:
          delivery.estimatedDeliveryDate?.toISOString() || 'N/A',
        deliveryFee: delivery.deliveryFee || 0,
        errander: delivery.errander ? {
        id: delivery.errander.id,
        name: delivery.errander.fullName,
        email: delivery.errander.email,
        phone: delivery.errander.whatsappNumber,
      } : null,
      }));

      return {
        success: true,
        message: 'Deliveries fetched successfully',
        data: mappedDeliveries,
      };
    } catch (error) {
      return {
        statuscode: '01',
        status: 'FAILED',
        message: 'Failed to fetch deliveries: ' + error.message,
      };
    }
  }

async findOneDelivery(id: string) {
  try {
    const delivery = await this.prisma.delivery.findFirst({
      where: {
        id,
      },
      include: {
        sender: {
          select: {
            fullName: true,
            email: true,
            phoneNumber1: true,
            phoneNumber2: true,
          },
        },
        errander: {
          select: { 
            id: true,
            fullName: true,
            phoneNumber1: true,
            whatsappNumber: true,
            email: true,
          },
        },
      },
    });

    if (!delivery) {
      return {
        success: false,
        statusCode: 404,
        message: `Delivery with ID ${id} not found`,
        data: null,
      };
    }

    // Create separate errander object
    const erranderDetails = delivery.errander ? {
      id: delivery.errander.id,
      fullName: delivery.errander.fullName,
      phone: delivery.errander.phoneNumber1,
      whatsapp: delivery.errander.whatsappNumber || 'N/A',
      email: delivery.errander.email || 'N/A',
    } : null;

    const mappedDelivery = {
      id: delivery.id,
      orderNumber: delivery.trackingNumber,
      sender: {
        name: delivery.sender?.fullName || delivery.senderName || 'Unknown Sender',
        email: delivery.sender?.email || 'N/A',
        phone1: delivery.sender?.phoneNumber1 || delivery.senderPhone1 || 'N/A',
        phone2: delivery.sender?.phoneNumber2 || 'N/A',
      },
      receiver: {
        name: delivery.recipientName,
        phone: delivery.recipientPhoneNumber,
      },
      deliveryAddress: delivery.deliveryAddress,
      itemDetails: {
        type: delivery.itemType,
        description: delivery.itemDescription || 'N/A',
        specialInstructions: delivery.specialInstructions || 'None',
      },
      status: this.normalizeStatus(delivery.status),
      timeline: {
        createdAt: delivery.createdAt.toISOString(),
        estimatedDeliveryDate: delivery.estimatedDeliveryDate?.toISOString() || 'N/A',
      },
      deliveryFee: delivery.deliveryFee || 0,
      errander: erranderDetails,
    };

    return {
      success: '01',
      statusCode: 200,
      message: 'Delivery fetched successfully',
      data: mappedDelivery,
    };
  } catch (error) {
    console.error(`Error fetching delivery ${id}:`, error);
    return {
      success: false,
      statusCode: 500,
      message: 'Failed to fetch delivery: ' + error.message,
    };
  }
}

// Helper method to normalize status values (reuse from previous example)
private normalizeStatus(status: string): 'pending' | 'in-transit' | 'delivered' | 'cancelled' {
  const normalizedStatus = status.toLowerCase().trim();
  
  switch (normalizedStatus) {
    case 'pending':
    case 'in-transit':
    case 'delivered':
    case 'cancelled':
      return normalizedStatus;
    default:
      return 'pending';
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
          whatsappNumber: dto.whatsappNumber,
          school: dto.school,
          homeAddress: dto.homeAddress,
          idCardUrl,
          idCardFileName: idCardUrl ? idCardUrl.split('/').pop() : undefined,
          erranderStatus: dto.status || 'PENDING',
        },
      });
    } else {
      return {
        success: true,
        statuscode: '00',
        status: 'SUCCESS',
        message: 'Errander with phone number already exists',
      };
    }

    return {
      success: true,
      statuscode: '00',
      status: 'SUCCESS',
      message: 'Errander application submitted successfully',
      data: {
        user,
        applicationId: user.id,
      },
    };
  }

  async getErranderByUserId(userId: string) {
    try {
      const errander = await this.prisma.user.findFirst({
        where: { id: userId, userType: 'errander' },
      });

      if (!errander) {
        return {
          statuscode: '01',
          status: 'FAILED',
          message: 'Errander not found',
        };
      }

      return {
        statuscode: '00',
        status: 'SUCCESS',
        message: 'Errander fetched successfully',
        data: errander,
      };
    } catch (error) {
      return {
        statuscode: '01',
        status: 'FAILED',
        message: 'Failed to fetch errander: ' + error.message,
      };
    }
  }

  async updateErranderStatus(
    erranderId: string,
    status: string,
    adminId?: string,
  ) {
    const updateData: any = {
      erranderStatus: status.toUpperCase(),
      updatedAt: new Date(),
    };

    if (status.toLowerCase() === 'approved') {
      updateData.isVerified = true;
      updateData.verifiedAt = new Date();
      if (adminId) {
        updateData.verifiedBy = adminId;
      }
    }

    try {
      const updatedErrander = await this.prisma.user.update({
        where: { id: erranderId },
        data: updateData,
      });

      return {
        statuscode: '00',
        status: 'SUCCESS',
        message: 'Errander status updated successfully',
        data: updatedErrander,
      };
    } catch (error) {
      return {
        statuscode: '01',
        status: 'FAILED',
        message: 'Failed to update errander status: ' + error.message,
      };
    }
  }

  async getAllErranders(status?: string) {
    const where: any = { userType: 'errander' };
    if (status) {
      where.erranderStatus = status.toUpperCase();
    }

    try {
      const erranders = await this.prisma.user.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        message: 'Erranders fetched successfully',
        data: erranders,
      };
    } catch (error) {
      return {
        statuscode: '01',
        status: 'FAILED',
        message: 'Failed to fetch erranders: ' + error.message,
      };
    }
  }

  async findAllErranders() {
    try {
      const errandersWithStats = await this.prisma.user.findMany({
        where: { userType: 'errander' },
        include: {
          assignedDeliveries: {
            select: {
              deliveryFee: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const formattedErranders = errandersWithStats.map((errander) => {
        const deliveries = errander.assignedDeliveries;
        const totalDeliveries = deliveries.length;

        const earnings = deliveries.reduce(
          (sum, delivery) => sum + (delivery.deliveryFee || 0),
          0,
        );

        const lastDelivery = deliveries[0];
        const lastActive = lastDelivery?.createdAt;

        let status: string;
        switch (errander.erranderStatus?.toLowerCase()) {
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

        let lastActiveFormatted = 'Never';
        if (lastActive) {
          const timeDiff = Date.now() - lastActive.getTime();
          if (timeDiff < 3600000) {
            lastActiveFormatted = 'Recent';
          } else {
            lastActiveFormatted = lastActive.toISOString().split('T')[0];
          }
        }

        return {
          id: errander.id,
          name: errander.fullName,
          email: errander.email || '',
          phone: errander.phoneNumber1,
          address: errander.homeAddress,
          status,
          totalDeliveries,
          joinDate: errander.createdAt.toISOString().split('T')[0],
          lastActive: lastActiveFormatted,
          earnings,
          idCardUrl: errander.idCardUrl,
        };
      });

      return {
        success: true,
        message: 'Erranders fetched successfully',
        data: formattedErranders,
      };
    } catch (error) {
      return {
        statuscode: '01',
        status: 'FAILED',
        message: 'Failed to fetch erranders: ' + error.message,
      };
    }
  }

async updateDeliveryStatus(id: string, updateDto: UpdateDeliveryDto) {
  try {
    // Fetch current delivery to get existing values
    const currentDelivery = await this.prisma.delivery.findUnique({
      where: { id },
      select: {
        erranderId: true,
        deliveryFee: true,
        status: true,
      },
    });

    if (!currentDelivery) {
      return {
        statuscode: '01',
        status: 'FAILED',
        message: 'Delivery not found',
      };
    }

    const validStatuses = [
      'pending',
      'confirmed',
      'picked_up',
      'in-transit',
      'delivered',
      'failed_delivery',
      'cancelled',
    ];

    if (updateDto.status) {
      const statusLower = updateDto.status.toLowerCase();
      if (!validStatuses.includes(statusLower)) {
        return {
          statuscode: '01',
          status: 'FAILED',
          message: 'Invalid status value',
        };
      }
    }

    // Use existing values if not provided in update
    const effectiveErranderId = updateDto.erranderId ?? currentDelivery.erranderId;
    // If updateDto.deliveryFee is undefined, fall back to currentDelivery.deliveryFee
    const effectiveDeliveryFee = updateDto.deliveryFee ?? currentDelivery.deliveryFee;

    // Validate erranderId only if explicitly provided in update
    if (updateDto.erranderId !== undefined && updateDto.erranderId) {
      const errander = await this.prisma.user.findFirst({
        where: { 
          id: updateDto.erranderId, 
          userType: 'errander',
        },
      });

      if (!errander) {
        return {
          statuscode: '01',
          status: 'FAILED',
          message: 'No errander found with the provided ID',
        };
      }
    }

    // Validation for status transitions to 'in-transit' or 'delivered'
    if (updateDto.status) {
      const lowerStatus = updateDto.status.toLowerCase();
      if (lowerStatus === 'in-transit' || lowerStatus === 'delivered') {
        if (!effectiveErranderId) {
          return {
            statuscode: '01',
            status: 'FAILED',
            message: 'Errander ID is required for status transition to in-transit or delivered',
          };
        }
        // Explicitly check for null or undefined, and ensure fee is positive
        if (effectiveDeliveryFee === null || effectiveDeliveryFee === undefined || effectiveDeliveryFee <= 0) {
          return {
            statuscode: '01',
            status: 'FAILED',
            message: 'A positive delivery fee is required for status transition to in-transit or delivered',
          };
        }
      }
      // Allow 'confirmed' without requiring erranderId or deliveryFee
      if (lowerStatus === 'confirmed' && currentDelivery.status.toLowerCase() !== 'pending') {
        return {
          statuscode: '01',
          status: 'FAILED',
          message: 'Can only transition to confirmed from pending status',
        };
      }
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updateDto.status) {
      updateData.status = updateDto.status.toUpperCase();
      const lowerStatus = updateDto.status.toLowerCase();
      if (lowerStatus === 'delivered') {
        updateData.actualDeliveryDate = new Date();
      }
      if (lowerStatus === 'in-transit' && updateDto.erranderId) {
        // Update errander status to 'on-delivery' only if new assignment
        await this.prisma.user.update({
          where: { id: updateDto.erranderId },
          data: { erranderStatus: 'ON-DELIVERY' },
        });
      }
      if (lowerStatus === 'cancelled') {
        // Reset errander assignment if one was set
        if (currentDelivery.erranderId) {
          await this.prisma.user.update({
            where: { id: currentDelivery.erranderId },
            data: { erranderStatus: 'APPROVED' },
          });
        }
        updateData.erranderId = null; // Clear assignment
      }
    }

    if (updateDto.erranderId !== undefined) {
      if (updateDto.erranderId) {
        // Update errander status to on-delivery if assigning
        await this.prisma.user.update({
          where: { id: updateDto.erranderId },
          data: { erranderStatus: 'ON-DELIVERY' },
        });
      } else {
        // If clearing assignment
        if (currentDelivery.erranderId) {
          await this.prisma.user.update({
            where: { id: currentDelivery.erranderId },
            data: { erranderStatus: 'APPROVED' },
          });
        }
      }
      updateData.erranderId = updateDto.erranderId;
    }

    if (updateDto.deliveryFee !== undefined) {
      if (updateDto.deliveryFee <= 0) {
        return {
          statuscode: '01',
          status: 'FAILED',
          message: 'Delivery fee must be a positive number',
        };
      }
      updateData.deliveryFee = updateDto.deliveryFee;
    }

    const delivery = await this.prisma.delivery.update({
      where: { id },
      data: updateData,
      include: {
        sender: {
          select: { fullName: true },
        },
        errander: {
          select: { fullName: true },
        },
      },
    });

    const mappedDelivery = {
      id: delivery.id,
      orderNumber: delivery.trackingNumber,
      sender: delivery.sender?.fullName || delivery.senderName || 'Unknown Sender',
      receiver: delivery.recipientName,
      errander: delivery.errander?.fullName || 'Unassigned',
      itemType: delivery.itemType,
      itemDescription: delivery.itemDescription || 'N/A',
      status: delivery.status.toLowerCase() as
        | 'pending'
        | 'confirmed'
        | 'picked_up'
        | 'in-transit'
        | 'delivered'
        | 'failed_delivery'
        | 'cancelled',
      deliveryFee: delivery.deliveryFee || 0,
    };

    return {
      statuscode: '00',
      status: 'SUCCESS',
      message: 'Delivery updated successfully',
      data: mappedDelivery,
    };
  } catch (error) {
    return {
      statuscode: '01',
      status: 'FAILED',
      message: 'Failed to update delivery: ' + error.message,
    };
  }
}
}
