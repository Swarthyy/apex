// ═══════════════════════════════════════════════════════════════════════════
// Fetch all Hevy workout data and save as JSON
// Run: node scripts/fetch-hevy.js
// ═══════════════════════════════════════════════════════════════════════════
const API_KEY = 'bd2a5e74-9a1f-4c48-a7cb-90cdde0d2bb8';
const BASE = 'https://api.hevyapp.com/v1';
const fs = require('fs');
const path = require('path');

async function fetchAllWorkouts() {
    console.log('📡 Fetching workout count...');
    const countRes = await fetch(`${BASE}/workouts/count`, {
        headers: { 'api-key': API_KEY }
    });
    const { workout_count } = await countRes.json();
    console.log(`📊 Total workouts: ${workout_count}`);

    const pageSize = 10;
    const totalPages = Math.ceil(workout_count / pageSize);
    const allWorkouts = [];

    for (let page = 1; page <= totalPages; page++) {
        process.stdout.write(`\r⏳ Fetching page ${page}/${totalPages}...`);
        const res = await fetch(`${BASE}/workouts?page=${page}&pageSize=${pageSize}`, {
            headers: { 'api-key': API_KEY }
        });
        const data = await res.json();
        allWorkouts.push(...data.workouts);

        // Respect rate limits — wait 300ms per request
        await new Promise(r => setTimeout(r, 300));
    }

    console.log(`\n✅ Fetched ${allWorkouts.length} workouts`);

    // Sort by date (newest first)
    allWorkouts.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

    // Save raw data
    const outPath = path.join(__dirname, '..', 'frontend', 'src', 'hevy-data.json');
    fs.writeFileSync(outPath, JSON.stringify(allWorkouts, null, 2));
    console.log(`💾 Saved to ${outPath}`);

    // Print summary
    const byMonth = {};
    allWorkouts.forEach(w => {
        const month = w.start_time.substring(0, 7);
        byMonth[month] = (byMonth[month] || 0) + 1;
    });
    console.log('\n📅 Workouts by month:');
    Object.entries(byMonth).sort().forEach(([m, c]) => console.log(`   ${m}: ${c}`));

    // Print exercise frequency
    const exFreq = {};
    allWorkouts.forEach(w => {
        w.exercises.forEach(ex => {
            exFreq[ex.title] = (exFreq[ex.title] || 0) + 1;
        });
    });
    console.log('\n🏋️ Top 15 exercises:');
    Object.entries(exFreq).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([name, count]) => {
        console.log(`   ${name}: ${count}x`);
    });

    // Volume stats
    let totalVolume = 0;
    let totalSets = 0;
    allWorkouts.forEach(w => {
        w.exercises.forEach(ex => {
            ex.sets.forEach(s => {
                if (s.weight_kg && s.reps) {
                    totalVolume += s.weight_kg * s.reps;
                    totalSets++;
                }
            });
        });
    });
    console.log(`\n💪 Total volume lifted: ${(totalVolume / 1000).toFixed(0)} tonnes`);
    console.log(`📈 Total sets logged: ${totalSets}`);
}

fetchAllWorkouts().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
