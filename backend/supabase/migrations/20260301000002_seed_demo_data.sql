-- APEX Demo Data Seed
-- Creates 30 days of realistic demo data for testing
-- Includes SR cycle pattern, correlated scores, and nutrition tracking

-- NOTE: This seed data is for development/testing only
-- Replace demo-user-id with actual user ID when testing

-- Insert demo user preferences
INSERT INTO user_preferences (
  user_id,
  daily_calorie_goal,
  daily_protein_goal_g,
  daily_fat_goal_g,
  daily_carbs_goal_g
) VALUES (
  'demo-user-id', -- Replace with actual user ID
  2800,
  200,
  120,
  250
) ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- 30 DAYS OF CHECK-INS WITH SR CYCLE PATTERN
-- Pattern: Days 1-14 building up, day 15 reset, days 16-30 rebuild
-- ============================================================================

-- Days 1-7: Early SR streak, scores gradually increasing
INSERT INTO daily_checkins (user_id, check_date, energy_score, mood_score, libido_score, sr_day_count, morning_completed_at) VALUES
('demo-user-id', '2026-02-01', 6, 6, 5, 1, '2026-02-01 08:15:00'),
('demo-user-id', '2026-02-02', 6, 6, 6, 2, '2026-02-02 08:12:00'),
('demo-user-id', '2026-02-03', 7, 6, 6, 3, '2026-02-03 08:20:00'),
('demo-user-id', '2026-02-04', 7, 7, 6, 4, '2026-02-04 08:10:00'),
('demo-user-id', '2026-02-05', 7, 7, 7, 5, '2026-02-05 08:25:00'),
('demo-user-id', '2026-02-06', 8, 7, 7, 6, '2026-02-06 08:05:00'),
('demo-user-id', '2026-02-07', 8, 8, 8, 7, '2026-02-07 08:18:00');

-- Days 8-14: Peak performance window
INSERT INTO daily_checkins (user_id, check_date, energy_score, mood_score, libido_score, sr_day_count, morning_completed_at) VALUES
('demo-user-id', '2026-02-08', 8, 8, 8, 8, '2026-02-08 08:08:00'),
('demo-user-id', '2026-02-09', 9, 8, 9, 9, '2026-02-09 08:14:00'),
('demo-user-id', '2026-02-10', 9, 9, 9, 10, '2026-02-10 08:11:00'),
('demo-user-id', '2026-02-11', 9, 9, 9, 11, '2026-02-11 08:06:00'),
('demo-user-id', '2026-02-12', 9, 8, 9, 12, '2026-02-12 08:22:00'),
('demo-user-id', '2026-02-13', 9, 9, 10, 13, '2026-02-13 08:16:00'),
('demo-user-id', '2026-02-14', 9, 9, 10, 14, '2026-02-14 08:09:00');

-- Day 15: SR reset, scores drop
INSERT INTO daily_checkins (user_id, check_date, energy_score, mood_score, libido_score, sr_day_count, morning_completed_at) VALUES
('demo-user-id', '2026-02-15', 5, 5, 4, 0, '2026-02-15 09:45:00');

-- Days 16-30: Rebuilding streak
INSERT INTO daily_checkins (user_id, check_date, energy_score, mood_score, libido_score, sr_day_count, morning_completed_at) VALUES
('demo-user-id', '2026-02-16', 6, 6, 5, 1, '2026-02-16 08:30:00'),
('demo-user-id', '2026-02-17', 6, 6, 6, 2, '2026-02-17 08:12:00'),
('demo-user-id', '2026-02-18', 7, 6, 6, 3, '2026-02-18 08:18:00'),
('demo-user-id', '2026-02-19', 7, 7, 7, 4, '2026-02-19 08:15:00'),
('demo-user-id', '2026-02-20', 7, 7, 7, 5, '2026-02-20 08:20:00'),
('demo-user-id', '2026-02-21', 8, 7, 8, 6, '2026-02-21 08:10:00'),
('demo-user-id', '2026-02-22', 8, 8, 8, 7, '2026-02-22 08:14:00'),
('demo-user-id', '2026-02-23', 8, 8, 8, 8, '2026-02-23 08:08:00'),
('demo-user-id', '2026-02-24', 8, 8, 9, 9, '2026-02-24 08:12:00'),
('demo-user-id', '2026-02-25', 9, 8, 9, 10, '2026-02-25 08:16:00'),
('demo-user-id', '2026-02-26', 9, 9, 9, 11, '2026-02-26 08:11:00'),
('demo-user-id', '2026-02-27', 9, 9, 9, 12, '2026-02-27 08:09:00'),
('demo-user-id', '2026-02-28', 9, 9, 10, 13, '2026-02-28 08:13:00'),
('demo-user-id', '2026-03-01', 9, 9, 10, 14, '2026-03-01 08:07:00');

-- ============================================================================
-- SLEEP LOGS - Varying quality and duration
-- ============================================================================

INSERT INTO sleep_logs (user_id, sleep_date, bedtime, wake_time, duration_minutes, quality_score) VALUES
('demo-user-id', '2026-01-31', '2026-01-31 23:15:00', '2026-02-01 07:15:00', 480, 7),
('demo-user-id', '2026-02-01', '2026-02-01 23:30:00', '2026-02-02 07:45:00', 495, 8),
('demo-user-id', '2026-02-02', '2026-02-02 23:00:00', '2026-02-03 07:30:00', 510, 8),
('demo-user-id', '2026-02-03', '2026-02-03 22:45:00', '2026-02-04 07:00:00', 495, 7),
('demo-user-id', '2026-02-04', '2026-02-04 23:00:00', '2026-02-05 08:00:00', 540, 9),
('demo-user-id', '2026-02-05', '2026-02-05 23:30:00', '2026-02-06 07:30:00', 480, 8),
('demo-user-id', '2026-02-06', '2026-02-06 22:30:00', '2026-02-07 07:00:00', 510, 9),
('demo-user-id', '2026-02-07', '2026-02-07 23:00:00', '2026-02-08 07:30:00', 510, 8),
('demo-user-id', '2026-02-08', '2026-02-08 22:45:00', '2026-02-09 07:15:00', 510, 9),
('demo-user-id', '2026-02-09', '2026-02-09 23:00:00', '2026-02-10 07:30:00', 510, 8),
('demo-user-id', '2026-02-10', '2026-02-10 23:15:00', '2026-02-11 08:00:00', 525, 9),
('demo-user-id', '2026-02-11', '2026-02-11 23:00:00', '2026-02-12 07:30:00', 510, 8),
('demo-user-id', '2026-02-12', '2026-02-12 23:30:00', '2026-02-13 07:30:00', 480, 8),
('demo-user-id', '2026-02-13', '2026-02-13 23:00:00', '2026-02-14 08:00:00', 540, 9),
('demo-user-id', '2026-02-14', '2026-02-14 01:30:00', '2026-02-15 06:30:00', 300, 5), -- Short sleep after reset
('demo-user-id', '2026-02-15', '2026-02-15 23:45:00', '2026-02-16 07:45:00', 480, 7),
('demo-user-id', '2026-02-16', '2026-02-16 23:30:00', '2026-02-17 07:30:00', 480, 7),
('demo-user-id', '2026-02-17', '2026-02-17 23:00:00', '2026-02-18 07:30:00', 510, 8),
('demo-user-id', '2026-02-18', '2026-02-18 23:15:00', '2026-02-19 07:45:00', 510, 8),
('demo-user-id', '2026-02-19', '2026-02-19 23:00:00', '2026-02-20 07:30:00', 510, 8),
('demo-user-id', '2026-02-20', '2026-02-20 22:45:00', '2026-02-21 07:30:00', 525, 9),
('demo-user-id', '2026-02-21', '2026-02-21 23:00:00', '2026-02-22 07:30:00', 510, 8),
('demo-user-id', '2026-02-22', '2026-02-22 23:00:00', '2026-02-23 08:00:00', 540, 9),
('demo-user-id', '2026-02-23', '2026-02-23 23:15:00', '2026-02-24 07:45:00', 510, 8),
('demo-user-id', '2026-02-24', '2026-02-24 23:00:00', '2026-02-25 07:30:00', 510, 8),
('demo-user-id', '2026-02-25', '2026-02-25 23:00:00', '2026-02-26 08:00:00', 540, 9),
('demo-user-id', '2026-02-26', '2026-02-26 23:30:00', '2026-02-27 07:45:00', 495, 8),
('demo-user-id', '2026-02-27', '2026-02-27 23:00:00', '2026-02-28 07:30:00', 510, 8),
('demo-user-id', '2026-02-28', '2026-02-28 22:45:00', '2026-03-01 07:30:00', 525, 9);

-- ============================================================================
-- GYM SESSIONS - 4-5 per week with volume progression
-- ============================================================================

INSERT INTO gym_sessions (user_id, session_date, session_time, workout_name, total_volume, total_sets, duration_minutes, exercises) VALUES
('demo-user-id', '2026-02-01', '2026-02-01 17:00:00', 'Upper Body Push', 12500, 18, 75, '[{"name":"Bench Press","sets":4,"reps":8,"weight":225,"is_pr":false},{"name":"Overhead Press","sets":4,"reps":10,"weight":135,"is_pr":false},{"name":"Dips","sets":3,"reps":12,"weight":45,"is_pr":false}]'),
('demo-user-id', '2026-02-03', '2026-02-03 17:30:00', 'Lower Body', 18000, 20, 90, '[{"name":"Squat","sets":5,"reps":5,"weight":315,"is_pr":false},{"name":"Romanian Deadlift","sets":4,"reps":8,"weight":225,"is_pr":false},{"name":"Leg Press","sets":3,"reps":12,"weight":400,"is_pr":false}]'),
('demo-user-id', '2026-02-05', '2026-02-05 17:15:00', 'Upper Body Pull', 13200, 18, 80, '[{"name":"Deadlift","sets":4,"reps":6,"weight":365,"is_pr":true},{"name":"Pull-ups","sets":4,"reps":10,"weight":25,"is_pr":false},{"name":"Rows","sets":4,"reps":10,"weight":185,"is_pr":false}]'),
('demo-user-id', '2026-02-07', '2026-02-07 17:00:00', 'Full Body', 14500, 20, 85, '[{"name":"Front Squat","sets":4,"reps":8,"weight":225,"is_pr":false},{"name":"Bench Press","sets":4,"reps":8,"weight":225,"is_pr":false},{"name":"Deadlift","sets":3,"reps":6,"weight":345,"is_pr":false}]'),
('demo-user-id', '2026-02-10', '2026-02-10 17:30:00', 'Upper Body Push', 13000, 18, 75, '[{"name":"Bench Press","sets":4,"reps":8,"weight":235,"is_pr":true},{"name":"Overhead Press","sets":4,"reps":10,"weight":140,"is_pr":false},{"name":"Dips","sets":3,"reps":12,"weight":50,"is_pr":false}]'),
('demo-user-id', '2026-02-12', '2026-02-12 17:00:00', 'Lower Body', 18500, 20, 90, '[{"name":"Squat","sets":5,"reps":5,"weight":325,"is_pr":true},{"name":"Romanian Deadlift","sets":4,"reps":8,"weight":235,"is_pr":false},{"name":"Leg Press","sets":3,"reps":12,"weight":420,"is_pr":false}]'),
('demo-user-id', '2026-02-14', '2026-02-14 17:30:00', 'Upper Body Pull', 13800, 18, 80, '[{"name":"Deadlift","sets":4,"reps":6,"weight":375,"is_pr":true},{"name":"Pull-ups","sets":4,"reps":11,"weight":25,"is_pr":false},{"name":"Rows","sets":4,"reps":10,"weight":190,"is_pr":false}]');

-- Continue with remaining gym sessions...

-- ============================================================================
-- BODY METRICS - Weekly weigh-ins showing gradual recomp
-- ============================================================================

INSERT INTO body_metrics (user_id, measurement_date, weight_lbs, body_fat_percentage) VALUES
('demo-user-id', '2026-02-01', 185.2, 12.5),
('demo-user-id', '2026-02-08', 184.6, 12.3),
('demo-user-id', '2026-02-15', 183.8, 12.1),
('demo-user-id', '2026-02-22', 183.2, 11.9),
('demo-user-id', '2026-03-01', 182.8, 11.7);

-- ============================================================================
-- SAMPLE INSIGHTS
-- ============================================================================

INSERT INTO insights (user_id, insight_text, insight_type, confidence_level, sector_tags, date_range_start, date_range_end, is_read) VALUES
('demo-user-id', 'SR day 14 correlation detected: Your energy scores averaged 8.8 during days 10-14 of your streak, 32% higher than your baseline of 6.7.', 'positive', 'high', '["retention", "energy"]', '2026-02-10', '2026-02-14', false),
('demo-user-id', 'Sleep debt accumulation: Detected 1 night under 7h on Feb 15. Consider prioritizing recovery.', 'warning', 'medium', '["sleep"]', '2026-02-14', '2026-02-15', false),
('demo-user-id', 'Gym volume progression: Your total volume increased by 8% over the last 2 weeks. Recomp pattern detected: weight down 1.4 lbs while maintaining strength.', 'positive', 'high', '["gym", "body"]', '2026-02-01', '2026-02-28', false);

-- NOTE: This is sample data. In production, replace 'demo-user-id' with actual user IDs
-- and add nutrition_logs and calendar_events as needed for testing.
