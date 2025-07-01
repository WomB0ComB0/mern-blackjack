import React, { useState, useEffect } from 'react';
import './App.css';

// TypeScript interfaces
interface Card {
  code: string;
  image: string;
  value: string;
  suit: string;
}

interface Game {
  _id?: string;
  playerHand: Card[];
  dealerHand: Card[];
  message: string;
  gameOver: boolean;
  betAmount: number;
  winAmount: number;
  playerId: string;
}

interface User {
  id: string;
  username: string;
  balance: number;
  wins?: number;
  totalGames?: number;
  highestWin?: number;
  _id?: string;
}

function App() {
  const [gameState, setGameState] = useState<Game | null>(null);
  const [loading, setLoading] = useState(false);
  const [betAmount, setBetAmount] = useState(10);
  const [balance, setBalance] = useState(1000);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');
    const savedUsername = localStorage.getItem('username');
    if (savedUserId) {
      setUserId(savedUserId);
      setIsLoggedIn(true);
      fetchUserData(savedUserId);
    }
    if (savedUsername) {
      setUsername(savedUsername);
    }
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/users/leaderboard');
      const data = await res.json();
      setLeaderboard(Array.isArray(data) ? data : []);
    } catch {
      setError('Error fetching leaderboard');
      setLeaderboard([]);
    }
  };

  const fetchUserData = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`);
      const user: User = await res.json();
      setBalance(user.balance);
      setUsername(user.username);
    } catch {
      setError('Error fetching user data');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setUserId(data.user.id);
        setBalance(data.user.balance);
        setIsLoggedIn(true);
        setUsername(data.user.username);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('username', data.user.username);
        setMessage('Registration successful!');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch {
      setError('Registration failed, please try again later');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setUserId(data.user.id);
        setBalance(data.user.balance);
        setIsLoggedIn(true);
        setUsername(data.user.username);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('username', data.user.username);
        setMessage('Login successful!');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch {
      setError('Login failed, please try again later');
    }
  };

  const startGame = async () => {
    setError('');
    if (!userId) {
      setError('Please register first!');
      return;
    }
    if (betAmount > balance) {
      setError('Bet amount cannot exceed balance!');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/blackjack/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: userId,
          betAmount
        }),
      });
      const data = await res.json();
      if (data.game && data.user) {
        setGameState(data.game);
        setBalance(data.user.balance);
        setError('');
      } else {
        setError(data.message || 'Game start failed, please try again!');
      }
    } catch {
      setError('Game start failed, please try again!');
    }
    setLoading(false);
  };

  const hit = async () => {
    setError('');
    if (!gameState?._id) return;
    setLoading(true);
    try {
      const res = await fetch('/api/blackjack/hit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId: gameState._id }),
      });
      const data = await res.json();
      setGameState(data.game);
      if (data.user) {
        setBalance(data.user.balance);
      }
    } catch {
      setError('Error hitting. Please try again.');
    }
    setLoading(false);
  };

  const stand = async () => {
    setError('');
    if (!gameState?._id) return;
    setLoading(true);
    try {
      const res = await fetch('/api/blackjack/stand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId: gameState._id }),
      });
      const data = await res.json();
      setGameState(data.game);
      if (data.user) {
        setBalance(data.user.balance);
      }
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    } catch {
      setError('Error standing. Please try again.');
    }
    setLoading(false);
  };

  const surrender = async () => {
    setError('');
    if (!gameState?._id) return;
    setLoading(true);
    try {
      const res = await fetch('/api/blackjack/surrender', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId: gameState._id }),
      });
      const data = await res.json();
      setGameState(data.game);
      if (data.user) {
        setBalance(data.user.balance);
      }
    } catch {
      setError('Error surrendering. Please try again.');
    }
    setLoading(false);
  };

  const renderCard = (card: Card) => {
    if (!card) return null;
    return (
      <div className="card" key={card.code}>
        <img
          src={card.image}
          alt={`${card.value} of ${card.suit}`}
          style={{ width: '100px', height: '140px' }}
        />
      </div>
    );
  };

  return (
    <div className="App">
      <h1>Blackjack</h1>
      {error && <div className="message" style={{ color: 'red' }}>{error}</div>}
      {!isLoggedIn ? (
        <div className="auth-container">
          <h2>{isRegistering ? 'Register' : 'Login'}</h2>
          <form onSubmit={isRegistering ? handleRegister : handleLogin}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">{isRegistering ? 'Register' : 'Login'}</button>
          </form>
          <button
            className="switch-auth-btn"
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering ? 'Already have an account? Login' : 'No account? Register'}
          </button>
          {message && <p className="message">{message}</p>}
        </div>
      ) : (
        <div className="game-container">
          <div className="user-info">
            <p>Username: {username}</p>
            <p>Balance: ${balance}</p>
            <button
              className="logout-btn"
              onClick={() => {
                setIsLoggedIn(false);
                setUserId(null);
                setGameState(null);
                setUsername('');
                setPassword('');
                localStorage.removeItem('userId');
                localStorage.removeItem('username');
              }}
            >
              Logout
            </button>
          </div>
          {!gameState ? (
            <div className="start-game">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                min="1"
                max={balance}
              />
              <button onClick={startGame} disabled={loading}>
                Start Game
              </button>
            </div>
          ) : (
            <div className="game-board">
              <div className="dealer-hand">
                <h3>Dealer</h3>
                <div className="cards-container">
                  {gameState?.dealerHand && Array.isArray(gameState.dealerHand) && gameState.dealerHand.map((card, index) => (
                    <div key={index} className="card-wrapper">
                      {renderCard(card)}
                    </div>
                  ))}
                </div>
              </div>
              <div className="player-hand">
                <h3>Player</h3>
                <div className="cards-container">
                  {gameState?.playerHand && Array.isArray(gameState.playerHand) && gameState.playerHand.map((card, index) => (
                    <div key={index} className="card-wrapper">
                      {renderCard(card)}
                    </div>
                  ))}
                </div>
              </div>
              <div className="game-message">{gameState.message}</div>
              {!gameState.gameOver && (
                <div className="game-controls">
                  <button onClick={hit} disabled={loading}>
                    Hit
                  </button>
                  <button onClick={stand} disabled={loading}>
                    Stand
                  </button>
                  <button onClick={surrender} disabled={loading} className="surrender-btn">
                    Surrender
                  </button>
                </div>
              )}
              {gameState.gameOver && (
                <button onClick={() => setGameState(null)}>
                  New Game
                </button>
              )}
            </div>
          )}
          <button
            className="leaderboard-btn"
            onClick={() => {
              setShowLeaderboard(!showLeaderboard);
              if (!showLeaderboard) {
                fetchLeaderboard();
              }
            }}
          >
            {showLeaderboard ? 'Hide Leaderboard' : 'Show Leaderboard'}
          </button>
          {showLeaderboard && (
            <div className="leaderboard">
              <h2>Leaderboard</h2>
              {leaderboard.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Player</th>
                      <th>Highest Win</th>
                      <th>Wins</th>
                      <th>Total Games</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((user, index) => (
                      <tr key={user._id || user.id} className={user._id === userId ? 'current-user' : ''}>
                        <td>{index + 1}</td>
                        <td>{user.username}</td>
                        <td>${user.highestWin}</td>
                        <td>{user.wins}</td>
                        <td>{user.totalGames}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No data available</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
