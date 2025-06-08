# Maii Bot

This is a minimal Node.js project with ESLint and Prettier configured. It uses
[winston](https://github.com/winstonjs/winston) for logging. Logs are written to
`logs/app.log`.

## Commands

- `npm run lint` – run ESLint on the project files.
- `npm run format` – format the files using Prettier.
- `npm test` – run the simple test script.

## Project Structure

```
.
├── eslint.config.mjs
├── .prettierrc
├── logger.js
├── index.js
├── package.json
├── test.js
├── LICENSE
└── README.md
```

## Detailed Structure

```
maii-bot/
├── eslint.config.mjs
├── .prettierrc
├── logger.js
├── index.js
├── package.json
├── test.js
├── LICENSE
└── README.md
```

## Log Files

Logs are stored in `logs/app.log` when the application or tests run.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
