import fs from 'fs-extra';
import walkSync from 'walk-sync';
import { exec } from 'child_process';

describe('webp-converter', () => {
    const inputDir = './test-input';
    const outputDir = './test-output';

    beforeAll(() => {
        fs.mkdirSync(inputDir, { recursive: true });
        fs.mkdirSync(outputDir, { recursive: true });
        fs.copySync('./test-files', inputDir);
    });

    afterAll(() => {
        fs.removeSync(inputDir);
        fs.removeSync(outputDir);
    });

    it('should convert all supported images in input directory and subdirectories to WebP format', (done) => {
        exec(`node ./dist/index.js -i ${inputDir} -o ${outputDir}`, (error, stdout, stderr) => {
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
});
