import React, { useRef, useEffect, useState } from 'react';
import { Assignee, Status, Priority, Impact, Progress } from '../../types';
import { ChevronDownIcon, ArrowUpIcon, ArrowDownIcon, MoreHorizontalIcon } from '../common/Icons';

interface PillProps {
    children: React.ReactNode;
    colorClasses: string;
    title?: string;
}

export const Pill: React.FC<PillProps> = ({ children, colorClasses, title }) => (
  <span title={title} className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1.5 ${colorClasses} overflow-hidden w-full`}>
    {children}
  </span>
);

export const ImpactPill: React.FC<{ impact: Impact }> = ({ impact }) => {
    const impactStyles: Record<Impact, { bg: string; text: string; dot: string }> = {
        [Impact.High]: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
        [Impact.Medium]: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
        [Impact.Low]: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
    };
    const style = impactStyles[impact];
    if (!style) return null;

    return (
        <Pill colorClasses={`${style.bg} ${style.text}`} title={`Impact: ${impact}`}>
            <span className={`w-2 h-2 rounded-full ${style.dot}`}></span>
            <span>{impact}</span>
        </Pill>
    );
};

const statusDotStyles: Record<Status, string> = {
  [Status.InProgress]: 'bg-cyan-500',
  [Status.Completed]: 'bg-green-500',
  [Status.InReview]: 'bg-yellow-500',
  [Status.Planned]: 'bg-blue-500',
  [Status.New]: 'bg-sky-500',
};

export const StatusDisplay: React.FC<{ status: Status }> = ({ status }) => {
  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 w-full" title={status}>
      <span className={`w-2.5 h-2.5 rounded-full ${statusDotStyles[status]} flex-shrink-0`}></span>
      <div className="min-w-0">
        <p className="text-gray-600 font-medium truncate">{status}</p>
      </div>
    </div>
  );
};

export const StatusSelector: React.FC<{
  currentStatus: Status;
  onChange: (newStatus: Status) => void;
  onBlur: () => void;
}> = ({ currentStatus, onChange, onBlur }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onBlur();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onBlur]);

  const handleSelect = (status: Status) => {
    onChange(status);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full" onClick={(e) => e.stopPropagation()}>
      <div className="w-full h-full flex items-center justify-between">
        <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${statusDotStyles[currentStatus]}`}></span>
            <span className="text-gray-800 font-medium">{currentStatus}</span>
        </div>
        <ChevronDownIcon className="w-4 h-4 text-gray-500" />
      </div>
      <ul
        className="absolute top-full left-0 mt-1 w-full min-w-max bg-white rounded-md shadow-lg border border-gray-200 z-50 overflow-hidden"
      >
        {Object.values(Status).map((s) => (
          <li
            key={s}
            onMouseDown={() => handleSelect(s)}
            className={`px-3 py-1.5 text-sm cursor-pointer flex items-center gap-2 ${
              s === currentStatus 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-800 hover:bg-indigo-500 hover:text-white'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${statusDotStyles[s]}`}></span>
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const priorityStyles: Record<Priority, { icon: React.FC<React.SVGProps<SVGSVGElement>>; color: string; name: string }> = {
    [Priority.Urgent]: { icon: ArrowUpIcon, color: 'text-red-600', name: 'Urgent' },
    [Priority.High]: { icon: ArrowUpIcon, color: 'text-orange-600', name: 'High' },
    [Priority.Medium]: { icon: MoreHorizontalIcon, color: 'text-yellow-600', name: 'Medium' },
    [Priority.Low]: { icon: ArrowDownIcon, color: 'text-green-600', name: 'Low' },
    [Priority.None]: { icon: MoreHorizontalIcon, color: 'text-gray-500', name: 'None' },
};

export const PrioritySelector: React.FC<{
  taskId: number;
  currentPriority?: Priority;
  onPriorityChange: (taskId: number, newPriority: Priority) => void;
}> = ({ taskId, currentPriority = Priority.None, onPriorityChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (priority: Priority) => {
    onPriorityChange(taskId, priority);
    setIsOpen(false);
  };

  const { icon: CurrentPriorityIcon, color: currentPriorityColor, name: currentPriorityName } = priorityStyles[currentPriority] || priorityStyles[Priority.None];

  return (
    <div ref={containerRef} className="relative w-full h-full" onClick={(e) => { e.stopPropagation(); setIsOpen(p => !p); }}>
      <div className="w-full h-full flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-100">
        <CurrentPriorityIcon className={`w-4 h-4 ${currentPriorityColor}`} />
        <span className="text-gray-800 font-medium">{currentPriorityName}</span>
      </div>
      {isOpen && (
      <ul
        className="absolute top-full left-0 mt-1 w-full min-w-max bg-white rounded-md shadow-lg border border-gray-200 z-50 overflow-hidden"
      >
        {Object.values(Priority).map((p) => {
          const { icon: Icon, color, name } = priorityStyles[p];
          return (
            <li
              key={p}
              onMouseDown={() => handleSelect(p)}
              className={`px-3 py-1.5 text-sm cursor-pointer flex items-center gap-2 ${
                p === currentPriority
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-800 hover:bg-indigo-500 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${p === currentPriority ? 'text-white' : color}`} />
              <span>{name}</span>
            </li>
          );
        })}
      </ul>
      )}
    </div>
  );
};


export const AssigneeAvatar: React.FC<{ assignee: Assignee }> = ({ assignee }) => (
    <div title={assignee.name} className={`w-5 h-5 rounded-full ${assignee.avatarColor} flex items-center justify-center text-white text-xs font-bold ring-2 ring-white`}>
        {assignee.initials}
    </div>
);

type Trend = 'up' | 'down' | 'flat';

const Sparkline: React.FC<{ data: number[], trend: Trend, width?: number, height?: number, strokeWidth?: number }> = ({ data, trend, width = 60, height = 20, strokeWidth = 1.5 }) => {
    if (data.length < 2) return null;

    const yMin = Math.min(...data);
    const yMax = Math.max(...data);

    const yPadding = height * 0.1;
    const effectiveHeight = height - (2 * yPadding);

    const getSvgX = (index: number) => index * (width / (data.length - 1));
    const getSvgY = (y: number) => {
        if (yMax === yMin) return height / 2;
        return effectiveHeight + yPadding - ((y - yMin) / (yMax - yMin)) * effectiveHeight;
    };

    const pathData = data.map((point, i) => {
        const x = getSvgX(i);
        const y = getSvgY(point);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ');

    const color = trend === 'up' ? 'stroke-green-500' : trend === 'down' ? 'stroke-red-500' : 'stroke-gray-400';

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="flex-shrink-0">
            <path d={pathData} fill="none" className={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
};

export const ProgressDisplay: React.FC<{ progress: Progress }> = ({ progress }) => {
    const { percentage, history } = progress;
    
    let trend: Trend = 'flat';
    if (history && history.length > 1) {
        const start = history[0];
        const end = history[history.length - 1];
        if (end > start) trend = 'up';
        else if (end < start) trend = 'down';
    }

    return (
        <div className="flex items-center gap-2 w-full" title={`Progress: ${percentage}%`}>
            {history && history.length > 1 ? (
                <Sparkline data={history} trend={trend} />
            ) : <div className="w-[60px] flex-shrink-0"></div>}
            <div className="w-full flex-grow">
                <div className="flex items-center gap-2">
                    <div className="h-2 bg-gray-200 rounded-full w-full">
                        <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <span className="text-xs font-mono text-gray-500 w-9 text-right">{percentage}%</span>
                </div>
            </div>
        </div>
    );
};

export const InteractiveProgressChart: React.FC<{ progress: Progress }> = ({ progress }) => {
  const { history = [] } = progress;
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: number; index: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (history.length < 2) {
    return (
      <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-500">Not enough data to display a chart.</p>
      </div>
    );
  }
  
  const width = 320;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };

  const yMin = 0;
  const yMax = 100;

  const getSvgX = (index: number) => padding.left + index * ((width - padding.left - padding.right) / (history.length - 1));
  const getSvgY = (y: number) => height - padding.bottom - ((y - yMin) / (yMax - yMin)) * (height - padding.top - padding.bottom);

  const pathData = history.map((point, i) => {
    const x = getSvgX(i);
    const y = getSvgY(point);
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');

  const areaPathData = `${pathData} V ${getSvgY(0)} L ${getSvgX(0)} ${getSvgY(0)} Z`;

  const points = history.map((value, index) => ({
    x: getSvgX(index),
    y: getSvgY(value),
    value,
    index,
  }));

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const cursorPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    
    const closestPoint = points.reduce((prev, curr) => {
      const prevDist = Math.abs(prev.x - cursorPt.x);
      const currDist = Math.abs(curr.x - cursorPt.x);
      return currDist < prevDist ? curr : prev;
    });

    setTooltip(closestPoint);
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Y-axis grid lines and labels */}
        {[0, 25, 50, 75, 100].map(val => (
          <g key={val}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={getSvgY(val)}
              y2={getSvgY(val)}
              className="stroke-gray-200"
              strokeWidth="1"
            />
            <text x={padding.left - 8} y={getSvgY(val) + 4} textAnchor="end" className="text-xs fill-gray-500">
              {val}%
            </text>
          </g>
        ))}
        {/* X-axis labels */}
        {points.map((p, i) => (
             <text key={i} x={p.x} y={height - padding.bottom + 15} textAnchor="middle" className="text-xs fill-gray-500">
                {i + 1}
             </text>
        ))}
        <text x={(width - padding.left - padding.right)/2 + padding.left} y={height - 5} textAnchor="middle" className="text-xs fill-gray-400 font-medium">Interval</text>

        {/* Gradient for area */}
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(79 70 229)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(79 70 229)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area under the line */}
        <path d={areaPathData} fill="url(#areaGradient)" />

        {/* The progress line */}
        <path d={pathData} fill="none" className="stroke-indigo-600" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Tooltip elements */}
        {tooltip && (
          <g>
            <line
              x1={tooltip.x}
              x2={tooltip.x}
              y1={padding.top}
              y2={height - padding.bottom}
              className="stroke-gray-400"
              strokeWidth="1"
              strokeDasharray="4 2"
            />
            <circle cx={tooltip.x} cy={tooltip.y} r="4" className="fill-indigo-600 stroke-white" strokeWidth="2" />
            
            <g transform={`translate(${tooltip.x > width / 2 ? tooltip.x - 70 : tooltip.x + 10}, ${padding.top})`}>
              <rect x="0" y="0" width="60" height="24" rx="4" className="fill-gray-800" opacity="0.8" />
              <text x="30" y="16" textAnchor="middle" className="fill-white text-xs font-semibold">
                {tooltip.value}%
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};