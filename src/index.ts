#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { program } from 'commander';
import sharp from 'sharp';

const packageJson = require('../package.json');

program
    .version(packageJson.version)
    .option('-i, --input <path>', 'Input file or directory (default: public)', 'public')
    .option('-o, --output <dir>', 'Output directory (defaults to input path)', '')
    .option('-q, --quality <number>', 'Quality of the output image (1-100)', '80')
    .parse(process.argv);

const options = program.opts();
const inputPath = path.resolve(options.input);
const quality = parseInt(options.quality, 10);

if (!fs.existsSync(inputPath)) {
    console.error(`Input path "${inputPath}" not found.`);
    process.exit(1);
}

const isInputFile = fs.statSync(inputPath).isFile();

let outputDir: string;
if (options.output) {
    const resolvedOutput = path.resolve(options.output);
    const exists = fs.existsSync(resolvedOutput);

    // Must be directory
    if (exists && !fs.statSync(resolvedOutput).isDirectory()) {
        console.error(`Output path "${resolvedOutput}" is not a directory.`);
        process.exit(1);
    }

    fs.ensureDirSync(resolvedOutput);
    outputDir = resolvedOutput;
} else {
    outputDir = isInputFile ? path.dirname(inputPath) : inputPath;
}

function isSupportedImage(ext: string) {
    return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext.toLowerCase());
}

function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024, dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function printHeader() {
    console.log('File Path'.padEnd(50) + 'Original Size'.padEnd(20) + 'Compressed Size'.padEnd(20) + 'Compression Ratio');
    console.log('-'.repeat(110));
}

function convertFile(inputFile: string, outputFile: string, relativePath: string): void {
    const originalSize = fs.statSync(inputFile).size;
    const animated = path.extname(inputFile).toLowerCase() === '.gif';

    sharp(inputFile, { animated })
        .webp({ quality })
        .toBuffer()
        .then(outputBuffer => {
            fs.ensureDirSync(path.dirname(outputFile));
            fs.writeFileSync(outputFile, outputBuffer);
            const compressedSize = outputBuffer.length;
            const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);

            console.log(
                `${relativePath.padEnd(50)}\t${formatBytes(originalSize).padEnd(20)}\t${formatBytes(compressedSize).padEnd(20)}\t${compressionRatio}%`
            );
        })
        .catch(err => {
            console.error(`Failed to convert file "${inputFile}" to "${outputFile}".`, err.message);
        });
}

function convertDirectory(inputDir: string, outputDir: string, baseDir: string = inputDir): void {
    const files = fs.readdirSync(inputDir);

    for (const file of files) {
        const inputFile = path.join(inputDir, file);
        const relativePath = path.relative(baseDir, inputFile);

        if (fs.statSync(inputFile).isDirectory()) {
            convertDirectory(inputFile, path.join(outputDir, file), baseDir);
        } else {
            const ext = path.extname(inputFile);
            if (!isSupportedImage(ext)) {
                console.warn(`Skipping unsupported file: ${inputFile}`);
                continue;
            }

            const outputFile = path.join(outputDir, relativePath).replace(ext, '.webp');
            convertFile(inputFile, outputFile, relativePath);
        }
    }
}

printHeader();

if (isInputFile) {
    const ext = path.extname(inputPath);
    if (!isSupportedImage(ext)) {
        console.error(`Unsupported file format "${ext}" for file "${inputPath}".`);
        process.exit(1);
    }

    const baseName = path.basename(inputPath, ext);
    const relativePath = path.basename(inputPath);
    const outputFile = path.join(outputDir, `${baseName}.webp`);
    convertFile(inputPath, outputFile, relativePath);
} else {
    convertDirectory(inputPath, outputDir);
}
