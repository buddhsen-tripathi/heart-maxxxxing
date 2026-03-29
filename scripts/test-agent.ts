import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';

const PATIENTS_FILE = path.join(process.cwd(), 'data', 'patients.json');
const PLACES_FILE = path.join(process.cwd(), 'data', 'nutrition_places.json');
const ACTIVITIES_FILE = path.join(process.cwd(), 'data', 'rehab_activities.json');
const SUPPORTERS_FILE = path.join(process.cwd(), 'data', 'supporters.json');

interface Activity {
    name: string;
    variations: string[];
    instructions: string;
    risks_to_avoid: string[];
    benefits: string[];
    stats?: {
        users_count?: number;
        avg_progress?: number;
        variations_stats?: { variation: string, users_count: number, avg_progress: number }[];
    };
}

interface PhaseData {
    title: string;
    focus: string;
    activities: Activity[];
}

interface Act {
    id: string;
    title: string;
    missions_count: number;
    description: string;
}

interface Review {
    place_id: string;
    rating: string;
    comment: string;
}

interface Patient {
    id: string;
    name: string;
    age: number;
    gender: string;
    height: number;
    blood_pressure: string;
    heart_rate: number;
    past_diseases: string[];
    status: 'active' | 'completed';
    progress_percent?: number;
    current_session?: number;
    rehab_plan: {
        title: string;
        acts: Act[];
        total_sessions: number;
        total_weeks: number;
    };
}

interface Place {
    id: string;
    name: string;
    type: string;
    coordinates: { lat: number, lng: number };
    specialty: string;
    address: string;
}

interface Supporter {
    id: string;
    name: string;
    role: string;
    hospital?: string;
    organization?: string;
    message: string;
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query: string): Promise<string> => {
    return new Promise((resolve) => rl.question(query, resolve));
};

async function runAgent() {
    console.log('--- Heart Health Support: Comprehensive Care Onboarding ---');

    // 1. Initial Greeting
    console.log('\nAgent: Good morning. I am your cardiovascular health assistant. To get started, may I ask for your name?');
    const name = await askQuestion('You: ');

    // 2. Past History
    console.log(`\nAgent: Thank you, ${name}. What cardiovascular conditions or history have you had in the past?`);
    const historyInput = await askQuestion('You: ');
    const history = historyInput.split(',').map(s => s.trim().toLowerCase());

    // 3. Load Data
    const patientsData: Patient[] = JSON.parse(fs.readFileSync(PATIENTS_FILE, 'utf-8'));
    const nutritionPlaces: Place[] = JSON.parse(fs.readFileSync(PLACES_FILE, 'utf-8'));
    const rehabData = JSON.parse(fs.readFileSync(ACTIVITIES_FILE, 'utf-8'));
    const supporters: Supporter[] = JSON.parse(fs.readFileSync(SUPPORTERS_FILE, 'utf-8'));

    const foundPatient = patientsData.find(p =>
        p.name.toLowerCase() === name.toLowerCase() &&
        history.some(h => p.past_diseases.some(pd => pd.toLowerCase().includes(h)))
    );

    if (foundPatient) {
        // 4. Confirmation
        console.log(`\nAgent: I’ve located your health profile. Are you ${foundPatient.name}, ${foundPatient.age} years old?`);
        const confirmation = await askQuestion('You (yes/no): ');

        if (confirmation.toLowerCase().startsWith('y')) {
            // 5. Phase Plan
            console.log(`\nAgent: Excellent. Your roadmap is **${foundPatient.rehab_plan.title}**.`);
            console.log(`\nAgent: During Phase II, we use community data to guide your routine:`);
            const phase2: PhaseData = rehabData.phases.phase_II;
            const exercise = phase2.activities.find(a => a.name === 'Monitored Exercise');
            if (exercise && exercise.stats && exercise.stats.variations_stats) {
                exercise.stats.variations_stats.forEach(v => {
                    console.log(`  - ${v.users_count} users did **${v.variation}** and achieved ${v.avg_progress}% progress.`);
                });
            }

            // 6. Mentor suggestion
            const midProgramMentor = patientsData.find(p => p.status === 'active' && p.progress_percent && p.progress_percent > 30 && p.progress_percent < 70 && p.id !== foundPatient.id);
            if (midProgramMentor) {
                console.log(`\nAgent: I can also connect you with **${midProgramMentor.name}**, who is ${midProgramMentor.progress_percent}% through his plan.`);
            }

            // 7. Support Circle (Family vs. Pseudo-Family)
            console.log(`\nAgent: Recovery is more successful with support. Would you like to involve a family member (spouse, child, or sibling) for weekly motivation?`);
            const familyConfirmation = await askQuestion('You (yes/no): ');

            if (familyConfirmation.toLowerCase().startsWith('n')) {
                console.log(`\nAgent: No problem. Everyone's situation is different.`);
                console.log(`Agent: Would you like to be paired with one of our "Care Supporters" instead? These are nurses and volunteers who act as a supportive circle for patients navigating recovery alone.`);
                const volunteerConfirmation = await askQuestion('You (yes/no): ');

                if (volunteerConfirmation.toLowerCase().startsWith('y')) {
                    const supporter = supporters[Math.floor(Math.random() * supporters.length)];
                    console.log(`\nAgent: I’ve paired you with **${supporter.name}** (${supporter.role}).`);
                    console.log(`Agent: Messages from ${supporter.name}: "${supporter.message}"`);
                    console.log(`Agent: They will receive updates on your milestones and send you encouraging notes!`);
                }
            } else {
                console.log('Agent: Great choice! Family support always makes the heart stronger.');
            }

            console.log(`\nAgent: Ready to begin your first session today?`);
        } else {
            console.log(`\nAgent: I apologize. Let me double-check our records.`);
        }
    } else {
        console.log(`\nAgent: I’m sorry, I couldn’t find a matching profile.`);
    }

    rl.close();
}

runAgent().catch(err => {
    console.error('Error running health assistant:', err);
    process.exit(1);
});
