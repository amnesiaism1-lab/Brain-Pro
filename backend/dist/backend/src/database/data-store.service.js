"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataStoreService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@brain-exercises/shared");
const shared_2 = require("@brain-exercises/shared");
let DataStoreService = class DataStoreService {
    exercises = [];
    routines = [];
    readingTexts = [];
    attempts = [];
    assessments = [];
    reminders = [
        {
            id: 'rem-1',
            reminderTime: '08:30',
            daysOfWeek: [1, 2, 3, 4, 5],
            isEnabled: true,
            label: 'Luyện tập buổi sáng 15 phút'
        }
    ];
    currentUser = {
        id: 'user-demo-1',
        email: 'user@brainexercises.pro',
        username: 'BrainMaster',
        totalXp: 350,
        currentLevel: 2,
        currentStreak: 4,
        bestStreak: 7,
        profile: {
            id: 'prof-demo-1',
            userId: 'user-demo-1',
            preferredLanguage: 'vi',
            targetWpm: 500,
            dailyGoalMinutes: 15,
            soundEnabled: true,
            theme: 'light',
            autoDifficultyDefault: true
        }
    };
    onModuleInit() {
        this.exercises = JSON.parse(JSON.stringify(shared_1.EXERCISES_METADATA));
        this.routines = JSON.parse(JSON.stringify(shared_1.WORKOUT_ROUTINES));
        this.readingTexts = JSON.parse(JSON.stringify(shared_1.SAMPLE_READING_TEXTS));
    }
    getExercises() {
        return this.exercises;
    }
    getExerciseBySlug(slug) {
        return this.exercises.find(e => e.slug === slug);
    }
    getRoutines() {
        return this.routines;
    }
    getRoutineByCode(code) {
        return this.routines.find(r => r.code === code);
    }
    getReadingTexts() {
        return this.readingTexts;
    }
    getReadingTextById(id) {
        return this.readingTexts.find(t => t.id === id);
    }
    saveGameAttempt(attemptDto) {
        const id = `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        this.attempts.push({
            ...attemptDto,
            id,
            userId: this.currentUser.id,
            createdAt: new Date()
        });
        const xpEarned = Math.round(attemptDto.score / 10) + (attemptDto.accuracyRate >= 80 ? 25 : 10);
        this.currentUser.totalXp += xpEarned;
        this.currentUser.currentLevel = Math.floor(Math.sqrt(this.currentUser.totalXp / 100)) + 1;
        const timeLimit = 60;
        const nextLevel = (0, shared_2.calculateRecommendedNextLevel)(attemptDto.difficultyLevel, attemptDto.accuracyRate, attemptDto.timeSpentSec, timeLimit);
        return {
            id,
            score: attemptDto.score,
            xpEarned,
            currentLevel: this.currentUser.currentLevel,
            totalXp: this.currentUser.totalXp,
            currentStreak: this.currentUser.currentStreak,
            recommendedNextLevel: nextLevel,
            isNewHighScore: true,
            message: `Tuyệt vời! Bạn đã nhận được +${xpEarned} XP rèn luyện nhận thức.`
        };
    }
    saveAssessment(dto) {
        const text = this.getReadingTextById(dto.readingTextId);
        if (!text) {
            throw new Error('Reading text not found');
        }
        const rawWpm = (0, shared_2.calculateWpm)(text.wordCount, dto.readingTimeSec);
        let correctCount = 0;
        const questions = text.questions || [];
        dto.answers.forEach(ans => {
            const q = questions.find(item => item.id === ans.questionId);
            if (q && q.correctOption === ans.selectedOption) {
                correctCount++;
            }
        });
        const totalQuestions = Math.max(1, questions.length);
        const comprehensionScore = Math.round((correctCount / totalQuestions) * 100);
        const effectiveWpm = (0, shared_2.calculateEffectiveWpm)(rawWpm, comprehensionScore);
        const id = `assess-${Date.now()}`;
        const xpEarned = Math.round(effectiveWpm / 5) + (comprehensionScore >= 75 ? 50 : 20);
        this.currentUser.totalXp += xpEarned;
        this.currentUser.currentLevel = Math.floor(Math.sqrt(this.currentUser.totalXp / 100)) + 1;
        const res = {
            id,
            rawWpm,
            comprehensionScore,
            effectiveWpm,
            correctAnswersCount: correctCount,
            totalQuestionsCount: totalQuestions,
            feedback: effectiveWpm >= 500
                ? 'Tốc độ đọc xuất chúng! Bạn đã đạt trình độ đọc siêu nhanh với mức thấu hiểu cao.'
                : effectiveWpm >= 300
                    ? 'Tốc độ rất tốt! Tiếp tục rèn luyện Bảng Schulte và RSVP để khử đọc thầm hoàn toàn.'
                    : 'Khởi đầu tốt! Hãy tập trung vào việc đọc cụm từ thay vì đọc từng chữ đơn lẻ.',
            xpEarned
        };
        this.assessments.push({
            ...res,
            userId: this.currentUser.id,
            readingTextId: dto.readingTextId,
            createdAt: new Date()
        });
        return res;
    }
    getUserStats() {
        const totalMinutes = Math.round(this.attempts.reduce((sum, a) => sum + (a.timeSpentSec || 0), 0) / 60) + 24;
        return {
            totalXp: this.currentUser.totalXp,
            currentLevel: this.currentUser.currentLevel,
            currentStreak: this.currentUser.currentStreak,
            bestStreak: this.currentUser.bestStreak,
            totalSessions: this.attempts.length + 5,
            totalMinutesTrained: totalMinutes,
            averageWpm: 420,
            radar: {
                speedReadingScore: 78,
                peripheralVisionScore: 85,
                memoryScore: 72,
                attentionScore: 90,
                reactionScore: 82
            }
        };
    }
    getCurrentUser() {
        return this.currentUser;
    }
    getReminders() {
        return this.reminders;
    }
    updateReminders(reminders) {
        this.reminders = reminders;
        return this.reminders;
    }
};
exports.DataStoreService = DataStoreService;
exports.DataStoreService = DataStoreService = __decorate([
    (0, common_1.Injectable)()
], DataStoreService);
//# sourceMappingURL=data-store.service.js.map