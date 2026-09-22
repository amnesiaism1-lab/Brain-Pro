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
exports.ReadingText = void 0;
const typeorm_1 = require("typeorm");
const reading_question_entity_1 = require("./reading-question.entity");
let ReadingText = class ReadingText {
    id;
    title;
    category;
    wordCount;
    difficultyLevel;
    content;
    previewExcerpt;
    author;
    createdAt;
    questions;
};
exports.ReadingText = ReadingText;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ReadingText.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], ReadingText.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], ReadingText.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'word_count' }),
    __metadata("design:type", Number)
], ReadingText.prototype, "wordCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'difficulty_level', default: 1 }),
    __metadata("design:type", Number)
], ReadingText.prototype, "difficultyLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], ReadingText.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'preview_excerpt', length: 500 }),
    __metadata("design:type", String)
], ReadingText.prototype, "previewExcerpt", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150 }),
    __metadata("design:type", String)
], ReadingText.prototype, "author", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ReadingText.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => reading_question_entity_1.ReadingQuestion, question => question.readingText, { cascade: true }),
    __metadata("design:type", Array)
], ReadingText.prototype, "questions", void 0);
exports.ReadingText = ReadingText = __decorate([
    (0, typeorm_1.Entity)('reading_texts')
], ReadingText);
//# sourceMappingURL=reading-text.entity.js.map