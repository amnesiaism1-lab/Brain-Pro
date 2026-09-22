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
exports.ExerciseLevelConfig = void 0;
const typeorm_1 = require("typeorm");
const exercise_entity_1 = require("./exercise.entity");
let ExerciseLevelConfig = class ExerciseLevelConfig {
    id;
    exerciseId;
    exercise;
    level;
    gridRows;
    gridCols;
    targetItemCount;
    timeLimitSec;
    speedWpm;
    parametersJson;
};
exports.ExerciseLevelConfig = ExerciseLevelConfig;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ExerciseLevelConfig.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'exercise_id' }),
    __metadata("design:type", String)
], ExerciseLevelConfig.prototype, "exerciseId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => exercise_entity_1.Exercise, exercise => exercise.levelConfigs, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'exercise_id' }),
    __metadata("design:type", exercise_entity_1.Exercise)
], ExerciseLevelConfig.prototype, "exercise", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ExerciseLevelConfig.prototype, "level", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'grid_rows', nullable: true }),
    __metadata("design:type", Number)
], ExerciseLevelConfig.prototype, "gridRows", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'grid_cols', nullable: true }),
    __metadata("design:type", Number)
], ExerciseLevelConfig.prototype, "gridCols", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_item_count', nullable: true }),
    __metadata("design:type", Number)
], ExerciseLevelConfig.prototype, "targetItemCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'time_limit_sec' }),
    __metadata("design:type", Number)
], ExerciseLevelConfig.prototype, "timeLimitSec", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'speed_wpm', nullable: true }),
    __metadata("design:type", Number)
], ExerciseLevelConfig.prototype, "speedWpm", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parameters_json', type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], ExerciseLevelConfig.prototype, "parametersJson", void 0);
exports.ExerciseLevelConfig = ExerciseLevelConfig = __decorate([
    (0, typeorm_1.Entity)('exercise_level_configs')
], ExerciseLevelConfig);
//# sourceMappingURL=exercise-level-config.entity.js.map