import fs from 'fs-extra';
import walkSync from 'walk-sync';
import { exec } from 'child_process';

describe('webp-converter', () => {
    const inputDir = './test-input';
    const outputDir = './test-output';
    const qualityTestOutputDir = './test-output-quality';

    beforeAll(() => {
        fs.mkdirSync(inputDir, { recursive: true });
        fs.mkdirSync(outputDir, { recursive: true });
        fs.mkdirSync(qualityTestOutputDir, { recursive: true });
        fs.copySync('./test-files', inputDir);
    });

    afterAll(() => {
        fs.removeSync(inputDir);
        fs.removeSync(outputDir);
        fs.removeSync(qualityTestOutputDir);
    });

    it('should convert all supported images in input directory and subdirectories to WebP format', (done) => {
        exec(`node ./dist/index.js -i ${inputDir} -o ${outputDir}`, (error, _stdout, stderr) => {
            expect(error).toBeNull();
            expect(stderr).toBeFalsy();

            const expectedFiles = [
                'apple.webp', 'banana.webp', 'orange.webp', 'subdir1/apple.webp',
                'subdir1/subdir1-1/banana.webp', 'subdir2/banana.webp', 'subdir2/orange.webp'
            ];
            const outputFiles = walkSync(outputDir, { directories: false });

            expect(outputFiles).toEqual(expect.arrayContaining(expectedFiles));
            expect(outputFiles.length).toBe(expectedFiles.length);

            done();
        });
    });

    it('should produce smaller files with lower quality setting', async () => {
        await new Promise<void>((resolve, reject) => {
            exec(`node ./dist/index.js -i ${inputDir} -o ${qualityTestOutputDir} -q 50`, async (error, _stdout, stderr) => {
                if (error) return reject(error);
                if (stderr) return reject(stderr);

                const highQualityFiles = walkSync(outputDir, { directories: false });
                const lowQualityFiles = walkSync(qualityTestOutputDir, { directories: false });

                let isSmaller = true;
                for (let i = 0; i < highQualityFiles.length; i++) {
                    const highQualitySize = (await fs.stat(`${outputDir}/${highQualityFiles[i]}`)).size;
                    const lowQualitySize = (await fs.stat(`${qualityTestOutputDir}/${lowQualityFiles[i]}`)).size;

                    if (lowQualitySize >= highQualitySize) {
                        isSmaller = false;
                        break;
                    }
                }

                expect(isSmaller).toBe(true);
                resolve();
            });
        });
    });
});
