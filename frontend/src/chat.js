// ═══════════════════════════════════════════════════════════════════════════
// APEX — Chat Engine (Keyword-match canned responses for MVP)
// ═══════════════════════════════════════════════════════════════════════════
import { getToday, getRecentDays } from './data.js';

const RESPONSES = [
    {
        keywords: ['sleep', 'tired', 'rest'], fn: () => {
            const days = getRecentDays(7);
            const avg = (days.reduce((s, d) => s + d.sleep, 0) / days.length).toFixed(1);
            const worst = Math.min(...days.map(d => d.sleep));
            return `Your 7-day sleep average is ${avg}h. Worst night was ${worst}h. ${avg < 7.5 ? 'You\'re running a sleep debt — your energy and mood scores are 12% below your 30-day baseline on sub-7h nights.' : 'Sleep is on track. Your energy scores are 18% higher during weeks you average 7.5h+.'}`;
        }
    },
    {
        keywords: ['energy', 'feel', 'tired', 'fatigue'], fn: () => {
            const today = getToday();
            const days = getRecentDays(30);
            const avg30 = (days.reduce((s, d) => s + d.energy, 0) / days.length).toFixed(1);
            return `Your energy today is ${today.energy}/10. Your 30-day average is ${avg30}. ${today.energy >= 8 ? 'You\'re above baseline — SR day ' + today.srDay + ' and good sleep are likely drivers.' : 'Below your best. Historical data shows your peak energy days correlate with SR day 14+, liver consumption, and 8h+ sleep.'}`;
        }
    },
    {
        keywords: ['sr', 'retention', 'streak', 'semen'], fn: () => {
            const today = getToday();
            return `You're on SR day ${today.srDay}. Historical analysis: your energy averages 1.8 points higher after day 14, libido peaks around day 10-16, and mood is consistently elevated from day 7 onwards. Your personal best is day 28 — you're ${today.srDay >= 14 ? 'in a performance window right now.' : `${14 - today.srDay} days from the performance window.`}`;
        }
    },
    {
        keywords: ['libido', 'drive'], fn: () => {
            const today = getToday();
            const days = getRecentDays(14);
            const avg = (days.reduce((s, d) => s + d.libido, 0) / days.length).toFixed(1);
            return `Libido today: ${today.libido}/10. 14-day average: ${avg}. Strongest correlations: SR day (r=0.82), oyster consumption (+1.4 avg when logged), liver (+0.9 avg). ${today.hadOysters ? 'Oysters logged today — good.' : 'No oysters logged recently. Last time you had oysters 2x/week, libido averaged 8.1.'}`;
        }
    },
    {
        keywords: ['eat', 'food', 'meal', 'nutrition', 'diet', 'liver', 'oyster', 'milk'], fn: () => {
            const today = getToday();
            return `Today you've logged ${today.meals.length} meals totalling ${today.totalKcal} kcal (${today.totalProtein}g protein). ${today.totalKcal < 2800 ? `You need ~${3200 - today.totalKcal} more kcal to hit your goal.` : 'Calorie intake is on track.'} ${!today.hadLiver ? 'No liver logged this week — your B12 and Vitamin A are running low. On weeks with 3+ liver servings, your libido averaged 1.4 points higher.' : 'Liver is logged — B12 and Vitamin A covered.'}`;
        }
    },
    {
        keywords: ['gym', 'workout', 'train', 'exercise', 'lift'], fn: () => {
            const days = getRecentDays(7);
            const gymDays = days.filter(d => d.hasGym).length;
            const today = getToday();
            return `${today.hasGym ? 'Gym session logged today.' : 'Rest day today.'} This week: ${gymDays}/7 sessions. Your gym volume has been trending up 12% over the last 4 weeks while weight decreased 0.8kg — that's a lean recomp pattern. ${today.sleep < 7 ? 'Given your sleep last night (' + today.sleep + 'h), consider a lighter session or rest.' : 'Recovery looks good based on last night\'s sleep.'}`;
        }
    },
    {
        keywords: ['mood', 'happy', 'sad', 'feel', 'mental'], fn: () => {
            const today = getToday();
            const days = getRecentDays(14);
            const avg = (days.reduce((s, d) => s + d.mood, 0) / days.length).toFixed(1);
            return `Mood today: ${today.mood}/10. 14-day average: ${avg}. Best correlations: social events in the evening (+1.2 avg), gym in the morning (+0.8 avg), liver consumption (+0.6 avg), sunshine/outdoor time (+1.0 avg). Your highest-mood days almost always include a gym session AND a social event.`;
        }
    },
    {
        keywords: ['weight', 'body', 'fat', 'composition'], fn: () => {
            const today = getToday();
            return `Current weight: ${today.weight}kg at ${today.bodyFat}% body fat. 14-day trend: -0.8kg. Combined with 12% gym volume increase, this is consistent with body recomposition. Estimated lean mass gain: ~0.3kg. Your weight tends to be lowest on days following high-sleep (8h+) nights.`;
        }
    },
    {
        keywords: ['best', 'peak', 'optimal', 'perfect'], fn: () => {
            return `Your best days (vitality 8.5+) share these patterns: SR day 14+ (present 85% of peak days), sleep 7.5h+ (92%), liver consumed (78%), gym session in the morning (71%), and a social event (64%). Your single best day this month: Vitality 9.2 on Feb 18 — SR day 19, 8.5h sleep, gym + liver + oysters + social dinner.`;
        }
    },
    {
        keywords: ['week', 'correlat', 'pattern', 'why'], fn: () => {
            const today = getToday();
            return `Based on your last 30 days: SR streak is your strongest single driver (explains ~35% of vitality variance). Sleep duration is second (22%). Liver and oyster consumption are the highest-impact nutritional factors. Your lowest-scoring weeks correlate with: sub-6.5h sleep for 3+ nights, early SR days (1-5), and no organ meat consumption. Currently you're on SR day ${today.srDay} — ${today.srDay >= 14 ? 'this is a high-performance window.' : 'building toward your performance window.'}`;
        }
    },
];

export function getChatResponse(query) {
    const q = query.toLowerCase();
    for (const r of RESPONSES) {
        if (r.keywords.some(k => q.includes(k))) return r.fn();
    }
    return `I've reviewed your data but I'm not sure what specific area you're asking about. Try asking about your sleep, energy, SR streak, nutrition, gym performance, libido, mood, weight, or overall patterns. I'll give you specific answers based on your actual data.`;
}
