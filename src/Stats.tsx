import React from 'react';

interface StatsProps {
  score: number;
}

const Stats: React.FC<StatsProps> = ({ score }) => {
  return (
    <div>
      <h3>Player Stats</h3>
      <p>Score: {score}</p>
    </div>
  );
};

export default Stats;