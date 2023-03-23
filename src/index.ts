#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { program } from 'commander';
import sharp from 'sharp';

const packageJson = require('../package.json');

program
    .version(packageJson.version)
    .option('-i, --input <dir>', 'Input directory', 'public')
    .option('-o, --output <dir>', 'Output directory', 'public')
    .parse(process.argv);

const options = program.opts();
const inputDir = path.resolve(options.input);
const outputDir = path.resolve(options.output);

if (!fs.existsSync(inputDir)) {
    console.error(`Input directory "${inputDir}" not found.`);
    process.exit(1);
}

if (!fs.existsSync(outputDir)) {
    console.error(`Output directory "${outputDir}" not found.`);
    process.exit(1);
}

function convertFile(inputFile: string, outputFile: string): void {
    console.log(`Converting file "${inputFile}" to "${outputFile}"...`);

    sharp(inputFile)
        .webp()
        .toFile(outputFile, (err) => {
            if (err) {
                console.error(`Failed to convert file "${inputFile}" to "${outputFile}".`, err);
                process.exit(1);
            }
        });
}

function convertDirectory(inputDir: string, outputDir: string): void {
    const files = fs.readdirSync(inputDir);

    files.forEach((file) => {
        const inputFile = path.join(inputDir, file);

        if (fs.statSync(inputFile).isDirectory()) {
            const subInputDir = inputFile;
            const subOutputDir = path.join(outputDir, file);
            fs.ensureDirSync(subOutputDir);
            convertDirectory(subInputDir, subOutputDir);
        } else {
            const outputFile = path.join(outputDir, `${path.parse(file).name}.webp`);

            if (path.parse(inputFile).ext.toLowerCase() !== '.jpg' && path.parse(inputFile).ext.toLowerCase() !== '.jpeg' &&
                path.parse(inputFile).ext.toLowerCase() !== '.png') {
                console.warn(`Unsupported file format "${path.parse(inputFile).ext}" for file "${inputFile}". Skipping file.`);
                return;
            }

            convertFile(inputFile, outputFile);
        }
    });
}

convertDirectory(inputDir, outputDir);
