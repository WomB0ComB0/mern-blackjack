import { connectDB } from './config/db';
import { userRoutes } from './routes/user.routes';
import { blackjackRoutes } from './routes/black-jack.routes';

connectDB();

Bun.serve({
  port: process.env.PORT || 4000,
  async fetch(req) {
    const url = new URL(req.url);

    // User routes
    if (url.pathname.startsWith('/api/users')) {
      return await userRoutes(req);
    }

    // Blackjack routes
    if (url.pathname.startsWith('/api/blackjack')) {
      return await blackjackRoutes(req);
    }

    // Static or fallback
    if (url.pathname === '/') {
      return new Response('Backend is running!');
    }

    return new Response('Not found', { status: 404 });
  }
}); 