import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

// Suspense configuration types from backend
const SUSPENSE_TYPES = {
  NONE: 'none',
  MINIMAL: 'minimal',
  MODERATE: 'moderate',
  DRAMATIC: 'dramatic',
  SUPER_DRAMATIC: 'super_dramatic'
};

// Animation phases
const ANIMATION_PHASE = {
  NATURAL: 'natural',
  OVERSHOOT: 'overshoot',
  HESITATION: 'hesitation',
  DRAMATIC: 'dramatic'
};

// Helper component for sounds using Web Audio API
const useWheelSounds = () => {
  const audioContextRef = useRef(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const playTickSound = useCallback(() => {
    if (!audioContextRef.current) return;
    const osc = audioContextRef.current.createOscillator();
    const gain = audioContextRef.current.createGain();
    osc.connect(gain);
    gain.connect(audioContextRef.current.destination);
    osc.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
    gain.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.1);
    osc.start(audioContextRef.current.currentTime);
    osc.stop(audioContextRef.current.currentTime + 0.1);
  }, []);

  const playWinSound = useCallback(() => {
    if (!audioContextRef.current) return;
    const osc = audioContextRef.current.createOscillator();
    const gain = audioContextRef.current.createGain();
    osc.connect(gain);
    gain.connect(audioContextRef.current.destination);
    osc.frequency.setValueAtTime(500, audioContextRef.current.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioContextRef.current.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, audioContextRef.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.5);
    osc.start(audioContextRef.current.currentTime);
    osc.stop(audioContextRef.current.currentTime + 0.5);
  }, []);

  const playDramaticSound = useCallback(() => {
    if (!audioContextRef.current) return;
    const osc = audioContextRef.current.createOscillator();
    const gain = audioContextRef.current.createGain();
    osc.connect(gain);
    gain.connect(audioContextRef.current.destination);
    osc.frequency.setValueAtTime(200, audioContextRef.current.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, audioContextRef.current.currentTime + 0.2);
    gain.gain.setValueAtTime(0.15, audioContextRef.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.3);
    osc.start(audioContextRef.current.currentTime);
    osc.stop(audioContextRef.current.currentTime + 0.3);
  }, []);

  return { playTickSound, playWinSound, playDramaticSound };
};

const WheelSegment = ({ segment, index, segments }) => {
  const createSegmentPath = idx => {
    const angle = 360 / segments.length;
    const startAngle = idx * angle - 90;
    const endAngle = (idx + 1) * angle - 90;
    const radius = 180;
    const cx = 200;
    const cy = 200;
    const x1 = cx + radius * Math.cos((startAngle * Math.PI) / 180);
    const y1 = cy + radius * Math.sin((startAngle * Math.PI) / 180);
    const x2 = cx + radius * Math.cos((endAngle * Math.PI) / 180);
    const y2 = cy + radius * Math.sin((endAngle * Math.PI) / 180);
    const largeArcFlag = angle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  const getTextPosition = idx => {
    const angle = 360 / segments.length;
    const middleAngle = (idx * angle + (idx + 1) * angle) / 2 - 90;
    const textRadius = 130;
    const cx = 200;
    const cy = 200;
    const rad = (middleAngle * Math.PI) / 180;
    const x = cx + textRadius * Math.cos(rad);
    const y = cy + textRadius * Math.sin(rad);
    let rotation = middleAngle;
    if (middleAngle > 90 && middleAngle < 270) rotation = middleAngle + 180;
    return { x, y, rotation };
  };

  return (
    <g>
      <path
        d={createSegmentPath(index)}
        fill={segment.color}
        stroke="#374151"
        strokeWidth={2}
        filter="drop-shadow(0 2px 3px rgba(0,0,0,0.25))"
      />
      <text
        {...getTextPosition(index)}
        fill={segment.textColor || 'white'}
        fontSize={14}
        fontWeight="bold"
        textAnchor="middle"
        dominantBaseline="middle"
        transform={`rotate(${getTextPosition(index).rotation}, ${getTextPosition(index).x}, ${getTextPosition(index).y})`}
        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)', fontFamily: 'Arial, sans-serif' }}
      >
        {segment.text}
      </text>
    </g>
  );
};

const WheelCenter = ({ currentSegment }) => {
  const TrianglePointer = ({ innerRadius, height, fill, baseWidth = 30, insideOffset = 10 }) => {
    const cx = 200;
    const cy = 200;
    const baseY = cy - innerRadius + insideOffset;
    const tipY = baseY - height;
    const leftX = cx - baseWidth / 2;
    const rightX = cx + baseWidth / 2;
    const d = `M ${leftX} ${baseY} Q ${cx} ${tipY} ${rightX} ${baseY} A ${innerRadius} ${innerRadius} 0 0 0 ${leftX} ${baseY} Z`;
    return <path d={d} fill={fill} />;
  };

  return (
    <g>
      <motion.circle
        cx={200}
        cy={200}
        animate={{ r: [28, 35, 28], fill: currentSegment?.color || '#374151' }}
        transition={{ r: { duration: 2, ease: 'easeInOut', repeat: Infinity, repeatType: 'loop' }, fill: { duration: 0.1 } }}
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
      />
      <circle cx={200} cy={200} r={28} fill="#1f2937" />
      <TrianglePointer innerRadius={28} height={30} insideOffset={8} fill="#1f2937" />
      <text
        x={200}
        y={200}
        fill={currentSegment?.textColor || 'white'}
        fontSize={12}
        fontWeight="bold"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {currentSegment?.text || ''}
      </text>
    </g>
  );
};

export const SpinWheel = ({
  segments = [],
  predeterminedWinner = null,
  suspenseConfig = { type: SUSPENSE_TYPES.MODERATE },
  autoSpin = false,
  onSpinComplete,
  serverCalculationTime = null,
  shouldContinueAnimation = false,
  isRealtime = false
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [winner, setWinner] = useState(null);
  const [currentPhase, setCurrentPhase] = useState(null);
  const [isPausedForLateJoin, setIsPausedForLateJoin] = useState(false);
  const controls = useAnimation();
  const lastSegmentRef = useRef(-1);
  const { playTickSound, playWinSound, playDramaticSound } = useWheelSounds();

  // Idle rotation that can be paused/resumed
  useEffect(() => {
    if (!isSpinning) {
      if (shouldContinueAnimation && !isPausedForLateJoin) {
        // Resume idle rotation for late-joining players
        controls.start({
          rotate: [currentRotation, currentRotation + 360],
          transition: { duration: 100, ease: 'linear', repeat: Infinity }
        });
      } else if (!shouldContinueAnimation) {
        // Normal idle rotation
        controls.start({
          rotate: [currentRotation, currentRotation + 360],
          transition: { duration: 100, ease: 'linear', repeat: Infinity }
        });
      }
    }
  }, [isSpinning, shouldContinueAnimation, isPausedForLateJoin, currentRotation]);

  const segmentAngle = segments.length > 0 ? 360 / segments.length : 36;

  const getCurrentSegmentIndex = useCallback(rot => {
    if (segments.length === 0) return 0;
    const norm = ((rot % 360) + 360) % 360;
    const adj = (norm + segmentAngle / 2) % 360;
    const idx = Math.floor(adj / segmentAngle);
    return segments.length - 1 - idx;
  }, [segments.length, segmentAngle]);

  const handleRotationUpdate = useCallback(rot => {
    const idx = getCurrentSegmentIndex(rot);
    if (idx !== lastSegmentRef.current && isSpinning) {
      // Play different sounds based on current phase
      if (currentPhase === ANIMATION_PHASE.DRAMATIC) {
        playDramaticSound();
      } else {
        playTickSound();
      }
      lastSegmentRef.current = idx;
    }
    setCurrentRotation(rot);
  }, [getCurrentSegmentIndex, isSpinning, currentPhase, playTickSound, playDramaticSound]);

  // Get suspense configuration
  const getSuspenseConfig = () => {
    const type = suspenseConfig?.type || SUSPENSE_TYPES.MODERATE;

    const configs = {
      [SUSPENSE_TYPES.NONE]: {
        baseRotations: 3,
        rotationVariance: 1,
        overshoot: 0,
        hesitationDuration: 0,
        dramaticSlowdown: 1
      },
      [SUSPENSE_TYPES.MINIMAL]: {
        baseRotations: 4,
        rotationVariance: 1,
        overshoot: 45,
        hesitationDuration: 0.5,
        dramaticSlowdown: 0.8
      },
      [SUSPENSE_TYPES.MODERATE]: {
        baseRotations: 5,
        rotationVariance: 2,
        overshoot: 90,
        hesitationDuration: 1,
        dramaticSlowdown: 0.6
      },
      [SUSPENSE_TYPES.DRAMATIC]: {
        baseRotations: 6,
        rotationVariance: 2,
        overshoot: 135,
        hesitationDuration: 1.5,
        dramaticSlowdown: 0.4
      },
      [SUSPENSE_TYPES.SUPER_DRAMATIC]: {
        baseRotations: 7,
        rotationVariance: 3,
        overshoot: 180,
        hesitationDuration: 2,
        dramaticSlowdown: 0.2
      }
    };

    return configs[type] || configs[SUSPENSE_TYPES.MODERATE];
  };

  // Core spin logic with suspense animation phases
  const spinWheel = async () => {
    if (isSpinning || segments.length === 0) return;
    setIsSpinning(true);
    setIsPausedForLateJoin(false);
    lastSegmentRef.current = -1;

    const config = getSuspenseConfig();
    let finalTargetRotation;
    const baseRotations = config.baseRotations + Math.random() * config.rotationVariance;

    if (predeterminedWinner) {
      const winnerIndex = segments.findIndex(s => s.text === predeterminedWinner || s.id === predeterminedWinner);
      if (winnerIndex !== -1) {
        // Calculate exact rotation to land on winner
        let found = null;
        for (let a = 0; a < 360; a += 5) {
          const test = currentRotation + baseRotations * 360 + a;
          const idx = getCurrentSegmentIndex(test);
          if (idx === winnerIndex) {
            found = test;
            break;
          }
        }
        finalTargetRotation = found || currentRotation + baseRotations * 360 + winnerIndex * segmentAngle;
      } else {
        finalTargetRotation = currentRotation + baseRotations * 360 + Math.random() * 360;
      }
    } else {
      finalTargetRotation = currentRotation + baseRotations * 360 + Math.random() * 360;
    }

    // Phase 1: Natural spin
    setCurrentPhase(ANIMATION_PHASE.NATURAL);
    await controls.start({
      rotate: finalTargetRotation,
      transition: {
        duration: 3 + config.baseRotations * 0.5,
        ease: [0.25, 0.1, 0.25, 1],
        onUpdate: handleRotationUpdate
      }
    });

    // Phase 2: Overshoot (if configured)
    if (config.overshoot > 0) {
      setCurrentPhase(ANIMATION_PHASE.OVERSHOOT);
      const overshootTarget = finalTargetRotation + config.overshoot;
      await controls.start({
        rotate: overshootTarget,
        transition: {
          duration: 0.8,
          ease: 'easeOut',
          onUpdate: handleRotationUpdate
        }
      });

      // Phase 3: Hesitation pause
      if (config.hesitationDuration > 0) {
        setCurrentPhase(ANIMATION_PHASE.HESITATION);
        await new Promise(resolve => setTimeout(resolve, config.hesitationDuration * 1000));
      }

      // Phase 4: Dramatic return
      setCurrentPhase(ANIMATION_PHASE.DRAMATIC);
      await controls.start({
        rotate: finalTargetRotation,
        transition: {
          duration: 1.5 * (1 / config.dramaticSlowdown),
          ease: [0.42, 0, 0.58, 1],
          onUpdate: handleRotationUpdate
        }
      });
    }

    // Determine winner
    const winnerIdx = getCurrentSegmentIndex(finalTargetRotation);
    const winnerSegment = segments[winnerIdx];
    setWinner(winnerSegment);
    setCurrentPhase(null);
    playWinSound();
    setIsSpinning(false);

    if (onSpinComplete) {
      onSpinComplete(winnerSegment.text || winnerSegment.id);
    }
  };

  // Trigger auto spin when requested
  useEffect(() => {
    if (autoSpin && !isSpinning && segments.length > 0) {
      spinWheel();
    }
  }, [autoSpin]);

  // Get current segment for display
  const currentSegmentIndex = getCurrentSegmentIndex(currentRotation);
  const currentSegment = segments[currentSegmentIndex];

  // Show loading state if no segments
  if (segments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-white text-lg">Waiting for players...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Real-time indicators */}
      {isRealtime && (
        <div className="mb-4 flex gap-4 text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>Real-time</span>
          </div>
          {serverCalculationTime && (
            <div className="flex items-center gap-2">
              <span>Server: {serverCalculationTime.toFixed(0)}ms</span>
            </div>
          )}
        </div>
      )}

      {/* Wheel Container */}
      <div className="relative">
        <motion.svg
          width="400"
          height="400"
          viewBox="0 0 400 400"
          animate={controls}
          onUpdate={({ rotate }) => handleRotationUpdate(rotate)}
          style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))' }}
        >
          {/* Wheel segments */}
          {segments.map((segment, index) => (
            <WheelSegment key={segment.id} segment={segment} index={index} segments={segments} />
          ))}

          {/* Center and pointer */}
          <WheelCenter currentSegment={currentSegment} />
        </motion.svg>

        {/* Suspense phase indicator */}
        {currentPhase && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">
            {currentPhase === ANIMATION_PHASE.NATURAL && 'Spinning...'}
            {currentPhase === ANIMATION_PHASE.OVERSHOOT && 'Building suspense...'}
            {currentPhase === ANIMATION_PHASE.HESITATION && 'Almost there...'}
            {currentPhase === ANIMATION_PHASE.DRAMATIC && 'Finding winner...'}
          </div>
        )}
      </div>

      {/* Winner display */}
      {winner && !isSpinning && (
        <div className="mt-8 p-4 bg-gradient-to-r from-green-600 to-green-700 rounded-lg text-white shadow-lg">
          <div className="text-2xl font-bold">🎉 Winner: {winner.text || winner.id} 🎉</div>
        </div>
      )}
    </div>
  );
};

export default SpinWheel;
