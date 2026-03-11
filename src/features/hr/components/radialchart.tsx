import { useState, useEffect, useRef } from 'react';

interface AttendanceData {
  active: number;
  onLeave: number;
  absent: number;
}

interface AttendanceChartProps {
  data: AttendanceData;
  showControls?: boolean;
  onValueChange?: (value: number) => void;
}

const AttendanceChart = ({ 
  data, 
   
}: AttendanceChartProps) => {
  const [value, setValue] = useState<number>(0);
  
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const progressCanvasRef = useRef<HTMLCanvasElement>(null);

  const centerX = 175;
  const centerY = 175;
  const outerRadius = 160;
  const innerRadius = 95;
  const gapAngle = 0.15; // Gap in radians (about 3 degrees)

  // Calculate percentage based on active count
  const calculatePercentage = () => {
    const total = data.active + data.onLeave + data.absent;
    return total > 0 ? Math.round((data.active / total) * 100) : 0;
  };

  const drawBackgroundLines = (ctx: CanvasRenderingContext2D, currentValue: number) => {
    ctx.clearRect(0, 0, 350, 350);

    const numberOfLines = 60;
    const angleStep = (Math.PI * 2) / numberOfLines;

    for (let i = 0; i < numberOfLines; i++) {
      const angle = i * angleStep - Math.PI / 2;

      // Normalize angle to 0-1 range starting from top (12 o'clock)
      const normalizedAngle = (angle + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
      const linePosition = normalizedAngle / (Math.PI * 2);
      const progressPosition = currentValue / 100;

      // Only draw line if it's NOT covered by the colored arcs
      if (linePosition > progressPosition) {
        const startX = centerX + Math.cos(angle) * innerRadius;
        const startY = centerY + Math.sin(angle) * innerRadius;
        const endX = centerX + Math.cos(angle) * outerRadius;
        const endY = centerY + Math.sin(angle) * outerRadius;

        // Calculate opacity based on position - darker on left, lighter on right
        const angleDeg = (angle * 180 / Math.PI + 360) % 360;
        let opacity = 0.25;

        // Make lines on the left side more visible
        if (angleDeg >= 90 && angleDeg <= 270) {
          const normalizedPos = Math.abs((angleDeg - 180) / 90);
          opacity = 0.4 + (0.3 * (1 - normalizedPos));
        }

        ctx.strokeStyle = `#0F3988 `;
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    }
  };

  const drawProgressArcs = (ctx: CanvasRenderingContext2D, currentValue: number) => {
    ctx.clearRect(0, 0, 350, 350);

    const arcRadius = 150;
    const arcWidth = 18;

    // Calculate how much of the circle to fill based on value (0-100)
    const totalProgress = (currentValue / 100) * Math.PI * 2;

    // Start from top (12 o'clock position)
    const startAngle = -Math.PI / 2;

    // Draw two arcs with a gap
    if (totalProgress > 0) {
      // First arc (green) - fills 40% of the progress
      const greenPercent = Math.min(40, currentValue);
      const greenAngle = (greenPercent / 100) * Math.PI * 2;
      
      if (greenAngle > 0) {
        const greenEnd = startAngle + greenAngle;
        ctx.strokeStyle = '#B8E6C0'; // Green
        ctx.lineWidth = arcWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(centerX, centerY, arcRadius, startAngle, greenEnd);
        ctx.stroke();
      }

      // Second arc (red) - fills the remaining progress (after 40%)
      if (currentValue > 40) {
        const redPercent = currentValue - 40;
        const redAngle = (redPercent / 100) * Math.PI * 2;
        
        if (redAngle > 0) {
          const redStart = startAngle + greenAngle + gapAngle; // Add gap
          const redEnd = redStart + redAngle;
          ctx.strokeStyle = '#FF6B6B'; // Red
          ctx.lineWidth = arcWidth;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(centerX, centerY, arcRadius, redStart, redEnd);
          ctx.stroke();
        }
      }
    }
  };

  // Calculate total and percentage when data changes
  useEffect(() => {
    const percentage = calculatePercentage();
    setValue(percentage);
  }, [data]);

  useEffect(() => {
    if (backgroundCanvasRef.current && progressCanvasRef.current) {
      const bgCtx = backgroundCanvasRef.current.getContext('2d');
      const progressCtx = progressCanvasRef.current.getContext('2d');
      
      if (bgCtx && progressCtx) {
        drawBackgroundLines(bgCtx, value);
        drawProgressArcs(progressCtx, value);
      }
    }
  }, [value, data, gapAngle]);

 


  return (
    <div style={{
      borderRadius: '20px',
      maxWidth: '500px',
    }}>
      <div style={{
        position: 'relative',
        width: '350px',
        height: '350px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '10px auto'
      }}>
        <canvas 
          ref={backgroundCanvasRef} 
          id="backgroundLines" 
          width="350" 
          height="350"
          style={{ position: 'absolute', margin: '50px'}}
        />
        <canvas 
          ref={progressCanvasRef} 
          id="progressArcs" 
          width="350" 
          height="350"
          style={{ position: 'absolute' }}
        />
        <div style={{
          position: 'relative',
          margin:'20px',
          width: '130px',
          height: '130px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #FFFFFF 0%, #BCCDF9 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '68px',
          fontWeight: '300',
          color: '#1A202C',
          boxShadow: '0 10px 30px rgba(100, 130, 200, 0.15)',
          zIndex: 10,
          flexDirection: 'column'
        }}>
          <span id="valueDisplay" style={{ fontSize: '68px' }}>{value}</span>
         
        </div>
      </div>

     
 
    </div>
  );
};

export default AttendanceChart;