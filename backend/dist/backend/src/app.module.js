"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const data_store_service_1 = require("./database/data-store.service");
const exercises_controller_1 = require("./modules/exercises/exercises.controller");
const attempts_controller_1 = require("./modules/attempts/attempts.controller");
const workouts_controller_1 = require("./modules/workouts/workouts.controller");
const reading_assessment_controller_1 = require("./modules/reading-assessment/reading-assessment.controller");
const analytics_controller_1 = require("./modules/analytics/analytics.controller");
const reminders_controller_1 = require("./modules/reminders/reminders.controller");
const auth_controller_1 = require("./modules/auth/auth.controller");
const auth_service_1 = require("./modules/auth/auth.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET || 'brain-exercises-pro-secret-2026',
                signOptions: { expiresIn: '30d' }
            })
        ],
        controllers: [
            exercises_controller_1.ExercisesController,
            attempts_controller_1.AttemptsController,
            workouts_controller_1.WorkoutsController,
            reading_assessment_controller_1.ReadingAssessmentController,
            analytics_controller_1.AnalyticsController,
            reminders_controller_1.RemindersController,
            auth_controller_1.AuthController
        ],
        providers: [data_store_service_1.DataStoreService, auth_service_1.AuthService],
        exports: [data_store_service_1.DataStoreService, auth_service_1.AuthService]
    })
], AppModule);
//# sourceMappingURL=app.module.js.map