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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const user_profile_entity_1 = require("./user-profile.entity");
const game_attempt_entity_1 = require("./game-attempt.entity");
const user_assessment_entity_1 = require("./user-assessment.entity");
const daily_streak_entity_1 = require("./daily-streak.entity");
const user_reminder_entity_1 = require("./user-reminder.entity");
let User = class User {
    id;
    email;
    username;
    passwordHash;
    avatarUrl;
    totalXp;
    currentLevel;
    currentStreak;
    bestStreak;
    createdAt;
    updatedAt;
    profile;
    attempts;
    assessments;
    streaks;
    reminders;
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 255 }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 100 }),
    __metadata("design:type", String)
], User.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'password_hash', length: 255 }),
    __metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avatar_url', nullable: true, length: 500 }),
    __metadata("design:type", String)
], User.prototype, "avatarUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_xp', default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "totalXp", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'current_level', default: 1 }),
    __metadata("design:type", Number)
], User.prototype, "currentLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'current_streak', default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "currentStreak", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'best_streak', default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "bestStreak", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_profile_entity_1.UserProfile, profile => profile.user, { cascade: true }),
    __metadata("design:type", user_profile_entity_1.UserProfile)
], User.prototype, "profile", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => game_attempt_entity_1.GameAttempt, attempt => attempt.user),
    __metadata("design:type", Array)
], User.prototype, "attempts", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_assessment_entity_1.UserAssessment, assessment => assessment.user),
    __metadata("design:type", Array)
], User.prototype, "assessments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => daily_streak_entity_1.DailyStreak, streak => streak.user),
    __metadata("design:type", Array)
], User.prototype, "streaks", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_reminder_entity_1.UserReminder, reminder => reminder.user),
    __metadata("design:type", Array)
], User.prototype, "reminders", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
//# sourceMappingURL=user.entity.js.map