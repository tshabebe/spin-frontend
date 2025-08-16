import { useState, useEffect } from "react";
import SpinWheel from "./SpinWheel";
import { GiSpinningSword } from "react-icons/gi";
import { FaArrowLeft, FaCoins, FaTrophy, FaHashtag } from "react-icons/fa";

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
  isRealtime = false
}) {
  const [mustSpin, setMustSpin] = useState(false);

  const [localIsSpinning, setLocalIsSpinning] = useState(false);
  const [winningEntry, setWinningEntry] = useState(null);
  const [waitingToSpin, setWaitingToSpin] = useState(false);



  // Prepare segments for new wheel
  const segments = players.map((p, idx) => ({
    id: `${idx}`,
    text: p.username,
    color: idx % 2 === 0 ? '#15803d' : '#f97316',
    textColor: 'white'
  }));

  // Determine if we should continue animation only during countdown
  const shouldContinueAnimation = Boolean(countdown && countdown.remainingSeconds > 0 && !isSpinning);

  // Handle countdown finished - show "Waiting to spin"
  useEffect(() => {
    if (countdown && countdown.remainingSeconds === 0 && gameStatus === 'waiting') {
      setWaitingToSpin(true);
    }
  }, [countdown, gameStatus]);

  // Handle spin start with pre-determined winner from backend
  useEffect(() => {
    if (isSpinning && winner && players.length > 0) {
      // Find the index of the winner in the players array
      const winnerIndex = players.findIndex(player => player.username === winner);

      if (winnerIndex !== -1) {
        console.log(`Starting spin to winner: ${winner} at index: ${winnerIndex}`);

        setMustSpin(true);
        setLocalIsSpinning(true);
        setWaitingToSpin(false);
      }
    }
  }, [isSpinning, winner, players]);

  const handleStopSpinning = () => {
    setMustSpin(false);
    setLocalIsSpinning(false);
    setWinningEntry(winner);

    // Call parent callback
    onSpinComplete(winner);
  };

  // If no players (should not happen since creator auto-joins), show info instead of loading
  if (players.length === 0) {
    return (
      <div className="min-h-screen bg-cyan-950 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-cyan-100 text-sm font-semibold">Waiting for players to join. The game starts when there are at least 2 players.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyan-950 flex flex-col">
      {/* Header Section */}
      <div className="bg-cyan-900 p-4">
        <div className="flex items-center justify-between">
          {/* Back Button */}
          <button
            onClick={onBackClick}
            className="flex items-center gap-2 px-4 py-3 bg-cyan-700 rounded-lg active:bg-cyan-600 transition-colors text-cyan-50 text-sm font-semibold"
          >
            <FaArrowLeft />
          </button>

          {/* Game Info */}
          <div className="flex items-center gap-4 text-cyan-100">
            {/* Game ID */}
            <div className="flex items-center gap-2 bg-cyan-800 px-3 py-2 rounded-lg">
              <FaHashtag className="text-cyan-200 text-sm" />
              <span className="text-sm font-semibold text-cyan-100">{gameId}</span>
            </div>

            {/* Bet Amount */}
            <div className="flex items-center gap-2 bg-cyan-800 px-3 py-2 rounded-lg">
              <FaCoins className="text-cyan-200 text-sm" />
              <span className="text-sm font-semibold text-cyan-300">{betAmount}</span>
            </div>

            {/* Win Amount */}
            <div className="flex items-center gap-2 bg-cyan-800 px-3 py-2 rounded-lg">
              <FaTrophy className="text-cyan-200 text-sm" />
              <span className="text-sm font-semibold text-cyan-400">
                {players.length > 0 ? Math.round((players.length * betAmount) * 0.9) : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center">
          {/* Waiting to Spin Message */}
          {waitingToSpin && (
            <div className="pb-4 text-center">
              <div className="text-cyan-100 text-base font-semibold">
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
              <div className="text-cyan-100 text-lg font-semibold">
                {countdown.remainingSeconds}
              </div>
              <div className="text-cyan-200 text-xs font-semibold">
                {countdown.remainingSeconds === 1 ? 'second' : 'seconds'} remaining
              </div>
            </div>
          )}

          {/* Spinning Status */}
          {(localIsSpinning || isSpinning) && (
            <div className="pt-4 flex items-center gap-2 text-cyan-100">
              <GiSpinningSword className="animate-spin" />
              <span className="text-sm font-semibold">Spinning...</span>
            </div>
          )}

          {/* Winner Display */}
          {winningEntry && !localIsSpinning && !isSpinning && (
            <div className="pt-6 p-4 bg-cyan-600 rounded-lg text-cyan-50">
              <div className="text-lg font-semibold">🎉 Winner: {winningEntry} 🎉</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Game;


