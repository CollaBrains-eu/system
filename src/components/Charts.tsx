import { useId, useState } from "react";

interface RevenueChartProps {
  data: number[];
  labels?: string[];
  height?: number;
  compact?: boolean;
}

export function RevenueChart({
  data,
  labels,
  height = 248,
  compact = false,
}: RevenueChartProps) {
  const gradientId = useId().replace(/:/g, "");
  const [active, setActive] = useState<number | null>(null);
  const width = 760;
  const top = 18;
  const bottom = compact ? 12 : 34;
  const left = compact ? 4 : 46;
  const right = 14;
  const chartHeight = height - top - bottom;
  const chartWidth = width - left - right;
  const min = Math.floor(Math.min(...data) - 1);
  const max = Math.ceil(Math.max(...data) + 1);
  const points = data.map((value, index) => ({
    x: left + (index * chartWidth) / Math.max(data.length - 1, 1),
    y:
      top +
      chartHeight -
      ((value - min) / Math.max(max - min, 1)) * chartHeight,
    value,
  }));

  const path = points.reduce((result, point, index) => {
    if (index === 0) return `M ${point.x},${point.y}`;
    const previous = points[index - 1];
    const controlX = (previous.x + point.x) / 2;
    return `${result} C ${controlX},${previous.y} ${controlX},${point.y} ${point.x},${point.y}`;
  }, "");
  const areaPath = `${path} L ${points.at(-1)?.x},${top + chartHeight} L ${points[0].x},${top + chartHeight} Z`;
  const defaultLabels =
    data.length === 12
      ? [
          "Dec",
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
        ]
      : data.length === 6
        ? ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"]
        : ["09 Oct", "14 Oct", "19 Oct", "24 Oct", "29 Oct", "07 Nov"];
  const xLabels = labels || defaultLabels;

  function handleMove(event: React.MouseEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * width;
    let nearest = 0;
    points.forEach((point, index) => {
      if (Math.abs(point.x - x) < Math.abs(points[nearest].x - x))
        nearest = index;
    });
    setActive(nearest);
  }

  return (
    <div className="revenue-chart" style={{ height }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        onMouseMove={handleMove}
        onMouseLeave={() => setActive(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7a9e45" stopOpacity=".22" />
            <stop offset="100%" stopColor="#7a9e45" stopOpacity="0" />
          </linearGradient>
        </defs>
        {!compact &&
          [0, 1, 2, 3].map((line) => {
            const y = top + (line * chartHeight) / 3;
            const value = max - ((max - min) / 3) * line;
            return (
              <g key={line}>
                <line
                  x1={left}
                  x2={width - right}
                  y1={y}
                  y2={y}
                  stroke="#e9ece5"
                  strokeDasharray={line === 3 ? "0" : "3 4"}
                  vectorEffect="non-scaling-stroke"
                />
                <text x={0} y={y + 4} fill="#9a9f96" fontSize="11">
                  €{value.toFixed(0)}k
                </text>
              </g>
            );
          })}
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={path}
          fill="none"
          stroke="#749545"
          strokeWidth="2.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {active !== null && (
          <g>
            <line
              x1={points[active].x}
              x2={points[active].x}
              y1={top}
              y2={top + chartHeight}
              stroke="#b7c0ae"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={points[active].x}
              cy={points[active].y}
              r="5"
              fill="#fff"
              stroke="#749545"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        )}
        {!compact &&
          points.map((point, index) => {
            const show =
              data.length <= 6 || index % 2 === 0 || index === data.length - 1;
            return show ? (
              <text
                key={index}
                x={point.x}
                y={height - 5}
                textAnchor={
                  index === 0
                    ? "start"
                    : index === data.length - 1
                      ? "end"
                      : "middle"
                }
                fill="#9a9f96"
                fontSize="11"
              >
                {
                  xLabels[
                    Math.round(
                      (index * (xLabels.length - 1)) /
                        Math.max(data.length - 1, 1),
                    )
                  ]
                }
              </text>
            ) : null;
          })}
      </svg>
      {active !== null && (
        <div
          className="chart-tooltip"
          style={{
            left: `${(points[active].x / width) * 100}%`,
            top: `${Math.max((points[active].y / height) * 100 - 6, 0)}%`,
          }}
        >
          <span>Recurring revenue</span>
          <strong>€{points[active].value.toFixed(2)}k</strong>
        </div>
      )}
    </div>
  );
}

export function UsageRing({
  value,
  label,
  sublabel,
  color = "#7e9f50",
  size = 130,
}: {
  value: number;
  label: string;
  sublabel: string;
  color?: string;
  size?: number;
}) {
  return (
    <div
      className="usage-ring"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} ${value * 3.6}deg, #edf0e9 0deg)`,
      }}
    >
      <div>
        <strong>{label}</strong>
        <span>{sublabel}</span>
      </div>
    </div>
  );
}

export function MiniBars({
  values,
  color = "#8ca966",
}: {
  values: number[];
  color?: string;
}) {
  const max = Math.max(...values);
  return (
    <div className="mini-bars">
      {values.map((value, index) => (
        <i
          key={index}
          style={{ height: `${(value / max) * 100}%`, background: color }}
        />
      ))}
    </div>
  );
}
