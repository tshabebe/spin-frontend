import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import {
  FaGamepad,
  FaCrown,
  FaCoins,
  FaUser,
  FaPlus,
  FaSync,
  FaSpinner,
} from 'react-icons/fa'
import { GiChessKing } from 'react-icons/gi'
import { io } from 'socket.io-client'
import { API_URL } from '../utils/apiUrl'
import { useGetUserInfo } from '../utils/getUserinfo'
import Loading from './Loading'
import { maskUsername } from '../utils/maskUsername'

// Simple component for user balance display
const UserBalance = ({ balance }) => (
  <div className="flex items-center gap-2 bg-cyan-800 p-3 rounded-lg">
    <FaCoins size={14} className="text-cyan-200" />
    <span className="font-semibold text-cyan-100 text-sm">
      {Number(balance).toFixed(2)}
    </span>
  </div>
)

// Simple component for action buttons
const ActionButtons = ({ onRefresh, isLoading, onDemoClick }) => (
  <div className="flex items-center gap-3">
    <button
      onClick={onRefresh}
      disabled={isLoading}
      className="flex justify-center items-center bg-cyan-700 active:bg-cyan-600 disabled:opacity-50 p-3 rounded-lg font-semibold text-cyan-50 text-sm transition-colors"
    >
      <FaSync size={14} className={isLoading ? 'animate-spin' : ''} />
      <span className="sr-only">Reload</span>
    </button>

    <button
      onClick={onDemoClick}
      className="flex justify-center items-center bg-cyan-600 active:bg-cyan-500 p-3 rounded-lg font-semibold text-cyan-50 text-sm transition-colors"
    >
      <FaGamepad size={14} />
      <span className="sr-only">Demo</span>
    </button>
  </div>
)

// Simple component for game status display
const GameStatus = ({
  game,
  isUserInGame,
  onJoinGame,
  onRejoinGame,
  joiningGameId,
  token,
  gameCountdowns,
}) => {
  if (game.status === 'waiting') {
    return isUserInGame(game) ? (
      <button
        onClick={() => onRejoinGame(game.gameId, token)}
        className="flex justify-center items-center bg-cyan-500 active:bg-cyan-600 px-3 py-1 rounded-full min-w-[50px] font-semibold text-cyan-50 text-xs transition-colors"
      >
        Rejoin
      </button>
    ) : (
      <button
        onClick={() => onJoinGame(game.gameId, game.betAmount)}
        disabled={joiningGameId === game.gameId}
        className="flex justify-center items-center bg-cyan-700 active:bg-cyan-600 disabled:opacity-50 px-3 py-1 rounded-full min-w-[50px] font-semibold text-cyan-50 text-xs transition-colors"
      >
        {joiningGameId === game.gameId ? '...' : 'Join'}
      </button>
    )
  }

  if (game.status === 'spinning') {
    return (
      <div className="font-semibold text-cyan-300 text-xs">Spinning...</div>
    )
  }

  if (game.status === 'completed') {
    return <div className="font-semibold text-cyan-400 text-xs">Completed</div>
  }

  if (
    game.status === 'waiting' &&
    gameCountdowns[game.gameId] &&
    gameCountdowns[game.gameId].remainingSeconds > 0
  ) {
    return (
      <div className="font-bold text-cyan-300 text-xs animate-pulse">
        ⏰ {gameCountdowns[game.gameId].remainingSeconds}s
      </div>
    )
  }

  return null
}

// Simple component for player avatar
const PlayerAvatar = ({ player, isCreator }) => (
  <div className="relative">
    <div className="flex justify-center items-center bg-cyan-600 shadow-lg rounded-lg w-8 h-8 overflow-hidden">
      <span className="font-semibold text-cyan-50 text-sm">
        {player?.username?.charAt(0).toUpperCase() || '?'}
      </span>
    </div>
    {isCreator && (
      <span className="-top-1 -right-1 absolute text-cyan-300 text-xs">👑</span>
    )}
  </div>
)

// Simple component for stake information (kept for potential reuse elsewhere)
const StakeInfo = ({ betAmount, maxPrize }) => (
  <div className="flex flex-col flex-shrink-0 items-end w-24">
    <div className="text-center">
      <span className="block font-semibold text-cyan-200 text-xs">Bet</span>
      <div className="font-semibold text-cyan-300 text-sm">{betAmount} ብር</div>
    </div>
    <div className="pt-1 text-center">
      <span className="block font-semibold text-cyan-200 text-xs">
        Max Prize
      </span>
      <div className="font-semibold text-cyan-400 text-sm">{maxPrize} ብር</div>
    </div>
  </div>
)

// Simple component for individual game card
const GameCard = ({
  game,
  isUserInGame,
  onJoinGame,
  onRejoinGame,
  joiningGameId,
  token,
  gameCountdowns,
}) => (
  <div
    className={`relative overflow-hidden rounded-lg p-4
               bg-cyan-900 transition-colors duration-300
               ${isUserInGame(game) ? 'bg-cyan-900/90' : ''}`}
  >
    {/* You're in this game badge */}
    {isUserInGame(game) && (
      <div className="top-2 right-2 z-10 absolute">
        <span className="bg-cyan-500 px-2 py-1 rounded-full font-semibold text-cyan-50 text-xs">
          You're in!
        </span>
      </div>
    )}

    {/* Game Card Content - Horizontal flow */}
    <div className="flex justify-between items-center">
      {/* Left Player Section */}
      <div className="flex flex-col flex-shrink-0 items-center w-20">
        <PlayerAvatar
          player={game.players[0]}
          isCreator={game.creator === game.players[0]?.username}
        />
        <span className="pt-1 font-semibold text-cyan-200 text-xs">
          {maskUsername(game.players[0]?.username)}
        </span>
        <span className="font-semibold text-cyan-300 text-xs">
          {game.betAmount} ብር
        </span>
      </div>

      {/* Center Game Info - Vertical flow */}
      <div className="flex flex-col flex-1 justify-center items-center min-w-[60px]">
        <div className="flex justify-center items-center pb-1 h-5">
          <FaSpinner className="drop-shadow-[0_0_3px_rgba(34,211,238,0.5)] text-cyan-400 text-lg" />
        </div>
        <div className="pb-1 font-semibold text-cyan-300 text-xs">
          Spin ({game.players.length}/{game.maxPlayers})
        </div>

        <GameStatus
          game={game}
          isUserInGame={isUserInGame}
          onJoinGame={onJoinGame}
          onRejoinGame={onRejoinGame}
          joiningGameId={joiningGameId}
          token={token}
          gameCountdowns={gameCountdowns}
        />
      </div>

      {/* Right Stake Info */}
      <div className="flex flex-col flex-shrink-0 items-end w-20">
        <div className="text-center">
          <span className="block font-semibold text-cyan-200 text-xs">Bet</span>
          <div className="font-semibold text-cyan-300 text-sm">
            {game.betAmount} ብር
          </div>
        </div>
        <div className="pt-1 text-center">
          <span className="block font-semibold text-cyan-200 text-xs">Max</span>
          <div className="font-semibold text-cyan-400 text-sm">
            {game.betAmount * game.players.length * 0.9} ብር
          </div>
        </div>
      </div>
    </div>
  </div>
)

// Simple component for games list
const GamesList = ({
  games,
  isUserInGame,
  onJoinGame,
  onRejoinGame,
  joiningGameId,
  token,
  gameCountdowns,
}) => (
  <div className="flex flex-col flex-1 gap-3 bg-cyan-950 p-3 rounded-xl">
    {games.map((game) => (
      <GameCard
        key={`public-${game.gameId}`}
        game={game}
        isUserInGame={isUserInGame}
        onJoinGame={onJoinGame}
        onRejoinGame={onRejoinGame}
        joiningGameId={joiningGameId}
        token={token}
        gameCountdowns={gameCountdowns}
      />
    ))}
  </div>
)

// Simple component for loading state
const LoadingState = () => (
  <div className="flex flex-1 justify-center items-center">
    <div className="border-cyan-400 border-t-2 border-b-2 rounded-full w-8 h-8 animate-spin"></div>
  </div>
)

// Simple component for empty state
const EmptyState = ({ isLoading }) => (
  <div className="flex flex-1 justify-center items-center">
    <p className="font-semibold text-cyan-200 text-sm text-center">
      {isLoading ? 'Loading games...' : 'No spin games available'}
    </p>
  </div>
)

// Simple component for error state
const ErrorState = ({ error }) => (
  <div className="flex flex-1 justify-center items-center">
    <p className="font-semibold text-cyan-200 text-sm text-center">{error}</p>
  </div>
)

// Main Lobby component - now focused on composition and layout
const Lobby = () => {
  const { chatId } = useParams()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [tokenError, setTokenError] = useState(null)

  const {
    userInfo: user,
    isLoading: userLoading,
    error: userError,
    refreshUserInfo,
  } = useGetUserInfo(token)

  const [recentGames, setRecentGames] = useState([])
  const [gamesError, setGamesError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [joiningGameId, setJoiningGameId] = useState(null)
  const [socket, setSocket] = useState(null)
  const [gameCountdowns, setGameCountdowns] = useState({})

  // Socket connection logic
  useEffect(() => {
    if (!token) return

    const newSocket = io(`${API_URL}`, {
      auth: { token },
      query: { token },
      transports: ['websocket'],
    })

    newSocket.on('connect', () => {
      console.log('Connected to spin wheel socket')
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    newSocket.on('error', (error) => {
      console.error('Socket error:', error)
    })

    // Game state update handlers
    newSocket.on('gameStateUpdate', ({ game }) => {
      setRecentGames((prevGames) => {
        const updatedGames = prevGames.map((g) =>
          g.gameId === game.gameId ? game : g,
        )
        return updatedGames
      })
    })

    newSocket.on('spinStarted', ({ game, message }) => {
      console.log('Spin started:', message)
      setRecentGames((prevGames) => {
        const updatedGames = prevGames.map((g) =>
          g.gameId === game.gameId ? game : g,
        )
        return updatedGames
      })
    })

    newSocket.on(
      'spinCompleted',
      ({ game, spinResult, payoutInfo, message }) => {
        console.log('Spin completed:', message)
        setRecentGames((prevGames) => {
          const updatedGames = prevGames.map((g) =>
            g.gameId === game.gameId ? game : g,
          )
          return updatedGames
        })
      },
    )

    newSocket.on('autoStartTimerStarted', ({ gameId, delay, startTime }) => {
      console.log('Auto-start timer started for game:', gameId)
    })

    newSocket.on(
      'countdownStarted',
      ({ gameId, duration, startTime, endTime }) => {
        console.log('Countdown started for game:', gameId)
        setGameCountdowns((prev) => ({
          ...prev,
          [gameId]: {
            duration,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            remainingSeconds: Math.ceil(duration / 1000),
          },
        }))
      },
    )

    newSocket.on('countdownUpdate', ({ gameId, remainingSeconds }) => {
      console.log('Countdown update for game:', gameId, remainingSeconds)
      setGameCountdowns((prev) => ({
        ...prev,
        [gameId]: prev[gameId] ? { ...prev[gameId], remainingSeconds } : null,
      }))
    })

    newSocket.on('gameFinished', ({ game, winner, reason, payoutInfo }) => {
      console.log('Game finished:', reason)
      setRecentGames((prevGames) =>
        prevGames.filter((g) => g.gameId !== game.gameId),
      )
      setGameCountdowns((prev) => {
        const newState = { ...prev }
        delete newState[game.gameId]
        return newState
      })
    })

    newSocket.on('playerLeft', ({ game, leftPlayer, message }) => {
      console.log('Player left:', message)
      setRecentGames((prevGames) => {
        const updatedGames = prevGames.map((g) =>
          g.gameId === game.gameId ? game : g,
        )
        return updatedGames
      })
    })

    newSocket.on('gameError', ({ message }) => {
      console.error('Game error:', message)
      setGamesError(message)
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [token, user?.username])

  // Fetch games logic
  const fetchRecentGames = async () => {
    setIsLoading(true)
    try {
      console.log(
        '🔍 Fetching recent games from:',
        `${API_URL}/api/games/recent`,
      )
      console.log('🔍 Using token:', token ? 'Token present' : 'No token')

      const response = await fetch(`${API_URL}/api/games/recent`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log('🔍 Response status:', response.status)
      console.log('🔍 Response ok:', response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('🔍 Error response:', errorText)
        throw new Error('Failed to fetch recent games')
      }

      const data = await response.json()
      console.log('🔍 Received games data:', data)

      if (data.success && data.games) {
        console.log('🔍 Number of games:', data.games.length)
        console.log(
          '🔍 Games details:',
          data.games.map((game) => ({
            gameId: game.gameId,
            status: game.status,
            players: game.players?.length || 0,
            betAmount: game.betAmount,
          })),
        )

        setRecentGames(data.games)
      } else {
        console.error('🔍 Invalid response format:', data)
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Error fetching recent games:', error)
      setGamesError('Failed to load recent games')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    await fetchRecentGames()
    await refreshUserInfo()
    setIsLoading(false)
  }

  useEffect(() => {
    if (!userLoading && user) {
      fetchRecentGames()
    }
  }, [user, userLoading])

  const handleJoinGame = async (gameId, stakeAmount) => {
    setJoiningGameId(gameId)
    try {
      const response = await fetch(`${API_URL}/api/games/${gameId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: user?.username,
          chatId: user?.chatId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Join failed')
      }

      window.location.href = `/spin-wheel/${data.gameId}?token=${token}`
      fetchRecentGames()
    } catch (error) {
      console.error('Join error:', error)
      fetchRecentGames()
    } finally {
      setJoiningGameId(null)
    }
  }

  const handleRejoinGame = (gameId, token) => {
    // Use navigate instead of window.location for better mobile experience
    window.location.href = `/spin-wheel/${gameId}?token=${token}`
  }

  const isUserInGame = (game) => {
    if (!user?.chatId) return false
    return game.players.some((player) => player.chatId === user.chatId)
  }

  // Early returns for error states
  if (tokenError) {
    return (
      <div className="flex flex-col bg-cyan-950 min-h-screen text-cyan-100">
        <div className="flex flex-1 justify-center items-center p-4">
          <p className="text-red-500 text-lg text-center">{tokenError}</p>
        </div>
      </div>
    )
  }

  if (userLoading || isLoading) {
    return <Loading />
  }

  if (user && user.banned) {
    return (
      <div className="flex flex-col bg-cyan-950 min-h-screen text-cyan-100">
        <div className="flex flex-1 justify-center items-center p-4">
          <p className="text-red-500 text-lg text-center">
            You are banned from playing
          </p>
        </div>
      </div>
    )
  }

  // Main render - focused on composition
  return (
    <div className="flex flex-col bg-cyan-950 min-h-screen text-cyan-100">
      <div className="flex flex-col flex-1 mx-auto p-6 max-w-4xl">
        {/* Header Section - Horizontal flow */}
        <div className="flex justify-between items-center bg-cyan-900 p-4 rounded-xl">
          <UserBalance balance={user?.balance} />
          <ActionButtons
            onRefresh={handleRefresh}
            isLoading={isLoading}
            onDemoClick={() => (window.location.href = '/demo')}
          />
        </div>

        {/* Main Content - Vertical flow */}
        <div className="flex flex-col flex-1 pt-6">
          <h2 className="pb-4 font-semibold text-cyan-100 text-base">
            Active Spin Games
          </h2>

          {isLoading ? (
            <LoadingState />
          ) : gamesError ? (
            <ErrorState error={gamesError} />
          ) : recentGames.length > 0 ? (
            <GamesList
              games={recentGames}
              isUserInGame={isUserInGame}
              onJoinGame={handleJoinGame}
              onRejoinGame={handleRejoinGame}
              joiningGameId={joiningGameId}
              token={token}
              gameCountdowns={gameCountdowns}
            />
          ) : (
            <EmptyState isLoading={isLoading} />
          )}
        </div>
      </div>
    </div>
  )
}

export default Lobby
