import React from 'react'
import { buildStyles, CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const Timer = ({ timeLeft, totalTime }) => {
  const percentage = (timeLeft / totalTime) * 100;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formattedTime = `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;

  return (
    <div className="w-20 h-20">
      <CircularProgressbar
        value={percentage}
        text={formattedTime}
        styles={buildStyles({
          textSize: "20px",
          pathColor: "#10b981",
          textColor: "#ef4444",
          trailColor: "#e5e7eb",
        })}
      />
    </div>
  );
};

export default Timer;
