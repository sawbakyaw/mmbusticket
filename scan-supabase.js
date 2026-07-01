const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    bold: "\x1b[1m"
};

console.log(`${colors.bold}${colors.cyan}=== Supabase Project Environment Scan ===${colors.reset}\n`);

let overallStatus = true;

// 1. Check package.json & Dependencies
console.log(`${colors.bold}[1/3] Checking Dependencies...${colors.reset}`);
if (fs.existsSync('package.json')) {
    try {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        
        const requiredDeps = ['@supabase/supabase-js', '@supabase/ssr'];
        requiredDeps.forEach(dep => {
            if (deps[dep]) {
                console.log(`  ${colors.green}✓${colors.reset} ${dep} is installed (${deps[dep]})`);
            } else {
                console.log(`  ${colors.red}✗${colors.reset} ${dep} is MISSING!`);
                overallStatus = false;
            }
        });
    } catch (e) {
        console.log(`  ${colors.red}✗ Error parsing package.json${colors.reset}`);
        overallStatus = false;
    }
} else {
    console.log(`  ${colors.red}✗ package.json not found. Make sure you run this script in the project root.${colors.reset}`);
    overallStatus = false;
}

console.log('');

// 2. Check Environment Variables (.env or .env.local)
console.log(`${colors.bold}[2/3] Checking Environment Variables...${colors.reset}`);
const envFiles = ['.env.local', '.env'];
let envFileFound = null;
let envContent = '';

for (const file of envFiles) {
    if (fs.existsSync(file)) {
        envFileFound = file;
        envContent = fs.readFileSync(file, 'utf8');
        break;
    }
}

if (envFileFound) {
    console.log(`  Found configuration file: ${colors.cyan}${envFileFound}${colors.reset}`);
    const requiredEnvKeys = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];
    
    requiredEnvKeys.forEach(key => {
        // Match key with or without quotes
        const regex = new RegExp(`^${key}\\s*=\\s*.*`, 'm');
        if (regex.test(envContent)) {
            console.log(`  ${colors.green}✓${colors.reset} ${key} is defined.`);
        } else {
            console.log(`  ${colors.red}✗${colors.reset} ${key} is MISSING or commented out!`);
            overallStatus = false;
        }
    });
} else {
    console.log(`  ${colors.red}✗ Neither .env.local nor .env was found!${colors.reset}`);
    overallStatus = false;
}

console.log('');

// 3. Check Required Utility Files
console.log(`${colors.bold}[3/3] Checking Supabase Helper Files...${colors.reset}`);
const targetFiles = [
    'utils/supabase/client.ts',
    'utils/supabase/client.js',
    'utils/supabase/server.ts',
    'utils/supabase/server.js',
    'utils/supabase/middleware.ts',
    'utils/supabase/middleware.js'
];

// Group by type to see if at least one extension exists
const expectedHelpers = ['client', 'server', 'middleware'];
expectedHelpers.forEach(helper => {
    const tsPath = path.join('utils', 'supabase', `${helper}.ts`);
    const jsPath = path.join('utils', 'supabase', `${helper}.js`);
    
    if (fs.existsSync(tsPath)) {
        console.log(`  ${colors.green}✓${colors.reset} utils/supabase/${helper}.ts found.`);
    } else if (fs.existsSync(jsPath)) {
        console.log(`  ${colors.green}✓${colors.reset} utils/supabase/${helper}.js found.`);
    } else {
        console.log(`  ${colors.red}✗${colors.reset} Utilities for '${helper}' are MISSING! (Expected utils/supabase/${helper}.ts or .js)`);
        overallStatus = false;
    }
});

console.log('\n-----------------------------------------');
if (overallStatus) {
    console.log(`${colors.bold}${colors.green}RESULT: Success! Project architecture is ready for Supabase.${colors.reset}`);
} else {
    console.log(`${colors.bold}${colors.red}RESULT: Scan failed. Please fix the missing setup parts above.${colors.reset}`);
}
