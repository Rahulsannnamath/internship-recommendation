import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Tooltip, Filler
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const ApplicationsLine = ({ dataPoints=[] }) => {
  const data = {
    labels: dataPoints.map((_,i)=>`M${i+1}`),
    datasets: [{
      data: dataPoints,
      fill: true,
      tension:.35,
      backgroundColor:'rgba(37,99,235,.12)',
      borderColor:'#2563eb',
      pointRadius:0
    }]
  };
  const options = {
    plugins:{ legend:{ display:false }, tooltip:{ mode:'index', intersect:false } },
    scales:{
      x:{ grid:{ display:false }, ticks:{ color:'#8892a0', font:{ size:10 } } },
      y:{ grid:{ color:'rgba(0,0,0,0.06)' }, ticks:{ color:'#8892a0', font:{ size:10 }, precision:0 } }
    }
  };
  return <Line data={data} options={options} height={110} />;
};

export default ApplicationsLine;