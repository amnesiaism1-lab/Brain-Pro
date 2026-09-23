const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'aws-0-ap-northeast-1.pooler.supabase.com',
  port: parseInt(process.env.DB_PORT || '6543', 10),
  database: 'postgres',
  user: 'postgres.ogsemefehnlaedkwigyl',
  password: '5g*Q?hqT9N6BU7x',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('Connected to Supabase PostgreSQL...');

  console.log('Creating relation_evidence table...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS relation_evidence (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      attempt_id VARCHAR(100),
      exercise_slug VARCHAR(100) NOT NULL,
      level INT NOT NULL,
      trial_id VARCHAR(100) NOT NULL,
      relation_id VARCHAR(50) NOT NULL,
      relation_weight DECIMAL(4,2) DEFAULT 1.0,
      entities_json JSONB,
      state_before VARCHAR(50),
      state_after VARCHAR(50),
      response_ms INT,
      correct BOOLEAN NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_evidence_user_relation ON relation_evidence(user_id, relation_id, created_at DESC);
  `);

  console.log('Creating user_relation_mastery table...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS user_relation_mastery (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      relation_id VARCHAR(50) NOT NULL,
      exposure_count INT DEFAULT 0,
      accuracy DECIMAL(5,3) DEFAULT 0.500,
      median_response_ms INT DEFAULT 600,
      stability DECIMAL(5,3) DEFAULT 0.500,
      local_contexts_json JSONB DEFAULT '[]',
      transfer_score DECIMAL(5,3) DEFAULT 0.000,
      interference_score DECIMAL(5,3) DEFAULT 0.000,
      current_tier INT DEFAULT 1,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, relation_id)
    );
  `);

  console.log('Creating relation_transfer_edges table...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS relation_transfer_edges (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      relation_id VARCHAR(50) NOT NULL,
      source_exercise_slug VARCHAR(100) NOT NULL,
      target_exercise_slug VARCHAR(100) NOT NULL,
      transfer_ratio DECIMAL(5,3) DEFAULT 0.000,
      sample_count INT DEFAULT 0,
      is_bridge_active BOOLEAN DEFAULT false,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, relation_id, source_exercise_slug, target_exercise_slug)
    );
  `);

  // Rename overall_brain_age in user_cognitive_snapshots if needed
  await client.query(`
    DO $$ 
    BEGIN 
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_cognitive_snapshots' AND column_name = 'overall_brain_age'
      ) THEN 
        ALTER TABLE user_cognitive_snapshots RENAME COLUMN overall_brain_age TO overall_training_index;
      END IF;
    END $$;
  `);

  console.log('Cognitive tables created and updated successfully in Supabase!');
  await client.end();
}

run().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
