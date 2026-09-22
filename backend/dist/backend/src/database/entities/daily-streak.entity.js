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
exports.DailyStreak = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let DailyStreak = class DailyStreak {
    id;
    userId;
    user;
    streakDate;
    minutesTrained;
    exercisesCompleted;
    xpEarned;
};
exports.DailyStreak = DailyStreak;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DailyStreak.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], DailyStreak.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.streaks, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], DailyStreak.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'streak_date', type: 'date' }),
    __metadata("design:type", String)
], DailyStreak.prototype, "streakDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'minutes_trained', default: 0 }),
    __metadata("design:type", Number)
], DailyStreak.prototype, "minutesTrained", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'exercises_completed', default: 0 }),
    __metadata("design:type", Number)
], DailyStreak.prototype, "exercisesCompleted", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'xp_earned', default: 0 }),
    __metadata("design:type", Number)
], DailyStreak.prototype, "xpEarned", void 0);
exports.DailyStreak = DailyStreak = __decorate([
    (0, typeorm_1.Entity)('daily_streaks'),
    (0, typeorm_1.Unique)(['userId', 'streakDate'])
], DailyStreak);
//# sourceMappingURL=daily-streak.entity.js.map