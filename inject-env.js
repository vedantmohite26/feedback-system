const fs = require('fs');
const path = require('path');

/**
 * Super simple .env parser to avoid mandatory npm install for basic usage
 */
function parseEnv(filePath) {
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            let value = match[2] || '';
            if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1);
            }
            env[match[1]] = value.trim();
        }
    });
    return env;
}

function inject() {
    const rootDir = __dirname;
    const configPath = path.join(rootDir, 'frontend', 'js', 'firebase-config.js');
    const templatePath = path.join(rootDir, 'frontend', 'js', 'firebase-config.template.js');
    const envPath = path.join(rootDir, '.env');

    if (!fs.existsSync(envPath)) {
        console.error('Error: .env file not found at ' + envPath);
        process.exit(1);
    }

    const env = parseEnv(envPath);
    
    // Check if template exists, if not create one from the current config (first time run)
    if (!fs.existsSync(templatePath)) {
        console.log('Creating template from existing config...');
        let currentConfig = fs.readFileSync(configPath, 'utf8');
        // Replace known values with placeholders for the template
        const replacements = {
            'apiKey': 'FIREBASE_API_KEY',
            'authDomain': 'FIREBASE_AUTH_DOMAIN',
            'projectId': 'FIREBASE_PROJECT_ID',
            'storageBucket': 'FIREBASE_STORAGE_BUCKET',
            'messagingSenderId': 'FIREBASE_MESSAGING_SENDER_ID',
            'appId': 'FIREBASE_APP_ID',
            'measurementId': 'FIREBASE_MEASUREMENT_ID'
        };

        for (const [prop, envKey] of Object.entries(replacements)) {
            const regex = new RegExp(`${prop}:\\s*["'].*?["']`, 'g');
            currentConfig = currentConfig.replace(regex, `${prop}: "__${envKey}__"`);
        }
        fs.writeFileSync(templatePath, currentConfig);
    }

    let template = fs.readFileSync(templatePath, 'utf8');
    let output = template;

    for (const [key, value] of Object.entries(env)) {
        const placeholder = `__${key}__`;
        output = output.split(placeholder).join(value);
    }

    fs.writeFileSync(configPath, output);
    console.log('Successfully injected credentials into firebase-config.js');
}

inject();
