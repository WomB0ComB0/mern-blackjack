import Game from '../models/game';
import User from '../models/user';
import { calculateHand, drawCard, initializeDeck } from '../utils';

export async function blackjackRoutes(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const method = req.method;
  const path = url.pathname.replace(/^\/api\/blackjack/, '');

  async function parseBody(): Promise<Record<string, any>> {
    try {
      return (await req.json()) as Record<string, any>;
    } catch {
      return {};
    }
  }

  // POST /start
  if (method === 'POST' && path === '/start') {
    const body = await parseBody();
    const playerId = body?.playerId;
    const betAmount = body?.betAmount;
    if (!playerId || typeof betAmount !== 'number' || betAmount <= 0) {
      return Response.json({ message: 'playerId and valid betAmount required' }, { status: 400 });
    }
    await Game.deleteMany({ playerId, gameOver: false });
    const user = await User.findById(playerId);
    if (!user) return Response.json({ message: 'User not found' }, { status: 404 });
    if (user.balance < betAmount)
      return Response.json({ message: 'Insufficient balance' }, { status: 400 });
    const existingGame = await Game.findOne({ playerId, gameOver: false });
    if (existingGame)
      return Response.json(
        { message: 'You have an unfinished game, please complete it first' },
        { status: 400 },
      );
    await initializeDeck();
    const playerHand = await drawCard(2);
    const dealerHand = await drawCard(2);
    const game = await Game.create({
      playerId,
      playerHand,
      dealerHand,
      betAmount,
      gameOver: false,
      message: 'Game started',
    });
    user.balance -= betAmount;
    user.totalGames += 1;
    await user.save();
    return Response.json({ game, user });
  }

  // POST /hit
  if (method === 'POST' && path === '/hit') {
    const body = await parseBody();
    const gameId = body?.gameId;
    if (!gameId) return Response.json({ message: 'gameId required' }, { status: 400 });
    const game = await Game.findById(gameId);
    if (!game) return Response.json({ message: 'Game Not Found' }, { status: 404 });
    if (game.gameOver) return Response.json({ message: 'Game Over' }, { status: 400 });
    const newCard = await drawCard(1);
    game.playerHand.push(newCard[0]);
    const playerScore = calculateHand(game.playerHand);
    if (playerScore > 21) {
      game.gameOver = true;
      game.message = 'Bust! Dealer wins!';
      game.winAmount = 0;
    }
    await game.save();
    const user = await User.findById(game.playerId);
    return Response.json({ game, user });
  }

  // POST /stand
  if (method === 'POST' && path === '/stand') {
    const body = await parseBody();
    const gameId = body?.gameId;
    if (!gameId) return Response.json({ message: 'gameId required' }, { status: 400 });
    const game = await Game.findById(gameId);
    if (!game) return Response.json({ message: 'Game Not Found' }, { status: 404 });
    if (game.gameOver) return Response.json({ message: 'Game Over' }, { status: 400 });
    let dealerScore = calculateHand(game.dealerHand);
    const playerScore = calculateHand(game.playerHand);
    while (dealerScore < 17) {
      const newCard = await drawCard(1);
      game.dealerHand.push(newCard[0]);
      dealerScore = calculateHand(game.dealerHand);
    }
    game.gameOver = true;
    switch (true) {
      case dealerScore > 21:
        game.message = 'The cards are busted! The player wins!';
        game.winAmount = game.betAmount * 2;
        break;
      case dealerScore > playerScore:
        game.message = 'Dealer win!';
        game.winAmount = 0;
        break;
      case dealerScore < playerScore:
        game.message = 'Player win!';
        game.winAmount = game.betAmount * 2;
        break;
      default:
        game.message = 'Tie!';
        game.winAmount = game.betAmount;
        break;
    }
    await game.save();
    const user = await User.findById(game.playerId);
    if (!user) return Response.json({ message: 'User Not Found' }, { status: 404 });
    user.balance += game.winAmount;
    if (game.winAmount > game.betAmount) {
      user.wins += 1;
      if (game.winAmount > user.highestWin) user.highestWin = game.winAmount;
    }
    await user.save();
    return Response.json({ game, user });
  }

  // POST /surrender
  if (method === 'POST' && path === '/surrender') {
    const body = await parseBody();
    const gameId = body?.gameId;
    if (!gameId) return Response.json({ message: 'gameId required' }, { status: 400 });
    const game = await Game.findById(gameId);
    if (!game) return Response.json({ message: 'Game Not Found' }, { status: 404 });
    if (game.gameOver) return Response.json({ message: 'Game Over' }, { status: 400 });
    game.gameOver = true;
    game.message = 'Player terminate game';
    game.winAmount = Math.floor(game.betAmount / 2);
    await game.save();
    const user = await User.findById(game.playerId);
    if (!user) return Response.json({ message: 'User Not Found' }, { status: 404 });
    user.balance += game.winAmount;
    await user.save();
    return Response.json({ game, user });
  }

  // GET /history/:playerId
  const historyMatch = path.match(/^\/history\/(\w+)$/);
  if (method === 'GET' && historyMatch) {
    const playerId = historyMatch[1];
    const games = await Game.find({ playerId }).sort({ createdAt: -1 }).limit(10);
    return Response.json(games);
  }

  // Fallback
  return new Response('Not found', { status: 404 });
}
