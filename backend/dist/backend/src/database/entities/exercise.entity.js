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
exports.Exercise = void 0;
const typeorm_1 = require("typeorm");
const exercise_level_config_entity_1 = require("./exercise-level-config.entity");
const game_attempt_entity_1 = require("./game-attempt.entity");
let Exercise = class Exercise {
    id;
    categoryId;
    categoryCode;
    categoryName;
    slug;
    title;
    subtitle;
    iconName;
    scientificBasis;
    instructions;
    rulesSummary;
    maxDifficultyLevel;
    defaultDurationSec;
    isFeatured;
    createdAt;
    levelConfigs;
    attempts;
};
exports.Exercise = Exercise;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Exercise.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'category_id', length: 50 }),
    __metadata("design:type", String)
], Exercise.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'category_code', length: 50 }),
    __metadata("design:type", String)
], Exercise.prototype, "categoryCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'category_name', length: 100 }),
    __metadata("design:type", String)
], Exercise.prototype, "categoryName", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 100 }),
    __metadata("design:type", String)
], Exercise.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150 }),
    __metadata("design:type", String)
], Exercise.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Exercise.prototype, "subtitle", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'icon_name', length: 50 }),
    __metadata("design:type", String)
], Exercise.prototype, "iconName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'scientific_basis', type: 'text' }),
    __metadata("design:type", String)
], Exercise.prototype, "scientificBasis", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Exercise.prototype, "instructions", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rules_summary', type: 'text' }),
    __metadata("design:type", String)
], Exercise.prototype, "rulesSummary", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_difficulty_level', default: 8 }),
    __metadata("design:type", Number)
], Exercise.prototype, "maxDifficultyLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_duration_sec', default: 60 }),
    __metadata("design:type", Number)
], Exercise.prototype, "defaultDurationSec", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_featured', default: false }),
    __metadata("design:type", Boolean)
], Exercise.prototype, "isFeatured", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Exercise.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => exercise_level_config_entity_1.ExerciseLevelConfig, config => config.exercise, { cascade: true }),
    __metadata("design:type", Array)
], Exercise.prototype, "levelConfigs", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => game_attempt_entity_1.GameAttempt, attempt => attempt.exercise),
    __metadata("design:type", Array)
], Exercise.prototype, "attempts", void 0);
exports.Exercise = Exercise = __decorate([
    (0, typeorm_1.Entity)('exercises')
], Exercise);
//# sourceMappingURL=exercise.entity.js.map