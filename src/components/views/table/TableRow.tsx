
import React, { Fragment, useEffect, useRef } from 'react';
import { Task, Status, Column, ColumnId, DisplayDensity } from '../../../types';
import { EyeIcon, ChevronRightIcon, ChevronDownIcon, DocumentIcon } from '../../common/Icons';
import { StatusDisplay, AssigneeAvatar, StatusSelector, ProgressDisplay } from '../../shared/TaskElements';
import { formatDateForInput, formatDateFromInput, parseDate } from '../../../lib/dateUtils';
import { DatePicker } from '../../common/ui/DatePicker';
import { format } from 'date-fns';

interface TableRowProps {
  task: Task;
  level: number;
  onToggle: (taskId: number) => void;
  rowNumberMap: Map<number, number>;
  selectedTaskIds: Set<number>;
  onToggleRow: (taskId: number) => void;
  editingCell: { taskId: number; column: string } | null;
  onEditCell: (cell: { taskId: number; column: string } | null) => void;
  onUpdateTask: (taskId: number, updatedValues: Partial<Omit<Task, 'id' | 'children'>>) => void;
  columns: Column[];
  isScrolled: boolean;
  displayDensity: DisplayDensity;
  showGridLines: boolean;
  onShowDetails: (taskId: number) => void;
}

const getRowHeight = (density: DisplayDensity) => {
  switch (density) {
    case 'compact': return 'h-8';
    case 'standard': return 'h-10';
    case 'comfortable': return 'h-12';
    default: return 'h-8';
  }
};

// --- Cell Content Components ---

const SelectionCell: React.FC<{ task: Task, isSelected: boolean, onToggleRow: (id: number) => void, rowNum?: number, isScrolled: boolean, rowHeightClass: string }> = ({ task, isSelected, onToggleRow, rowNum, isScrolled, rowHeightClass }) => {
  const taskNameId = `task-name-${task.id}`;
  const cellClasses = `sticky left-0 z-10 ${rowHeightClass} px-2 w-14 text-center text-gray-500 border-b border-r border-gray-200 transition-shadow duration-200 cursor-pointer ${
    isSelected 
      ? 'bg-indigo-50 group-hover:bg-indigo-100' 
      : 'bg-white group-hover:bg-gray-50'
  } ${isScrolled ? 'shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)]' : ''}`;

  return (
    <td className={cellClasses} onClick={() => onToggleRow(task.id)}>
        <div className="flex items-center justify-center h-full">
            <span className={isSelected ? 'hidden' : 'group-hover:hidden'}>{rowNum}</span>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleRow(task.id)}
              onClick={(e) => e.stopPropagation()}
              aria-labelledby={taskNameId}
              className={`h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mx-auto ${isSelected ? 'block' : 'hidden group-hover:block'}`}
            />
        </div>
    </td>
  );
};

const NameCellContent: React.FC<{ task: Task, level: number, isEditing: boolean, onEdit: (cell: { taskId: number; column: string } | null) => void, onUpdateTask: TableRowProps['onUpdateTask'], onToggle: (id: number) => void }> = ({ task, level, isEditing, onEdit, onUpdateTask, onToggle }) => {
    const hasChildren = task.children && task.children.length > 0;
    const nameInputRef = useRef<HTMLInputElement>(null);
    const taskNameId = `task-name-${task.id}`;

    useEffect(() => {
        if (isEditing) {
            nameInputRef.current?.focus();
            nameInputRef.current?.select();
        }
    }, [isEditing]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => onUpdateTask(task.id, { name: e.target.value });
    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === 'Escape') onEdit(null);
    };

    return (
        <div className="grid grid-cols-[auto_1fr] items-center gap-x-1 w-full" style={{ paddingLeft: `${level * 24}px` }}>
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                {hasChildren ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
                        className="text-gray-400 hover:text-gray-800"
                        aria-expanded={task.isExpanded}
                    >
                        {task.isExpanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                    </button>
                ) : (
                    <DocumentIcon className="w-4 h-4 text-gray-400"/>
                )}
            </div>
            {isEditing ? (
                <input
                    ref={nameInputRef}
                    type="text"
                    value={task.name}
                    onChange={handleNameChange}
                    onBlur={() => onEdit(null)}
                    onKeyDown={handleNameKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-transparent border-0 p-0 focus:ring-0 focus:outline-none text-gray-800 font-medium"
                />
            ) : (
                <div className="min-w-0">
                  <p id={taskNameId} className="truncate text-gray-800 font-medium" title={task.name}>{task.name}</p>
                </div>
            )}
        </div>
    );
};

const StatusCellContent: React.FC<{ task: Task, isEditing: boolean, onEdit: (cell: { taskId: number; column: string } | null) => void, onUpdateTask: TableRowProps['onUpdateTask'] }> = ({ task, isEditing, onEdit, onUpdateTask }) => {
    const handleStatusChange = (newStatus: Status) => {
        onUpdateTask(task.id, { status: newStatus });
        onEdit(null);
    };

    return isEditing ? (
        <StatusSelector 
            currentStatus={task.status} 
            onChange={handleStatusChange} 
            onBlur={() => onEdit(null)}
            defaultOpen={true}
        />
    ) : (
        <StatusDisplay status={task.status} showChevron={true} />
    );
};

const AssigneeCellContent: React.FC<{ task: Task }> = ({ task }) => (
    <div className="flex items-center -space-x-2 overflow-hidden" title={task.assignees.map(a => a.name).join(', ')}>
        {task.assignees.map(a => <AssigneeAvatar key={a.id} assignee={a} />)}
    </div>
);

const DateCellContent: React.FC<{ task: Task, isEditing: boolean, onEdit: (cell: { taskId: number; column: string } | null) => void, onUpdateTask: TableRowProps['onUpdateTask'] }> = ({ task, isEditing, onEdit, onUpdateTask }) => {
    const handleDateChange = (date: Date | undefined) => {
        if (date) {
             // Format Date back to DD/MM/YYYY for storage
             const day = String(date.getDate()).padStart(2, '0');
             const month = String(date.getMonth() + 1).padStart(2, '0');
             const year = date.getFullYear();
             onUpdateTask(task.id, { startDate: `${day}/${month}/${year}` });
        }
    };

    const parsedDate = task.startDate ? parseDate(task.startDate) : undefined;

    return (
        <div onClick={e => e.stopPropagation()} className="w-full">
             <DatePicker 
                date={parsedDate} 
                setDate={handleDateChange}
                open={isEditing}
                onOpenChange={(isOpen) => {
                    if (isOpen) onEdit({ taskId: task.id, column: 'dates' });
                    else onEdit(null);
                }}
                className="text-gray-800 font-medium"
             />
        </div>
    );
};

const TableRow: React.FC<TableRowProps> = ({ task, level, onToggle, rowNumberMap, selectedTaskIds, onToggleRow, editingCell, onEditCell, onUpdateTask, columns, isScrolled, displayDensity, showGridLines, onShowDetails }) => {
  const isSelected = selectedTaskIds.has(task.id);
  const rowNum = rowNumberMap.get(task.id);
  const rowHeightClass = getRowHeight(displayDensity);

  const getCellContent = (columnId: ColumnId) => {
      const isEditing = editingCell?.taskId === task.id && editingCell?.column === columnId;
      switch (columnId) {
          case 'name':
              return <NameCellContent task={task} level={level} isEditing={isEditing} onEdit={onEditCell} onUpdateTask={onUpdateTask} onToggle={onToggle} />;
          case 'status':
              return <StatusCellContent task={task} isEditing={isEditing} onEdit={onEditCell} onUpdateTask={onUpdateTask} />;
          case 'assignee':
              return <AssigneeCellContent task={task} />;
          case 'dates':
              return <DateCellContent task={task} isEditing={isEditing} onEdit={onEditCell} onUpdateTask={onUpdateTask} />;
          case 'progress':
              return task.progress ? <ProgressDisplay progress={task.progress} /> : null;
          case 'details':
              return (
                <button 
                    onClick={() => onShowDetails(task.id)} 
                    className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                    aria-label={`View details for ${task.name}`}
                >
                    <EyeIcon className="w-5 h-5" />
                </button>
              );
          default:
              return null;
      }
  };
  
  const isColumnEditable = (columnId: ColumnId) => ['name', 'status', 'dates'].includes(columnId);

  return (
    <Fragment>
      <tr className={`group ${isSelected ? 'bg-indigo-50 hover:bg-indigo-100' : 'hover:bg-gray-50'}`}>
        <SelectionCell 
            task={task} 
            isSelected={isSelected} 
            onToggleRow={onToggleRow}
            rowNum={rowNum}
            isScrolled={isScrolled}
            rowHeightClass={rowHeightClass}
        />
        {columns.map((col, index) => {
            const isLastColumn = index === columns.length - 1;
            const isEditing = editingCell?.taskId === task.id && editingCell?.column === col.id;
            const isEditable = isColumnEditable(col.id);
            
            let cellClasses = `${rowHeightClass} p-0`;
            if (isEditable) cellClasses += ' cursor-pointer';

            cellClasses += ' border-b border-gray-200';
            if (showGridLines && !isLastColumn) {
              cellClasses += ' border-r border-gray-200';
            }
            
            if (isEditable) {
                if (isEditing) {
                    cellClasses = cellClasses.replace('border-b border-gray-200', 'border-b-transparent');
                    cellClasses += ' outline-blue-600 outline outline-2 -outline-offset-2 bg-white';
                } else {
                    cellClasses += ' hover:outline-blue-400 hover:outline hover:outline-1 hover:-outline-offset-1';
                }
            }

            let wrapperClass = "flex items-center h-full w-full group"; 
            if (col.id === 'details') {
                wrapperClass += " justify-center";
            } else {
                wrapperClass += " px-6";
            }
            
            return (
                 <td 
                    key={col.id}
                    className={cellClasses}
                    onClick={isEditable && !isEditing ? () => onEditCell({ taskId: task.id, column: col.id }) : undefined}
                >
                    <div className={wrapperClass}>
                      {getCellContent(col.id)}
                    </div>
                </td>
            )
        })}
        <td className="border-b border-gray-200"></td>
      </tr>
      {task.children && task.isExpanded && task.children?.map(child => (
        <TableRow 
            key={child.id} 
            task={child} 
            level={level + 1} 
            onToggle={onToggle} 
            rowNumberMap={rowNumberMap}
            selectedTaskIds={selectedTaskIds}
            onToggleRow={onToggleRow}
            editingCell={editingCell}
            onEditCell={onEditCell}
            onUpdateTask={onUpdateTask}
            columns={columns}
            isScrolled={isScrolled}
            displayDensity={displayDensity}
            showGridLines={showGridLines}
            onShowDetails={onShowDetails}
        />
      ))}
    </Fragment>
  );
};

export default TableRow;
