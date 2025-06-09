# Contributor Guidelines

- **Required checks**: After making any code changes, run the following commands before committing:
  - `npm run lint`
  - `npm run format`
  - `npm test`
- **Documentation**: If you add new directories or significant files, update the "Project Structure" section in `README.md`.
- **Optional scripts**: Maintainers may add helper scripts (e.g., manual CI triggers) to ease development, but these must not conflict with the required checks above.
