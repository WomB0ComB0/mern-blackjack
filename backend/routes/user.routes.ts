/**
 * User Routes
*/
import { genSalt, hash, compare } from 'bcryptjs';
import { User } from '../models';

export async function userRoutes(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const method = req.method;
  const path = url.pathname.replace(/^\/api\/users/, '');

  // Helper: parse JSON body
  async function parseBody(): Promise<Record<string, any>> {
    try {
      return await req.json() as Record<string, any>;
    } catch {
      return {};
    }
  }

  // POST /register
  if (method === 'POST' && path === '/register') {
    const body = await parseBody();
    const username = body?.username;
    const password = body?.password;
    if (!username || !password) {
      return Response.json({ message: 'Username and password required' }, { status: 400 });
    }
    const existingUser = await User.default.findOne({ username });
    if (existingUser) {
      return Response.json({ message: 'Username already exists' }, { status: 400 });
    }
    const salt = await genSalt(10);
    const hashedPassword = await hash(password, salt);
    const user = await User.default.create({ username, password: hashedPassword });
    return Response.json({
      message: 'Register Success',
      user: { id: user._id, username: user.username, balance: user.balance }
    }, { status: 201 });
  }

  // POST /login
  if (method === 'POST' && path === '/login') {
    const body = await parseBody();
    const username = body?.username;
    const password = body?.password;
    if (!username || !password) {
      return Response.json({ message: 'Username and password required' }, { status: 400 });
    }
    const user = await User.default.findOne({ username });
    if (!user) {
      return Response.json({ message: 'Invalid credentials' }, { status: 400 });
    }
    const isMatch = await compare(password, user.password);
    if (!isMatch) {
      return Response.json({ message: 'Invalid credentials' }, { status: 400 });
    }
    return Response.json({
      message: 'Login Success',
      user: { id: user._id, username: user.username, balance: user.balance }
    });
  }

  // GET /leaderboard
  if (method === 'GET' && path === '/leaderboard') {
    const users = await User.default.find()
      .select('username balance wins totalGames highestWin')
      .sort({ balance: -1 })
      .limit(10);
    return Response.json(users);
  }

  // GET /:id
  const userIdMatch = path.match(/^\/(\w+)$/);
  if (method === 'GET' && userIdMatch) {
    const user = await User.default.findById(userIdMatch[1]);
    if (!user) {
      return Response.json({ message: 'User Not Found' }, { status: 404 });
    }
    return Response.json(user);
  }

  // PUT /:id/balance
  const balanceMatch = path.match(/^\/(\w+)\/balance$/);
  if (method === 'PUT' && balanceMatch) {
    const body = await parseBody();
    const amount = body?.amount;
    if (typeof amount !== 'number') {
      return Response.json({ message: 'Amount must be a number' }, { status: 400 });
    }
    const user = await User.default.findById(balanceMatch[1]);
    if (!user) {
      return Response.json({ message: 'User Not Found' }, { status: 404 });
    }
    user.balance += amount;
    if (amount > 0 && amount > user.highestWin) user.highestWin = amount;
    await user.save();
    return Response.json(user);
  }

  // Fallback
  return new Response('Not found', { status: 404 });
} 