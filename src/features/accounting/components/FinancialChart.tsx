// src/features/accounting/components/FinancialChart.tsx
import { useEffect, useRef } from 'react';
import {
  Chart,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js components
Chart.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface FinancialChartProps {
  type: 'bar' | 'line' | 'area';
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string;
      fill?: boolean;
    }[];
  };
  options?: any;
  height?: number;
  width?: number;
}

export default function FinancialChart({ type, data, options = {}, height = 300, width }: FinancialChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      // Destroy existing chart
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      // Create new chart
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        const defaultOptions = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom' as const,
              labels: {
                boxWidth: 12,
                padding: 15,
                font: {
                  size: 11,
                },
              },
            },
            tooltip: {
              backgroundColor: 'white',
              titleColor: '#111827',
              bodyColor: '#4B5563',
              borderColor: '#E5E7EB',
              borderWidth: 1,
              padding: 12,
              boxPadding: 6,
              usePointStyle: true,
              callbacks: {
                label: function(context: any) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.y !== null) {
                    label += new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'KWD',
                      minimumFractionDigits: 3,
                    }).format(context.parsed.y);
                  }
                  return label;
                },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: '#E5E7EB',
              },
              ticks: {
                callback: function(value: any) {
                  return 'KWD ' + value.toFixed(3);
                },
              },
            },
            x: {
              grid: {
                display: false,
              },
            },
          },
        };

        const mergedOptions = { ...defaultOptions, ...options };

        chartInstance.current = new Chart(ctx, {
          type: type === 'area' ? 'line' : type,
          data: {
            ...data,
            datasets: data.datasets.map(dataset => ({
              ...dataset,
              fill: type === 'area' ? true : dataset.fill,
              tension: 0.4,
            })),
          },
          options: mergedOptions,
        });
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, type, options]);

  return (
    <div style={{ height, width }}>
      <canvas ref={chartRef} />
    </div>
  );
}