import React from 'react';
import { Task, Status, Priority } from '../../../types';
import { AssigneeAvatar, ImpactPill, PrioritySelector } from '../../shared/TaskElements';
import { useProject } from '../../../context/ProjectContext';
import { useProjectData } from '../../../hooks/useProjectData';
import ViewControls from '../../layout/ViewControls';

const flattenTasks = (tasks: Task[]): Task[] => {
  let allTasks: Task[] = [];
  const recurse = (taskItems: Task[]) => {
    taskItems.forEach(task => {
      allTasks.push(task);
      if (task.children) {
        recurse(task.children);
      }
    });
  };
  recurse(tasks);
  return allTasks;
};

const TaskCard: React.FC<{ task: Task; onPriorityChange: (taskId: number, priority: Priority) => void; }> = ({ task, onPriorityChange }) => {
    const progressColor = task.progress && task.progress.percentage === 100 ? 'bg-green-500' : 'bg-blue-500';
    
    return (
    <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm mb-2.5 cursor-pointer hover:shadow-md transition-all hover:border-indigo-400 group relative">
        <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-2">
                 <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1 rounded border border-gray-100">ID-{task.id}</span>
                 <div className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 -ml-1">
                    <PrioritySelector taskId={task.id} currentPriority={task.priority} onPriorityChange={onPriorityChange} hideLabel={true} />
                 </div>
            </div>
            {task.impact && <div className="transform scale-75 origin-top-right"><ImpactPill impact={task.impact} /></div>}
        </div>
        
        <p className="font-medium text-gray-800 text-xs mb-2 line-clamp-2 leading-tight">{task.name}</p>
        
        {task.progress && (
             <div className="w-full h-1 bg-gray-100 rounded-full mb-2 overflow-hidden">
                 <div className={`h-full ${progressColor}`} style={{ width: `${task.progress.percentage}%` }} />
             </div>
        )}

        <div className="flex justify-between items-center mt-1">
             <div className="flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                {task.dueDate}
             </div>
            <div className="flex items-center -space-x-1.5">
                {task.assignees.map(a => (
                     <div key={a.id} className="ring-1 ring-white rounded-full bg-white transform scale-90">
                        <AssigneeAvatar assignee={a} />
                     </div>
                ))}
            </div>
        </div>
    </div>
    );
};

const BoardView: React.FC = () => {
    const { 
        tasks, activeView, searchTerm, handlePriorityChange
    } = useProject();
    const { sortedTasks } = useProjectData(tasks, activeView, searchTerm);
    const allTasks = flattenTasks(sortedTasks);

    const statusColumns: Status[] = [Status.New, Status.Planned, Status.InProgress, Status.InReview, Status.Completed];

    const tasksByStatus = statusColumns.reduce((acc, status) => {
        acc[status] = allTasks.filter(task => task.status === status);
        return acc;
    }, {} as Record<Status, Task[]>);

    const statusColors: Record<Status, string> = {
      [Status.New]: 'bg-sky-500',
      [Status.Planned]: 'bg-blue-500',
      [Status.InProgress]: 'bg-cyan-500',
      [Status.InReview]: 'bg-yellow-500',
      [Status.Completed]: 'bg-green-500',
    };

    return (
        <div className="flex flex-col h-full p-4 gap-4 min-w-min bg-gray-50">
            <ViewControls />
            <div className="flex gap-6 flex-grow overflow-auto">
                {statusColumns.map(status => (
                    <div key={status} className="w-72 bg-gray-100 rounded-lg flex-shrink-0 flex flex-col max-h-full">
                        <div className="flex items-center justify-between p-3 sticky top-0 bg-gray-100 z-10 rounded-t-lg">
                            <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${statusColors[status]}`}></span>
                                <h3 className="font-semibold text-gray-700 text-sm">{status}</h3>
                            </div>
                            <span className="text-xs font-medium text-gray-500 bg-gray-200 rounded-full px-2 py-0.5">
                                {tasksByStatus[status].length}
                            </span>
                        </div>
                        <div className="p-2 overflow-y-auto flex-grow custom-scrollbar">
                            {tasksByStatus[status].map(task => (
                                <TaskCard key={task.id} task={task} onPriorityChange={handlePriorityChange} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BoardView;