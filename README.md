# Maii Bot

Restaurant Economy Game 餐飲系統遊戲

This project simulates Taiwan's economy in a restaurant management game. It is built around a Discord bot and aims to support web, desktop and mobile platforms. All text should be internationalized.

## Features

- Discord bot with slash commands
- Express API server
- Placeholder directories for multiplatform clients
- Docker container support

## Requirements

- Node.js 20 or later

## Configuration

1. Copy `config.example.json` to `config.json` and add your Discord token.
2. Optionally adjust the API port.

## Usage

Run the API server:

```bash
npm run api
```

Run the Discord bot:

```bash
npm run bot
```

Run the Discord bot in CI:

```bash
npm run bot:ci
```

## Project Structure

```
.
├── .github/
│   └── workflows/
├── API/
├── CHANGELOG.md
├── DCACT/
├── Dockerfile
├── README.md
├── TODO.md
├── bot/
│   ├── commands/
│   ├── handler/
│   └── utils/
├── commandHandler.js
├── config.example.json
├── config.js
├── docker-compose.yml
├── eslint.config.mjs
├── index.js
├── logger.js
├── logs/
├── multiplatform/
│   ├── Darwin/
│   ├── android/
│   ├── iOS/
│   ├── linux/
│   └── windows/
├── package-lock.json
├── package.json
├── test.js
└── web/
```

## Commands

- `npm run lint` – run ESLint on the project files.
- `npm run format` – format the files using Prettier.
- `npm test` – run the simple test script.
- `npm run ci` – run lint, format, and tests together.
- `docker compose up` – start the API and bot services.

### Command Sync

Use `handler.syncCommands(client)` to register all slash commands. The handler
emits a `synced` event once the Discord API update completes.

## Docker Compose Usage

Start both services with:

```sh
docker compose up
```

The API service will be available at `http://localhost:3000`.
The docker-compose file uses Node.js 20 images for the API and bot services.

## Log Files

Logs are stored in `logs/app.log` when the application or tests run.
All services write messages using the centralized `logger.js` which wraps the
`winston` library. Avoid using `console.log` in the codebase.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
