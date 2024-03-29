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
    .option('-q, --quality <number>', 'Quality of the output image (1-100)', '80')
    .parse(process.argv);

const options = program.opts();
const inputDir = path.resolve(options.input);
const outputDir = path.resolve(options.output);
const quality = parseInt(options.quality, 10);

if (!fs.existsSync(inputDir)) {
    console.error(`Input directory "${inputDir}" not found.`);
    process.exit(1);
}

if (!fs.existsSync(outputDir)) {
    console.error(`Output directory "${outputDir}" not found.`);
    process.exit(1);
}

function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function printHeader() {
    console.log('File Path'.padEnd(50) + 'Original Size'.padEnd(20) + 'Compressed Size'.padEnd(20) + 'Compression Ratio');
    console.log('-'.repeat(110));
}

function convertFile(inputFile: string, outputFile: string, relativePath: string): void {
    const originalSize = fs.statSync(inputFile).size;
    const animated = path.parse(inputFile).ext.toLowerCase() === '.gif';

    sharp(inputFile, { animated })
        .webp({ quality: quality })
        .toBuffer()
        .then(outputBuffer => {
            fs.writeFileSync(outputFile, outputBuffer);
            const compressedSize = outputBuffer.length;
            const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);

            console.log(
                `${relativePath.padEnd(50)}\t${formatBytes(originalSize).padEnd(20)}\t${formatBytes(compressedSize).padEnd(20)}\t${compressionRatio}%`
            );
        })
        .catch(err => {
            console.error(`Failed to convert file "${inputFile}" to "${outputFile}".`, err);
            process.exit(1);
        });
}

function convertDirectory(inputDir: string, outputDir: string, baseDir: string = inputDir): void {
    const files = fs.readdirSync(inputDir);

    files.forEach((file) => {
        const inputFile = path.join(inputDir, file);
        const relativePath = path.relative(baseDir, inputFile);

        if (fs.statSync(inputFile).isDirectory()) {
            const subInputDir = inputFile;
            const subOutputDir = path.join(outputDir, file);
            fs.ensureDirSync(subOutputDir);
            convertDirectory(subInputDir, subOutputDir, baseDir);
        } else {
            const outputFile = path.join(outputDir, `${path.parse(file).name}.webp`);

            if (path.parse(inputFile).ext.toLowerCase() !== '.jpg' && path.parse(inputFile).ext.toLowerCase() !== '.jpeg' &&
                path.parse(inputFile).ext.toLowerCase() !== '.png' && path.parse(inputFile).ext.toLowerCase() !== '.gif') {
                console.warn(`Unsupported file format "${path.parse(inputFile).ext}" for file "${inputFile}". Skipping file.`);
                return;
            }

            convertFile(inputFile, outputFile, relativePath);
        }
    });
}

printHeader();
convertDirectory(inputDir, outputDir);
