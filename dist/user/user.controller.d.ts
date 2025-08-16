import { UserService } from './user.service';
import { CreateDeliveryRequestDto } from './dto/create-delievery.dto';
import { CreateErranderDto } from './dto/create-errander.dto';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    create(createUserDto: CreateDeliveryRequestDto): Promise<{
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
    erranderSetup(files: {
        idCard?: Express.Multer.File[];
    }, dto: CreateErranderDto): Promise<"Errander application already exists for this user" | {
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
    } | {
        statuscode: string;
        status: string;
        message: any;
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
    remove(id: string): string;
}
