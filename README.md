# Maii Bot

This is a minimal Node.js project with ESLint and Prettier configured.

## Commands

- `npm run lint` – run ESLint on the project files.
- `npm run format` – format the files using Prettier.
- `npm test` – run the simple test script.
- `docker compose up` – start the API and bot services.

## Docker Compose Usage

Start both services with:

```sh
docker compose up
```

The API service will be available at `http://localhost:3000`.

## Project Structure

```
.
├── api
│   └── index.js
├── bot
│   └── index.js
├── docker-compose.yml
├── eslint.config.mjs
├── .prettierrc
├── index.js
├── package.json
├── test.js
├── LICENSE
└── README.md
```

## Detailed Structure

```
maii-bot/
├── api
│   └── index.js
├── bot
│   └── index.js
├── docker-compose.yml
├── eslint.config.mjs
├── .prettierrc
├── index.js
├── package.json
├── test.js
├── LICENSE
└── README.md
```

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
