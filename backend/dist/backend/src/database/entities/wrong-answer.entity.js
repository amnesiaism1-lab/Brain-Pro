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
exports.WrongAnswer = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let WrongAnswer = class WrongAnswer {
    id;
    userId;
    user;
    exerciseSlug;
    difficultyLevel;
    round;
    questionContext;
    correctAnswer;
    userAnswer;
    errorCategory;
    severity;
    confusionPairKey;
    responseTimeMs;
    sessionId;
    reviewStatus;
    reviewCount;
    lastReviewedAt;
    nextReviewAt;
    easeFactor;
    createdAt;
};
exports.WrongAnswer = WrongAnswer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WrongAnswer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', nullable: true }),
    __metadata("design:type", String)
], WrongAnswer.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], WrongAnswer.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'exercise_slug', length: 50 }),
    __metadata("design:type", String)
], WrongAnswer.prototype, "exerciseSlug", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'difficulty_level' }),
    __metadata("design:type", Number)
], WrongAnswer.prototype, "difficultyLevel", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], WrongAnswer.prototype, "round", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'question_context', type: 'simple-json' }),
    __metadata("design:type", Object)
], WrongAnswer.prototype, "questionContext", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'correct_answer', type: 'simple-json' }),
    __metadata("design:type", Object)
], WrongAnswer.prototype, "correctAnswer", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_answer', type: 'simple-json' }),
    __metadata("design:type", Object)
], WrongAnswer.prototype, "userAnswer", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_category', length: 40 }),
    __metadata("design:type", String)
], WrongAnswer.prototype, "errorCategory", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 15 }),
    __metadata("design:type", String)
], WrongAnswer.prototype, "severity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'confusion_pair_key', length: 60 }),
    __metadata("design:type", String)
], WrongAnswer.prototype, "confusionPairKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'response_time_ms' }),
    __metadata("design:type", Number)
], WrongAnswer.prototype, "responseTimeMs", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'session_id', length: 60 }),
    __metadata("design:type", String)
], WrongAnswer.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'review_status', length: 20, default: 'new' }),
    __metadata("design:type", String)
], WrongAnswer.prototype, "reviewStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'review_count', default: 0 }),
    __metadata("design:type", Number)
], WrongAnswer.prototype, "reviewCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_reviewed_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], WrongAnswer.prototype, "lastReviewedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'next_review_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], WrongAnswer.prototype, "nextReviewAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ease_factor', type: 'decimal', precision: 3, scale: 2, default: 2.5 }),
    __metadata("design:type", Number)
], WrongAnswer.prototype, "easeFactor", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], WrongAnswer.prototype, "createdAt", void 0);
exports.WrongAnswer = WrongAnswer = __decorate([
    (0, typeorm_1.Entity)('wrong_answers'),
    (0, typeorm_1.Index)(['userId', 'exerciseSlug', 'createdAt']),
    (0, typeorm_1.Index)(['userId', 'confusionPairKey'])
], WrongAnswer);
//# sourceMappingURL=wrong-answer.entity.js.map