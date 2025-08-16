import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { API_URL } from "../utils/apiUrl";
import { useGetUserInfo } from "../utils/getUserinfo";
import Loading from "./Loading";
import Game from "./new/Game";

const SpinWheelGame = () => {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [suspenseConfig, setSuspenseConfig] = useState(null);
  const [serverCalculationTime, setServerCalculationTime] = useState(null);

  const {
    userInfo: currentUser,
    isLoading: userLoading,
    error: userError
  } = useGetUserInfo(token);



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

    newSocket.on('winnerDetermined', ({ game, winner, winnerIndex, message }) => {
      console.log('Winner determined:', winner, 'at index:', winnerIndex);
      setGame(game);
      setWinner(winner);
    });

    newSocket.on('gameStateUpdate', ({ game }) => {
      console.log('Game state update received:', game);
      setGame(game);
      setLoading(false);
    });

    newSocket.on('spinStarted', ({ game, winner, winnerIndex, message, suspenseConfig, calculationTime }) => {
      console.log('Spin started with winner:', winner, 'at index:', winnerIndex);
      setGame(game);
      setIsSpinning(true);
      setWinner(winner);
      // Set suspense configuration from backend
      setSuspenseConfig(suspenseConfig || { type: 'moderate' });
      setServerCalculationTime(calculationTime || null);
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
      // Use the pre-determined winner from the game state
      if (game.winner) {
        setWinner(game.winner);
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
      if (gameWinner) {
        setWinner(gameWinner);
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

  // Handle showing winner for already finished games
  useEffect(() => {
    if (game && game.status === 'completed' && game.winner) {
      console.log('Game already finished, winner:', game.winner);
      setWinner(game.winner);
    }
  }, [game]);

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

  const handleSpinComplete = (spinResult, payoutInfo) => {
    setIsSpinning(false);
    setWinner(spinResult.winner);
  };



  if (userLoading || loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cyan-950 text-cyan-100 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-center">
            <h2 className="text-base font-semibold text-cyan-100 pb-4">Error</h2>
            <p className="text-sm font-semibold text-cyan-200 pb-4">{error}</p>
            <button
              onClick={() => navigate(`/lobby?token=${token}`)}
              className="px-4 py-3 bg-cyan-700 rounded-lg active:bg-cyan-600 transition-colors text-cyan-50 text-sm font-semibold"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-cyan-950 text-cyan-100 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-center">
            <h2 className="text-base font-semibold text-cyan-100 pb-4">Game Not Found</h2>
            <button
              onClick={() => navigate(`/lobby?token=${token}`)}
              className="px-4 py-3 bg-cyan-700 rounded-lg active:bg-cyan-600 transition-colors text-cyan-50 text-sm font-semibold"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {loading ? (
        <Loading />
      ) : error ? (
        <div className="min-h-screen bg-cyan-950 flex flex-col">
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-cyan-300 text-base font-semibold">{error}</div>
          </div>
        </div>
      ) : (
        <Game
          players={game?.players || []}
          isSpinning={isSpinning}
          winner={winner}
          suspenseConfig={suspenseConfig}
          serverCalculationTime={serverCalculationTime}
          onSpinComplete={handleSpinComplete}
          countdown={countdown}
          gameStatus={game?.status || 'waiting'}
          gameId={gameId}
          betAmount={game?.betAmount || 0}
          token={token}
          onBackClick={() => navigate('/lobby')}
          socket={socket}
          isRealtime={true}
          currentUsername={currentUser?.username}
        />
      )}
    </>
  );
};

export default SpinWheelGame;