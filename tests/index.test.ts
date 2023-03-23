import * as fs from 'fs-extra';
import { exec } from 'child_process';

describe('webp-converter', () => {
    const inputDir = './test-input';
    const outputDir = './test-output';

    beforeAll(() => {
        fs.mkdirSync(inputDir);
        fs.mkdirSync(outputDir);
        fs.copySync('./test-files', inputDir);
    });

    afterAll(() => {
        fs.removeSync(inputDir);
        fs.removeSync(outputDir);
    });

    it('should convert all supported images in input directory to WebP format', (done) => {
        exec(`node ./dist/index.js -i ${inputDir} -o ${outputDir}`, (error, stdout, stderr) => {
            expect(error).toBeNull();
            expect(stderr).toBeFalsy();

            const expectedFiles = ['apple.webp', 'banana.webp', 'orange.webp'];
            const outputFiles = fs.readdirSync(outputDir);

            expect(outputFiles).toEqual(expect.arrayContaining(expectedFiles));
            expect(outputFiles.length).toBe(expectedFiles.length);

            done();
        });
    });
});
