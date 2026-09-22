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
exports.WorkoutsController = void 0;
const common_1 = require("@nestjs/common");
const data_store_service_1 = require("../../database/data-store.service");
let WorkoutsController = class WorkoutsController {
    dataStore;
    constructor(dataStore) {
        this.dataStore = dataStore;
    }
    getAllRoutines() {
        return {
            success: true,
            data: this.dataStore.getRoutines()
        };
    }
    getRoutineByCode(code) {
        const routine = this.dataStore.getRoutineByCode(code);
        if (!routine) {
            return {
                success: false,
                message: `Workout routine '${code}' not found`
            };
        }
        return {
            success: true,
            data: routine
        };
    }
};
exports.WorkoutsController = WorkoutsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WorkoutsController.prototype, "getAllRoutines", null);
__decorate([
    (0, common_1.Get)(':code'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WorkoutsController.prototype, "getRoutineByCode", null);
exports.WorkoutsController = WorkoutsController = __decorate([
    (0, common_1.Controller)('workouts'),
    __metadata("design:paramtypes", [data_store_service_1.DataStoreService])
], WorkoutsController);
//# sourceMappingURL=workouts.controller.js.map