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
exports.UserAssessment = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const reading_text_entity_1 = require("./reading-text.entity");
let UserAssessment = class UserAssessment {
    id;
    userId;
    user;
    readingTextId;
    readingText;
    readingTimeSec;
    rawWpm;
    comprehensionScore;
    effectiveWpm;
    answersJson;
    completedAt;
};
exports.UserAssessment = UserAssessment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserAssessment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], UserAssessment.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.assessments, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserAssessment.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reading_text_id' }),
    __metadata("design:type", String)
], UserAssessment.prototype, "readingTextId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => reading_text_entity_1.ReadingText, text => text.id, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'reading_text_id' }),
    __metadata("design:type", reading_text_entity_1.ReadingText)
], UserAssessment.prototype, "readingText", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reading_time_sec', type: 'decimal', precision: 7, scale: 2 }),
    __metadata("design:type", Number)
], UserAssessment.prototype, "readingTimeSec", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'raw_wpm' }),
    __metadata("design:type", Number)
], UserAssessment.prototype, "rawWpm", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comprehension_score', type: 'decimal', precision: 5, scale: 2 }),
    __metadata("design:type", Number)
], UserAssessment.prototype, "comprehensionScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'effective_wpm' }),
    __metadata("design:type", Number)
], UserAssessment.prototype, "effectiveWpm", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'answers_json', type: 'simple-json' }),
    __metadata("design:type", Array)
], UserAssessment.prototype, "answersJson", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'completed_at' }),
    __metadata("design:type", Date)
], UserAssessment.prototype, "completedAt", void 0);
exports.UserAssessment = UserAssessment = __decorate([
    (0, typeorm_1.Entity)('user_assessments')
], UserAssessment);
//# sourceMappingURL=user-assessment.entity.js.map