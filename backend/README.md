# Blackjack Backend (Bun)

## Getting Started

### Install dependencies
```bash
bun install
```

### Run the server
```bash
bun run server.ts
```

## Environment Variables
- `MONGO_URI`: MongoDB connection string (Bun loads .env automatically)
- `PORT`: (optional) Port to run the server (default: 4000)

## API Endpoints

### User
- `POST   /api/users/register` — Register a new user `{ username, password }`
- `POST   /api/users/login` — Login `{ username, password }`
- `GET    /api/users/leaderboard` — Get leaderboard
- `GET    /api/users/:id` — Get user by ID
- `PUT    /api/users/:id/balance` — Update user balance `{ amount }`

### Blackjack
- `POST   /api/blackjack/start` — Start a new game `{ playerId, betAmount }`
- `POST   /api/blackjack/hit` — Player hits `{ gameId }`
- `POST   /api/blackjack/stand` — Player stands `{ gameId }`
- `POST   /api/blackjack/surrender` — Player surrenders `{ gameId }`

## Notes
- This backend is fully Bun-native. No Express or Node.js required.
- Bun automatically loads environment variables from `.env`.
- All responses are JSON.

## Development
- Use Bun for all scripts and running the server.
- For more info, see [Bun documentation](https://bun.sh/docs).
