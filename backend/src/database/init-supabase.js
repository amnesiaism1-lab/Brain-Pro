const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'aws-0-ap-northeast-1.pooler.supabase.com',
  port: parseInt(process.env.DB_PORT || '6543', 10),
  database: 'postgres',
  user: 'postgres.ogsemefehnlaedkwigyl',
  password: '5g*Q?hqT9N6BU7x',
  ssl: { rejectUnauthorized: false }
});

async function initSupabase() {
  console.log('Connecting to Supabase PostgreSQL...');
  await client.connect();
  console.log('Connected successfully!');

  // Create extension for UUID
  await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

  console.log('Creating tables...');

  // 1. users
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR(255) UNIQUE NOT NULL,
      username VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      avatar_url VARCHAR(500),
      total_xp INT DEFAULT 0,
      current_level INT DEFAULT 1,
      current_streak INT DEFAULT 0,
      best_streak INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 2. user_profiles
  await client.query(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      preferred_language VARCHAR(10) DEFAULT 'vi',
      target_wpm INT DEFAULT 450,
      daily_goal_minutes INT DEFAULT 15,
      sound_enabled BOOLEAN DEFAULT true,
      theme VARCHAR(20) DEFAULT 'light',
      auto_difficulty_default BOOLEAN DEFAULT true,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 3. exercise_categories
  await client.query(`
    CREATE TABLE IF NOT EXISTS exercise_categories (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      icon_name VARCHAR(50),
      sort_order INT DEFAULT 0
    );
  `);

  // 4. exercises
  await client.query(`
    CREATE TABLE IF NOT EXISTS exercises (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      category_id VARCHAR(50) NOT NULL,
      category_code VARCHAR(50) NOT NULL,
      category_name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) UNIQUE NOT NULL,
      title VARCHAR(150) NOT NULL,
      subtitle VARCHAR(255),
      icon_name VARCHAR(50),
      scientific_basis TEXT,
      instructions TEXT,
      rules_summary TEXT,
      max_difficulty_level INT DEFAULT 8,
      default_duration_sec INT DEFAULT 60,
      is_featured BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 5. exercise_level_configs
  await client.query(`
    CREATE TABLE IF NOT EXISTS exercise_level_configs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
      level INT NOT NULL,
      grid_rows INT,
      grid_cols INT,
      target_item_count INT,
      time_limit_sec INT NOT NULL,
      speed_wpm INT,
      parameters_json JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 6. workout_routines
  await client.query(`
    CREATE TABLE IF NOT EXISTS workout_routines (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      code VARCHAR(50) UNIQUE NOT NULL,
      title VARCHAR(150) NOT NULL,
      duration_minutes INT NOT NULL,
      star_rating INT DEFAULT 1,
      description TEXT,
      is_default BOOLEAN DEFAULT false,
      items_json JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 7. game_attempts
  await client.query(`
    CREATE TABLE IF NOT EXISTS game_attempts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
      exercise_slug VARCHAR(100) NOT NULL,
      difficulty_level INT NOT NULL,
      score INT NOT NULL,
      accuracy_rate DECIMAL(5,2) NOT NULL,
      time_spent_sec DECIMAL(7,2) NOT NULL,
      effective_wpm INT,
      raw_metrics_json JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_attempts_user_date ON game_attempts(user_id, created_at DESC);
  `);

  // 8. reading_texts
  await client.query(`
    CREATE TABLE IF NOT EXISTS reading_texts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      word_count INT NOT NULL,
      difficulty_level INT DEFAULT 1,
      content TEXT NOT NULL,
      preview_excerpt VARCHAR(500),
      author VARCHAR(150),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 9. reading_questions
  await client.query(`
    CREATE TABLE IF NOT EXISTS reading_questions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      reading_text_id UUID REFERENCES reading_texts(id) ON DELETE CASCADE,
      question_order INT NOT NULL,
      question_text TEXT NOT NULL,
      option_a VARCHAR(255) NOT NULL,
      option_b VARCHAR(255) NOT NULL,
      option_c VARCHAR(255) NOT NULL,
      option_d VARCHAR(255) NOT NULL,
      correct_option VARCHAR(1) NOT NULL,
      explanation TEXT
    );
  `);

  // 10. user_assessments
  await client.query(`
    CREATE TABLE IF NOT EXISTS user_assessments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      reading_text_id UUID REFERENCES reading_texts(id) ON DELETE CASCADE,
      reading_time_sec DECIMAL(7,2) NOT NULL,
      raw_wpm INT NOT NULL,
      comprehension_score DECIMAL(5,2) NOT NULL,
      effective_wpm INT NOT NULL,
      answers_json JSONB,
      completed_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 11. daily_streaks
  await client.query(`
    CREATE TABLE IF NOT EXISTS daily_streaks (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      streak_date DATE NOT NULL,
      minutes_trained INT DEFAULT 0,
      exercises_completed INT DEFAULT 0,
      xp_earned INT DEFAULT 0,
      UNIQUE(user_id, streak_date)
    );
  `);

  // 12. user_reminders
  await client.query(`
    CREATE TABLE IF NOT EXISTS user_reminders (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      reminder_time VARCHAR(5) DEFAULT '08:00',
      days_of_week_json JSONB NOT NULL,
      is_enabled BOOLEAN DEFAULT true,
      label VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 13. exercise_variants
  await client.query(`
    CREATE TABLE IF NOT EXISTS exercise_variants (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      exercise_slug VARCHAR(100) NOT NULL,
      min_level INT NOT NULL,
      max_level INT NOT NULL,
      variant_code VARCHAR(50) NOT NULL,
      variant_name VARCHAR(150) NOT NULL,
      variant_description TEXT,
      variant_config JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(exercise_slug, variant_code)
    );
  `);

  // 14. exercise_synergies
  await client.query(`
    CREATE TABLE IF NOT EXISTS exercise_synergies (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      exercise_a_slug VARCHAR(100) NOT NULL,
      exercise_b_slug VARCHAR(100) NOT NULL,
      synergy_type VARCHAR(50) NOT NULL,
      title VARCHAR(150) NOT NULL,
      description TEXT,
      bonus_xp_percent INT DEFAULT 20,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(exercise_a_slug, exercise_b_slug)
    );
  `);

  // 15. exercise_content_pools
  await client.query(`
    CREATE TABLE IF NOT EXISTS exercise_content_pools (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      exercise_slug VARCHAR(100) NOT NULL,
      content_type VARCHAR(50) NOT NULL,
      content_data JSONB NOT NULL,
      difficulty_tier INT DEFAULT 1,
      times_used INT DEFAULT 0,
      last_used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_content_pool_slug_tier ON exercise_content_pools(exercise_slug, difficulty_tier);
  `);

  // 16. user_exercise_mastery
  await client.query(`
    CREATE TABLE IF NOT EXISTS user_exercise_mastery (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      exercise_slug VARCHAR(100) NOT NULL,
      current_level INT DEFAULT 1,
      highest_level_reached INT DEFAULT 1,
      total_attempts INT DEFAULT 0,
      perfect_attempts INT DEFAULT 0,
      avg_accuracy DECIMAL(5,2) DEFAULT 0,
      avg_reaction_ms DECIMAL(8,2) DEFAULT 0,
      consecutive_wins INT DEFAULT 0,
      consecutive_losses INT DEFAULT 0,
      last_played_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, exercise_slug)
    );
  `);

  // 17. user_cognitive_snapshots
  await client.query(`
    CREATE TABLE IF NOT EXISTS user_cognitive_snapshots (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      snapshot_date DATE NOT NULL,
      speed_reading_score INT DEFAULT 50,
      peripheral_vision_score INT DEFAULT 50,
      memory_score INT DEFAULT 50,
      attention_score INT DEFAULT 50,
      reaction_score INT DEFAULT 50,
      overall_brain_age INT DEFAULT 25,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 18. user_content_history
  await client.query(`
    CREATE TABLE IF NOT EXISTS user_content_history (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      content_pool_id UUID REFERENCES exercise_content_pools(id) ON DELETE CASCADE,
      exercise_slug VARCHAR(100) NOT NULL,
      seen_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_content_history_user_seen ON user_content_history(user_id, exercise_slug, seen_at DESC);
  `);

  console.log('All 18 tables created successfully in Supabase!');

  // Seed default admin / demo user
  const userRes = await client.query(`
    INSERT INTO users (email, username, password_hash, total_xp, current_level, current_streak, best_streak)
    VALUES ('master@brainexercises.pro', 'BrainMaster', '$2a$10$wK1k6a.8Z8xGzC8c9Q5n7uWz/N6Yq7mYh1U7L1J1r7Q5Y7K1k6a.8', 550, 3, 5, 10)
    ON CONFLICT (email) DO UPDATE SET total_xp = EXCLUDED.total_xp
    RETURNING id;
  `);

  const userId = userRes.rows[0].id;
  await client.query(`
    INSERT INTO user_profiles (user_id, preferred_language, target_wpm, daily_goal_minutes, sound_enabled, theme, auto_difficulty_default)
    VALUES ($1, 'vi', 500, 15, true, 'light', true)
    ON CONFLICT (user_id) DO NOTHING;
  `, [userId]);

  console.log('Seeded demo user with ID:', userId);

  await client.end();
  console.log('Supabase Database Initialization Finished!');
}

initSupabase().catch(err => {
  console.error('Initialization error:', err);
  process.exit(1);
});
