# APEX Backend API

REST API backend for APEX - The Dashboard for Your Life

## Tech Stack

- **Framework**: Node.js + Express + TypeScript
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **Validation**: Zod
- **Date Utils**: date-fns

## Project Structure

```
backend/
├── src/
│   ├── index.ts                 # Express server entry point
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client initialization
│   │   └── vitality/
│   │       └── calculator.ts    # Vitality score calculation logic
│   ├── middleware/
│   │   └── auth.ts              # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.ts              # Authentication endpoints
│   │   ├── checkins.ts          # Daily check-ins
│   │   ├── sleep.ts             # Sleep logs
│   │   ├── gym.ts               # Gym sessions
│   │   ├── body-metrics.ts      # Body composition
│   │   ├── nutrition.ts         # Meal logging
│   │   ├── calendar.ts          # Calendar events
│   │   ├── insights.ts          # Insights
│   │   ├── vitality.ts          # Vitality score
│   │   ├── dashboard.ts         # Dashboard aggregation
│   │   └── chat.ts              # Keyword chat MVP
│   ├── db/
│   │   └── checkins.ts          # Database query layer (example)
│   ├── validators/
│   │   └── schemas.ts           # Zod validation schemas
│   └── types/
│       └── database.ts          # TypeScript types (generated from Supabase)
├── supabase/
│   └── migrations/
│       ├── 20260301000000_initial_schema.sql
│       ├── 20260301000001_rls_policies.sql
│       └── 20260301000002_seed_demo_data.sql (TODO)
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up Supabase

**Option A: Supabase Cloud (Recommended for quick start)**

1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Copy the project URL and keys

**Option B: Local Supabase (Recommended for development)**

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Initialize Supabase:
   ```bash
   supabase init
   ```

3. Start local Supabase:
   ```bash
   supabase start
   ```

4. Note the printed URLs and keys (API URL, anon key, service role key)

### 3. Run Database Migrations

```bash
# If using local Supabase
supabase db push

# If using Supabase Cloud
# Run migrations through Supabase Dashboard SQL Editor
```

### 4. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```bash
PORT=3001
NODE_ENV=development

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 5. Generate TypeScript Types (Optional)

```bash
npm run db:types
```

This generates TypeScript types from your Supabase schema into `src/types/database.ts`.

### 6. Start Development Server

```bash
npm run dev
```

The API will start on `http://localhost:3001`.

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login and get access token
- `POST /api/auth/logout` - End session

### Daily Check-ins

- `POST /api/checkins` - Create/update daily check-in
- `GET /api/checkins?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` - Get check-ins in range
- `GET /api/checkins/:date` - Get check-in for specific date

### Sleep

- `POST /api/sleep` - Log sleep data
- `GET /api/sleep?start_date=...&end_date=...` - Get sleep logs

### Gym

- `POST /api/gym` - Log gym session
- `GET /api/gym?start_date=...&end_date=...` - Get gym sessions

### Body Metrics

- `POST /api/body-metrics` - Log weight/body composition
- `GET /api/body-metrics?start_date=...&end_date=...` - Get body metrics

### Nutrition

- `POST /api/nutrition/meals` - Log a meal
- `GET /api/nutrition/meals?date=YYYY-MM-DD` - Get meals for date
- `GET /api/nutrition/daily-summary/:date` - Get daily nutrition summary

### Calendar

- `POST /api/calendar/events` - Create calendar event
- `GET /api/calendar/events?start_date=...&end_date=...` - Get events

### Insights

- `GET /api/insights` - Get all insights
- `GET /api/insights/unread` - Get unread insights
- `POST /api/insights/:id/read` - Mark insight as read

### Vitality Score

- `GET /api/vitality/score/:date` - Get vitality score for date
- `GET /api/vitality/range?start_date=...&end_date=...` - Get scores for range

### Dashboard

- `GET /api/dashboard` - Get aggregated dashboard data

### Chat

- `POST /api/chat` - Query APEX chat (keyword matching MVP)

## Authentication

All endpoints except `/api/auth/*` and `/health` require authentication.

Include the access token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

## Testing with cURL

### 1. Sign up

```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### 2. Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

Copy the `access_token` from the response.

### 3. Create Check-in

```bash
curl -X POST http://localhost:3001/api/checkins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d '{
    "check_date": "2026-03-01",
    "energy_score": 8,
    "mood_score": 7,
    "libido_score": 8,
    "sr_day_count": 14
  }'
```

### 4. Get Dashboard

```bash
curl http://localhost:3001/api/dashboard \
  -H "Authorization: Bearer <your_access_token>"
```

## Development Commands

```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to JavaScript
npm start            # Run compiled production build
npm run db:migrate   # Apply database migrations
npm run db:reset     # Reset database to clean state
npm run db:types     # Generate TypeScript types from schema
```

## Database Schema

See `supabase/migrations/` for full schema definition.

**Core Tables:**
- `daily_checkins` - Morning/evening scores (energy, mood, libido, SR)
- `sleep_logs` - Sleep tracking
- `gym_sessions` - Workout data
- `body_metrics` - Weight and body composition
- `nutrition_logs` - Meal logging
- `calendar_events` - Events for context
- `insights` - AI-generated insights
- `user_preferences` - User settings

All tables have Row Level Security (RLS) enabled - users can only access their own data.

## Vitality Score Calculation

The vitality score (1.0 - 10.0) is calculated from:

- **Energy**: 25%
- **Mood**: 20%
- **Libido**: 20%
- **Sleep**: 20% (with duration adjustments)
- **SR Modifier**: 15% (additive bonus based on streak day)

See `src/lib/vitality/calculator.ts` for implementation.

## Security

- All API routes (except auth) protected by JWT authentication
- Row Level Security (RLS) enforced at database level
- Passwords hashed by Supabase Auth
- CORS configured for allowed origins only

## Next Steps

- [ ] Create demo data seed migration
- [ ] Add comprehensive error logging
- [ ] Implement rate limiting
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Add integration tests
- [ ] Deploy to production (Render/Railway/Vercel)

## Phase 2 Features (Upcoming)

- External API integrations (Hevy, Apple Health, Withings, Google Calendar)
- Nightly insight generation job
- Real-time data sync
- Scheduled background jobs (Supabase Edge Functions)

## Phase 3 Features (Upcoming)

- Real AI chat (Claude Sonnet 4.5)
- Nutrition photo AI (GPT-4o Vision)
- Advanced pattern detection
- Meal recommendations

## License

Proprietary - Internal use only
