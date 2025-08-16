import { CreateDeliveryRequestDto } from './dto/create-delievery.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateErranderDto } from './dto/create-errander.dto';
export declare class UserService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createDeliveryRequest(dto: CreateDeliveryRequestDto): Promise<{
        success: boolean;
        message: string;
        data: {
            delivery: {
                sender: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    email: string | null;
                    fullName: string;
                    phoneNumber1: string;
                    phoneNumber2: string | null;
                    userType: string;
                } | null;
            } & {
                id: string;
                senderName: string;
                senderPhone1: string;
                senderPhone2: string | null;
                itemType: string;
                itemDescription: string | null;
                deliveryAddress: string;
                recipientName: string;
                recipientPhoneNumber: string;
                status: string;
                trackingNumber: string;
                createdAt: Date;
                updatedAt: Date;
                estimatedDeliveryDate: Date | null;
                actualDeliveryDate: Date | null;
                packageWeight: number | null;
                packageDimensions: string | null;
                deliveryFee: number | null;
                specialInstructions: string | null;
                senderId: string;
            };
            trackingNumber: string;
        };
    }>;
    findAll(): string;
    findOne(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        fullName: string;
        phoneNumber1: string;
        phoneNumber2: string | null;
        userType: string;
    } | null>;
    update(id: number, updateUserDto: UpdateUserDto): string;
    remove(id: number): string;
    createErrander(dto: CreateErranderDto, idCardUrl?: string): Promise<"Errander application already exists for this user" | {
        success: boolean;
        statuscode: string;
        status: string;
        message: string;
        data: {
            user: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string | null;
                fullName: string;
                phoneNumber1: string;
                phoneNumber2: string | null;
                userType: string;
            };
            errander: {
                id: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                email: string | null;
                fullName: string;
                phoneNumber: string;
                whatsappNumber: string | null;
                school: string;
                homeAddress: string;
                idCardUrl: string | null;
                idCardFileName: string | null;
                isVerified: boolean;
                verifiedAt: Date | null;
                verifiedBy: string | null;
                userId: string;
            };
            applicationId: string;
        };
    }>;
    getErranderByUserId(userId: string): Promise<({
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            fullName: string;
            phoneNumber1: string;
            phoneNumber2: string | null;
            userType: string;
        } | null;
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        fullName: string;
        phoneNumber: string;
        whatsappNumber: string | null;
        school: string;
        homeAddress: string;
        idCardUrl: string | null;
        idCardFileName: string | null;
        isVerified: boolean;
        verifiedAt: Date | null;
        verifiedBy: string | null;
        userId: string;
    }) | null>;
    updateErranderStatus(erranderId: string, status: string, adminId?: string): Promise<{
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            fullName: string;
            phoneNumber1: string;
            phoneNumber2: string | null;
            userType: string;
        } | null;
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        fullName: string;
        phoneNumber: string;
        whatsappNumber: string | null;
        school: string;
        homeAddress: string;
        idCardUrl: string | null;
        idCardFileName: string | null;
        isVerified: boolean;
        verifiedAt: Date | null;
        verifiedBy: string | null;
        userId: string;
    }>;
    getAllErranders(status?: string): Promise<({
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            fullName: string;
            phoneNumber1: string;
            phoneNumber2: string | null;
            userType: string;
        } | null;
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        fullName: string;
        phoneNumber: string;
        whatsappNumber: string | null;
        school: string;
        homeAddress: string;
        idCardUrl: string | null;
        idCardFileName: string | null;
        isVerified: boolean;
        verifiedAt: Date | null;
        verifiedBy: string | null;
        userId: string;
    })[]>;
}
