// KV namespace export script
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import * as jsonc from 'jsonc-parser';
import dotenv from 'dotenv';
import { execSync } from 'child_process';

// Parse command line arguments
const args = process.argv.slice(2);
const isVerbose = args.includes('--verbose');
const dryRun = args.includes('--dry-run');
const kvIndex = args.findIndex(arg => arg === '--kv');
const hasKvParam = kvIndex !== -1;
const kvBinding = hasKvParam && args[kvIndex + 1] && !args[kvIndex + 1].startsWith('--') ? args[kvIndex + 1] : null;
const showHelp = args.includes('--help') || args.includes('-h') || (!kvBinding);
const usePreview = args.includes('--preview_kv');
const inputFile = args.find((arg, index) => index > 0 && args[index - 1] === '--input');

// Display help and exit if --help flag is present
// Show help if explicitly requested or if --kv parameter is missing or used without a binding
if (showHelp) {
    if (!kvBinding) {
        console.error('Error: --kv <binding> parameter is required');
    }
    console.log(`
Cloudflare KV Export Tool

Usage:
  node export_kv.js [options]

Options:
  --kv <binding>   Required. Specifies the KV binding name to use
  --input <file>   Optional. JSON file to use as input source instead of local KV
  --dry-run        Output data as JSON instead of exporting to remote KV
  --preview_kv     Use KV preview namespace 
  --help, -h       Show this help message and exit
  --verbose        Show detailed information during execution

Description:
  Exports data from local KV storage to Cloudflare KV or outputs it as JSON.
  Requires KV_EXPORT_TOKEN environment variable to be set in .dev.vars file.

Examples:
  node export_kv.js --kv MY_KV       # Export data from local KV to remote KV 
  node export_kv.js --kv MY_KV --dry-run # Output local KV data as JSON instead of exporting to remote KV
  node export_kv.js --kv MY_KV --input data.json # Export data from JSON file to remote KV
`);
    process.exit(0);
}

// Logging function that only logs in verbose mode
function verboseLog(...messages) {
    if (isVerbose) {
        console.log(...messages);
    }
}

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Temporarily redirect console.log to suppress dotenv messages
const originalConsoleLog = console.log;
if (!isVerbose) {
    console.log = () => { }; // No-op function
}

// Load environment variables from .dev.vars file
const dotenvResult = dotenv.config({
    path: resolve(__dirname, '../.dev.vars')
});

// Restore console.log
console.log = originalConsoleLog;

// Log dotenv result in verbose mode
if (isVerbose && dotenvResult.parsed) {
    verboseLog(`Loaded ${Object.keys(dotenvResult.parsed).length} environment variables from .dev.vars`);
}

// Function to read and parse wrangler.jsonc using jsonc-parser
function readWranglerConfig() {
    try {
        const wranglerPath = resolve(__dirname, '../wrangler.jsonc');

        if (!existsSync(wranglerPath)) {
            console.error('wrangler.jsonc file not found.');
            process.exit(1);
        }

        // Read wrangler.jsonc
        const content = readFileSync(wranglerPath, 'utf8');

        // Parse JSONC content (handles comments automatically)
        const errors = [];
        const config = jsonc.parse(content, errors);

        if (errors.length > 0) {
            console.warn('Warning: Errors found while parsing wrangler.jsonc:', errors);
        }

        return config;
    } catch (e) {
        console.error('Error reading or parsing wrangler.jsonc:', e.message);
        process.exit(1);
    }
}

// Function to get KV configuration from wrangler.jsonc
function getKVConfig(binding) {
    const config = readWranglerConfig();

    // Extract account ID
    const accountId = config.account_id;
    if (!accountId) {
        console.error('account_id not found in wrangler.jsonc');
        process.exit(1);
    }

    // Find the KV namespace with the specified binding
    if (!config.kv_namespaces || !Array.isArray(config.kv_namespaces)) {
        console.error('No KV namespaces found in wrangler.jsonc');
        process.exit(1);
    }

    const namespace = config.kv_namespaces.find(ns => ns.binding === binding);
    if (!namespace) {
        console.error(`KV namespace with binding '${binding}' not found in wrangler.jsonc`);
        process.exit(1);
    }

    if (!namespace.id) {
        console.error(`ID for KV namespace '${binding}' not found in wrangler.jsonc`);
        process.exit(1);
    }

    return {
        accountId,
        namespaceId: namespace.id,
        binding: namespace.binding
    };
}

// Function to get data from local KV
async function getLocalKVData(binding) {
    try {
        verboseLog(`Fetching data from local KV with binding: ${binding}`);

        // Define preview flag
        const previewFlag = usePreview ? '--preview' : '--preview false';

        // Use wrangler CLI to list keys (without --json flag which causes errors)
        const command = `npx wrangler kv key list --binding=${binding} --local ${previewFlag}`;
        verboseLog(`Executing: ${command}`);

        const result = execSync(command, { encoding: 'utf8' });
        
        // Parse the output as JSON
        // The output format is an array of objects with a 'name' property
        let keys = [];
        try {
            const jsonData = JSON.parse(result);
            if (Array.isArray(jsonData)) {
                keys = jsonData.map(item => item.name);
            }
        } catch (e) {
            // Fallback to plain text parsing if JSON parsing fails
            verboseLog(`Error parsing JSON output: ${e.message}`);
            keys = result.trim().split('\n')
                .filter(line => line.trim() !== '')
                .map(line => line.trim());
        }

        verboseLog(`Found ${keys.length} keys in local KV`);

        const data = {};

        // Get values for each key
        for (const key of keys) {
            verboseLog(`Fetching value for key: ${key}`);

            const valueCommand = `npx wrangler kv key get --binding=${binding} --local ${previewFlag} "${key}"`;
            const value = execSync(valueCommand, { encoding: 'utf8' });

            // Try to parse as JSON, but keep as string if parsing fails
            try {
                data[key] = JSON.parse(value);
            } catch (e) {
                data[key] = value;
            }
        }

        return data;
    } catch (error) {
        console.error(`Error fetching data from local KV: ${error.message}`);
        process.exit(1);
    }
}

// Function to read data from input JSON file
function readInputFile(filePath) {
    try {
        verboseLog(`Reading data from input file: ${filePath}`);
        const content = readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`Error reading input file: ${error.message}`);
        process.exit(1);
    }
}

async function exportKV() {
    try {
        // Get KV configuration from wrangler.jsonc using the binding from --kv parameter
        const kvConfig = getKVConfig(kvBinding);

        // Check if API token is set in environment variables
        const apiTokenEnvVar = process.env.KV_EXPORT_TOKEN;

        if (!apiTokenEnvVar) {
            console.error('KV_EXPORT_TOKEN environment variable is required but not set.');
            console.error('Please set it in your .dev.vars file or environment variables.');
            process.exit(1);
        }

        // Get data either from input file or local KV
        let exportData;
        if (inputFile && existsSync(inputFile)) {
            exportData = readInputFile(inputFile);
        } else {
            exportData = await getLocalKVData(kvBinding);
        }

        // If --dry-run flag is provided, just output the data as JSON and exit
        if (dryRun) {
            verboseLog(`Dry run mode: Outputting data as JSON`);
            console.log(JSON.stringify(exportData, null, 2));
            return;
        }

        // Otherwise, export data to remote KV
        const accountId = kvConfig.accountId;
        const namespaceId = kvConfig.namespaceId;
        const apiToken = apiTokenEnvVar;

        const headers = {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
        };

        verboseLog(`Exporting ${Object.keys(exportData).length} items to remote KV namespace: ${namespaceId}`);

        let successCount = 0;

        // Create a temporary directory for value files
        const tempDir = join(__dirname, '../.tmp_kv_export');
        try {
            // Ensure temp directory exists
            execSync(`mkdir -p ${tempDir}`);
            verboseLog(`Created temporary directory: ${tempDir}`);
        } catch (error) {
            console.error(`Error creating temporary directory: ${error.message}`);
            process.exit(1);
        }

        for (const key of Object.keys(exportData)) {
            const value = exportData[key];
            const valueString = typeof value === 'string' ? value : JSON.stringify(value);

            verboseLog(`Processing key: ${key}`);

            try {
                // Write value to API
                const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${key}`;

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

                const response = await fetch(url, {
                    method: 'PUT',
                    headers,
                    body: valueString,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                const responseData = await response.json();

                if (!responseData.success) {
                    throw new Error(`API Error: ${JSON.stringify(responseData.errors)}`);
                }

                verboseLog(`Successfully wrote key: ${key} to remote KV`);
                successCount++;
            } catch (error) {
                console.error(`Error writing key ${key}: ${error.message}`);
                // Log full error details
                console.error(error);
                // Exit immediately on error
                process.exit(1);
            }
        }

        // Clean up temp directory
        execSync(`rm -rf ${tempDir}`);
        verboseLog(`Removed temporary directory: ${tempDir}`);

        // Summary
        verboseLog(`Remote KV export completed: ${successCount} keys written`);
        console.log(`Successfully exported ${successCount} keys to remote KV ${kvBinding}`);


    } catch (error) {
        // Handle any other errors
        console.error(`Error in exportKV: ${error.message}`);
        // Always show stack trace for better debugging
        if (error.stack) console.error(error.stack);
        process.exit(1);
    }
}

exportKV().catch(console.error);
