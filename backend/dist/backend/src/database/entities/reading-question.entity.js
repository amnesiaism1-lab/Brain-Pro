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
exports.ReadingQuestion = void 0;
const typeorm_1 = require("typeorm");
const reading_text_entity_1 = require("./reading-text.entity");
let ReadingQuestion = class ReadingQuestion {
    id;
    readingTextId;
    readingText;
    questionOrder;
    questionText;
    optionA;
    optionB;
    optionC;
    optionD;
    correctOption;
    explanation;
};
exports.ReadingQuestion = ReadingQuestion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ReadingQuestion.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reading_text_id' }),
    __metadata("design:type", String)
], ReadingQuestion.prototype, "readingTextId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => reading_text_entity_1.ReadingText, text => text.questions, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'reading_text_id' }),
    __metadata("design:type", reading_text_entity_1.ReadingText)
], ReadingQuestion.prototype, "readingText", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'question_order' }),
    __metadata("design:type", Number)
], ReadingQuestion.prototype, "questionOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'question_text', type: 'text' }),
    __metadata("design:type", String)
], ReadingQuestion.prototype, "questionText", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'option_a', length: 255 }),
    __metadata("design:type", String)
], ReadingQuestion.prototype, "optionA", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'option_b', length: 255 }),
    __metadata("design:type", String)
], ReadingQuestion.prototype, "optionB", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'option_c', length: 255 }),
    __metadata("design:type", String)
], ReadingQuestion.prototype, "optionC", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'option_d', length: 255 }),
    __metadata("design:type", String)
], ReadingQuestion.prototype, "optionD", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'correct_option', length: 1 }),
    __metadata("design:type", String)
], ReadingQuestion.prototype, "correctOption", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ReadingQuestion.prototype, "explanation", void 0);
exports.ReadingQuestion = ReadingQuestion = __decorate([
    (0, typeorm_1.Entity)('reading_questions')
], ReadingQuestion);
//# sourceMappingURL=reading-question.entity.js.map