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
    <div className="min-h-screen bg-[#0A0B1A] text-white p-3 sm:p-6">
      <div className="max-w-4xl mx-auto">

        <div className=" rounded-xl mb-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[#252642] p-2 rounded-lg text-sm">
                <FaCoins size={12} className="text-yellow-400" />
                <span>{Number(user?.balance).toFixed(2)}</span>
              </div>
            </div>

            {/* User Info - Smaller text */}
            <div className="flex items-center gap-2">

              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="bg-blue-500 p-2 rounded-lg flex items-center justify-center gap-1 hover:opacity-90 active:scale-95
                         transition-all disabled:opacity-50 text-sm font-medium text-black"
              >
                <FaSync size={14} className={isLoading ? "animate-spin" : ""} />
                <span className="sr-only">Reload</span>
              </button>

              {/* Demo Button */}
              <button
                onClick={() => window.location.href = '/roulette-demo'}
                className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg flex items-center justify-center gap-1 hover:opacity-90 active:scale-95
                         transition-all text-sm font-medium text-white shadow-lg"
              >
                <FaGamepad size={14} />
                <span className="sr-only">Demo</span>
              </button>

            </div>
          </div>
        </div>


        {/* Games Sections - Mobile optimized cards */}
        <div className="space-y-6">

          {/* Active Games */}
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
              Active Spin Games
            </h2>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : gamesError ? (
              <p className="text-center py-4">{gamesError}</p>
            ) : recentGames.length > 0 ? (
              <div className="space-y-2 p-2 rounded-xl bg-[#0A0B1A]/40 backdrop-blur-sm">
                {recentGames.map((game) => (
                  <div
                    key={`public-${game.gameId}`}
                    className={`relative overflow-hidden rounded-lg p-2.5 mb-2
                               bg-[#1A1B2E]/30 backdrop-blur-md
                               border border-white/5
                               shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]
                               transition-all duration-300 hover:bg-[#1A1B2E]/40
                               animate-border-glow
                               ${isUserInGame(game) ? 'border-green-500/50 bg-green-500/10' : ''}`}
                  >
                    {/* Animated Border Gradient */}
                    <div className="absolute inset-0 -z-10 animate-gradient-xy">
                      <div className="absolute inset-[1px] rounded-lg bg-[#0A0B1A]" />
                    </div>

                    {/* You're in this game badge */}
                    {isUserInGame(game) && (
                      <div className="absolute top-2 right-2 z-10">
                        <span className="bg-green-500 text-white text-[8px] px-2 py-1 rounded-full font-medium shadow-lg">
                          You're in!
                        </span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="relative flex items-center justify-between">
                      {/* Left Player - Stacked Layout */}
                      <div className="flex flex-col items-center w-24">
                        <div className="relative mb-0.5">
                          <div
                            className="w-8 h-8 rounded-lg overflow-hidden
                                        bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg
                                        border border-white/10 flex items-center justify-center"
                          >
                            <span className="text-white font-bold text-sm">
                              {getTextAvatar(game.players[0]?.username)}
                            </span>
                          </div>
                          {/* Creator badge */}
                          {game.creator === game.players[0]?.username && (
                            <span
                              className="absolute -top-1 -right-1 text-[10px] text-yellow-400
                                         drop-shadow-[0_0_2px_rgba(234,179,8,0.3)]"
                            >
                              👑
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-white/90 mb-0.5">
                          {maskUsername(game.players[0]?.username)}
                        </span>
                        <span
                          className="text-[10px] text-yellow-400
                                       drop-shadow-[0_0_2px_rgba(234,179,8,0.3)]"
                        >
                          {game.betAmount} ብር
                        </span>
                      </div>

                      {/* Center VS Section */}
                      <div className="flex flex-col items-center justify-center min-w-[80px]">
                        <div className="flex items-center justify-center h-6 mb-1 gap-1">
                          <FaSpinner className="text-yellow-500 text-xl drop-shadow-[0_0_3px_rgba(234,179,8,0.5)]" />
                        </div>
                        <div className="text-[10px] text-blue-300 mb-1">
                          Spin Game ({game.players.length}/{game.maxPlayers})
                        </div>
                        {game.status === "waiting" && (
                          isUserInGame(game) ? (
                            <button
                              onClick={() => window.location.href = `/spin-wheel/${game.gameId}?token=${token}`}
                              className="px-4 py-1 bg-green-500/90 text-white rounded-full text-[10px]
                                       hover:bg-green-500 active:scale-95 transition-all
                                       min-w-[60px] flex items-center justify-center
                                       shadow-[0_0_10px_rgba(34,197,94,0.3)]
                                       hover:shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                            >
                              Rejoin
                            </button>
                          ) : (
                            <button
                              onClick={() => handleJoinGame(game.gameId, game.betAmount)}
                              disabled={joiningGameId === game.gameId}
                              className="px-4 py-1 bg-blue-500/90 text-white rounded-full text-[10px]
                                       hover:bg-blue-500 active:scale-95 transition-all disabled:opacity-50
                                       min-w-[60px] flex items-center justify-center
                                       shadow-[0_0_10px_rgba(59,130,246,0.3)]
                                       hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                            >
                              {joiningGameId === game.gameId ? "..." : "Join"}
                            </button>
                          )
                        )}
                        {game.status === "spinning" && (
                          <div className="text-[10px] text-blue-300">
                            Spinning...
                          </div>
                        )}
                        {game.status === "completed" && (
                          <div className="text-[10px] text-green-300">
                            Completed
                          </div>
                        )}
                        {game.status === "waiting" && gameCountdowns[game.gameId] && gameCountdowns[game.gameId].remainingSeconds > 0 && (
                          <div className="text-[10px] text-orange-400 font-bold animate-pulse">
                            ⏰ {gameCountdowns[game.gameId].remainingSeconds}s
                          </div>
                        )}
                      </div>

                      {/* Right Side - Stake Info - Stacked Layout */}
                      <div className="flex flex-col items-end w-24">
                        <div className="text-center">
                          <span className="text-[10px] text-gray-400 block">
                            Bet
                          </span>
                          <div
                            className="text-yellow-400 text-[11px]
                                        drop-shadow-[0_0_2px_rgba(234,179,8,0.3)]"
                          >
                            {game.betAmount} ብር
                          </div>
                        </div>
                        <div className="text-center mt-1">
                          <span className="text-[10px] text-gray-400 block">
                            Max Prize
                          </span>
                          <div
                            className="text-green-400 text-[11px]
                                        drop-shadow-[0_0_2px_rgba(34,197,94,0.3)]"
                          >
                            {game.betAmount * game.players.length * 0.9} ብር
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <p className="text-gray-500 text-center py-4">
                  {isLoading ? 'Loading games...' : 'No spin games available'}
                </p>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
