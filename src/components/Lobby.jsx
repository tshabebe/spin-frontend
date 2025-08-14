import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useParams } from "react-router-dom";
import { FaGamepad, FaCrown, FaCoins, FaUser, FaPlus, FaSync, FaSpinner } from "react-icons/fa";
import { GiChessKing } from "react-icons/gi";
import { io } from "socket.io-client";
import { API_URL } from "../utils/apiUrl";
import { useGetUserInfo } from "../utils/getUserinfo";
import Loading from "./Loading";
import { maskUsername } from "../utils/maskUsername";

const Lobby = () => {
  const { chatId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [tokenError, setTokenError] = useState(null);
  // const officialChatId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

  // if (!officialChatId) {
  //   return <div className="text-white text-center text-lg">Error accessing user account. Reload the bot and try again</div>;
  // }

  // Use the improved getUserinfo hook
  const {
    userInfo: user,
    isLoading: userLoading,
    error: userError,
    refreshUserInfo
  } = useGetUserInfo(token);

  const [recentGames, setRecentGames] = useState([]);
  const [gamesError, setGamesError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [joiningGameId, setJoiningGameId] = useState(null);
  const [socket, setSocket] = useState(null);
  const [gameCountdowns, setGameCountdowns] = useState({});


  // Update socket connection effect
  useEffect(() => {
    if (!token) return;

    const newSocket = io(`${API_URL}`, {
      auth: { token },
      query: { token },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to spin wheel socket');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Listen for game state updates
    newSocket.on('gameStateUpdate', ({ game }) => {
      // Update the specific game in the list
      setRecentGames(prevGames => {
        const updatedGames = prevGames.map(g =>
          g.gameId === game.gameId ? game : g
        );
        return updatedGames;
      });
    });

    // Listen for spin started
    newSocket.on('spinStarted', ({ game, message }) => {
      console.log('Spin started:', message);
      // Update game state
      setRecentGames(prevGames => {
        const updatedGames = prevGames.map(g =>
          g.gameId === game.gameId ? game : g
        );
        return updatedGames;
      });
    });

    // Listen for spin completed
    newSocket.on('spinCompleted', ({ game, spinResult, payoutInfo, message }) => {
      console.log('Spin completed:', message);
      // Update game state
      setRecentGames(prevGames => {
        const updatedGames = prevGames.map(g =>
          g.gameId === game.gameId ? game : g
        );
        return updatedGames;
      });
    });

    // Listen for auto-start timer
    newSocket.on('autoStartTimerStarted', ({ gameId, delay, startTime }) => {
      console.log('Auto-start timer started for game:', gameId);
    });

    // Listen for countdown events
    newSocket.on('countdownStarted', ({ gameId, duration, startTime, endTime }) => {
      console.log('Countdown started for game:', gameId);
      setGameCountdowns(prev => ({
        ...prev,
        [gameId]: {
          duration,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          remainingSeconds: Math.ceil(duration / 1000)
        }
      }));
    });

    newSocket.on('countdownUpdate', ({ gameId, remainingSeconds }) => {
      console.log('Countdown update for game:', gameId, remainingSeconds);
      setGameCountdowns(prev => ({
        ...prev,
        [gameId]: prev[gameId] ? { ...prev[gameId], remainingSeconds } : null
      }));
    });

    // Listen for game finished
    newSocket.on('gameFinished', ({ game, winner, reason, payoutInfo }) => {
      console.log('Game finished:', reason);
      // Remove finished games from lists
      setRecentGames(prevGames =>
        prevGames.filter(g => g.gameId !== game.gameId)
      );
      // Clean up countdown state
      setGameCountdowns(prev => {
        const newState = { ...prev };
        delete newState[game.gameId];
        return newState;
      });
    });

    // Listen for player left
    newSocket.on('playerLeft', ({ game, leftPlayer, message }) => {
      console.log('Player left:', message);
      // Update game state
      setRecentGames(prevGames => {
        const updatedGames = prevGames.map(g =>
          g.gameId === game.gameId ? game : g
        );
        return updatedGames;
      });
    });

    // Listen for game errors
    newSocket.on('gameError', ({ message }) => {
      console.error('Game error:', message);
      setGamesError(message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, user?.username]);



  // Updated fetchRecentGames to use the new /recent route
  const fetchRecentGames = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Fetching recent games from:', `${API_URL}/api/games/recent`);
      console.log('🔍 Using token:', token ? 'Token present' : 'No token');

      const response = await fetch(`${API_URL}/api/games/recent`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 Error response:', errorText);
        throw new Error("Failed to fetch recent games");
      }

      const data = await response.json();
      console.log('🔍 Received games data:', data);

      // Handle the new response format
      if (data.success && data.games) {
        console.log('🔍 Number of games:', data.games.length);
        console.log('🔍 Games details:', data.games.map(game => ({
          gameId: game.gameId,
          status: game.status,
          players: game.players?.length || 0,
          betAmount: game.betAmount
        })));

        setRecentGames(data.games);
      } else {
        console.error('🔍 Invalid response format:', data);
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error fetching recent games:", error);
      setGamesError("Failed to load recent games");
    } finally {
      setIsLoading(false);
    }
  };

  console.log(recentGames);

  const handleRefresh = async () => {
    setIsLoading(true);
    await fetchRecentGames();
    // Refresh user info as well
    await refreshUserInfo();
    setIsLoading(false);
  };

  useEffect(() => {
    if (!userLoading && user) {
      fetchRecentGames();
    }
  }, [user, userLoading]);



  const handleJoinGame = async (gameId, stakeAmount) => {
    setJoiningGameId(gameId);
    try {
      const response = await fetch(`${API_URL}/api/games/${gameId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          username: user?.username,
          chatId: user?.chatId
        })
      });

      const data = await response.json();

      if (!response.ok) {

        throw new Error(data.error || "Join failed");
      }

      window.location.href = `/spin-wheel/${data.gameId}?token=${token}`;
      fetchRecentGames();
    } catch (error) {
      console.error("Join error:", error);
      fetchRecentGames();
    } finally {
      setJoiningGameId(null);
    }
  };



  // Add helper function to check if user is in game
  const isUserInGame = (game) => {
    if (!user?.chatId) return false;
    return game.players.some(player => player.chatId === user.chatId);
  };



  // Early return for token error
  if (tokenError) {
    return (
      <div className="min-h-screen bg-[#0A0B1A] text-white flex items-center justify-center p-4">
        <p className="text-red-500 text-center text-lg">{tokenError}</p>
      </div>
    );
  }

  if (userLoading || isLoading) {
    return <Loading />;
  }

  if (user && user.banned) {
    return (
      <div className="min-h-screen bg-[#0A0B1A] text-white p-3 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-red-500 text-center text-lg">
            You are banned from playing
          </p>
        </div>
      </div>
    );
  }


  // Add: text-based avatar function
  const getTextAvatar = (username) => {
    if (!username) return "?";
    return username.charAt(0).toUpperCase();
  };

    return (
    <div className="min-h-screen bg-cyan-950 text-cyan-100 flex flex-col">
      <div className="max-w-4xl mx-auto flex-1 flex flex-col p-3 sm:p-6">

        {/* Header Section - Horizontal flow */}
        <div className="flex items-center justify-between p-4 bg-cyan-900/20 rounded-xl">
          {/* Balance Display */}
          <div className="flex items-center gap-2 bg-cyan-900 p-2 rounded-lg">
            <FaCoins size={12} className="text-cyan-300" />
            <span className="text-sm">{Number(user?.balance).toFixed(2)}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="bg-cyan-600 p-2 rounded-lg flex items-center justify-center hover:bg-cyan-500 active:scale-95
                       transition-all disabled:opacity-50 text-sm font-medium text-cyan-50"
            >
              <FaSync size={14} className={isLoading ? "animate-spin" : ""} />
              <span className="sr-only">Reload</span>
            </button>

            <button
              onClick={() => window.location.href = '/roulette-demo'}
              className="bg-gradient-to-r from-cyan-500 to-cyan-400 p-2 rounded-lg flex items-center justify-center hover:opacity-90 active:scale-95
                       transition-all text-sm font-medium text-cyan-50 shadow-lg"
            >
              <FaGamepad size={14} />
              <span className="sr-only">Demo</span>
            </button>
          </div>
        </div>

        {/* Main Content - Vertical flow */}
        <div className="flex-1 flex flex-col pt-6">
          <h2 className="text-xl sm:text-2xl font-semibold pb-4">
            Active Spin Games
          </h2>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
          ) : gamesError ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-center">{gamesError}</p>
            </div>
          ) : recentGames.length > 0 ? (
            <div className="flex-1 flex flex-col gap-3 p-2 rounded-xl bg-cyan-950/40 backdrop-blur-sm">
              {recentGames.map((game) => (
                <div
                  key={`public-${game.gameId}`}
                  className={`relative overflow-hidden rounded-lg p-4
                             bg-cyan-900/30 backdrop-blur-md
                             border border-cyan-200/5
                             shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]
                             transition-all duration-300 hover:bg-cyan-900/40
                             animate-border-glow
                             ${isUserInGame(game) ? 'border-cyan-400/50 bg-cyan-400/10' : ''}`}
                >
                  {/* Animated Border Gradient */}
                  <div className="absolute inset-0 -z-10 animate-gradient-xy">
                    <div className="absolute inset-[1px] rounded-lg bg-cyan-950" />
                  </div>

                  {/* You're in this game badge */}
                  {isUserInGame(game) && (
                    <div className="absolute top-2 right-2 z-10">
                      <span className="bg-cyan-500 text-cyan-50 text-[8px] px-2 py-1 rounded-full font-medium shadow-lg">
                        You're in!
                      </span>
                    </div>
                  )}

                  {/* Game Card Content - Horizontal flow */}
                  <div className="flex items-center justify-between">
                    {/* Left Player Section */}
                    <div className="flex flex-col items-center flex-shrink-0 w-24">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-lg overflow-hidden
                                    bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg
                                    border border-cyan-200/10 flex items-center justify-center">
                          <span className="text-cyan-50 font-bold text-sm">
                            {getTextAvatar(game.players[0]?.username)}
                          </span>
                        </div>
                        {/* Creator badge */}
                        {game.creator === game.players[0]?.username && (
                          <span className="absolute -top-1 -right-1 text-[10px] text-cyan-300
                                     drop-shadow-[0_0_2px_rgba(34,211,238,0.3)]">
                            👑
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-cyan-200 pt-1">
                        {maskUsername(game.players[0]?.username)}
                      </span>
                      <span className="text-[10px] text-cyan-300 drop-shadow-[0_0_2px_rgba(34,211,238,0.3)]">
                        {game.betAmount} ብር
                      </span>
                    </div>

                    {/* Center Game Info - Vertical flow */}
                    <div className="flex flex-col items-center justify-center flex-1 min-w-[80px]">
                      <div className="flex items-center justify-center h-6 pb-1">
                        <FaSpinner className="text-cyan-400 text-xl drop-shadow-[0_0_3px_rgba(34,211,238,0.5)]" />
                      </div>
                      <div className="text-[10px] text-cyan-300 pb-1">
                        Spin Game ({game.players.length}/{game.maxPlayers})
                      </div>

                      {game.status === "waiting" && (
                        isUserInGame(game) ? (
                          <button
                            onClick={() => window.location.href = `/spin-wheel/${game.gameId}?token=${token}`}
                            className="px-4 py-1 bg-cyan-500/90 text-cyan-50 rounded-full text-[10px]
                                     hover:bg-cyan-500 active:scale-95 transition-all
                                     min-w-[60px] flex items-center justify-center
                                     shadow-[0_0_10px_rgba(34,211,238,0.3)]
                                     hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                          >
                            Rejoin
                          </button>
                        ) : (
                          <button
                            onClick={() => handleJoinGame(game.gameId, game.betAmount)}
                            disabled={joiningGameId === game.gameId}
                            className="px-4 py-1 bg-cyan-600/90 text-cyan-50 rounded-full text-[10px]
                                     hover:bg-cyan-600 active:scale-95 transition-all disabled:opacity-50
                                     min-w-[60px] flex items-center justify-center
                                     shadow-[0_0_10px_rgba(8,145,178,0.3)]
                                     hover:shadow-[0_0_15px_rgba(8,145,178,0.4)]"
                          >
                            {joiningGameId === game.gameId ? "..." : "Join"}
                          </button>
                        )
                      )}
                      {game.status === "spinning" && (
                        <div className="text-[10px] text-cyan-300">
                          Spinning...
                        </div>
                      )}
                      {game.status === "completed" && (
                        <div className="text-[10px] text-cyan-400">
                          Completed
                        </div>
                      )}
                      {game.status === "waiting" && gameCountdowns[game.gameId] && gameCountdowns[game.gameId].remainingSeconds > 0 && (
                        <div className="text-[10px] text-cyan-300 font-bold animate-pulse">
                          ⏰ {gameCountdowns[game.gameId].remainingSeconds}s
                        </div>
                      )}
                    </div>

                    {/* Right Stake Info - Vertical flow */}
                    <div className="flex flex-col items-end flex-shrink-0 w-24">
                      <div className="text-center">
                        <span className="text-[10px] text-cyan-200 block">
                          Bet
                        </span>
                        <div className="text-cyan-300 text-[11px] drop-shadow-[0_0_2px_rgba(34,211,238,0.3)]">
                          {game.betAmount} ብር
                        </div>
                      </div>
                      <div className="text-center pt-1">
                        <span className="text-[10px] text-cyan-200 block">
                          Max Prize
                        </span>
                        <div className="text-cyan-400 text-[11px] drop-shadow-[0_0_2px_rgba(34,211,238,0.3)]">
                          {game.betAmount * game.players.length * 0.9} ብር
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-cyan-200 text-center">
                {isLoading ? 'Loading games...' : 'No spin games available'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lobby;
