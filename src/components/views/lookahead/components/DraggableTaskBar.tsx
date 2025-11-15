import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { LookaheadTask, ConstraintStatus, DailyMetric } from '../types';
import { addDays, formatDateISO, getDaysDiff, parseLookaheadDate } from '../../../../lib/dateUtils';

interface DraggableTaskBarProps {
    task: LookaheadTask;
    projectStartDate: Date;
    dayWidth: number;
    onUpdateTask: (taskId: string | number, newStart: string, newFinish: string) => void;
    onDayClick: (task: LookaheadTask, date: Date) => void;
}

const getTaskStatus = (task: LookaheadTask): 'ready' | 'at_risk' | 'blocked' => {
  const statuses = Object.values(task.status);
  if (statuses.includes(ConstraintStatus.Overdue)) return 'blocked';
  if (statuses.includes(ConstraintStatus.Pending)) return 'at_risk';
  return 'ready';
};

const statusStyles: Record<'ready' | 'at_risk' | 'blocked', { bg: string }> = {
  ready: { bg: 'bg-green-100' },
  at_risk: { bg: 'bg-yellow-100' },
  blocked: { bg: 'bg-red-100' },
};

const getActualColor = (actual: number, plan: number): string => {
    if (actual > plan) return 'text-green-600 font-semibold';
    if (actual < plan) return 'text-red-600 font-semibold';
    return 'text-blue-600';
};

const MetricRow: React.FC<{ label: string; plan: number; actual: number; unit: string; }> = ({ label, plan, actual, unit }) => (
    <div className="text-[10px] leading-tight text-gray-500">
      {label}: {plan} / <span className={getActualColor(actual, plan)}>{actual}</span> {unit}
    </div>
);

// FIX: Update onClick prop type to accept a MouseEvent.
const DailyCell: React.FC<{ metric: DailyMetric | undefined, onClick: (e: React.MouseEvent<HTMLDivElement>) => void }> = ({ metric, onClick }) => {
    const getProgressStatusColor = (status: DailyMetric['progressStatus']) => {
        if (status === 'Ahead') return 'text-green-700';
        if (status === 'Delayed') return 'text-red-700';
        return 'text-gray-600';
    };

    if (!metric) {
        return <div className="w-full h-full cursor-pointer hover:bg-black/5" onClick={onClick}></div>;
    }

    return (
        <div className="w-full h-full p-1 flex flex-col justify-between cursor-pointer hover:bg-black/5" onClick={onClick}>
            <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-gray-800">{metric.progress}%</span>
                <span className={`text-[10px] font-semibold ${getProgressStatusColor(metric.progressStatus)}`}>{metric.progressStatus}</span>
            </div>
            <div className="space-y-0.5">
                <MetricRow label="Q" plan={metric.plan.q} actual={metric.actual.q} unit={metric.units.q} />
                <MetricRow label="H" plan={metric.plan.h} actual={metric.actual.h} unit={metric.units.h} />
                <MetricRow label="C" plan={metric.plan.c} actual={metric.actual.c} unit={metric.units.c} />
            </div>
        </div>
    );
};

const DraggableTaskBar: React.FC<DraggableTaskBarProps> = ({ task, projectStartDate, dayWidth, onUpdateTask, onDayClick }) => {
    const [dragState, setDragState] = useState<{
        type: 'move' | 'resize-left' | 'resize-right';
        startX: number;
        originalTask: LookaheadTask;
    } | null>(null);

    const metricsByDate = useMemo(() => new Map(task.dailyMetrics?.map(m => [m.date, m])), [task.dailyMetrics]);
    
    const taskStatus = getTaskStatus(task);
    const styles = statusStyles[taskStatus];
    
    const taskStart = parseLookaheadDate(task.startDate);
    const taskEnd = parseLookaheadDate(task.finishDate);
    const offsetDays = getDaysDiff(projectStartDate, taskStart);
    const durationDays = getDaysDiff(taskStart, taskEnd) + 1;

    const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'resize-left' | 'resize-right') => {
        e.preventDefault();
        e.stopPropagation();
        document.body.style.cursor = type === 'move' ? 'grabbing' : 'ew-resize';
        document.body.style.userSelect = 'none';
        setDragState({ type, startX: e.clientX, originalTask: task });
    };
    
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragState) return;

        const deltaX = e.clientX - dragState.startX;
        const dayDelta = Math.round(deltaX / dayWidth);
        const originalStart = parseLookaheadDate(dragState.originalTask.startDate);
        const originalFinish = parseLookaheadDate(dragState.originalTask.finishDate);

        let newStart = new Date(originalStart);
        let newFinish = new Date(originalFinish);

        if (dragState.type === 'move') {
            newStart = addDays(originalStart, dayDelta);
            newFinish = addDays(originalFinish, dayDelta);
        } else if (dragState.type === 'resize-left') {
            newStart = addDays(originalStart, dayDelta);
            if (newStart > originalFinish) newStart = new Date(originalFinish);
        } else if (dragState.type === 'resize-right') {
            newFinish = addDays(originalFinish, dayDelta);
            if (newFinish < originalStart) newFinish = new Date(originalStart);
        }
        
        onUpdateTask(task.id, formatDateISO(newStart), formatDateISO(newFinish));

    }, [dragState, dayWidth, onUpdateTask, task.id]);


    const handleMouseUp = useCallback(() => {
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
        setDragState(null);
    }, []);

    useEffect(() => {
        if (dragState) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragState, handleMouseMove, handleMouseUp]);

    const barWidth = durationDays * dayWidth;

    return (
        <div 
            className={`absolute top-0 bottom-0 group
                ${dragState?.type === 'move' ? 'cursor-grabbing opacity-80 z-20' : 'cursor-grab z-10'}`}
            style={{ 
                left: `${offsetDays * dayWidth}px`, 
                width: `${barWidth}px`,
            }}
            onMouseDown={(e) => handleMouseDown(e, 'move')}
            title={`${task.name}: ${task.startDate} to ${task.finishDate}`}
        >
            <div className={`absolute inset-0 flex ${styles.bg}`}>
                {Array.from({ length: durationDays }).map((_, i) => {
                    const dayDate = addDays(taskStart, i);
                    const metric = metricsByDate.get(formatDateISO(dayDate));
                    return (
                        <div
                            key={i}
                            className="h-full border-r border-gray-300/50 last:border-r-0"
                            style={{ width: `${dayWidth}px` }}
                        >
                           <DailyCell metric={metric} onClick={(e) => { e.stopPropagation(); onDayClick(task, dayDate); }} />
                        </div>
                    );
                })}
            </div>
            
            {/* Critical Path Indicator */}
            {task.isCriticalPath && (
                <>
                    <div className="absolute -top-1 left-0 right-0 h-1 bg-red-600 rounded-t-sm"></div>
                    <div className="absolute -bottom-1 left-0 right-0 h-1 bg-red-600 rounded-b-sm"></div>
                </>
            )}
            
            {/* Resize Handles */}
            <div 
                className="absolute left-0 top-0 h-full w-2 cursor-ew-resize opacity-0 group-hover:opacity-100"
                style={{transform: 'translateX(-50%)'}}
                onMouseDown={(e) => handleMouseDown(e, 'resize-left')}
            />
            <div 
                className="absolute right-0 top-0 h-full w-2 cursor-ew-resize opacity-0 group-hover:opacity-100" 
                style={{transform: 'translateX(50%)'}}
                onMouseDown={(e) => handleMouseDown(e, 'resize-right')}
            />
        </div>
    );
};

export default DraggableTaskBar;