import { useState, useEffect } from "react";
import SpinWheel from "./SpinWheel";
import { GiSpinningSword } from "react-icons/gi";
import { FaArrowLeft, FaCoins, FaTrophy, FaHashtag } from "react-icons/fa";
import useSound from 'use-sound';
import spinSound from '../../assets/spin.mp3';
import winSound from '../../assets/win.mp3';

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

  // Use sound hooks with the imported audio files
  const [playSpin] = useSound(spinSound, { soundEnabled: true });
  const [playWin] = useSound(winSound, { soundEnabled: true });

  // Prepare segments for new wheel
  const segments = players.map((p, idx) => ({
    id: `${idx}`,
    text: p.username,
    color: idx % 2 === 0 ? '#15803d' : '#f97316',
    textColor: 'white'
  }));

  // Determine if we should continue animation for late joiners
  const shouldContinueAnimation = isRealtime && players.length > 0 && !isSpinning;

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
        playSpin();
      }
    }
  }, [isSpinning, winner, players, playSpin]);

  const handleStopSpinning = () => {
    setMustSpin(false);
    setLocalIsSpinning(false);
    setWinningEntry(winner);
    playWin();

    // Call parent callback
    onSpinComplete(winner);
  };

  // Show loading state if no players
  if (players.length === 0) {
    return (
      <div className="min-h-screen bg-cyan-950 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-cyan-100 text-lg">Loading players...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyan-950 flex flex-col">
      {/* Header Section */}
      <div className="bg-cyan-900 p-4 border-b border-cyan-800">
        <div className="flex items-center justify-between">
          {/* Back Button */}
          <button
            onClick={onBackClick}
            className="flex items-center gap-2 px-3 py-2 bg-cyan-600 rounded-lg hover:bg-cyan-500 transition-colors text-cyan-50"
          >
            <FaArrowLeft />
          </button>

          {/* Game Info */}
          <div className="flex items-center gap-6 text-cyan-100">
            {/* Game ID */}
            <div className="flex items-center gap-2 bg-cyan-800 px-3 py-2 rounded-lg">
              <FaHashtag className="text-cyan-300" />
              <span className="font-bold">{gameId}</span>
            </div>

            {/* Bet Amount */}
            <div className="flex items-center gap-2 bg-cyan-800 px-3 py-2 rounded-lg">
              <FaCoins className="text-cyan-300" />
              <span className="font-bold text-cyan-300">{betAmount}</span>
            </div>

            {/* Win Amount */}
            <div className="flex items-center gap-2 bg-cyan-800 px-3 py-2 rounded-lg">
              <FaTrophy className="text-cyan-400" />
              <span className="font-bold text-cyan-400">
                {players.length > 0 ? Math.round((players.length * betAmount) * 0.9) : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center">
          {/* Waiting to Spin Message */}
          {waitingToSpin && (
            <div className="pb-4 text-center">
              <div className="text-cyan-100 text-xl font-bold">
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
              <div className="text-cyan-100 text-2xl font-bold">
                {countdown.remainingSeconds}
              </div>
              <div className="text-cyan-200 text-sm">
                {countdown.remainingSeconds === 1 ? 'second' : 'seconds'} remaining
              </div>
            </div>
          )}

          {/* Spinning Status */}
          {(localIsSpinning || isSpinning) && (
            <div className="pt-4 flex items-center gap-2 text-cyan-100">
              <GiSpinningSword className="animate-spin" />
              <span>Spinning...</span>
            </div>
          )}

          {/* Winner Display */}
          {winningEntry && !localIsSpinning && !isSpinning && (
            <div className="pt-8 p-4 bg-gradient-to-r from-cyan-600 to-cyan-700 rounded-lg text-cyan-50 shadow-lg">
              <div className="text-2xl font-bold">🎉 Winner: {winningEntry} 🎉</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Game;


