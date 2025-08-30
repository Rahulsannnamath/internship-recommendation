import React from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS, RadialLinearScale, PointElement,
  LineElement, Filler, Tooltip
} from 'chart.js';
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

const SkillRadar = ({ skills=[] }) => {
  const data = {
    labels: skills.map(s=>s.name),
    datasets:[{
      data: skills.map(s=>s.value),
      backgroundColor:'rgba(124,58,237,0.18)',
      borderColor:'#7c3aed',
      borderWidth:2,
      pointBackgroundColor:'#7c3aed',
      pointRadius:3
    }]
  };
  const options = {
    plugins:{ legend:{ display:false } },
    scales:{
      r:{
        angleLines:{ color:'rgba(0,0,0,0.05)' },
        grid:{ color:'rgba(0,0,0,0.08)' },
        suggestedMin:0,
        suggestedMax:100,
        ticks:{ display:false },
        pointLabels:{ color:'#556072', font:{ size:10 } }
      }
    }
  };
  return <Radar data={data} options={options} height={260} />;
};

export default SkillRadar;