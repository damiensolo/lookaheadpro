import React from 'react';
import { useState, useMemo } from 'react';
import { PLANNER_TASKS, MOCK_WEATHER } from './constants';
import { LookaheadTask, Constraint, ConstraintStatus, ConstraintType, WeatherForecast } from './types';
import ConstraintBadge from './components/ConstraintBadge';
import ManHoursBar from './components/ManHoursBar';
import LookaheadDetailsPanel from './components/LookaheadDetailsPanel';
import SparklineChart from './components/SparklineChart';
import { ChevronDownIcon, ChevronRightIcon, DocumentIcon, SunIcon, CloudIcon, CloudRainIcon } from '../../common/Icons';
import { addDays, getDaysDiff, formatDateISO, parseLookaheadDate } from '../../../lib/dateUtils';

const DAY_WIDTH = 48;
const LEFT_PANEL_WIDTH = 750;
const ROW_HEIGHT = 40;

const WeatherIcon: React.FC<{ icon: WeatherForecast['icon'] }> = ({ icon }) => {
    switch(icon) {
        case 'sun': return <SunIcon className="w-4 h-4 text-yellow-500" />;
        case 'cloud': return <CloudIcon className="w-4 h-4 text-gray-500" />;
        case 'rain': return <CloudRainIcon className="w-4 h-4 text-blue-500" />;
        default: return null;
    }
}

const LookaheadView: React.FC = () => {
    const [plannerTasks, setPlannerTasks] = useState<LookaheadTask[]>(PLANNER_TASKS);
    const [selectedTask, setSelectedTask] = useState<LookaheadTask | null>(null);

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

    // FIX: Explicitly type the Map to ensure TypeScript correctly infers the type of `forecast`.
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
                <div key={task.id} className="flex border-b border-gray-200" style={{ height: `${ROW_HEIGHT}px`}}>
                    {/* Left Panel */}
                    <div className="sticky left-0 bg-white border-r border-gray-200 z-10 flex" style={{ width: `${LEFT_PANEL_WIDTH}px` }}>
                        <div className="w-[50px] flex-shrink-0 flex items-center justify-center px-2 text-gray-500 text-sm">
                            {task.id}
                        </div>
                        <div className="w-[250px] flex-shrink-0 flex items-center px-2 border-l border-gray-200" style={{ paddingLeft: `${8 + (level * 24)}px`}}>
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
                         <div className="w-[100px] flex-shrink-0 flex items-center px-2 truncate border-l border-gray-200 text-sm">{task.resource}</div>
                         <div className="w-[175px] flex-shrink-0 flex items-center px-2 border-l border-gray-200">
                             <ConstraintBadge status={task.status} onClick={() => setSelectedTask(task)} />
                         </div>
                         <div className="w-[175px] flex-shrink-0 flex items-center px-2 border-l border-gray-200">
                            <ManHoursBar manHours={task.manHours} />
                         </div>
                    </div>
                    {/* Right Panel (Timeline) */}
                    <div className="relative flex-grow">
                        <div className={`absolute top-1/2 -translate-y-1/2 h-4 bg-gray-200 rounded-sm ${isCritical ? 'border-t-2 border-b-2 border-red-500 box-content' : ''}`}
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
                    <div className="relative" style={{ minWidth: `${LEFT_PANEL_WIDTH + (totalDays * DAY_WIDTH)}px`}}>
                        {/* Header */}
                        <div className="sticky top-0 bg-gray-50 z-20 text-xs font-semibold text-gray-600 uppercase border-b border-t border-gray-200">
                            <div className="flex" style={{ height: '30px' }}>
                                <div className="sticky left-0 bg-gray-50 border-r border-gray-200" style={{ width: `${LEFT_PANEL_WIDTH}px` }}></div>
                                <div className="flex-grow flex">
                                    {weekHeaders.map((week, i) => (
                                        <div key={i} className="flex items-center justify-center border-r border-gray-200" style={{ width: `${week.days * DAY_WIDTH}px`}}>{week.label}</div>
                                    ))}
                                </div>
                            </div>
                             <div className="flex" style={{ height: '50px' }}>
                                 <div className="sticky left-0 bg-gray-50 flex border-r border-gray-200" style={{ width: `${LEFT_PANEL_WIDTH}px` }}>
                                    <div className="w-[50px] flex-shrink-0 px-2 flex items-end justify-center pb-1">ID</div>
                                    <div className="w-[250px] flex-shrink-0 px-2 flex items-end pb-1 border-l border-gray-200">Task Name</div>
                                    <div className="w-[100px] flex-shrink-0 px-2 flex items-end pb-1 border-l border-gray-200">Resource</div>
                                    <div className="w-[175px] flex-shrink-0 px-2 flex items-end pb-1 border-l border-gray-200">Constraint Health</div>
                                    <div className="w-[175px] flex-shrink-0 px-2 flex items-end pb-1 border-l border-gray-200">Man-Hours</div>
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
                        <div>
                            <div className="absolute top-0 left-0 h-full w-full z-0 pointer-events-none">
                                <div className="flex h-full" style={{ paddingLeft: `${LEFT_PANEL_WIDTH}px` }}>
                                    {Array.from({ length: totalDays }).map((_, i) => (
                                        <div key={i} className="h-full border-r border-gray-100" style={{ width: `${DAY_WIDTH}px` }}></div>
                                    ))}
                                </div>
                            </div>
                            <div className="relative z-10">
                                {renderTaskRows(plannerTasks, 0)}
                            </div>
                        </div>
                    </div>
                </div>
                <LookaheadDetailsPanel task={selectedTask} onClose={() => setSelectedTask(null)} onAddConstraint={handleAddConstraint} />
            </div>
        </div>
    );
};

export default LookaheadView;