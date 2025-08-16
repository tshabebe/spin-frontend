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
import { FaQuestionCircle } from 'react-icons/fa'
import { io } from 'socket.io-client'
import { API_URL } from '../utils/apiUrl'
import { message } from 'antd'
import { useGetUserInfo } from '../utils/getUserinfo'
import Loading from './Loading'
import RulesModal from './RulesModal'
import { maskUsername } from '../utils/maskUsername'
import Transactions from './Transactions'

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
const ActionButtons = ({ onRefresh, isLoading, onOpenRules }) => (
  <div className="flex items-center gap-3">
    <button
      onClick={onOpenRules}
      className="flex justify-center items-center bg-cyan-700 active:bg-cyan-600 p-3 rounded-lg text-cyan-50"
      aria-label="Rules"
    >
      <FaQuestionCircle size={16} />
    </button>
    <button
      onClick={onRefresh}
      disabled={isLoading}
      className="flex justify-center items-center bg-cyan-700 active:bg-cyan-600 disabled:opacity-50 p-3 rounded-lg font-semibold text-cyan-50 text-sm transition-colors"
    >
      <FaSync size={14} className={isLoading ? 'animate-spin' : ''} />
      <span className="sr-only">Reload</span>
    </button>
  </div>
)

// Create Game Panel
const betOptions = [10, 20, 30, 50, 100, 200]
const CreateGamePanel = ({
  selectedBet,
  setSelectedBet,
  onCreate,
  isCreating,
  balance,
}) => (
  <div className="flex flex-col gap-4 bg-cyan-900 p-4 rounded-xl">
    <div className="gap-3 grid grid-cols-3">
      {betOptions.map((bet) => {
        const active = selectedBet === bet
        return (
          <button
            key={bet}
            className={`rounded-lg py-3 text-sm font-semibold transition-colors ring-1 ${
              active
                ? 'bg-cyan-700 ring-amber-300/60 text-cyan-50'
                : 'bg-cyan-800 ring-cyan-700 text-cyan-200 active:bg-cyan-700'
            }`}
            onClick={() => setSelectedBet(bet)}
            disabled={isCreating}
          >
            <span className={`${active ? 'text-amber-200' : 'text-cyan-100'}`}>
              {bet} ETB
            </span>
          </button>
        )
      })}
    </div>

    {/** Debit happens on join, not create **/}
    <button
      onClick={onCreate}
      disabled={!selectedBet || isCreating}
      className={`w-full flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-colors ring-1 ${
        !selectedBet || isCreating
          ? 'bg-cyan-800 text-cyan-300 opacity-60 ring-cyan-700'
          : 'bg-cyan-600 active:bg-cyan-500 text-cyan-50 ring-amber-300/50'
      }`}
    >
      <FaPlus size={14} />
      Create Game{' '}
      {selectedBet ? (
        <span className="bg-amber-400/20 px-2 py-0.5 rounded-full text-amber-200">
          {selectedBet} ETB
        </span>
      ) : null}
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
        className="flex justify-center items-center bg-amber-800 active:bg-amber-900 px-3 py-1 rounded-full min-w-[50px] font-bold text-amber-100 text-xs transition-colors"
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
      <div className="font-bold text-amber-300 text-xs animate-pulse">
        ⏰ {gameCountdowns[game.gameId].remainingSeconds}s
      </div>
    )
  }

  return null
}

// Simple component for creator indicator
const CreatorIndicator = ({ isCreator }) => (
  <div className="flex items-center gap-1">
    {isCreator && <span className="text-amber-300 text-xs">👑</span>}
  </div>
)

// Simple component for individual game card
const GameCard = ({
  game,
  isUserInGame,
  onJoinGame,
  onRejoinGame,
  onCancelGame,
  joiningGameId,
  token,
  gameCountdowns,
}) => (
  <div
    className={`relative overflow-hidden rounded-lg p-4
               transition-colors bg-cyan-800 duration-300 min-w-52
               ${isUserInGame(game) ? 'bg-amber-800' : ''}`}
  >
    {/* Game Card Content - Modern Layout */}
    <div className="flex flex-col gap-4">
      {/* Top Section - Game Status & Player Info */}
      <div className="flex justify-between items-center">
        {/* Left - Player Count & Game ID */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-black text-lg">
              {game.players.length}/{game.maxPlayers}
            </span>
            <CreatorIndicator
              isCreator={game.creator === game.players[0]?.username}
            />
          </div>
          <div className="font-semibold text-amber-200 text-xs">
            Game #{game.gameId}
          </div>
        </div>

        {/* Right - Active Status Indicator */}
        {isUserInGame(game) && (
          <div className="flex items-center gap-2">
            <div className="bg-amber-400 rounded-full w-2 h-2 animate-pulse"></div>
            <span className="font-semibold text-amber-200 text-xs">Active</span>
          </div>
        )}
      </div>

      {/* Middle Section - Bet Information */}
      <div className="bg-cyan-700 p-3 rounded-lg">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-semibold text-cyan-200 text-xs">
              Bet Amount
            </span>
            <div className="font-semibold text-cyan-100 text-sm">
              {game.betAmount} ብር
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-semibold text-amber-200 text-xs">
              Max Prize
            </span>
            <div className="font-semibold text-amber-300 text-sm">
              {Math.round(game.betAmount * game.players.length * 0.9)} ብር
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Game Status & Actions */}
      <div className="flex justify-between items-center">
        <span className="font-semibold text-amber-300 text-xs">
          {game.status === 'waiting' ? 'Waiting' : game.status}
        </span>

        {/* Game Status Component */}
        <GameStatus
          game={game}
          isUserInGame={isUserInGame}
          onJoinGame={onJoinGame}
          onRejoinGame={onRejoinGame}
          joiningGameId={joiningGameId}
          token={token}
          gameCountdowns={gameCountdowns}
        />
        {game.status === 'waiting' && game.creator === game.players[0]?.username && (
          <button
            onClick={() => onCancelGame(game.gameId)}
            className="ml-2 px-3 py-1 rounded-full bg-cyan-700 text-cyan-50 text-xs font-semibold active:bg-cyan-600"
          >
            Delete
          </button>
        )}
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
  onCancelGame,
  joiningGameId,
  token,
  gameCountdowns,
}) => (
  <div className="flex flex-col flex-1 gap-3 bg-cyan-900 p-3 rounded-xl overflow-y-auto">
    {games
      .filter((g) => g.status !== 'completed' && g.status !== 'cancelled')
      .map((game) => (
        <GameCard
          key={`public-${game.gameId}`}
          game={game}
          isUserInGame={isUserInGame}
          onJoinGame={onJoinGame}
          onRejoinGame={onRejoinGame}
          onCancelGame={onCancelGame}
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
  const [selectedBet, setSelectedBet] = useState(10)
  const [isCreating, setIsCreating] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const navigate = useNavigate()

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
      // Only reflect updates for the currently selected bet tier
      if (selectedBet && game.betAmount !== selectedBet) return
      setRecentGames((prevGames) => {
        const exists = prevGames.some((g) => g.gameId === game.gameId)
        if (exists) {
          return prevGames.map((g) => (g.gameId === game.gameId ? game : g))
        }
        // Add new waiting games that match the bet amount (including creator's own)
        if (game.status === 'waiting' && game.betAmount === selectedBet) {
          return [game, ...prevGames]
        }
        return prevGames
      })
    })

    newSocket.on('spinStarted', ({ game, message }) => {
      console.log('Spin started:', message)
      if (selectedBet && game.betAmount !== selectedBet) return
      setRecentGames((prevGames) =>
        prevGames.map((g) => (g.gameId === game.gameId ? game : g)),
      )
    })

    newSocket.on(
      'spinCompleted',
      ({ game, spinResult, payoutInfo, message }) => {
        console.log('Spin completed:', message)
        if (selectedBet && game.betAmount !== selectedBet) return
        setRecentGames((prevGames) =>
          prevGames.map((g) => (g.gameId === game.gameId ? game : g)),
        )
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
      if (selectedBet && game.betAmount !== selectedBet) return
      setRecentGames((prevGames) =>
        prevGames.map((g) => (g.gameId === game.gameId ? game : g)),
      )
    })

    newSocket.on('gameError', ({ message }) => {
      console.error('Game error:', message)
      setGamesError(message)
    })

    // Notify when a player joins any game
    newSocket.on('playerJoined', ({ gameId, player }) => {
      // If it's the user's game and bet matches, show toast and navigate to the game
      const game = recentGames.find((g) => g.gameId === gameId)
      if (game && game.betAmount === selectedBet) {
        message.info(`${player.username} joined game #${gameId}`)
        if (game.creator === user?.username) {
          navigate(`/spin-wheel/${gameId}?token=${token}`)
        }
      }
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [token, user?.username, selectedBet])

  // Fetch games logic
  const fetchRecentGames = async () => {
    setIsLoading(true)
    try {
      const url = new URL(`${API_URL}/api/games/recent`)
      if (selectedBet) {
        url.searchParams.set('betAmount', String(selectedBet))
      }
      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to fetch recent games')
      }

      const data = await response.json()
      if (data.success && data.games) {
        // Filter out finished games just in case
        setRecentGames(
          (data.games || []).filter(
            (g) => g.status !== 'completed' && g.status !== 'cancelled',
          ),
        )
      } else {
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
  }, [user, userLoading, selectedBet])

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

      navigate(`/spin-wheel/${data.gameId}?token=${token}`)
      fetchRecentGames()
    } catch (error) {
      console.error('Join error:', error)
      fetchRecentGames()
    } finally {
      setJoiningGameId(null)
    }
  }

  const handleRejoinGame = (gameId, token) => {
    navigate(`/spin-wheel/${gameId}?token=${token}`)
  }

  const handleCancelGame = async (gameId) => {
    try {
      const res = await fetch(`${API_URL}/api/games/${gameId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Failed to delete game')
      }
      message.success(`Deleted game #${gameId}`)
      setRecentGames((prev) => prev.filter((g) => g.gameId !== gameId))
    } catch (err) {
      message.error(err.message || 'Failed to delete game')
    }
  }

  const handleCreateGame = async () => {
    if (!selectedBet || isCreating) return
    setIsCreating(true)
    setGamesError(null)

    try {
      const res = await fetch(`${API_URL}/api/games/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ betAmount: selectedBet }),
      })

      if (!res.ok) {
        const text = await res.text()
        // Map 402 to insufficient balance for clearer UX
        if (res.status === 402 || /insufficient/i.test(text)) {
          throw new Error('Insufficient balance to create game')
        }
        throw new Error(text || 'Failed to create game')
      }
      const created = await res.json()
      const createdGameId = created?.gameId || created?.game?.gameId
      if (createdGameId) {
        // Show toast and keep user on lobby; new game will appear at top via socket
        message.success(`Created game #${createdGameId} at ${selectedBet} ETB`)
        // Force-insert locally in case socket delay
        setRecentGames((prev) => [
          {
            ...created,
            players: created.players || [
              {
                username: user?.username,
                chatId: user?.chatId,
                isActive: true,
                joinedAt: new Date().toISOString(),
              },
            ],
          },
          ...prev,
        ])
      }
    } catch (e) {
      console.error('Create game failed:', e)
      setGamesError(e.message || 'Failed to create game')
    } finally {
      setIsCreating(false)
    }
  }

  const isUserInGame = (game) => {
    if (!user?.chatId) return false
    return game.players.some((player) => player.chatId === user.chatId)
  }

  // Only show games that are truly joinable
  const isGameJoinable = (game) => {
    if (!game) return false
    const playersCount = Array.isArray(game.players) ? game.players.length : 0
    const maxPlayers = game.maxPlayers || Infinity
    return (
      game.status === 'waiting' &&
      !isUserInGame(game) &&
      playersCount < maxPlayers
    )
  }

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
    <div className="flex justify-center bg-cyan-950 min-h-screen text-cyan-100">
      <div className="flex flex-col flex-1 p-6 max-w-xs">
        {/* Header Section - Horizontal flow */}
        <div className="flex justify-between items-center bg-cyan-900 p-4 rounded-xl">
          <UserBalance balance={user?.balance} />
          <ActionButtons
            onRefresh={handleRefresh}
            isLoading={isLoading}
            onOpenRules={() => setShowRules(true)}
          />
            </div>

        {/* Create Game Panel */}
        <div className="pt-4">
          <CreateGamePanel
            selectedBet={selectedBet}
            setSelectedBet={setSelectedBet}
            onCreate={handleCreateGame}
            isCreating={isCreating}
            balance={user?.balance}
          />
        </div>

        {/* Main Content - Vertical flow */}
        <div className="flex flex-col flex-1 pt-6">
          {(() => {
            if (isLoading) return <LoadingState />
            if (gamesError) return <ErrorState error={gamesError} />
            const joinableGames = recentGames.filter((g) => {
              const playersCount = Array.isArray(g.players)
                ? g.players.length
                : 0
              return (
                g.status === 'waiting' &&
                g.betAmount === selectedBet &&
                playersCount < (g.maxPlayers || Infinity)
              )
            })
            if (joinableGames.length === 0) return null
            return (
              <GamesList
                games={joinableGames}
                isUserInGame={isUserInGame}
                onJoinGame={handleJoinGame}
                onRejoinGame={handleRejoinGame}
                onCancelGame={handleCancelGame}
                joiningGameId={joiningGameId}
                token={token}
                gameCountdowns={gameCountdowns}
              />
            )
          })()}

          <div className="pt-6">
            <Transactions token={token} />
          </div>
        </div>
      </div>
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  )
}

export default Lobby
