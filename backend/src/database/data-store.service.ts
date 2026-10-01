import { Injectable, OnModuleInit } from '@nestjs/common';
import { 
  EXERCISES_METADATA, 
  WORKOUT_ROUTINES, 
  SAMPLE_READING_TEXTS,
  COGNITIVE_RELATIONS,
  ALL_RELATION_IDS,
  COGNITIVE_RELATION_CHAINS,
  RelationId,
  IRelationshipMastery,
  IRelationEvent,
  createInitialMasteriesMap,
  updateMasteryFromEvents
} from '@brain-exercises/shared';
import { 
  IExercise, 
  IWorkoutRoutine, 
  IReadingText, 
  IGameAttemptRequest, 
  IGameAttemptResponse,
  IUserAssessmentRequest,
  IUserAssessmentResponse,
  IUserStats,
  IUserReminder,
  IWrongAnswer,
  IConfusionPairStat,
  ExerciseSlug
} from '@brain-exercises/shared';
import { 
  calculateRecommendedNextLevel,
  calculateEffectiveWpm,
  calculateWpm,
  calculateNextReviewDate
} from '@brain-exercises/shared';

// Use pg Pool with robust fallback
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Pool } = require('pg');

@Injectable()
export class DataStoreService implements OnModuleInit {
  private exercises: IExercise[] = [];
  private routines: IWorkoutRoutine[] = [];
  private readingTexts: IReadingText[] = [];
  private attempts: Array<IGameAttemptRequest & { id: string; userId: string; createdAt: Date }> = [];
  private assessments: Array<IUserAssessmentResponse & { id: string; userId: string; readingTextId: string; createdAt: Date }> = [];
  private relationMasteries: Record<RelationId, IRelationshipMastery> = createInitialMasteriesMap();
  private wrongAnswers: IWrongAnswer[] = [];
  
  private reminders: IUserReminder[] = [
    {
      id: 'rem-1',
      reminderTime: '08:30',
      daysOfWeek: [1, 2, 3, 4, 5],
      isEnabled: true,
      label: 'Luyện tập buổi sáng 15 phút'
    }
  ];

  private currentUser = {
    id: '4ed61506-d150-4c8c-b04d-e48f329fda3b', // Seeded demo user in Supabase
    email: 'master@brainexercises.pro',
    username: 'BrainMaster',
    totalXp: 550,
    currentLevel: 3,
    currentStreak: 5,
    bestStreak: 10,
    profile: {
      id: 'prof-demo-1',
      userId: '4ed61506-d150-4c8c-b04d-e48f329fda3b',
      preferredLanguage: 'vi' as const,
      targetWpm: 500,
      dailyGoalMinutes: 15,
      soundEnabled: true,
      theme: 'light' as const,
      autoDifficultyDefault: true
    }
  };

  private pgPool: any = null;
  private isSupabaseConnected = false;

  async onModuleInit() {
    this.exercises = JSON.parse(JSON.stringify(EXERCISES_METADATA));
    this.routines = JSON.parse(JSON.stringify(WORKOUT_ROUTINES));
    this.readingTexts = JSON.parse(JSON.stringify(SAMPLE_READING_TEXTS));

    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl || process.env.DB_HOST) {
      try {
        this.pgPool = new Pool({
          connectionString: dbUrl,
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT || '6543', 10),
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME || 'postgres',
          ssl: { rejectUnauthorized: false },
          max: 10,
          idleTimeoutMillis: 30000
        });

        const client = await this.pgPool.connect();
        const res = await client.query('SELECT NOW()');
        client.release();
        this.isSupabaseConnected = true;
        console.log('✅ Supabase PostgreSQL connected successfully at:', res.rows[0].now);

        // Fetch demo user if available
        await this.syncUserFromDatabase();
      } catch (err) {
        console.warn('⚠️ Supabase connection failed, running in resilient In-Memory mode:', err);
        this.isSupabaseConnected = false;
      }
    }
  }

  private async syncUserFromDatabase() {
    if (!this.isSupabaseConnected || !this.pgPool) return;
    try {
      const res = await this.pgPool.query(
        'SELECT id, email, username, total_xp, current_level, current_streak, best_streak FROM users WHERE email = $1 LIMIT 1',
        ['master@brainexercises.pro']
      );
      if (res.rows.length > 0) {
        const u = res.rows[0];
        this.currentUser.id = u.id;
        this.currentUser.totalXp = u.total_xp || 550;
        this.currentUser.currentLevel = u.current_level || 3;
        this.currentUser.currentStreak = u.current_streak || 5;
        this.currentUser.bestStreak = u.best_streak || 10;
      }
    } catch (e) {
      console.warn('Could not sync user from DB:', e);
    }
  }

  getExercises(): IExercise[] {
    return this.exercises;
  }

  getExerciseBySlug(slug: string): IExercise | undefined {
    return this.exercises.find(e => e.slug === slug);
  }

  getRoutines(): IWorkoutRoutine[] {
    return this.routines;
  }

  getRoutineByCode(code: string): IWorkoutRoutine | undefined {
    return this.routines.find(r => r.code === code);
  }

  getReadingTexts(): IReadingText[] {
    return this.readingTexts;
  }

  getReadingTextById(id: string): IReadingText | undefined {
    return this.readingTexts.find(t => t.id === id);
  }

  saveGameAttempt(attemptDto: IGameAttemptRequest, userId?: string): IGameAttemptResponse {
    const id = `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const targetUserId = userId || this.currentUser.id;
    
    // Save to memory
    this.attempts.push({
      ...attemptDto,
      id,
      userId: targetUserId,
      createdAt: new Date()
    });

    const xpEarned = Math.round(attemptDto.score / 10) + (attemptDto.accuracyRate >= 80 ? 25 : 10);
    this.currentUser.totalXp += xpEarned;
    this.currentUser.currentLevel = Math.floor(Math.sqrt(this.currentUser.totalXp / 100)) + 1;

    const timeLimit = 60;
    const nextLevel = calculateRecommendedNextLevel(
      attemptDto.difficultyLevel,
      attemptDto.accuracyRate,
      attemptDto.timeSpentSec,
      timeLimit
    );

    // Update in-memory cognitive relationship masteries
    const relationEvents = attemptDto.rawMetricsJson?.relationEvents as IRelationEvent[] | undefined;
    if (relationEvents && Array.isArray(relationEvents)) {
      for (const relId of ALL_RELATION_IDS) {
        this.relationMasteries[relId] = updateMasteryFromEvents(this.relationMasteries[relId], relationEvents);
      }
    }

    // Persist to Supabase if connected (async)
    if (this.isSupabaseConnected && this.pgPool) {
      this.persistAttemptToSupabase(id, attemptDto, xpEarned, relationEvents, targetUserId).catch(err => {
        console.warn('Async Supabase persistence error:', err);
      });
    }

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

  private async persistAttemptToSupabase(
    id: string, 
    attemptDto: IGameAttemptRequest, 
    xpEarned: number,
    relationEvents?: IRelationEvent[],
    targetUserId?: string
  ) {
    if (!this.pgPool) return;
    const finalUserId = targetUserId || this.currentUser.id;

    // 1. Insert into game_attempts
    await this.pgPool.query(`
      INSERT INTO game_attempts 
        (user_id, exercise_slug, difficulty_level, score, accuracy_rate, time_spent_sec, effective_wpm, raw_metrics_json)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      finalUserId,
      attemptDto.exerciseSlug,
      attemptDto.difficultyLevel,
      attemptDto.score,
      attemptDto.accuracyRate,
      attemptDto.timeSpentSec,
      attemptDto.effectiveWpm || null,
      attemptDto.rawMetricsJson ? JSON.stringify(attemptDto.rawMetricsJson) : null
    ]);

    // 2. Update user XP
    await this.pgPool.query(`
      UPDATE users 
      SET total_xp = total_xp + $1, 
          current_level = GREATEST(current_level, FLOOR(SQRT((total_xp + $1) / 100)) + 1),
          updated_at = NOW()
      WHERE id = $2
    `, [xpEarned, finalUserId]);

    // 3. Persist relation evidence and update user_relation_mastery
    if (relationEvents && relationEvents.length > 0) {
      for (const ev of relationEvents.slice(0, 50)) { // batch insert first 50 detailed
        await this.pgPool.query(`
          INSERT INTO relation_evidence
            (user_id, attempt_id, exercise_slug, level, trial_id, relation_id, relation_weight, entities_json, state_before, state_after, response_ms, correct)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          finalUserId,
          id,
          ev.exerciseSlug,
          ev.level,
          ev.trialId,
          ev.relationId,
          ev.relationWeight || 1.0,
          ev.entities ? JSON.stringify(ev.entities) : null,
          ev.stateBefore,
          ev.stateAfter,
          ev.responseMs || null,
          ev.correct
        ]);
      }

      // Upsert masteries
      for (const relId of ALL_RELATION_IDS) {
        const m = this.relationMasteries[relId];
        if (m.exposureCount > 0) {
          await this.pgPool.query(`
            INSERT INTO user_relation_mastery 
              (user_id, relation_id, exposure_count, accuracy, median_response_ms, stability, local_contexts_json, transfer_score, current_tier, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            ON CONFLICT (user_id, relation_id) DO UPDATE SET
              exposure_count = EXCLUDED.exposure_count,
              accuracy = EXCLUDED.accuracy,
              median_response_ms = EXCLUDED.median_response_ms,
              stability = EXCLUDED.stability,
              local_contexts_json = EXCLUDED.local_contexts_json,
              transfer_score = EXCLUDED.transfer_score,
              current_tier = EXCLUDED.current_tier,
              updated_at = NOW()
          `, [
            this.currentUser.id,
            relId,
            m.exposureCount,
            m.accuracy,
            m.medianResponseMs,
            m.stability,
            JSON.stringify(m.localContexts),
            m.transferScore,
            m.currentTier
          ]);
        }
      }
    }
  }

  saveAssessment(dto: IUserAssessmentRequest): IUserAssessmentResponse {
    const text = this.getReadingTextById(dto.readingTextId);
    if (!text) {
      throw new Error('Reading text not found');
    }

    const rawWpm = calculateWpm(text.wordCount, dto.readingTimeSec);
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
    const effectiveWpm = calculateEffectiveWpm(rawWpm, comprehensionScore);
    const id = `assess-${Date.now()}`;
    const xpEarned = Math.round(effectiveWpm / 5) + (comprehensionScore >= 75 ? 50 : 20);

    this.currentUser.totalXp += xpEarned;
    this.currentUser.currentLevel = Math.floor(Math.sqrt(this.currentUser.totalXp / 100)) + 1;

    const res: IUserAssessmentResponse = {
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

  getUserStats(): IUserStats {
    const totalMinutes = Math.round(
      this.attempts.reduce((sum, a) => sum + (a.timeSpentSec || 0), 0) / 60
    ) + 24;

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

  getRelationshipMasteries(): Record<RelationId, IRelationshipMastery> {
    return this.relationMasteries;
  }

  getBrainGraph() {
    const nodes = ALL_RELATION_IDS.map(id => {
      const def = COGNITIVE_RELATIONS[id];
      const mastery = this.relationMasteries[id];
      return {
        id,
        nameVi: def.nameVi,
        nameEn: def.nameEn,
        iconName: def.iconName,
        masteryScore: Math.round(mastery.accuracy * 100),
        tier: mastery.currentTier,
        exposureCount: mastery.exposureCount,
        stability: mastery.stability,
        transferScore: mastery.transferScore,
        representativeGames: def.representativeGames
      };
    });

    // Edges between related relations
    const edges = [
      { source: 'TARGET_POSITION', target: 'ORDER_SEQUENCE', relation: 'spatio_temporal' },
      { source: 'ORDER_SEQUENCE', target: 'TEMPORAL_PREDICT', relation: 'sequencing' },
      { source: 'TARGET_POSITION', target: 'FOCUS_FIELD', relation: 'spatial_focus' },
      { source: 'TARGET_POSITION', target: 'SPATIAL_TRANSFORM', relation: 'coordinate_shift' },
      { source: 'TARGET_DISTRACTOR', target: 'SIMILARITY_DIFF', relation: 'feature_contrast' },
      { source: 'RULE_ACTION', target: 'INHIBITION', relation: 'executive_control' },
      { source: 'IDENTITY_MATCH', target: 'SIMILARITY_DIFF', relation: 'lexical_match' },
      { source: 'PART_WHOLE', target: 'CONTEXT_MEANING', relation: 'semantic_integration' },
      { source: 'TEMPORAL_PREDICT', target: 'CONTEXT_MEANING', relation: 'comprehension_flow' }
    ];

    return {
      nodes,
      edges,
      overallTrainingIndex: Math.round(
        Object.values(this.relationMasteries).reduce((acc, m) => acc + m.accuracy, 0) / 12 * 100
      )
    };
  }

  recommendCognitiveChain() {
    // Find relation with lowest accuracy or lowest exposure
    const sorted = ALL_RELATION_IDS.slice().sort((a, b) => {
      const ma = this.relationMasteries[a];
      const mb = this.relationMasteries[b];
      return (ma.accuracy * 0.7 + ma.transferScore * 0.3) - (mb.accuracy * 0.7 + mb.transferScore * 0.3);
    });

    const bottleneckRelation = sorted[0];
    const chain = COGNITIVE_RELATION_CHAINS.find(c => c.focusRelations.includes(bottleneckRelation)) 
      || COGNITIVE_RELATION_CHAINS[0];

    return {
      bottleneckRelation,
      relationDef: COGNITIVE_RELATIONS[bottleneckRelation],
      recommendedChain: chain
    };
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async findOrCreateGoogleUser(payload: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string;
    guestXp?: number;
    guestLevel?: number;
    guestStreak?: number;
  }) {
    if (this.isSupabaseConnected && this.pgPool) {
      try {
        const checkRes = await this.pgPool.query(
          `SELECT * FROM users WHERE google_id = $1 OR email = $2 LIMIT 1`,
          [payload.googleId, payload.email]
        );

        if (checkRes.rows.length > 0) {
          const existing = checkRes.rows[0];
          const guestXp = payload.guestXp || 0;
          const mergedXp = (existing.total_xp || 0) + guestXp;
          const mergedLevel = Math.max(existing.current_level || 1, payload.guestLevel || 1, Math.floor(Math.sqrt(mergedXp / 100)) + 1);
          const mergedStreak = Math.max(existing.current_streak || 0, payload.guestStreak || 0);

          const updateRes = await this.pgPool.query(
            `UPDATE users 
             SET google_id = COALESCE(google_id, $1),
                 avatar_url = COALESCE($2, avatar_url),
                 username = COALESCE(username, $3),
                 auth_provider = 'google',
                 total_xp = $4,
                 current_level = $5,
                 current_streak = $6,
                 updated_at = NOW()
             WHERE id = $7
             RETURNING *`,
            [
              payload.googleId,
              payload.avatarUrl || null,
              payload.name || existing.username,
              mergedXp,
              mergedLevel,
              mergedStreak,
              existing.id
            ]
          );
          return updateRes.rows[0];
        } else {
          const initialXp = payload.guestXp || 0;
          const initialLevel = Math.max(1, payload.guestLevel || 1, Math.floor(Math.sqrt(initialXp / 100)) + 1);
          const initialStreak = payload.guestStreak || 0;

          const insertRes = await this.pgPool.query(
            `INSERT INTO users 
               (email, username, avatar_url, google_id, auth_provider, total_xp, current_level, current_streak, best_streak)
             VALUES ($1, $2, $3, $4, 'google', $5, $6, $7, $7)
             RETURNING *`,
            [
              payload.email,
              payload.name || payload.email.split('@')[0],
              payload.avatarUrl || null,
              payload.googleId,
              initialXp,
              initialLevel,
              initialStreak
            ]
          );

          const newUser = insertRes.rows[0];
          await this.pgPool.query(
            `INSERT INTO user_profiles (user_id, preferred_language, target_wpm, daily_goal_minutes)
             VALUES ($1, 'vi', 450, 15)
             ON CONFLICT (user_id) DO NOTHING`,
            [newUser.id]
          ).catch(() => {});

          return newUser;
        }
      } catch (err) {
        console.warn('Supabase findOrCreateGoogleUser error, falling back to memory:', err);
      }
    }

    // In-memory fallback
    this.currentUser = {
      ...this.currentUser,
      email: payload.email,
      username: payload.name || payload.email.split('@')[0],
      totalXp: (this.currentUser.totalXp || 0) + (payload.guestXp || 0),
      currentLevel: Math.max(this.currentUser.currentLevel, payload.guestLevel || 1),
      currentStreak: Math.max(this.currentUser.currentStreak, payload.guestStreak || 0)
    };
    return this.currentUser;
  }

  async getUserById(userId: string) {
    if (this.isSupabaseConnected && this.pgPool) {
      try {
        const res = await this.pgPool.query(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [userId]);
        if (res.rows.length > 0) return res.rows[0];
      } catch (err) {
        console.warn('Supabase getUserById error:', err);
      }
    }
    return this.currentUser;
  }

  async syncUserProfile(userId: string, data: { xp: number; level: number; streak: number; bestStreak?: number }) {
    if (this.isSupabaseConnected && this.pgPool) {
      try {
        const res = await this.pgPool.query(
          `UPDATE users
           SET total_xp = GREATEST(total_xp, $1),
               current_level = GREATEST(current_level, $2),
               current_streak = GREATEST(current_streak, $3),
               best_streak = GREATEST(best_streak, $4),
               updated_at = NOW()
           WHERE id = $5
           RETURNING *`,
          [data.xp, data.level, data.streak, data.bestStreak || data.streak, userId]
        );
        if (res.rows.length > 0) return res.rows[0];
      } catch (err) {
        console.warn('Supabase syncUserProfile error:', err);
      }
    }
    return this.currentUser;
  }

  getReminders(): IUserReminder[] {
    return this.reminders;
  }

  updateReminders(reminders: IUserReminder[]): IUserReminder[] {
    this.reminders = reminders;
    return this.reminders;
  }

  // === WRONG ANSWERS PERSISTENCE & ANALYTICS ===

  saveWrongAnswers(answers: IWrongAnswer[], targetUserId?: string): IWrongAnswer[] {
    const finalUserId = targetUserId || this.currentUser.id;
    const enriched = answers.map(a => ({
      ...a,
      userId: finalUserId,
      timestamp: a.timestamp || new Date().toISOString()
    }));

    // Prepend to in-memory list (latest first)
    this.wrongAnswers = [...enriched, ...this.wrongAnswers].slice(0, 1000);

    // Persist to Supabase if connected
    if (this.isSupabaseConnected && this.pgPool) {
      this.persistWrongAnswersToSupabase(enriched).catch(err => {
        console.warn('Async Supabase wrong-answers insert error:', err);
      });
    }

    return enriched;
  }

  private async persistWrongAnswersToSupabase(answers: IWrongAnswer[]) {
    if (!this.pgPool || answers.length === 0) return;
    for (const a of answers) {
      await this.pgPool.query(`
        INSERT INTO wrong_answers (
          id, user_id, exercise_slug, difficulty_level, round,
          question_context, correct_answer, user_answer,
          error_category, severity, confusion_pair_key,
          response_time_ms, session_id, review_status, review_count,
          last_reviewed_at, next_review_at, ease_factor, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
        )
        ON CONFLICT (id) DO UPDATE SET
          review_status = EXCLUDED.review_status,
          review_count = EXCLUDED.review_count,
          last_reviewed_at = EXCLUDED.last_reviewed_at,
          next_review_at = EXCLUDED.next_review_at,
          ease_factor = EXCLUDED.ease_factor
      `, [
        a.id,
        a.userId,
        a.exerciseSlug,
        a.difficultyLevel,
        a.round,
        JSON.stringify(a.questionContext || {}),
        JSON.stringify(a.correctAnswer || {}),
        JSON.stringify(a.userAnswer || {}),
        a.errorCategory,
        a.severity,
        a.confusionPairKey,
        a.responseTimeMs,
        a.sessionId,
        a.reviewStatus,
        a.reviewCount,
        a.lastReviewedAt ? new Date(a.lastReviewedAt) : null,
        a.nextReviewAt ? new Date(a.nextReviewAt) : null,
        a.easeFactor,
        new Date(a.timestamp)
      ]);
    }
  }

  getWrongAnswers(params?: {
    exerciseSlug?: string;
    severity?: string;
    reviewStatus?: string;
    limit?: number;
    offset?: number;
  }): { total: number; items: IWrongAnswer[] } {
    let filtered = [...this.wrongAnswers];

    if (params?.exerciseSlug && params.exerciseSlug !== 'ALL') {
      filtered = filtered.filter(a => a.exerciseSlug === params.exerciseSlug);
    }
    if (params?.severity && params.severity !== 'ALL') {
      filtered = filtered.filter(a => a.severity === params.severity);
    }
    if (params?.reviewStatus && params.reviewStatus !== 'ALL') {
      filtered = filtered.filter(a => a.reviewStatus === params.reviewStatus);
    }

    const total = filtered.length;
    const offset = params?.offset || 0;
    const limit = params?.limit || 50;
    const items = filtered.slice(offset, offset + limit);

    return { total, items };
  }

  updateWrongAnswerReview(id: string, quality: 0 | 1 | 2 | 3 | 4 | 5): IWrongAnswer | null {
    const itemIndex = this.wrongAnswers.findIndex(a => a.id === id);
    if (itemIndex === -1) return null;

    const item = this.wrongAnswers[itemIndex];
    const srs = calculateNextReviewDate(item.easeFactor, item.reviewCount, quality);

    const isMastered = quality >= 4 && (item.reviewCount + 1) >= 3;
    const updated: IWrongAnswer = {
      ...item,
      easeFactor: srs.newEF,
      reviewCount: item.reviewCount + 1,
      lastReviewedAt: new Date().toISOString(),
      nextReviewAt: srs.nextReviewDate.toISOString(),
      reviewStatus: isMastered ? 'mastered' : 'reviewing'
    };

    this.wrongAnswers[itemIndex] = updated;

    if (this.isSupabaseConnected && this.pgPool) {
      this.persistWrongAnswersToSupabase([updated]).catch(err => {
        console.warn('Async update wrong answer review error:', err);
      });
    }

    return updated;
  }

  getConfusionPairStats(exerciseSlug?: ExerciseSlug): IConfusionPairStat[] {
    const targetItems = exerciseSlug && exerciseSlug !== 'ALL' as any
      ? this.wrongAnswers.filter(a => a.exerciseSlug === exerciseSlug)
      : this.wrongAnswers;

    const pairMap = new Map<string, {
      pairKey: string;
      exerciseSlug: ExerciseSlug;
      labelA: string;
      labelB: string;
      codeA: string;
      codeB: string;
      totalErrors: number;
      recentErrors: number;
      totalResponseMs: number;
      lastOccurredAt: string;
      masteredCount: number;
    }>();

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    for (const item of targetItems) {
      const key = item.confusionPairKey;
      if (!pairMap.has(key)) {
        pairMap.set(key, {
          pairKey: key,
          exerciseSlug: item.exerciseSlug,
          labelA: item.correctAnswer.label,
          labelB: item.userAnswer.label,
          codeA: item.correctAnswer.code,
          codeB: item.userAnswer.code,
          totalErrors: 0,
          recentErrors: 0,
          totalResponseMs: 0,
          lastOccurredAt: item.timestamp,
          masteredCount: 0
        });
      }

      const stat = pairMap.get(key)!;
      stat.totalErrors += 1;
      stat.totalResponseMs += item.responseTimeMs || 0;
      if (new Date(item.timestamp).getTime() >= sevenDaysAgo) {
        stat.recentErrors += 1;
      }
      if (item.reviewStatus === 'mastered') {
        stat.masteredCount += 1;
      }
      if (new Date(item.timestamp).getTime() > new Date(stat.lastOccurredAt).getTime()) {
        stat.lastOccurredAt = item.timestamp;
      }
    }

    const result: IConfusionPairStat[] = [];
    pairMap.forEach(s => {
      const avgMs = s.totalErrors > 0 ? Math.round(s.totalResponseMs / s.totalErrors) : 0;
      const isMastered = s.masteredCount >= 2 && s.recentErrors === 0;

      result.push({
        pairKey: s.pairKey,
        exerciseSlug: s.exerciseSlug,
        labelA: s.labelA,
        labelB: s.labelB,
        codeA: s.codeA,
        codeB: s.codeB,
        totalErrors: s.totalErrors,
        recentErrors: s.recentErrors,
        avgResponseMs: avgMs,
        masteredAt: isMastered ? s.lastOccurredAt : null,
        trendDirection: s.recentErrors === 0 ? 'improving' : s.recentErrors >= 3 ? 'declining' : 'stagnant',
        lastOccurredAt: s.lastOccurredAt
      });
    });

    return result.sort((a, b) => b.totalErrors - a.totalErrors);
  }

  clearWrongAnswers(exerciseSlug?: string): { clearedCount: number } {
    const beforeCount = this.wrongAnswers.length;
    if (exerciseSlug && exerciseSlug !== 'ALL') {
      this.wrongAnswers = this.wrongAnswers.filter(a => a.exerciseSlug !== exerciseSlug);
    } else {
      this.wrongAnswers = [];
    }
    const cleared = beforeCount - this.wrongAnswers.length;

    if (this.isSupabaseConnected && this.pgPool) {
      const query = exerciseSlug && exerciseSlug !== 'ALL'
        ? 'DELETE FROM wrong_answers WHERE exercise_slug = $1'
        : 'DELETE FROM wrong_answers';
      const params = exerciseSlug && exerciseSlug !== 'ALL' ? [exerciseSlug] : [];
      this.pgPool.query(query, params).catch(err => {
        console.warn('Async Supabase delete wrong answers error:', err);
      });
    }

    return { clearedCount: cleared };
  }
}
