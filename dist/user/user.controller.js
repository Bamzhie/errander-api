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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const user_service_1 = require("./user.service");
const create_delievery_dto_1 = require("./dto/create-delievery.dto");
const multer_config_1 = require("../file/multer.config");
const platform_express_1 = require("@nestjs/platform-express");
const create_errander_dto_1 = require("./dto/create-errander.dto");
let UserController = class UserController {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
    create(createUserDto) {
        return this.userService.createDeliveryRequest(createUserDto);
    }
    async erranderSetup(files, dto) {
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
        }
        catch (error) {
            return {
                statuscode: '01',
                status: 'FAILED',
                message: error.message || 'Failed to create errander application',
            };
        }
    }
    findAll() {
        return this.userService.findAll();
    }
    findOne(id) {
        return this.userService.findOne(id);
    }
    remove(id) {
        return this.userService.remove(+id);
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Post)('create-delievery'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_delievery_dto_1.CreateDeliveryRequestDto]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('errander'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([{ name: 'idCard', maxCount: 1 }], multer_config_1.multerConfig)),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_errander_dto_1.CreateErranderDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "erranderSetup", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UserController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "findOne", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "remove", null);
exports.UserController = UserController = __decorate([
    (0, common_1.Controller)('user'),
    __metadata("design:paramtypes", [user_service_1.UserService])
], UserController);
//# sourceMappingURL=user.controller.js.map