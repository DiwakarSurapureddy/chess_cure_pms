import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const DEFAULT_CAREER_GAMES = [
  { id: 'g-101', opponent: 'Stockfish Engine (Lvl 4)', mode: 'vs Computer', result: 'Won', method: 'Checkmate', moves: 32, ratingChange: '+18', date: 'Yesterday' },
  { id: 'g-102', opponent: 'MagnusFan99', mode: 'Online Match', result: 'Won', method: 'Resignation', moves: 24, ratingChange: '+14', date: '3 days ago' },
  { id: 'g-103', opponent: 'Alex_Rook', mode: 'Online Match', result: 'Lost', method: 'Time Out', moves: 45, ratingChange: '-11', date: '5 days ago' },
  { id: 'g-104', opponent: 'Guest_7841', mode: 'Two Players', result: 'Won', method: 'Checkmate', moves: 19, ratingChange: '+8', date: '1 week ago' },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('chess_cure_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [careerGames, setCareerGames] = useState(() => {
    try {
      const saved = localStorage.getItem('chess_cure_career');
      return saved ? JSON.parse(saved) : DEFAULT_CAREER_GAMES;
    } catch {
      return DEFAULT_CAREER_GAMES;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('chess_cure_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('chess_cure_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('chess_cure_career', JSON.stringify(careerGames));
  }, [careerGames]);

  // Login with Email/Phone
  const login = (identifier, password) => {
    const newUser = {
      id: 'usr_' + Date.now(),
      username: identifier.split('@')[0] || 'ChessKnight',
      identifier: identifier,
      avatar: null,
      isGuest: false,
      rating: 1540,
      title: 'Tactical Aspirant',
      wins: 82,
      losses: 42,
      draws: 8,
      puzzlesSolved: 342,
    };
    setUser(newUser);
    return true;
  };

  // Social Login: Google
  const loginWithGoogle = () => {
    const newUser = {
      id: 'goog_' + Date.now(),
      username: 'Google Player',
      email: 'player@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      isGuest: false,
      rating: 1500,
      title: 'Club Player',
      wins: 15,
      losses: 7,
      draws: 2,
      puzzlesSolved: 84,
    };
    setUser(newUser);
    return true;
  };

  // Social Login: Facebook
  const loginWithFacebook = () => {
    const newUser = {
      id: 'fb_' + Date.now(),
      username: 'Facebook Master',
      email: 'fb_player@facebook.com',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
      isGuest: false,
      rating: 1480,
      title: 'Challenger',
      wins: 20,
      losses: 12,
      draws: 4,
      puzzlesSolved: 110,
    };
    setUser(newUser);
    return true;
  };

  // Continue as Guest Mode
  const continueAsGuest = () => {
    const guestNumber = Math.floor(1000 + Math.random() * 9000);
    const guestUser = {
      id: 'guest_' + Date.now(),
      username: `Guest #${guestNumber}`,
      identifier: `guest_${guestNumber}@chesscure.guest`,
      avatar: null,
      isGuest: true,
      rating: 1200,
      title: 'Casual Guest',
      wins: 0,
      losses: 0,
      draws: 0,
      puzzlesSolved: 0,
    };
    setUser(guestUser);
    return true;
  };

  // Sign up with OTP
  const signup = ({ username, identifier, password }) => {
    const newUser = {
      id: 'usr_' + Date.now(),
      username: username || 'NewPlayer',
      identifier: identifier,
      avatar: null,
      isGuest: false,
      rating: 1200,
      title: 'Novice Strategist',
      wins: 0,
      losses: 0,
      draws: 0,
      puzzlesSolved: 0,
    };
    setUser(newUser);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const recordGameResult = (gameData) => {
    setCareerGames((prev) => [gameData, ...prev]);
    if (user) {
      setUser((prev) => {
        if (!prev) return prev;
        const isWin = gameData.result === 'Won';
        const isLoss = gameData.result === 'Lost';
        const ratingDiff = parseInt(gameData.ratingChange) || 0;
        return {
          ...prev,
          rating: Math.max(800, prev.rating + ratingDiff),
          wins: isWin ? prev.wins + 1 : prev.wins,
          losses: isLoss ? prev.losses + 1 : prev.losses,
          draws: !isWin && !isLoss ? prev.draws + 1 : prev.draws,
        };
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        careerGames,
        login,
        loginWithGoogle,
        loginWithFacebook,
        continueAsGuest,
        signup,
        logout,
        recordGameResult,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
