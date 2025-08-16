"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UserService = class UserService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createDeliveryRequest(dto) {
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
    async findOne(id) {
        const user = await this.prisma.user.findFirst({
            where: {
                id: id,
            },
        });
        return user;
    }
    update(id, updateUserDto) {
        return `This action updates a #${id} user`;
    }
    remove(id) {
        return `This action removes a #${id} user`;
    }
    async createErrander(dto, idCardUrl) {
        let user = await this.prisma.user.findFirst({
            where: {
                phoneNumber1: dto.phoneNumber,
                userType: 'errander'
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
            return ('Errander application already exists for this user');
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
    async getErranderByUserId(userId) {
        return await this.prisma.errander.findFirst({
            where: { userId },
            include: {
                user: true,
            },
        });
    }
    async updateErranderStatus(erranderId, status, adminId) {
        const updateData = {
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
    async getAllErranders(status) {
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
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserService);
//# sourceMappingURL=user.service.js.map