const fs = require('fs');
const path = require('path');

const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    bold: "\x1b[1m"
};

console.log(`${colors.bold}${colors.cyan}=== Existing Supabase Project Scan ===${colors.reset}\n`);

let overallStatus = true;

// 1. Dependencies Check
console.log(`${colors.bold}[1/3] Checking Installed Packages...${colors.reset}`);
if (fs.existsSync('package.json')) {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    
    if (deps['@supabase/supabase-js']) {
        console.log(`  ${colors.green}✓${colors.reset} @supabase/supabase-js is installed (${deps['@supabase/supabase-js']})`);
    } else {
        console.log(`  ${colors.red}✗${colors.reset} @supabase/supabase-js is MISSING!`);
        overallStatus = false;
    }
    
    if (deps['@supabase/ssr']) {
        console.log(`  ${colors.yellow}ℹ${colors.reset} @supabase/ssr (Modern Auth Handler) is installed (${deps['@supabase/ssr']})`);
    } else if (deps['@supabase/auth-helpers-nextjs']) {
        console.log(`  ${colors.green}✓${colors.reset} @supabase/auth-helpers-nextjs (Legacy Auth Handler) is installed (${deps['@supabase/auth-helpers-nextjs']})`);
    } else {
        console.log(`  ${colors.yellow}⚠${colors.reset} No dedicated Next.js Auth Helper package found (Might be using native supabase-js implementation)`);
    }
}

console.log('');

// 2. Environment Variables Check (Flexible Key Names)
console.log(`${colors.bold}[2/3] Checking Existing Environment Variables...${colors.reset}`);
const envFiles = ['.env.local', '.env', '.env.development', '.env.production'];
let envContent = '';
let foundEnv = null;

for (const file of envFiles) {
    if (fs.existsSync(file)) {
        foundEnv = file;
        envContent = fs.readFileSync(file, 'utf8');
        break;
    }
}

if (foundEnv) {
    console.log(`  Scanning config file: ${colors.cyan}${foundEnv}${colors.reset}`);
    
    // Check URL
    const urlRegex = /^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_URL)\s*=\s*.*/m;
    if (urlRegex.test(envContent)) {
        const matched = envContent.match(urlRegex)[1];
        console.log(`  ${colors.green}✓${colors.reset} Supabase URL Configuration found via: ${colors.bold}${matched}${colors.reset}`);
    } else {
        console.log(`  ${colors.red}✗${colors.reset} Supabase URL Key is missing.`);
        overallStatus = false;
    }

    // Check Public/Anon Key (Supports legacy and modern naming structures)
    const keyRegex = /^(NEXT_PUBLIC_SUPABASE_ANON_KEY|NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY|SUPABASE_ANON_KEY)\s*=\s*.*/m;
    if (keyRegex.test(envContent)) {
        const matched = envContent.match(keyRegex)[1];
        console.log(`  ${colors.green}✓${colors.reset} Supabase Public Key found via: ${colors.bold}${matched}${colors.reset}`);
    } else {
        console.log(`  ${colors.red}✗${colors.reset} Supabase Anon/Publishable Key is missing.`);
        overallStatus = false;
    }
} else {
    console.log(`  ${colors.red}✗ No environment config file (.env / .env.local) detected.${colors.reset}`);
    overallStatus = false;
}

console.log('');

// 3. Custom Check for Existing Supabase Client Files
console.log(`${colors.bold}[3/3] Locating Supabase Client Instances...${colors.reset}`);
const commonPaths = [
    'utils/supabase.ts', 'utils/supabase.js',
    'utils/supabaseClient.ts', 'utils/supabaseClient.js',
    'lib/supabase.ts', 'lib/supabase.js',
    'lib/supabaseClient.ts', 'lib/supabaseClient.js',
    'src/utils/supabase.ts', 'src/utils/supabase.js',
    'utils/supabase/client.ts', 'utils/supabase/server.ts'
];

let clientFilesFound = [];
commonPaths.forEach(p => {
    if (fs.existsSync(p)) {
        clientFilesFound.push(p);
    }
});

if (clientFilesFound.length > 0) {
    clientFilesFound.forEach(file => {
        console.log(`  ${colors.green}✓${colors.reset} Detected active database initializer: ${colors.cyan}${file}${colors.reset}`);
    });
} else {
    console.log(`  ${colors.yellow}⚠${colors.reset} Could not find standard standalone client utilities.`);
    console.log(`    Note: If your project structure imports createClient() inline inside pages/components, this is expected.`);
}

console.log('\n-----------------------------------------');
if (overallStatus) {
    console.log(`${colors.bold}${colors.green}RESULT: Ready! Your existing project has the necessary core configs.${colors.reset}`);
} else {
    console.log(`${colors.bold}${colors.red}RESULT: Action Required. Core database components or keys are missing.${colors.reset}`);
}

