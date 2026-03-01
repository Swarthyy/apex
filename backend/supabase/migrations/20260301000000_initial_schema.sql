-- APEX Database Schema - Phase 1
-- Initial schema with all 7 core tables + user_preferences

-- ============================================================================
-- TABLE: daily_checkins
-- Morning/evening check-in scores and SR day tracking
-- ============================================================================
CREATE TABLE daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_date DATE NOT NULL,

  -- Morning check-in scores (1-10)
  energy_score SMALLINT CHECK (energy_score >= 1 AND energy_score <= 10),
  mood_score SMALLINT CHECK (mood_score >= 1 AND mood_score <= 10),
  libido_score SMALLINT CHECK (libido_score >= 1 AND libido_score <= 10),

  -- SR tracking
  sr_day_count INTEGER DEFAULT 0 CHECK (sr_day_count >= 0),

  -- Optional notes
  morning_notes TEXT,
  evening_notes TEXT,

  -- Timestamps
  morning_completed_at TIMESTAMPTZ,
  evening_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one check-in per user per day
  UNIQUE(user_id, check_date)
);

CREATE INDEX idx_daily_checkins_user_date ON daily_checkins(user_id, check_date DESC);
CREATE INDEX idx_daily_checkins_user_created ON daily_checkins(user_id, created_at DESC);

-- ============================================================================
-- TABLE: sleep_logs
-- Sleep tracking data
-- ============================================================================
CREATE TABLE sleep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sleep_date DATE NOT NULL, -- The night of sleep (e.g., March 1 night)

  -- Manual entry fields (Phase 1)
  bedtime TIMESTAMPTZ,
  wake_time TIMESTAMPTZ,
  duration_minutes INTEGER CHECK (duration_minutes >= 0),
  quality_score SMALLINT CHECK (quality_score >= 1 AND quality_score <= 10),

  -- Future: sync from Apple Health/Oura (Phase 2)
  source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'apple_health', 'oura'

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, sleep_date)
);

CREATE INDEX idx_sleep_logs_user_date ON sleep_logs(user_id, sleep_date DESC);

-- ============================================================================
-- TABLE: gym_sessions
-- Workout/gym session tracking
-- ============================================================================
CREATE TABLE gym_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  session_time TIMESTAMPTZ,

  -- Manual entry (Phase 1)
  workout_name VARCHAR(255),
  total_volume INTEGER CHECK (total_volume >= 0), -- Total weight lifted (lbs or kg)
  total_sets INTEGER CHECK (total_sets >= 0),
  duration_minutes INTEGER CHECK (duration_minutes >= 0),
  exercises JSONB, -- Array of {name, sets, reps, weight, is_pr}

  -- Future: Hevy sync (Phase 2)
  source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'hevy'
  external_id VARCHAR(255), -- Hevy workout ID

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gym_sessions_user_date ON gym_sessions(user_id, session_date DESC);
CREATE INDEX idx_gym_sessions_user_created ON gym_sessions(user_id, created_at DESC);

-- ============================================================================
-- TABLE: body_metrics
-- Body composition tracking (weight, body fat %, etc.)
-- ============================================================================
CREATE TABLE body_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  measurement_date DATE NOT NULL,
  measurement_time TIMESTAMPTZ DEFAULT NOW(),

  -- Core metrics
  weight_kg DECIMAL(5,2) CHECK (weight_kg > 0),
  weight_lbs DECIMAL(5,2) CHECK (weight_lbs > 0),
  body_fat_percentage DECIMAL(4,2) CHECK (body_fat_percentage >= 0 AND body_fat_percentage <= 100),
  muscle_mass_kg DECIMAL(5,2) CHECK (muscle_mass_kg >= 0),

  -- Future: Withings sync (Phase 2)
  source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'withings'
  external_id VARCHAR(255),

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, measurement_date)
);

CREATE INDEX idx_body_metrics_user_date ON body_metrics(user_id, measurement_date DESC);

-- ============================================================================
-- TABLE: nutrition_logs
-- Meal/food logging with macros and micronutrients
-- ============================================================================
CREATE TABLE nutrition_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  log_time TIMESTAMPTZ DEFAULT NOW(),

  -- Meal info
  meal_type VARCHAR(50) CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'supplement')),
  food_name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Macros
  calories INTEGER CHECK (calories >= 0),
  protein_g DECIMAL(6,2) CHECK (protein_g >= 0),
  fat_g DECIMAL(6,2) CHECK (fat_g >= 0),
  carbs_g DECIMAL(6,2) CHECK (carbs_g >= 0),

  -- Micronutrients (for bonus chips)
  vitamin_a_mcg DECIMAL(8,2),
  vitamin_b12_mcg DECIMAL(6,2),
  zinc_mg DECIMAL(6,2),
  iron_mg DECIMAL(6,2),
  omega3_g DECIMAL(6,2),

  -- Bonus flags (for RPG chips)
  bonus_tags JSONB, -- ['high_protein', 'vitamin_a', 'b12', 'raw_enzymes', etc.]

  -- Photo (Phase 3: AI estimation)
  photo_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nutrition_logs_user_date ON nutrition_logs(user_id, log_date DESC);
CREATE INDEX idx_nutrition_logs_user_time ON nutrition_logs(user_id, log_time DESC);

-- ============================================================================
-- TABLE: calendar_events
-- Calendar events for contextual awareness
-- ============================================================================
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Event details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,

  -- Categorization
  category VARCHAR(50) CHECK (category IN ('work', 'gym', 'social', 'health', 'other')),
  auto_categorized BOOLEAN DEFAULT false,

  -- Future: Google Calendar sync (Phase 2)
  source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'google_calendar'
  external_id VARCHAR(255), -- Google Calendar event ID

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calendar_events_user_date ON calendar_events(user_id, event_date DESC);
CREATE INDEX idx_calendar_events_user_start ON calendar_events(user_id, start_time DESC);

-- ============================================================================
-- TABLE: insights
-- AI-generated insights and pattern detection
-- ============================================================================
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Insight content
  insight_text TEXT NOT NULL,
  insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN ('positive', 'warning', 'info', 'alert')),
  confidence_level VARCHAR(20) CHECK (confidence_level IN ('high', 'medium', 'low')),

  -- Related sectors
  sector_tags JSONB, -- ['retention', 'energy', 'gym']

  -- Data reference
  date_range_start DATE,
  date_range_end DATE,
  related_data JSONB, -- Specific data points that triggered insight

  -- Status
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_insights_user_created ON insights(user_id, created_at DESC);
CREATE INDEX idx_insights_user_unread ON insights(user_id, is_read, created_at DESC) WHERE is_read = false;

-- ============================================================================
-- TABLE: user_preferences
-- User settings and preferences
-- ============================================================================
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Vitality score weights (customizable in future)
  vitality_energy_weight DECIMAL(3,2) DEFAULT 0.25 CHECK (vitality_energy_weight >= 0 AND vitality_energy_weight <= 1),
  vitality_mood_weight DECIMAL(3,2) DEFAULT 0.20 CHECK (vitality_mood_weight >= 0 AND vitality_mood_weight <= 1),
  vitality_libido_weight DECIMAL(3,2) DEFAULT 0.20 CHECK (vitality_libido_weight >= 0 AND vitality_libido_weight <= 1),
  vitality_sleep_weight DECIMAL(3,2) DEFAULT 0.20 CHECK (vitality_sleep_weight >= 0 AND vitality_sleep_weight <= 1),
  vitality_sr_weight DECIMAL(3,2) DEFAULT 0.15 CHECK (vitality_sr_weight >= 0 AND vitality_sr_weight <= 1),

  -- Notification settings
  morning_notification_time TIME DEFAULT '08:00:00',
  notifications_enabled BOOLEAN DEFAULT true,

  -- Nutrition goals
  daily_calorie_goal INTEGER DEFAULT 2500 CHECK (daily_calorie_goal > 0),
  daily_protein_goal_g INTEGER DEFAULT 200 CHECK (daily_protein_goal_g >= 0),
  daily_fat_goal_g INTEGER DEFAULT 100 CHECK (daily_fat_goal_g >= 0),
  daily_carbs_goal_g INTEGER DEFAULT 200 CHECK (daily_carbs_goal_g >= 0),

  -- Units
  weight_unit VARCHAR(10) DEFAULT 'lbs' CHECK (weight_unit IN ('lbs', 'kg')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TRIGGERS: Auto-update updated_at timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_daily_checkins_updated_at BEFORE UPDATE ON daily_checkins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sleep_logs_updated_at BEFORE UPDATE ON sleep_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gym_sessions_updated_at BEFORE UPDATE ON gym_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_body_metrics_updated_at BEFORE UPDATE ON body_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_logs_updated_at BEFORE UPDATE ON nutrition_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insights_updated_at BEFORE UPDATE ON insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
