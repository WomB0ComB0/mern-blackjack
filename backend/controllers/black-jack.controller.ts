/**
 *
 */

import type { Request, Response } from 'express';
import User from '../models/user';

type Card = { suit: string; value: string };

type GameState = {
  deck: Card[];
  playerHand: Card[];
  dealerHand: Card[];
  gameOver: boolean;
  message: string;
  betAmount: number;
  winAmount: number;
  playerId: string | null;
};

// Create a new shuffled deck
const createDeck = (): Card[] => {
  const suits = ['♠', '♥', '♦', '♣'];
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }
  // Shuffle deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i]!, deck[j]!] = [deck[j]!, deck[i]!];
  }
  return deck;
};

// Calculate the score of a hand
const calculateHand = (hand: Card[]): number => {
  let sum = 0;
  let aces = 0;
  for (const card of hand) {
    if (card.value === 'A') {
      aces += 1;
    } else if (['J', 'Q', 'K'].includes(card.value)) {
      sum += 10;
    } else {
      sum += parseInt(card.value);
    }
  }
  for (let i = 0; i < aces; i++) {
    sum + 11 <= 21 ? (sum += 11) : (sum += 1);
  }
  return sum;
};

// In-memory game state (for demonstration; not for production multi-user use)
const gameState: GameState = {
  deck: [],
  playerHand: [],
  dealerHand: [],
  gameOver: false,
  message: '',
  betAmount: 0,
  winAmount: 0,
  playerId: null,
};

// All routing and logic should be handled in black-jack.routes.ts for Bun.
// If you need to port any logic, use the createDeck/calculateHand/gameState utilities above.

export { createDeck, calculateHand, gameState };

// TODO: 🚩
const startGame = async (req: Request, res: Response) => {
  const { betAmount, playerId } = req.body ?? {};
  if (typeof betAmount !== 'number' || betAmount <= 0 || !playerId) {
    return res.status(400).json({ message: 'Invalid bet amount or playerId' });
  }

  try {
    const user = await User.findById(playerId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (betAmount > user.balance) return res.status(400).json({ message: 'Insufficient balance' });

    user.balance -= betAmount;
    await user.save();

    gameState.deck = createDeck();
    gameState.playerHand = [];
    gameState.dealerHand = [];
    gameState.gameOver = false;
    gameState.message = '';
    gameState.betAmount = betAmount;
    gameState.winAmount = 0;
    gameState.playerId = playerId;

    // Deal cards safely
    for (let i = 0; i < 2; i++) {
      const playerCard = gameState.deck.pop();
      const dealerCard = gameState.deck.pop();
      if (playerCard) gameState.playerHand.push(playerCard);
      if (dealerCard) gameState.dealerHand.push(dealerCard);
    }

    return res.json({ game: gameState, user });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || String(error) });
  }
};

// TODO: 🚩
const hit = async (_req: Request, res: Response) => {
  if (gameState.gameOver) {
    return res.status(400).json({ message: 'Game Over' });
  }
  try {
    const card = gameState.deck.pop();
    if (card) gameState.playerHand.push(card);
    const playerScore = calculateHand(gameState.playerHand);

    let user = null;
    if (playerScore > 21) {
      gameState.gameOver = true;
      gameState.message = 'The cards are busted! The dealer wins!';
      gameState.winAmount = 0;
      user = await User.findById(gameState.playerId);
      if (user) {
        user.totalGames += 1;
        await user.save();
      }
    }
    return res.json({ game: gameState, user: user ?? (await User.findById(gameState.playerId)) });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || String(error) });
  }
};

// TODO: 🚩
const stand = async (_req: Request, res: Response) => {
  if (gameState.gameOver) {
    return res.status(400).json({ message: 'Game Over' });
  }
  try {
    let dealerScore = calculateHand(gameState.dealerHand);
    const playerScore = calculateHand(gameState.playerHand);

    // Dealer draws until 17 or higher
    while (dealerScore < 17) {
      const card = gameState.deck.pop();
      if (card) gameState.dealerHand.push(card);
      dealerScore = calculateHand(gameState.dealerHand);
    }

    gameState.gameOver = true;
    const user = await User.findById(gameState.playerId);
    if (user) {
      user.totalGames += 1;
      if (dealerScore > 21) {
        gameState.message = 'The cards are busted! The player wins!';
        gameState.winAmount = gameState.betAmount * 2;
        user.balance += gameState.winAmount;
        user.wins += 1;
        if (gameState.winAmount > user.highestWin) user.highestWin = gameState.winAmount;
      } else if (dealerScore > playerScore) {
        gameState.message = 'Dealer Win!';
        gameState.winAmount = 0;
      } else if (dealerScore < playerScore) {
        gameState.message = 'Player Win!';
        gameState.winAmount = gameState.betAmount * 2;
        user.balance += gameState.winAmount;
        user.wins += 1;
        if (gameState.winAmount > user.highestWin) user.highestWin = gameState.winAmount;
      } else {
        gameState.message = 'Tie!';
        gameState.winAmount = gameState.betAmount;
        user.balance += gameState.winAmount;
      }
      await user.save();
    }
    return res.json({ game: gameState, user });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || String(error) });
  }
};

export { startGame, hit, stand };
