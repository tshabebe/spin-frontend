import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { FaUsers, FaCoins, FaCrown, FaArrowLeft, FaSpinner } from "react-icons/fa";
import { Wheel } from "react-custom-roulette";
import { GiSpinningSword } from "react-icons/gi";
import useSound from 'use-sound';
import { io } from "socket.io-client";
import { API_URL } from "../utils/apiUrl";
import { useGetUserInfo } from "../utils/getUserinfo";
import Loading from "./Loading";
import Game from "./new/Game";
import spinSound from '../assets/spin.mp3';
import winSound from '../assets/win.mp3';

const SpinWheelGame = () => {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [sparkles, setSparkles] = useState([]);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winnerData, setWinnerData] = useState(null);

  // Wheel state
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [winningEntry, setWinningEntry] = useState(null);

  const spinTimeoutRef = useRef(null);

  // Use sound hooks with the imported audio files
  const [playSpin] = useSound(spinSound, { soundEnabled: true });
  const [playWin] = useSound(winSound, { soundEnabled: true });

  const {
    userInfo: currentUser,
    isLoading: userLoading,
    error: userError
  } = useGetUserInfo(token);

  // Generate sparkles animation
  useEffect(() => {
    if (isSpinning) {
      const newSparkles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2,
      }));
      setSparkles(newSparkles);
    } else {
      setSparkles([]);
    }
  }, [isSpinning]);

  // Connect to socket
  useEffect(() => {
    if (!token || !gameId) return;

    const newSocket = io(`${API_URL}`, {
      auth: { token },
      query: { token },
      transports: ['websocket'],
    });

    // Add timeout fallback to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.log('Loading timeout reached, setting loading to false');
      setLoading(false);
    }, 10000); // 10 seconds timeout

    newSocket.on('connect', () => {
      console.log('Connected to spin wheel socket');
      newSocket.emit('joinGame', { gameId: parseInt(gameId) });
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Failed to connect to game server');
    });

    newSocket.on('winnerDetermined', ({ game, winner, winnerIndex, spinAngle, message }) => {
      console.log('Winner determined:', winner, 'at index:', winnerIndex);
      setGame(game);
      setWinner(winner);
      setPrizeNumber(winnerIndex);
    });

    newSocket.on('gameStateUpdate', ({ game }) => {
      console.log('Game state update received:', game);
      setGame(game);
      setLoading(false);
    });

    newSocket.on('spinStarted', ({ game, winner, winnerIndex, spinAngle, message }) => {
      console.log('Spin started with winner:', winner, 'at index:', winnerIndex);
      setGame(game);
      setIsSpinning(true);
      setWinner(winner);
      setPrizeNumber(winnerIndex);
    });

    newSocket.on('spinCompleted', ({ game, spinResult, payoutInfo, message }) => {
      console.log('Spin completed:', spinResult);
      setGame(game);
      setIsSpinning(false);
      setWinner(spinResult.winner);
      handleSpinComplete(spinResult, payoutInfo);
    });

    newSocket.on('spinInProgress', ({ game, spinStartTime, spinDuration }) => {
      setGame(game);
      setIsSpinning(true);
      // 🎯 NEW: Use the pre-determined winner from the game state
      if (game.winner) {
        const winnerIndex = game.players.findIndex(p => p.username === game.winner);
        if (winnerIndex !== -1) {
          setPrizeNumber(winnerIndex);
          // 🎯 REMOVED: Let Game component handle wheel animation
          // setMustSpin(true);
          // playSpin();
        }
      }
    });

    newSocket.on('countdownStarted', ({ gameId, duration, startTime, endTime }) => {
      console.log('Countdown started:', { gameId, duration, startTime, endTime });
      setCountdown({
        gameId,
        duration,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        remainingSeconds: Math.ceil(duration / 1000)
      });
    });

    newSocket.on('countdownUpdate', ({ gameId, remainingSeconds }) => {
      console.log('Countdown update:', { gameId, remainingSeconds });
      setCountdown(prev => prev ? { ...prev, remainingSeconds } : null);
    });

    newSocket.on('countdownInProgress', ({ gameId, remainingSeconds, startTime, endTime }) => {
      console.log('Countdown in progress:', { gameId, remainingSeconds, startTime, endTime });
      setCountdown({
        gameId,
        duration: (new Date(endTime) - new Date(startTime)),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        remainingSeconds
      });
    });

    newSocket.on('gameFinished', ({ game, winner, reason, payoutInfo }) => {
      console.log('Game finished event received:', { game, winner, reason, payoutInfo });
      setGame(game);
      setLoading(false);

      // Extract winner from game data if not provided directly
      const gameWinner = winner || game.winner;
      const gameReason = reason || game.lastAction || 'game_finished';

      if (gameWinner) {
        setWinner(gameWinner);
        // Show winner modal
        setWinnerData({
          winner: gameWinner,
          reason: gameReason,
          payoutInfo,
          gameId: game.gameId
        });
        setShowWinnerModal(true);
      }
    });

    newSocket.on('gameError', ({ message }) => {
      setError(message);
      setLoading(false);
    });

    newSocket.on('playerLeft', ({ game, leftPlayer, message }) => {
      setGame(game);
      setLoading(false);
      console.log(message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, gameId, navigate]);

  // Fetch game data on mount
  useEffect(() => {
    if (!userLoading && currentUser && gameId && socket) {
      fetchGameData();
    }
  }, [userLoading, currentUser, gameId, socket]);

  // Handle showing winner modal for already finished games
  useEffect(() => {
    if (game && game.status === 'completed' && game.winner && !showWinnerModal) {
      console.log('Game already finished, showing winner modal:', game.winner);
      setWinner(game.winner);
      setWinnerData({
        winner: game.winner,
        reason: game.lastAction || 'game_finished',
        payoutInfo: null, // Will be populated if available
        gameId: game.gameId
      });
      setShowWinnerModal(true);
    }
  }, [game, showWinnerModal]);

  const fetchGameData = async () => {
    if (!socket) return;

    try {
      // Use socket to fetch game data instead of direct API call
      socket.emit('fetchGameData', { gameId: parseInt(gameId) });
    } catch (error) {
      console.error('Error fetching game:', error);
      setError('Failed to load game');
      setLoading(false);
    }
  };

  const completeSpin = async () => {
    if (!socket || !currentUser) return;

    try {
      // Use socket to complete spin instead of direct API call
      socket.emit('completeSpin', {
        gameId: parseInt(gameId),
        username: currentUser.username,
        chatId: currentUser.chatId
      });
    } catch (error) {
      console.error('Error completing spin:', error);
      setError(error.message);
    }
  };

  const handleSpinComplete = (spinResult, payoutInfo) => {
    if (spinTimeoutRef.current) {
      clearTimeout(spinTimeoutRef.current);
    }

    setMustSpin(false);
    setIsSpinning(false);
    setWinningEntry(spinResult.winner);
    playWin();

    // Show winner modal
    setWinnerData({
      winner: spinResult.winner,
      reason: 'spin_completed',
      payoutInfo,
      gameId: game?.gameId
    });
    setShowWinnerModal(true);
  };

  const handleGameSpinComplete = (winnerUsername) => {
    console.log('Game spin completed for winner:', winnerUsername);
    // This is called when the wheel stops spinning in the Game component
    // The actual game completion is handled by the socket events
  };

  const isInGame = () => {
    return game && currentUser &&
      game.players.some(p => p.username === currentUser.username);
  };

  // Create wheel data from game players
  const getWheelData = () => {
    if (!game || !game.players) return [];
    return game.players.map(player => ({ option: player.username }));
  };

  if (userLoading || loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#17212b] text-white">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Error</h2>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-[#8a1a2d] rounded-lg hover:bg-[#a72037] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#17212b] text-white">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Game Not Found</h2>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-[#8a1a2d] rounded-lg hover:bg-[#a72037] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#17212b]">
      {/* Game Component */}
      <Game
        players={game.players || []}
        isSpinning={isSpinning}
        winner={winner}
        onSpinComplete={handleGameSpinComplete}
        countdown={countdown}
        gameStatus={game.status}
        gameId={game.gameId}
        betAmount={game.betAmount || 0}
        token={token}
        onBackClick={() => navigate(`/lobby?token=${token}`)}
      />
    </div>
  );
};

export default SpinWheelGame; 