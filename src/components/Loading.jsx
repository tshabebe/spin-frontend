import React, { useState, useEffect } from 'react';
import { FaDiceD20 } from "react-icons/fa";

const Loading = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        // Smooth progress from 0 to 100 and loop
        if (prevProgress >= 100) {
          return 0;
        }
        return prevProgress + 2;
      });
    }, 100);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="fixed inset-0 min-h-screen bg-cyan-950 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      <FaDiceD20 className="w-[50px] h-[50px] text-cyan-100 animate-spin" />
      <p className="text-cyan-100 pt-2 text-xs animate-pulse">Next Games </p>

      <div className="w-40 h-4 bg-cyan-800 rounded-full pt-4 overflow-hidden relative shadow-inner">
        {/* Background track */}
        <div className="absolute inset-0 bg-cyan-900 rounded-full"></div>

        {/* Progress fill */}
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-cyan-300 rounded-full transition-all duration-150 ease-out relative shadow-sm"
          style={{ width: `${progress}%` }}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-100 to-transparent opacity-30 rounded-full"></div>
        </div>

        {/* Progress percentage overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-cyan-50 text-xs font-bold drop-shadow-sm">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default Loading;