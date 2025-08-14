import React, { useState, useEffect } from 'react';
import { FaDiceD20 } from "react-icons/fa";

const Loading = () => {
  const [progress, setProgress] = useState(15);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        // Change direction when reaching the edges
        if (prevProgress >= 85) {
          setDirection(-1);
          return prevProgress - 5;
        } else if (prevProgress <= 15) {
          setDirection(1);
          return prevProgress + 5;
        }
        return prevProgress + (5 * direction);
      });
    }, 150);

    return () => {
      clearInterval(timer);
    };
  }, [direction]);

  return (
    <div className="fixed inset-0 min-h-screen bg-[#0A0B1A] backdrop-blur-sm flex flex-col items-center justify-center z-50">
      <FaDiceD20 className="w-[50px] h-[50px] text-white animate-spin" />
      <p className="text-white mt-2 text-xs animate-pulse">Next Games </p>

      <div className="w-32 h-2 bg-gray-700 rounded-full mt-4 overflow-hidden">
        <div
          className={`h-full bg-white transition-all duration-100 ease-out ${
            direction > 0 ? 'rounded-r-full rounded-l-sm' : 'rounded-l-full rounded-r-sm'
          }`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-white mt-1 text-xs">Loading...</p>
    </div>
  );
};

export default Loading;