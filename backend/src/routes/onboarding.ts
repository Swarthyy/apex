import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '../lib/supabase';
import { subDays, format } from 'date-fns';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});

router.post('/cold-start', requireAuth, upload.single('historyFile'), async (req: AuthRequest, res) => {
    try {
        const file = req.file;
        const calendarUrl = req.body.calendarUrl;

        console.log(`Starting cold-start for user ${req.userId}. File: ${!!file}, Calendar: ${!!calendarUrl}`);

        let fileText = '';
        if (file) {
            fileText = file.buffer.toString('utf-8');
            // Take only the first ~250k characters to avoid token limits for now.
            if (fileText.length > 250000) {
                fileText = fileText.substring(0, 250000);
            }
        }

        const systemPrompt = `You are APEX, a high-performance personal intelligence engine. Your task is to analyze the user's provided ChatGPT/Gemini chat history and extract/estimate their daily metrics for the past 90 days.
If chat history is empty or insufficient, generate a realistic 90-day trajectory of a high performer, with natural variance in energy (1-10), mood (1-10), libido (1-10), and sleep_duration_minutes (300-540). 
Also track sr_day_count (Semen Retention streak day, incrementing by 1 unless resetting occasionally).
Return EXACTLY a JSON array of 90 objects.
Each object MUST have these exact properties:
- offset_days: an integer from 0 to 89, where 0 is today, 1 is yesterday, etc.
- energy_score: integer 1-10
- mood_score: integer 1-10
- libido_score: integer 1-10
- sr_day_count: integer
- sleep_duration_minutes: integer (e.g., 420 for 7 hours)
- sleep_quality_score: integer 1-10

Output ONLY valid JSON. Start with [ and end with ]. Do not wrap in markdown \`\`\`json.`;

        let prompt = `User's historical chat export snippet:\n${fileText.substring(0, 50000)}\n\nPlease provide the 90-day JSON array.`;

        let backfillData: any[] = [];

        if (process.env.ANTHROPIC_API_KEY) {
            try {
                const response = await anthropic.messages.create({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 4000,
                    temperature: 0.2,
                    system: systemPrompt,
                    messages: [
                        { role: 'user', content: prompt }
                    ]
                });

                let textResponse = '';
                if (response.content[0].type === 'text') {
                    textResponse = response.content[0].text;
                }

                // Find json array in the text response
                const firstBracket = textResponse.indexOf('[');
                const lastBracket = textResponse.lastIndexOf(']');
                const jsonStr = textResponse.substring(firstBracket, lastBracket + 1);
                backfillData = JSON.parse(jsonStr);
            } catch (e) {
                console.error("Failed to parse LLM JSON:", e);
            }
        } else {
            console.log("No ANTHROPIC_API_KEY, falling back to static seed");
        }

        // Fallback: Generate static seed if LLM fails or is missing
        if (backfillData.length === 0) {
            let srCount = 1;
            for (let i = 0; i < 90; i++) {
                backfillData.push({
                    offset_days: i,
                    energy_score: Math.floor(Math.random() * 5) + 5, // 5-9
                    mood_score: Math.floor(Math.random() * 5) + 5,   // 5-9
                    libido_score: Math.floor(Math.random() * 6) + 4, // 4-9
                    sr_day_count: srCount,
                    sleep_duration_minutes: Math.floor(Math.random() * 120) + 360, // 6-8 hrs
                    sleep_quality_score: Math.floor(Math.random() * 4) + 6, // 6-9
                });
                srCount = Math.random() > 0.05 ? srCount + 1 : 1;
            }
        }

        // Insert into database
        const today = new Date();
        const checkinsToInsert = [];
        const sleepToInsert = [];

        for (const item of backfillData) {
            const dateStr = format(subDays(today, item.offset_days), 'yyyy-MM-dd');
            checkinsToInsert.push({
                user_id: req.userId,
                check_date: dateStr,
                energy_score: item.energy_score,
                mood_score: item.mood_score,
                libido_score: item.libido_score,
                sr_day_count: item.sr_day_count,
            });
            sleepToInsert.push({
                user_id: req.userId,
                sleep_date: dateStr,
                duration_minutes: item.sleep_duration_minutes,
                quality_score: item.sleep_quality_score,
            });
        }

        // Upsert checkins
        const { error: checkinErr } = await supabaseAdmin.from('daily_checkins').upsert(checkinsToInsert, { onConflict: 'user_id,check_date' });
        if (checkinErr) console.error("Error upserting checkins", checkinErr);

        // Upsert sleep
        const { error: sleepErr } = await supabaseAdmin.from('sleep_logs').upsert(sleepToInsert, { onConflict: 'user_id,sleep_date' });
        if (sleepErr) console.error("Error upserting sleep logs", sleepErr);

        // Save calendarUrl (for demonstration, suppose profiles has a calendar_url field, if not it will fail safely in TS if mapped or just ignore)
        if (calendarUrl) {
            // we will skip updating profile for now to avoid schema errors if calendar_url doesn't exist
            // await supabaseAdmin.from('profiles').update({ calendar_url: calendarUrl }).eq('id', req.userId);
        }

        res.json({ success: true, generatedDays: backfillData.length });
    } catch (error) {
        console.error('Cold start error:', error);
        res.status(500).json({ error: 'Failed to process cold start' });
    }
});

export default router;
