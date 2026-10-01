"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WrongAnswersModule = void 0;
const common_1 = require("@nestjs/common");
const wrong_answers_controller_1 = require("./wrong-answers.controller");
const wrong_answers_service_1 = require("./wrong-answers.service");
const data_store_service_1 = require("../../database/data-store.service");
const auth_service_1 = require("../auth/auth.service");
const jwt_1 = require("@nestjs/jwt");
let WrongAnswersModule = class WrongAnswersModule {
};
exports.WrongAnswersModule = WrongAnswersModule;
exports.WrongAnswersModule = WrongAnswersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET || 'brain-exercises-pro-secret-2026',
                signOptions: { expiresIn: '30d' }
            })
        ],
        controllers: [wrong_answers_controller_1.WrongAnswersController],
        providers: [wrong_answers_service_1.WrongAnswersService, data_store_service_1.DataStoreService, auth_service_1.AuthService],
        exports: [wrong_answers_service_1.WrongAnswersService]
    })
], WrongAnswersModule);
//# sourceMappingURL=wrong-answers.module.js.map