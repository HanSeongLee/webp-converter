# WebP Converter

This tool converts JPEG, PNG, and GIF images to WebP format, providing details on the compression achieved for each file.

## Installation

```bash
npm install -g @jkhanseong/webp-converter
```

## Usage

```bash
webp-converter [options]
```

### Options

- `-i, --input <dir>`: Input file or directory. Defaults to `public`.
- `-o, --output <dir>`: Output directory. Defaults to `public`.
- `-q, --quality <number>`: Set the quality of the output WebP images. Acceptable values are from 1 to 100. Defaults to 80.

### Output

For each file processed, the script outputs:

- File path
- Original size
- Compressed size
- Compression ratio

## Contributing

1. Fork the repository and create your branch from `main`.
2. Install dependencies using `npm install`.
3. Run tests using `npm test`.
4. Make your changes and write tests if necessary.
5. Submit a pull request.

## License

[MIT](./LICENSE.md)
