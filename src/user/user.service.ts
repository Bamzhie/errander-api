import { Injectable } from '@nestjs/common';
import { CreateDeliveryRequestDto } from './dto/create-delievery.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateErranderDto } from './dto/create-errander.dto';
import {
  UpdateDeliveryDto,
  DeliveryStatus,
  ValidStatuses,
} from './dto/update-delievery.dto';
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
            select: {
              fullName: true,
              id: true,
              email: true,
              whatsappNumber: true,
            },
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
        errander: delivery.errander
          ? {
              id: delivery.errander.id,
              name: delivery.errander.fullName,
              email: delivery.errander.email,
              phone: delivery.errander.whatsappNumber,
            }
          : null,
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
      const erranderDetails = delivery.errander
        ? {
            id: delivery.errander.id,
            fullName: delivery.errander.fullName,
            phone: delivery.errander.phoneNumber1,
            whatsapp: delivery.errander.whatsappNumber || 'N/A',
            email: delivery.errander.email || 'N/A',
          }
        : null;

      const mappedDelivery = {
        id: delivery.id,
        orderNumber: delivery.trackingNumber,
        sender: {
          name:
            delivery.sender?.fullName ||
            delivery.senderName ||
            'Unknown Sender',
          email: delivery.sender?.email || 'N/A',
          phone1:
            delivery.sender?.phoneNumber1 || delivery.senderPhone1 || 'N/A',
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
          estimatedDeliveryDate:
            delivery.estimatedDeliveryDate?.toISOString() || 'N/A',
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
  private normalizeStatus(
    status: string,
  ): 'pending' | 'in-transit' | 'delivered' | 'cancelled' {
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
      // Early validation with optimized lookups
      const validationError = this.validateUpdateDto(updateDto);
      if (validationError) {
        return this.createErrorResponse(validationError);
      }

      // Fetch current delivery with optimized select
      const currentDelivery = await this.prisma.delivery.findUnique({
        where: { id },
        select: {
          id: true,
          trackingNumber: true,
          senderName: true,
          recipientName: true,
          recipientPhoneNumber: true,
          deliveryAddress: true,
          itemType: true,
          itemDescription: true,
          specialInstructions: true,
          status: true,
          deliveryFee: true,
          erranderId: true,
          createdAt: true,
          estimatedDeliveryDate: true,
          images: true,
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

      if (!currentDelivery) {
        return this.createErrorResponse('Delivery not found');
      }

      // Business logic validation
      const businessValidationError = await this.validateBusinessRules(
        updateDto,
        currentDelivery,
      );
      if (businessValidationError) {
        return this.createErrorResponse(businessValidationError);
      }

      // Prepare all operations
      const { updateData, userOperations } = this.prepareOperations(
        updateDto,
        currentDelivery,
      );

      // Execute all database operations in parallel
      const [updatedDelivery] = await Promise.all([
        this.prisma.delivery.update({
          where: { id },
          data: updateData,
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
        }),
        ...userOperations,
      ]);

      return {
        statuscode: '00',
        status: 'SUCCESS',
        message: 'Delivery updated successfully',
        data: this.mapDeliveryResponse(updatedDelivery),
      };
    } catch (error) {
      return this.createErrorResponse(
        'Failed to update delivery: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
      );
    }
  }

  // Optimized validation methods
  private validateUpdateDto(updateDto: UpdateDeliveryDto): string | null {
    // Use Set for O(1) lookup performance
    const VALID_STATUSES = new Set<DeliveryStatus>([
      'pending',
      'confirmed',
      'picked_up',
      'in-transit',
      'delivered',
      'failed_delivery',
      'cancelled',
    ]);

    if (
      updateDto.status &&
      !VALID_STATUSES.has(updateDto.status.toLowerCase() as DeliveryStatus)
    ) {
      return 'Invalid status value';
    }

    if (updateDto.deliveryFee !== undefined && updateDto.deliveryFee <= 0) {
      return 'Delivery fee must be a positive number';
    }

    return null;
  }

  private async validateBusinessRules(
    updateDto: UpdateDeliveryDto,
    currentDelivery: any,
  ): Promise<string | null> {
    // Validate errander exists if provided
    if (updateDto.erranderId !== undefined && updateDto.erranderId) {
      const errander = await this.prisma.user.findFirst({
        where: { id: updateDto.erranderId, userType: 'errander' },
        select: { id: true },
      });

      if (!errander) {
        return 'No errander found with the provided ID';
      }
    }

    // Status-specific business rules
    if (updateDto.status) {
      const lowerStatus = updateDto.status.toLowerCase() as DeliveryStatus;
      const effectiveErranderId =
        updateDto.erranderId ?? currentDelivery.erranderId;
      const effectiveDeliveryFee =
        updateDto.deliveryFee ?? currentDelivery.deliveryFee;

      // Validate status transitions
      if (['in-transit', 'delivered'].includes(lowerStatus)) {
        if (!effectiveErranderId) {
          return 'Errander ID is required for status transition to in-transit or delivered';
        }
        if (!effectiveDeliveryFee || effectiveDeliveryFee <= 0) {
          return 'A positive delivery fee is required for status transition to in-transit or delivered';
        }
      }

      if (
        lowerStatus === 'confirmed' &&
        currentDelivery.status.toLowerCase() !== 'pending'
      ) {
        return 'Can only transition to confirmed from pending status';
      }
    }

    return null;
  }

  private prepareOperations(
    updateDto: UpdateDeliveryDto,
    currentDelivery: any,
  ) {
    const updateData: any = { updatedAt: new Date() };
    const userOperations: Promise<any>[] = [];

    // Handle status updates
    if (updateDto.status) {
      const lowerStatus = updateDto.status.toLowerCase() as DeliveryStatus;
      updateData.status = updateDto.status.toUpperCase();

      if (lowerStatus === 'delivered') {
        updateData.actualDeliveryDate = new Date();
      }

      if (lowerStatus === 'in-transit' && updateDto.erranderId) {
        userOperations.push(
          this.prisma.user.update({
            where: { id: updateDto.erranderId },
            data: { erranderStatus: 'ON-DELIVERY' },
          }),
        );
      }

      if (lowerStatus === 'cancelled') {
        if (currentDelivery.erranderId) {
          userOperations.push(
            this.prisma.user.update({
              where: { id: currentDelivery.erranderId },
              data: { erranderStatus: 'APPROVED' },
            }),
          );
        }
        updateData.erranderId = null;
      }
    }

    // Handle errander updates
    if (updateDto.erranderId !== undefined) {
      updateData.erranderId = updateDto.erranderId;

      if (updateDto.erranderId) {
        userOperations.push(
          this.prisma.user.update({
            where: { id: updateDto.erranderId },
            data: { erranderStatus: 'ON-DELIVERY' },
          }),
        );
      } else if (currentDelivery.erranderId) {
        userOperations.push(
          this.prisma.user.update({
            where: { id: currentDelivery.erranderId },
            data: { erranderStatus: 'APPROVED' },
          }),
        );
      }
    }

    // Handle delivery fee updates
    if (updateDto.deliveryFee !== undefined) {
      updateData.deliveryFee = updateDto.deliveryFee;
    }

    return { updateData, userOperations };
  }

  private mapDeliveryResponse(delivery: any) {
    return {
      id: delivery.id,
      orderNumber: delivery.trackingNumber,
      sender: {
        name:
          delivery.sender?.fullName || delivery.senderName || 'Unknown Sender',
        email: delivery.sender?.email || 'N/A',
        phone1: delivery.sender?.phoneNumber1 || 'N/A',
        phone2: delivery.sender?.phoneNumber2 || 'N/A',
      },
      receiver: {
        name: delivery.recipientName,
        phone: delivery.recipientPhoneNumber || 'N/A',
      },
      deliveryAddress: delivery.deliveryAddress || 'N/A',
      itemDetails: {
        type: delivery.itemType,
        description: delivery.itemDescription || 'N/A',
        specialInstructions: delivery.specialInstructions || 'None',
      },
      status: delivery.status.toLowerCase() as DeliveryStatus,
      timeline: {
        createdAt: delivery.createdAt.toISOString(),
        estimatedDeliveryDate:
          delivery.estimatedDeliveryDate?.toISOString() || 'N/A',
      },
      deliveryFee: delivery.deliveryFee || 0,
      errander: delivery.errander
        ? {
            id: delivery.errander.id,
            fullName: delivery.errander.fullName,
            phone: delivery.errander.phoneNumber1 || 'N/A',
            whatsapp: delivery.errander.whatsappNumber || 'N/A',
            email: delivery.errander.email || 'N/A',
          }
        : null,
      images: delivery.images || [],
    };
  }

  private createErrorResponse(message: string) {
    return {
      statuscode: '01',
      status: 'FAILED',
      message,
    };
  }

async getDashboardData() {
  // Get all data in parallel for better performance
  const [totalCustomers, totalErranders, deliveries, users] = await Promise.all([
    this.prisma.user.count({ where: { userType: 'customer' } }),
    this.prisma.user.count({ where: { userType: 'errander' } }),
    this.prisma.delivery.findMany(),
    this.prisma.user.findMany(),
  ]);

  // Process deliveries data
  const totalDeliveries = deliveries.length;
  const pendingDeliveries = deliveries.filter((d) => d.status === 'PENDING').length;
  const completedDeliveries = deliveries.filter((d) => d.status === 'DELIVERED').length;
  const inTransitDeliveries = deliveries.filter((d) => d.status === 'IN_TRANSIT').length;
  const cancelledDeliveries = deliveries.filter((d) => d.status === 'CANCELLED').length;

  // Calculate total revenue based on deliveryFee of DELIVERED deliveries
  const totalRevenue = deliveries
    .filter((d) => d.status === 'DELIVERED')
    .reduce((sum, d) => sum + (d.deliveryFee || 0), 0);

  // Process erranders data
  const erranders = users.filter((u) => u.userType === 'errander');
  const availableErranders = erranders.filter(
    (e) => e.status === 'active' && e.erranderStatus === 'APPROVED',
  ).length;
  const onTripErranders = erranders.filter(
    (e) => e.status === 'active' && e.erranderStatus === 'APPROVED',
  ).length; // You may want to refine this based on trips
  const offlineErranders = erranders.filter((e) => e.status !== 'active').length;
  const activeErranders = erranders.filter(
    (e) => e.status === 'active' && e.erranderStatus === 'APPROVED',
  ).length;

  // Generate recent activities
  const recentActivities = this.generateRecentActivities(deliveries);

  return {
    success: true,
    message: 'Dashboard data fetched successfully',
    data: {
      stats: {
        totalRevenue,
        totalCustomers,
        totalDeliveries,
        pendingDeliveries,
        completedDeliveries,
        inTransitDeliveries,
        cancelledDeliveries,
        activeErranders,
        availableErranders,
        onTripErranders,
        offlineErranders,
        totalErranders,
      },
      recentActivities,
    },
  };
}


  private generateRecentActivities(deliveries: any[]) {
    const sortedDeliveries = deliveries
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);

    return sortedDeliveries.map((delivery) => {
      let activityType: string;
      let message: string;
      let color: string;

      switch (delivery.status) {
        case 'DELIVERED':
          activityType = 'delivery_completed';
          message = 'Delivery completed';
          color = 'green';
          break;
        case 'IN_TRANSIT':
          activityType = 'delivery_in_transit';
          message = 'Delivery in transit';
          color = 'blue';
          break;
        case 'CANCELLED':
          activityType = 'delivery_cancelled';
          message = 'Delivery cancelled';
          color = 'red';
          break;
        default:
          activityType = 'delivery_pending';
          message = 'New delivery created';
          color = 'yellow';
      }

      return {
        id: delivery.id,
        type: activityType,
        message,
        description: `Order ${delivery.trackingNumber} - ${delivery.senderName} to ${delivery.recipientName}`,
        time: this.getTimeAgo(delivery.createdAt),
        color,
      };
    });
  }

  private getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}
