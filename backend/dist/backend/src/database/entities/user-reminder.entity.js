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
exports.UserReminder = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let UserReminder = class UserReminder {
    id;
    userId;
    user;
    reminderTime;
    daysOfWeek;
    isEnabled;
    label;
    createdAt;
};
exports.UserReminder = UserReminder;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserReminder.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], UserReminder.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.reminders, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserReminder.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reminder_time', length: 5, default: '08:00' }),
    __metadata("design:type", String)
], UserReminder.prototype, "reminderTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'days_of_week_json', type: 'simple-json' }),
    __metadata("design:type", Array)
], UserReminder.prototype, "daysOfWeek", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_enabled', default: true }),
    __metadata("design:type", Boolean)
], UserReminder.prototype, "isEnabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, default: 'Đến giờ luyện não mỗi ngày!' }),
    __metadata("design:type", String)
], UserReminder.prototype, "label", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], UserReminder.prototype, "createdAt", void 0);
exports.UserReminder = UserReminder = __decorate([
    (0, typeorm_1.Entity)('user_reminders')
], UserReminder);
//# sourceMappingURL=user-reminder.entity.js.map