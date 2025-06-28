import React, { useState, useEffect } from "react";
import { Wheel } from "react-custom-roulette";
import { GiSpinningSword } from "react-icons/gi";
import { FaArrowLeft, FaCoins, FaTrophy, FaHashtag } from "react-icons/fa";
import useSound from 'use-sound';
import spinSound from '../../assets/spin.mp3';
import winSound from '../../assets/win.mp3';

function Game({ 
  players = [], 
  isSpinning = false, 
  winner = null, 
  onSpinComplete = () => {},
  countdown = null,
  gameStatus = 'waiting',
  gameId = null,
  betAmount = 0,
  token = null,
  onBackClick = () => {}
}) {
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [localIsSpinning, setLocalIsSpinning] = useState(false);
  const [winningEntry, setWinningEntry] = useState(null);
  const [waitingToSpin, setWaitingToSpin] = useState(false);
  
  // Use sound hooks with the imported audio files
  const [playSpin] = useSound(spinSound, { soundEnabled: true });
  const [playWin] = useSound(winSound, { soundEnabled: true });

  // Create data array from players
  const data = players.map(player => ({ option: player.username }));

  // Handle countdown finished - show "Waiting to spin"
  useEffect(() => {
    if (countdown && countdown.remainingSeconds === 0 && gameStatus === 'waiting') {
      setWaitingToSpin(true);
    }
  }, [countdown, gameStatus]);

  // 🎯 NEW: Handle spin start with pre-determined winner
  useEffect(() => {
    if (isSpinning && winner && players.length > 0) {
      // Find the index of the winner in the players array
      const winnerIndex = players.findIndex(player => player.username === winner);
      
      if (winnerIndex !== -1) {
        console.log(`Starting spin to winner: ${winner} at index: ${winnerIndex}`);
        setPrizeNumber(winnerIndex);
        setMustSpin(true);
        setLocalIsSpinning(true);
        setWaitingToSpin(false);
        playSpin();
      }
    }
  }, [isSpinning, winner, players]);

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

          {/* Wheel Section */}
          <Wheel
            mustStartSpinning={mustSpin}
            prizeNumber={prizeNumber}
            data={data}
            onStopSpinning={handleStopSpinning}
            backgroundColors={["#171d38", "#a72037"]}
            textColors={["#ffffff"]}
            outerBorderColor="#0f1423"
            innerBorderColor="#0f1423"
            innerRadius={30}
            radiusLineColor="#0f1423"
            spinDuration={0.8}
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
            <div className="mt-4 p-4 bg-[#8a1a2d] rounded-lg text-white">
              🎉 Winner: {winningEntry} 🎉
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Game;


