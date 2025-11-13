import React, { useState, useMemo, useCallback } from 'react';
import { PLANNER_TASKS, MOCK_WEATHER } from './constants';
import { LookaheadTask, Constraint, ConstraintStatus, ConstraintType, WeatherForecast } from './types';
import ConstraintBadge from './components/ConstraintBadge';
import ManHoursBar from './components/ManHoursBar';
import LookaheadDetailsPanel from './components/LookaheadDetailsPanel';
import SparklineChart from './components/SparklineChart';
import { ChevronDownIcon, ChevronRightIcon, DocumentIcon, SunIcon, CloudIcon, CloudRainIcon } from '../../common/Icons';
import { addDays, getDaysDiff, formatDateISO, parseLookaheadDate } from '../../../lib/dateUtils';

const DAY_WIDTH = 48;
const ROW_HEIGHT = 40;

const WeatherIcon: React.FC<{ icon: WeatherForecast['icon'] }> = ({ icon }) => {
    switch(icon) {
        case 'sun': return <SunIcon className="w-4 h-4 text-yellow-500" />;
        case 'cloud': return <CloudIcon className="w-4 h-4 text-gray-500" />;
        case 'rain': return <CloudRainIcon className="w-4 h-4 text-blue-500" />;
        default: return null;
    }
}

type ColumnKeys = 'id' | 'name' | 'resource' | 'health' | 'manHours';

const columnConfig: Record<ColumnKeys, { minWidth: number }> = {
    id: { minWidth: 40 },
    name: { minWidth: 150 },
    resource: { minWidth: 80 },
    health: { minWidth: 140 },
    manHours: { minWidth: 130 },
};


const LookaheadView: React.FC = () => {
    const [plannerTasks, setPlannerTasks] = useState<LookaheadTask[]>(PLANNER_TASKS);
    const [selectedTask, setSelectedTask] = useState<LookaheadTask | null>(null);
    
    const [columnWidths, setColumnWidths] = useState({
        id: 50,
        name: 250,
        resource: 100,
        health: 175,
        manHours: 175,
    });

    const handleMouseDown = useCallback((e: React.MouseEvent, columnId: ColumnKeys) => {
        e.preventDefault();

        const startX = e.clientX;
        const startWidth = columnWidths[columnId];
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const moveHandler = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const minWidth = columnConfig[columnId].minWidth;
            const newWidth = Math.max(startWidth + deltaX, minWidth);
            setColumnWidths(prev => ({
                ...prev,
                [columnId]: newWidth,
            }));
        };

        const upHandler = () => {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('mouseup', upHandler);
        };

        window.addEventListener('mousemove', moveHandler);
        window.addEventListener('mouseup', upHandler);
    }, [columnWidths]);

    const totalLeftPanelWidth = useMemo(() => Object.values(columnWidths).reduce((sum, width) => sum + width, 0), [columnWidths]);

    const { projectStartDate, projectEndDate, totalDays } = useMemo(() => {
        const allTasks: LookaheadTask[] = [];
        const flatten = (tasks: LookaheadTask[]) => {
            tasks.forEach(t => {
                allTasks.push(t);
                if (t.children) flatten(t.children);
            });
        };
        flatten(plannerTasks);
        if (allTasks.length === 0) return { projectStartDate: new Date(), projectEndDate: new Date(), totalDays: 0 };

        const start = allTasks.reduce((min, t) => parseLookaheadDate(t.startDate) < min ? parseLookaheadDate(t.startDate) : min, parseLookaheadDate(allTasks[0].startDate));
        const end = allTasks.reduce((max, t) => parseLookaheadDate(t.finishDate) > max ? parseLookaheadDate(t.finishDate) : max, parseLookaheadDate(allTasks[0].finishDate));
        
        return {
            projectStartDate: start,
            projectEndDate: end,
            totalDays: getDaysDiff(start, end) + 1,
        };
    }, [plannerTasks]);

    const weatherByDate = useMemo(() => new Map<string, WeatherForecast>(MOCK_WEATHER.map(w => [w.date, w])), []);

    const handleToggle = (taskId: string | number) => {
        const toggleRecursively = (tasks: LookaheadTask[]): LookaheadTask[] => {
            return tasks.map(task => {
                if (task.id === taskId) {
                    return { ...task, isExpanded: !task.isExpanded };
                }
                if (task.children) {
                    return { ...task, children: toggleRecursively(task.children) };
                }
                return task;
            });
        };
        setPlannerTasks(prev => toggleRecursively(prev));
    };

    const handleAddConstraint = (taskId: string | number, newConstraint: Constraint) => {
        const addConstraintRecursively = (tasks: LookaheadTask[]): LookaheadTask[] => {
            return tasks.map(task => {
                if (task.id === taskId) {
                    const updatedConstraints = [...task.constraints, newConstraint];
                    const newStatus = { ...task.status };
                    if (newConstraint.severity === 'Blocking') {
                        newStatus[newConstraint.type] = ConstraintStatus.Overdue;
                    } else if (newConstraint.severity === 'Warning' && newStatus[newConstraint.type] === ConstraintStatus.Complete) {
                        newStatus[newConstraint.type] = ConstraintStatus.Pending;
                    }
                    
                    const updatedTask = {
                        ...task,
                        constraints: updatedConstraints,
                        status: newStatus,
                    };
    
                    if (selectedTask && selectedTask.id === taskId) {
                        setSelectedTask(updatedTask);
                    }
                    return updatedTask;
                }
                if (task.children) {
                    return { ...task, children: addConstraintRecursively(task.children) };
                }
                return task;
            });
        };
        setPlannerTasks(prev => addConstraintRecursively(prev));
    };

    const weekHeaders: { label: string; days: number }[] = [];
    let currentDate = new Date(projectStartDate);
    while (currentDate <= projectEndDate) {
        const weekStart = new Date(currentDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = addDays(weekStart, 6);
        const label = `${weekStart.toLocaleString('default', { month: 'short' })} ${weekStart.getDate()} - ${weekEnd.toLocaleString('default', { month: 'short' })} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
        
        let daysInWeek = 0;
        for (let i = 0; i < 7 && addDays(currentDate, i) <= projectEndDate; i++) {
            daysInWeek++;
        }

        weekHeaders.push({ label, days: daysInWeek });
        currentDate = addDays(currentDate, daysInWeek);
    }
    
    const renderTaskRows = (tasks: LookaheadTask[], level: number): React.ReactNode[] => {
        return tasks.flatMap(task => {
            const isBlocked = Object.values(task.status).includes(ConstraintStatus.Overdue);
            const isCritical = !!task.isCriticalPath;
            const taskStart = parseLookaheadDate(task.startDate);
            const taskEnd = parseLookaheadDate(task.finishDate);
            const offsetDays = getDaysDiff(projectStartDate, taskStart);
            const durationDays = getDaysDiff(taskStart, taskEnd) + 1;
            const progressPercent = task.manHours.budget > 0 ? (task.manHours.actual / task.manHours.budget) : 0;
            const progressDays = Math.floor(durationDays * progressPercent);

            const row = (
                <div key={task.id} className="flex border-b border-gray-200 first:border-t" style={{ height: `${ROW_HEIGHT}px`}}>
                    {/* Left Panel */}
                    <div className="sticky left-0 bg-white border-r-2 border-gray-300 z-10 flex" style={{ width: `${totalLeftPanelWidth}px` }}>
                        <div className="flex-shrink-0 flex items-center justify-center px-2 text-gray-500 text-sm overflow-hidden" style={{ width: `${columnWidths.id}px` }}>
                            {task.id}
                        </div>
                        <div className="flex-shrink-0 flex items-center px-2 border-l border-gray-200 overflow-hidden" style={{ width: `${columnWidths.name}px`, paddingLeft: `${8 + (level * 24)}px`}}>
                           <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mr-1">
                                {task.children ? (
                                    <button
                                        onClick={() => handleToggle(task.id)}
                                        className="text-gray-400 hover:text-gray-800"
                                    >
                                        {task.isExpanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                                    </button>
                                ) : (
                                    <DocumentIcon className="w-4 h-4 text-gray-400"/>
                                )}
                            </div>
                            <span className="truncate font-medium text-gray-800 text-sm">{task.name}</span>
                        </div>
                         <div className="flex-shrink-0 flex items-center px-2 truncate border-l border-gray-200 text-sm overflow-hidden" style={{ width: `${columnWidths.resource}px` }}>{task.resource}</div>
                         <div className="flex-shrink-0 flex items-center px-2 border-l border-gray-200 overflow-hidden" style={{ width: `${columnWidths.health}px` }}>
                             <ConstraintBadge status={task.status} onClick={() => setSelectedTask(task)} />
                         </div>
                         <div className="flex-shrink-0 flex items-center px-2 border-l border-gray-200 overflow-hidden" style={{ width: `${columnWidths.manHours}px` }}>
                            <ManHoursBar manHours={task.manHours} />
                         </div>
                    </div>
                    {/* Right Panel (Timeline) */}
                    <div className="relative flex-grow flex">
                        {Array.from({ length: totalDays }).map((_, i) => {
                            const date = addDays(projectStartDate, i);
                            const day = date.getDay();
                            const isWeekend = day === 0 || day === 6;
                            return (
                                <div key={i} className={`h-full border-r border-gray-100 ${isWeekend ? 'bg-gray-50' : ''}`} style={{ width: `${DAY_WIDTH}px`}}></div>
                            );
                        })}
                        <div className={`absolute top-1/2 -translate-y-1/2 h-4 bg-gray-200 rounded-sm ${isCritical ? 'border-t-2 border-b-2 border-red-700' : ''}`}
                             style={{ left: `${offsetDays * DAY_WIDTH}px`, width: `${durationDays * DAY_WIDTH}px`}}
                        >
                            <div className="flex h-full">
                                {Array.from({ length: durationDays }).map((_, i) => (
                                    <div key={i} className="flex-1 border-r border-white/50 first:border-l-0" style={{
                                        backgroundColor: isBlocked ? '#fecaca' : // red-200
                                                        (i < progressDays ? '#3b82f6' : '#bfdbfe') // blue-500 : blue-200
                                    }}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            );
            return [row, task.isExpanded && task.children ? renderTaskRows(task.children, level + 1) : []];
        });
    };

    const Resizer: React.FC<{ onMouseDown: (e: React.MouseEvent) => void }> = ({ onMouseDown }) => (
        <div onMouseDown={onMouseDown} className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-blue-300 z-20" />
    );

    return (
        <div className="flex h-full bg-white overflow-hidden relative flex-col">
            {/* Dashboard Header */}
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">PPC Trend (Last 6 Weeks)</h3>
                    <SparklineChart data={plannerTasks[0]?.ppcHistory || []} />
                </div>
            </div>

            {/* Main Planner */}
            <div className="flex-grow overflow-hidden relative flex">
                <div className="flex-grow overflow-auto">
                    <div className="relative" style={{ minWidth: `${totalLeftPanelWidth + (totalDays * DAY_WIDTH)}px`}}>
                        {/* Header */}
                        <div className="sticky top-0 bg-gray-50 z-20 text-xs font-semibold text-gray-600 uppercase border-b border-t border-gray-200">
                            <div className="flex border-b border-gray-200" style={{ height: '30px' }}>
                                <div className="sticky left-0 bg-gray-50 flex border-r-2 border-gray-300" style={{ width: `${totalLeftPanelWidth}px` }}></div>
                                <div className="flex-grow flex">
                                    {weekHeaders.map((week, i) => (
                                        <div key={i} className="flex items-center justify-center border-r border-gray-200" style={{ width: `${week.days * DAY_WIDTH}px`}}>{week.label}</div>
                                    ))}
                                </div>
                            </div>
                             <div className="flex" style={{ height: '50px' }}>
                                 <div className="sticky left-0 bg-gray-50 flex border-r-2 border-gray-300" style={{ width: `${totalLeftPanelWidth}px` }}>
                                    <div className="relative flex-shrink-0 px-2 flex items-end justify-center pb-1" style={{ width: `${columnWidths.id}px`}}>
                                        ID
                                        <Resizer onMouseDown={(e) => handleMouseDown(e, 'id')} />
                                    </div>
                                    <div className="relative flex-shrink-0 px-2 flex items-end pb-1 border-l border-gray-200" style={{ width: `${columnWidths.name}px` }}>
                                        Task Name
                                        <Resizer onMouseDown={(e) => handleMouseDown(e, 'name')} />
                                    </div>
                                    <div className="relative flex-shrink-0 px-2 flex items-end pb-1 border-l border-gray-200" style={{ width: `${columnWidths.resource}px` }}>
                                        Resource
                                        <Resizer onMouseDown={(e) => handleMouseDown(e, 'resource')} />
                                    </div>
                                    <div className="relative flex-shrink-0 px-2 flex items-end pb-1 border-l border-gray-200" style={{ width: `${columnWidths.health}px` }}>
                                        Constraint Health
                                        <Resizer onMouseDown={(e) => handleMouseDown(e, 'health')} />
                                    </div>
                                    <div className="relative flex-shrink-0 px-2 flex items-end pb-1 border-l border-gray-200" style={{ width: `${columnWidths.manHours}px` }}>
                                        Man-Hours
                                        <Resizer onMouseDown={(e) => handleMouseDown(e, 'manHours')} />
                                    </div>
                                 </div>
                                 <div className="flex-grow flex">
                                    {Array.from({length: totalDays}).map((_, i) => {
                                        const date = addDays(projectStartDate, i);
                                        const dateString = formatDateISO(date);
                                        const forecast = weatherByDate.get(dateString);
                                        const day = date.getDay();
                                        const isWeekend = day === 0 || day === 6;
                                        return (
                                            <div key={i} className={`flex flex-col items-center justify-end pb-1 border-r border-gray-200 ${isWeekend ? 'bg-gray-100' : ''}`} style={{width: `${DAY_WIDTH}px`}}>
                                                <div className="h-7 flex flex-col items-center justify-center">
                                                    {forecast ? (
                                                        <div className="flex flex-col items-center" title={`${forecast.temp}°F`}>
                                                            <WeatherIcon icon={forecast.icon} />
                                                            <span className="text-[10px] font-medium text-gray-600">{forecast.temp}°</span>
                                                        </div>
                                                    ) : <div style={{height: '28px'}}></div>}
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="text-[10px] text-gray-400 mr-0.5">{date.toLocaleString('default', { weekday: 'short' })[0]}</span>
                                                    <span className="font-normal">{date.getDate()}</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                 </div>
                             </div>
                        </div>
                        {/* Body */}
                        <div className="relative z-10">
                            {renderTaskRows(plannerTasks, 0)}
                        </div>
                    </div>
                </div>
                <LookaheadDetailsPanel task={selectedTask} onClose={() => setSelectedTask(null)} onAddConstraint={handleAddConstraint} />
            </div>
        </div>
    );
};

export default LookaheadView;