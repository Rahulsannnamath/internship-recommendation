import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
ChartJS.register(ArcElement, Tooltip);

const MatchGauge = ({ value=0 }) => {
  const data = {
    labels:['Match','Remaining'],
    datasets:[{
      data:[value, 100-value],
      backgroundColor:['#2563eb','#e5e9f2'],
      borderWidth:0,
      cutout:'70%'
    }]
  };
  const opts = { plugins:{ legend:{ display:false }, tooltip:{ enabled:false } } };
  return (
    <div className="gauge-wrap">
      <Doughnut data={data} options={opts} />
      <div className="gauge-center">
        <div className="gc-val">{value}%</div>
        <div className="gc-label">Match</div>
      </div>
    </div>
  );
};

export default MatchGauge;