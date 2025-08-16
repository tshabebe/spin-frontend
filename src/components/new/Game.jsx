import { useState, useEffect } from 'react'
import SpinWheel from './SpinWheel'
import { GiSpinningSword } from 'react-icons/gi'
import { maskUsername } from '../../utils/maskUsername'
import { FaArrowLeft, FaCoins, FaTrophy, FaHashtag } from 'react-icons/fa'

function Game({
  players = [],
  isSpinning = false,
  winner = null,
  suspenseConfig = null,
  serverCalculationTime = null,
  onSpinComplete = () => {},
  countdown = null,
  gameStatus = 'waiting',
  gameId = null,
  betAmount = 0,
  token = null,
  onBackClick = () => {},
  socket = null,
  isRealtime = false,
  currentUsername = null,
}) {
  const [mustSpin, setMustSpin] = useState(false)

  const [localIsSpinning, setLocalIsSpinning] = useState(false)
  const [winningEntry, setWinningEntry] = useState(null)
  const [waitingToSpin, setWaitingToSpin] = useState(false)

  // Prepare segments for new wheel
  const segments = players.map((p, idx) => ({
    id: `${idx}`,
    text: p.username,
    color: idx % 2 === 0 ? '#15803d' : '#f97316',
    textColor: 'white',
  }))

  // Determine if we should continue animation only during countdown
  const shouldContinueAnimation = Boolean(
    countdown && countdown.remainingSeconds > 0 && !isSpinning,
  )

  // Handle countdown finished - show "Waiting to spin"
  useEffect(() => {
    if (
      countdown &&
      countdown.remainingSeconds === 0 &&
      gameStatus === 'waiting'
    ) {
      setWaitingToSpin(true)
    }
  }, [countdown, gameStatus])

  // Handle spin start with pre-determined winner from backend
  useEffect(() => {
    if (isSpinning && winner && players.length > 0) {
      // Find the index of the winner in the players array
      const winnerIndex = players.findIndex(
        (player) => player.username === winner,
      )

      if (winnerIndex !== -1) {
        console.log(
          `Starting spin to winner: ${winner} at index: ${winnerIndex}`,
        )

        setMustSpin(true)
        setLocalIsSpinning(true)
        setWaitingToSpin(false)
      }
    }
  }, [isSpinning, winner, players])

  const handleStopSpinning = () => {
    setMustSpin(false)
    setLocalIsSpinning(false)
    setWinningEntry(winner)

    // Call parent callback
    onSpinComplete(winner)
  }

  return (
    <div className="flex justify-center bg-cyan-950 w-full min-h-screen">
      <div className="flex flex-col p-2 w-full max-w-md min-h-screen">
        {/* Header Section */}
        <div className="bg-cyan-900 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            {/* Back Button */}
            <button
              onClick={onBackClick}
              className="flex items-center gap-2 bg-cyan-700 active:bg-cyan-600 px-4 py-3 rounded-lg font-semibold text-cyan-50 text-sm transition-colors"
            >
              <FaArrowLeft />
            </button>

            {/* Game Info */}
            <div className="flex flex-wrap flex-1 justify-end items-center gap-2 min-w-0 text-cyan-100">
              {/* Game ID */}
              <div className="flex items-center gap-2 bg-cyan-800 px-3 py-2 rounded-lg whitespace-nowrap">
                <FaHashtag className="text-cyan-200 text-sm" />
                <span className="font-semibold text-cyan-100 text-sm">
                  {gameId}
                </span>
              </div>

              {/* Bet Amount */}
              <div className="flex items-center gap-2 bg-cyan-800 px-3 py-2 rounded-lg whitespace-nowrap">
                <FaCoins className="text-cyan-200 text-sm" />
                <span className="font-semibold text-cyan-300 text-sm">
                  {betAmount}
                </span>
              </div>

              {/* Win Amount */}
              <div className="flex items-center gap-2 bg-cyan-800 px-3 py-2 rounded-lg whitespace-nowrap">
                <FaTrophy className="text-cyan-200 text-sm" />
                <span className="font-semibold text-cyan-400 text-sm">
                  {players.length > 0
                    ? Math.round(players.length * betAmount * 0.9)
                    : 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Game Content */}
        <div className="flex flex-col flex-1 justify-center items-center p-6">
          <div className="flex flex-col items-center">
            {/* Waiting to Spin Message */}
            {waitingToSpin && (
              <div className="pb-4 text-center">
                <div className="font-semibold text-cyan-100 text-base">
                  Waiting to spin...
                </div>
              </div>
            )}

            {/* Wheel Section with Backend Integration */}
            <SpinWheel
              segments={segments}
              autoSpin={mustSpin}
              predeterminedWinner={winner}
              suspenseConfig={suspenseConfig}
              onSpinComplete={handleStopSpinning}
              serverCalculationTime={serverCalculationTime}
              shouldContinueAnimation={shouldContinueAnimation}
              isRealtime={isRealtime}
            />

            {/* Countdown Display - Now below the wheel */}
            {countdown && countdown.remainingSeconds > 0 && (
              <div className="pt-4 text-center">
                <div className="font-semibold text-cyan-100 text-lg">
                  {countdown.remainingSeconds}
                </div>
                <div className="font-semibold text-cyan-200 text-xs">
                  {countdown.remainingSeconds === 1 ? 'second' : 'seconds'}{' '}
                  remaining
                </div>
              </div>
            )}

            {/* Spinning Status */}
            {(localIsSpinning || isSpinning) && (
              <div className="flex items-center gap-2 pt-4 text-cyan-100">
                <GiSpinningSword className="animate-spin" />
                <span className="font-semibold text-sm">Spinning...</span>
              </div>
            )}

            {/* Winner Display (single source of truth) */}
            {winningEntry && !localIsSpinning && !isSpinning && (
              <div className="bg-cyan-600 p-4 pt-6 rounded-lg text-cyan-50">
                <div className="font-semibold text-lg">
                  {currentUsername && winningEntry === currentUsername
                    ? '🎉 You won! 🎉'
                    : `🎉 Winner: ${maskUsername(winningEntry)} 🎉`}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Game
