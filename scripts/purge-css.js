#!/usr/bin/env node

import { PurgeCSS } from 'purgecss';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const buildDir = path.join(projectRoot, 'build');
const clientBuildDir = path.join(buildDir, 'client');
const serverBuildDir = path.join(buildDir, 'server');

// Get all HTML files from the build directory
const getHtmlFiles = (dir) => {
    const results = [];
    const list = fs.readdirSync(dir);

    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            results.push(...getHtmlFiles(filePath));
        } else if (path.extname(file) === '.html') {
            results.push(filePath);
        }
    });

    return results;
};

// Get all CSS files from the build directory
const getCssFiles = (dir) => {
    const results = [];
    const list = fs.readdirSync(dir);

    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            results.push(...getCssFiles(filePath));
        } else if (path.extname(file) === '.css') {
            results.push(filePath);
        }
    });

    return results;
};

// Get all JS files from the build directory
const getJsFiles = (dir) => {
    const results = [];
    const list = fs.readdirSync(dir);

    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            results.push(...getJsFiles(filePath));
        } else if (path.extname(file) === '.js') {
            results.push(filePath);
        }
    });

    return results;
};

/**
 * Process CSS files in a specific directory
 */
async function processCssInDirectory(dirPath) {
    // Extract directory name from path
    const dirName = path.basename(dirPath);
    console.log(`\n=== Processing ${dirName} CSS files ===`);

    // Get all HTML, CSS, and JS files
    const htmlFiles = getHtmlFiles(dirPath);
    const cssFiles = getCssFiles(dirPath);
    const jsFiles = getJsFiles(dirPath);

    console.log(`Found ${htmlFiles.length} HTML files, ${cssFiles.length} CSS files, and ${jsFiles.length} JS files in ${dirName}`);

    if (cssFiles.length === 0) {
        console.log(`No CSS files found to purge in ${dirName}`);
        return;
    }

    // Content to analyze for CSS selectors
    const content = [...htmlFiles, ...jsFiles];

    // If no content files found, we need to use JS files at minimum
    if (content.length === 0) {
        console.error(`No content files found to analyze CSS against in ${dirName}`);
        return;
    }

    // Calculate total original size of all CSS files
    let totalOriginalSize = 0;
    for (const cssFile of cssFiles) {
        totalOriginalSize += fs.statSync(cssFile).size;
    }

    console.log(`${dirName} CSS size before purging: ${(totalOriginalSize / 1024).toFixed(2)} KB`);

    // Process all CSS files at once
    const results = await new PurgeCSS().purge({
        content: content,
        css: cssFiles,
        safelist: {
            standard: [
                /^:/,
                /^::/,
                /^data-/,
                /^aria-/,
                /^rt-reset/,
                /^rt-BaseButton/,
                /^rt-r-size-.*/,
                /^rt-variant-.*/,
                /^rt-Button/,
                // deep: [/^:/, /^::/, /^data-/, /^aria-/],
                // greedy: [
            ],
        },
    });

    // Write results back to files
    results.forEach((result, index) => {
        const cssFile = cssFiles[index];
        if (result.css) {
            fs.writeFileSync(cssFile, result.css);
        }
    });

    // Calculate total size after purging
    let totalNewSize = 0;
    for (const cssFile of cssFiles) {
        totalNewSize += fs.statSync(cssFile).size;
    }

    console.log(`${dirName} CSS size after purging: ${(totalNewSize / 1024).toFixed(2)} KB`);
    console.log(`${dirName} reduction: ${((totalOriginalSize - totalNewSize) / 1024).toFixed(2)} KB (${((totalOriginalSize - totalNewSize) / totalOriginalSize * 100).toFixed(2)}%)`);
    console.log(`Processed ${cssFiles.length} CSS files in ${dirName}`);

    return {
        originalSize: totalOriginalSize,
        newSize: totalNewSize,
        fileCount: cssFiles.length
    };
}

async function purgeCSSFromBuild() {
    console.log('Starting PurgeCSS on build directory...');

    try {
        // Check if build directories exist
        const clientExists = fs.existsSync(clientBuildDir);
        const serverExists = fs.existsSync(serverBuildDir);

        if (!clientExists && !serverExists) {
            console.error('Neither client nor server build directories found');
            return;
        }

        let clientStats = null;
        let serverStats = null;

        // Process client CSS files
        if (clientExists) {
            clientStats = await processCssInDirectory(clientBuildDir);
        }

        // Process server CSS files
        if (serverExists) {
            serverStats = await processCssInDirectory(serverBuildDir);
        }

        // Show total stats if both directories were processed
        if (clientStats && serverStats) {
            const totalOriginalSize = clientStats.originalSize + serverStats.originalSize;
            const totalNewSize = clientStats.newSize + serverStats.newSize;
            const totalFileCount = clientStats.fileCount + serverStats.fileCount;

            console.log('\n=== Total Stats ===');
            console.log(`Total CSS size before purging: ${(totalOriginalSize / 1024).toFixed(2)} KB`);
            console.log(`Total CSS size after purging: ${(totalNewSize / 1024).toFixed(2)} KB`);
            console.log(`Total reduction: ${((totalOriginalSize - totalNewSize) / 1024).toFixed(2)} KB (${((totalOriginalSize - totalNewSize) / totalOriginalSize * 100).toFixed(2)}%)`);
            console.log(`Processed ${totalFileCount} CSS files total`);
        }

        console.log('PurgeCSS completed successfully!');
    } catch (error) {
        console.error('Error running PurgeCSS:', error);
    }
}

purgeCSSFromBuild();
