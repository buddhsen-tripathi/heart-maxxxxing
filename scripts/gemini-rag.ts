import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
const recorder = require('node-record-lpcm16');

dotenv.config();

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY || API_KEY === 'your_api_key_here') {
    console.error('Error: Please set GOOGLE_API_KEY in your .env file.');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
// Using 1.5-flash for stable multimodal (audio) processing
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Load Data
const loadData = () => {
    const patients = fs.readFileSync(path.join(process.cwd(), 'data', 'patients.json'), 'utf-8');
    const places = fs.readFileSync(path.join(process.cwd(), 'data', 'nutrition_places.json'), 'utf-8');
    const rehab = fs.readFileSync(path.join(process.cwd(), 'data', 'rehab_activities.json'), 'utf-8');
    const supporters = fs.readFileSync(path.join(process.cwd(), 'data', 'supporters.json'), 'utf-8');

    return { patients, places, rehab, supporters };
};

const data = loadData();

// Get Current Time for the Prompt
const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });
};

const systemPrompt = `
You are a supportive, time-aware, and multimodal Heart Health Assistant. 
CURRENT TIME: ${getCurrentTime()}

MULTIMODAL CAPABILITY:
- You CAN and MUST process audio inputs (sent as audio/wav). 
- If you receive an audio file, listen to it carefully, transcribe it, and respond to the user's spoken request. 
- Never say "I can't process audio." You are a multimodal expert.

CONVERSATION STYLE:
- Be concise. One or two short sentences per response. 
- Talk like a real person. Detect and respond in the user's language (Spanish, etc.).
- Ask one question at a time.

SCHEDULING & PRECISION:
- Use the CURRENT TIME to recommend specific activities from the Phase I "daily_schedule" or Phase II plan.
- For example, if it's 3:00 PM and the user is in Phase I, suggest the "Afternoon Range of Motion".
- Only recommend activities/locations strictly relevant to the user's specific past conditions.

SOURCE DATA:
- PATIENTS: ${data.patients}
- NUTRITION PLACES: ${data.places}
- REHAB ACTIVITIES: ${data.rehab}
- SUPPORTERS: ${data.supporters}

LOGIC FLOW:
1. Greet and identify (Name/History).
2. Confirm identity via database metrics.
3. Guide through rehab phases step-by-step, following the daily schedule for Phase I if applicable.
`;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const recordAudio = (durationMs: number = 5000): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        console.log(`\n[Listening for ${durationMs / 1000}s... Speak now!]`);
        const chunks: Buffer[] = [];
        const recording = recorder.record({
            sampleRate: 16000,
            threshold: 0,
            verbose: false,
            recordProgram: 'rec',
        });

        recording.stream().on('data', (chunk: Buffer) => chunks.push(chunk));

        setTimeout(() => {
            recording.stop();
            console.log('[Processing speech...]\n');
            resolve(Buffer.concat(chunks));
        }, durationMs);

        recording.stream().on('error', reject);
    });
};

async function main() {
    const chat = model.startChat({
        history: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: "Understood. I am now time-aware and ready to process both text and voice. How can I help you today?" }] }
        ]
    });

    console.log('--- Heart Health RAG Assistant (Time-Aware) ---');
    console.log(`Assistant: Good morning. It is currently ${getCurrentTime()}. How can I help you? (Type "voice" to speak)`);

    const chatLoop = () => {
        rl.question('\nYou: ', async (input) => {
            if (input.toLowerCase() === 'exit') {
                rl.close();
                return;
            }

            try {
                let parts: any[] = [];

                if (input.toLowerCase() === 'voice') {
                    const audioBuffer = await recordAudio();
                    parts.push({
                        inlineData: {
                            data: audioBuffer.toString('base64'),
                            mimeType: 'audio/wav',
                        },
                    });
                    parts.push({ text: "Listen to this audio carefully and respond as the Heart Health Assistant, following our schedule and guidelines." });
                } else {
                    parts.push({ text: input });
                }

                const result = await chat.sendMessage(parts);
                const response = result.response.text();
                console.log(`\nAssistant: ${response}`);
                chatLoop();
            } catch (error: any) {
                console.error('Error:', error.message || error);
                chatLoop();
            }
        });
    };

    chatLoop();
}

main().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
