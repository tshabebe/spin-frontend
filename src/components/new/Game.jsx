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
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#17212b] overflow-hidden p-4">
        <div className="flex flex-col items-center">
          <div className="text-white text-lg">Loading players...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#17212b] flex flex-col">
      {/* Header Section */}
      <div className="bg-[#0f1423] p-4 border-b border-[#2a3441]">
        <div className="flex items-center justify-between">
          {/* Back Button */}
          <button
            onClick={onBackClick}
            className="flex items-center gap-2 px-3 py-2 bg-[#8a1a2d] rounded-lg hover:bg-[#a72037] transition-colors text-white"
          >
            <FaArrowLeft />
          </button>

          {/* Game Info */}
          <div className="flex items-center gap-6 text-white">
            {/* Game ID */}
            <div className="flex items-center gap-2 bg-[#1a2332] px-3 py-2 rounded-lg">
              <FaHashtag className="text-blue-400" />
              <span className="font-bold">{gameId}</span>
            </div>

            {/* Bet Amount */}
            <div className="flex items-center gap-2 bg-[#1a2332] px-3 py-2 rounded-lg">
              <FaCoins className="text-yellow-400" />
              <span className="font-bold text-yellow-400">{betAmount}</span>
            </div>

            {/* Win Amount */}
            <div className="flex items-center gap-2 bg-[#1a2332] px-3 py-2 rounded-lg">
              <FaTrophy className="text-green-400" />
              <span className="font-bold text-green-400">
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
            <div className="mb-4 text-center">
              <div className="text-white text-xl font-bold">
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
            <div className="mt-4 text-center">
              <div className="text-white text-2xl font-bold">
                {countdown.remainingSeconds}
              </div>
              <div className="text-gray-300 text-sm">
                {countdown.remainingSeconds === 1 ? 'second' : 'seconds'} remaining
              </div>
            </div>
          )}

          {/* Spinning Status */}
          {(localIsSpinning || isSpinning) && (
            <div className="mt-4 flex items-center gap-2 text-white">
              <GiSpinningSword className="animate-spin" />
              <span>Spinning...</span>
            </div>
          )}

          {/* Winner Display */}
          {winningEntry && !localIsSpinning && !isSpinning && (
            <div className="mt-4 p-4 bg-gradient-to-r from-green-600 to-green-700 rounded-lg text-white shadow-lg">
              <div className="text-2xl font-bold">🎉 Winner: {winningEntry} 🎉</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Game;


