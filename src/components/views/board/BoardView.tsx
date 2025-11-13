import React from 'react';
import { Task, Status, Priority } from '../../../types';
import { AssigneeAvatar, ImpactPill, PrioritySelector } from '../../shared/TaskElements';
import { useProject } from '../../../context/ProjectContext';
import { useProjectData } from '../../../hooks/useProjectData';

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

const TaskCard: React.FC<{ task: Task; onPriorityChange: (taskId: number, priority: Priority) => void; }> = ({ task, onPriorityChange }) => (
    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm mb-3 cursor-pointer hover:shadow-md transition-shadow">
        <p className="font-semibold text-gray-800 mb-2 text-sm">{task.name}</p>
        <div className="mb-3">
          <PrioritySelector taskId={task.id} currentPriority={task.priority} onPriorityChange={onPriorityChange} />
        </div>
        <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
            <span>{task.dueDate}</span>
            {task.impact && <ImpactPill impact={task.impact} />}
        </div>
        <div className="flex items-center -space-x-2">
            {task.assignees.map(a => <AssigneeAvatar key={a.id} assignee={a} />)}
        </div>
    </div>
);

const BoardView: React.FC = () => {
    const { tasks, activeView, searchTerm, handlePriorityChange } = useProject();
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
        <div className="flex gap-6 p-4 h-full bg-gray-50 min-w-min">
            {statusColumns.map(status => (
                <div key={status} className="w-80 bg-gray-100 rounded-lg flex-shrink-0 flex flex-col">
                    <div className="flex items-center justify-between p-3 sticky top-0 bg-gray-100 z-10">
                        <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${statusColors[status]}`}></span>
                            <h3 className="font-semibold text-gray-700 text-sm">{status}</h3>
                        </div>
                        <span className="text-sm font-medium text-gray-500 bg-gray-200 rounded-full px-2 py-0.5">
                            {tasksByStatus[status].length}
                        </span>
                    </div>
                    <div className="p-1 overflow-y-auto flex-grow">
                        {tasksByStatus[status].map(task => (
                            <TaskCard key={task.id} task={task} onPriorityChange={handlePriorityChange} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default BoardView;