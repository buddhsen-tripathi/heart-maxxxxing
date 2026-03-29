import * as fs from 'node:fs';
import * as path from 'node:path';

const SUPPORTERS_FILE = path.join(process.cwd(), 'data', 'supporters.json');
const SCRIPT_FILE = path.join(process.cwd(), 'scripts', 'test-agent.ts');

interface Supporter {
    id: string;
    name: string;
    role: string;
    message: string;
}

// Test Case 1: Supporters dataset integrity
console.log('Test Case 1: Verifying supporters dataset...');
const supporters: Supporter[] = JSON.parse(fs.readFileSync(SUPPORTERS_FILE, 'utf-8'));
if (supporters.length >= 3) {
    console.log(`✅ Found ${supporters.length} supporters.`);
    console.log(`- Example supporter: ${supporters[0].name} (${supporters[0].role})`);
} else {
    console.log('❌ Failed to find enough supporters.');
}

// Test Case 2: Logic in agent script
console.log('\nTest Case 2: Checking agent script for alternative support logic...');
const scriptContent = fs.readFileSync(SCRIPT_FILE, 'utf-8');
if (scriptContent.includes('Care Supporters') && scriptContent.includes('paired you with')) {
    console.log('✅ Agent script includes alternative support (pseudo-family) logic.');
} else {
    console.log('❌ Alternative support logic missing from agent script.');
}
