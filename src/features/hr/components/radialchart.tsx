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
  const [dimensions, setDimensions] = useState({
    canvasSize: 280,
    centerX: 140,
    centerY: 140,
    outerRadius: 130,
    innerRadius: 75,
    arcRadius: 120,
    arcWidth: 14,
    centerCircleSize: 100,
    fontSize: 52,
  });

  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const progressCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const gapAngle = 0.15;

  // Responsive dimensions based on container width
  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) return;

      // Get the actual available width from parent container
      const containerWidth = containerRef.current.parentElement?.clientWidth || 350;
      // Calculate size based on container width, with appropriate padding
      let size = Math.min(containerWidth - 40, 320); // Leave 40px padding
      size = Math.max(size, 220); // Minimum size for visibility

      const scale = size / 280;

      setDimensions({
        canvasSize: size,
        centerX: size / 2,
        centerY: size / 2,
        outerRadius: 130 * scale,
        innerRadius: 75 * scale,
        arcRadius: 120 * scale,
        arcWidth: 14 * scale,
        centerCircleSize: 100 * scale,
        fontSize: 52 * Math.min(scale, 1.1),
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Calculate percentage based on active count
  const calculatePercentage = () => {
    const total = data.active + data.onLeave + data.absent;
    return total > 0 ? Math.round((data.active / total) * 100) : 0;
  };

  const drawBackgroundLines = (ctx: CanvasRenderingContext2D, currentValue: number) => {
    const { canvasSize, centerX, centerY, innerRadius, outerRadius } = dimensions;
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    const numberOfLines = 60;
    const angleStep = (Math.PI * 2) / numberOfLines;

    for (let i = 0; i < numberOfLines; i++) {
      const angle = i * angleStep - Math.PI / 2;

      const normalizedAngle = (angle + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
      const linePosition = normalizedAngle / (Math.PI * 2);
      const progressPosition = currentValue / 100;

      if (linePosition > progressPosition) {
        const startX = centerX + Math.cos(angle) * innerRadius;
        const startY = centerY + Math.sin(angle) * innerRadius;
        const endX = centerX + Math.cos(angle) * outerRadius;
        const endY = centerY + Math.sin(angle) * outerRadius;

        ctx.strokeStyle = `#0F3988`;
        ctx.lineWidth = Math.max(1, 1.5 * (dimensions.canvasSize / 280));
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    }
  };

  const drawProgressArcs = (ctx: CanvasRenderingContext2D, currentValue: number) => {
    const { canvasSize, centerX, centerY, arcRadius, arcWidth } = dimensions;
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    const totalProgress = (currentValue / 100) * Math.PI * 2;
    const startAngle = -Math.PI / 2;

    if (totalProgress > 0) {
      const greenPercent = Math.min(40, currentValue);
      const greenAngle = (greenPercent / 100) * Math.PI * 2;

      if (greenAngle > 0) {
        const greenEnd = startAngle + greenAngle;
        ctx.strokeStyle = '#B8E6C0';
        ctx.lineWidth = Math.max(2, arcWidth);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(centerX, centerY, arcRadius, startAngle, greenEnd);
        ctx.stroke();
      }

      if (currentValue > 40) {
        const redPercent = currentValue - 40;
        const redAngle = (redPercent / 100) * Math.PI * 2;

        if (redAngle > 0) {
          const redStart = startAngle + greenAngle + gapAngle;
          const redEnd = redStart + redAngle;
          ctx.strokeStyle = '#FF6B6B';
          ctx.lineWidth = Math.max(2, arcWidth);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(centerX, centerY, arcRadius, redStart, redEnd);
          ctx.stroke();
        }
      }
    }
  };

  useEffect(() => {
    const percentage = calculatePercentage();
    setValue(percentage);
  }, [data]);

  useEffect(() => {
    if (backgroundCanvasRef.current && progressCanvasRef.current) {
      const bgCtx = backgroundCanvasRef.current.getContext('2d');
      const progressCtx = progressCanvasRef.current.getContext('2d');

      if (bgCtx && progressCtx) {
        backgroundCanvasRef.current.width = dimensions.canvasSize;
        backgroundCanvasRef.current.height = dimensions.canvasSize;
        progressCanvasRef.current.width = dimensions.canvasSize;
        progressCanvasRef.current.height = dimensions.canvasSize;

        drawBackgroundLines(bgCtx, value);
        drawProgressArcs(progressCtx, value);
      }
    }
  }, [value, data, dimensions]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px',
      }}
    >
      <div style={{
        position: 'relative',
        width: `${dimensions.canvasSize}px`,
        height: `${dimensions.canvasSize}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <canvas
          ref={backgroundCanvasRef}
          id="backgroundLines"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
        />
        <canvas
          ref={progressCanvasRef}
          id="progressArcs"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
        />
        <div style={{
          position: 'relative',
          width: `${dimensions.centerCircleSize}px`,
          height: `${dimensions.centerCircleSize}px`,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #FFFFFF 0%, #BCCDF9 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${dimensions.fontSize}px`,
          fontWeight: '300',
          color: '#1A202C',
          boxShadow: '0 10px 30px rgba(100, 130, 200, 0.15)',
          zIndex: 10,
          flexDirection: 'column'
        }}>
          <span style={{ fontSize: `${dimensions.fontSize}px`, fontWeight: '300' }}>{value}</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceChart;