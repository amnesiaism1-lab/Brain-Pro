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
exports.GameAttempt = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const exercise_entity_1 = require("./exercise.entity");
let GameAttempt = class GameAttempt {
    id;
    userId;
    user;
    exerciseId;
    exercise;
    exerciseSlug;
    difficultyLevel;
    score;
    accuracyRate;
    timeSpentSec;
    effectiveWpm;
    rawMetricsJson;
    createdAt;
};
exports.GameAttempt = GameAttempt;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], GameAttempt.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], GameAttempt.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.attempts, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], GameAttempt.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'exercise_id' }),
    __metadata("design:type", String)
], GameAttempt.prototype, "exerciseId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => exercise_entity_1.Exercise, exercise => exercise.attempts, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'exercise_id' }),
    __metadata("design:type", exercise_entity_1.Exercise)
], GameAttempt.prototype, "exercise", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'exercise_slug', length: 100 }),
    __metadata("design:type", String)
], GameAttempt.prototype, "exerciseSlug", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'difficulty_level' }),
    __metadata("design:type", Number)
], GameAttempt.prototype, "difficultyLevel", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], GameAttempt.prototype, "score", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'accuracy_rate', type: 'decimal', precision: 5, scale: 2 }),
    __metadata("design:type", Number)
], GameAttempt.prototype, "accuracyRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'time_spent_sec', type: 'decimal', precision: 7, scale: 2 }),
    __metadata("design:type", Number)
], GameAttempt.prototype, "timeSpentSec", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'effective_wpm', nullable: true }),
    __metadata("design:type", Number)
], GameAttempt.prototype, "effectiveWpm", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'raw_metrics_json', type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], GameAttempt.prototype, "rawMetricsJson", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], GameAttempt.prototype, "createdAt", void 0);
exports.GameAttempt = GameAttempt = __decorate([
    (0, typeorm_1.Entity)('game_attempts'),
    (0, typeorm_1.Index)(['userId', 'createdAt'])
], GameAttempt);
//# sourceMappingURL=game-attempt.entity.js.map