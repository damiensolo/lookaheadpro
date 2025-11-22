
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ColumnId, DisplayDensity, TaskStyle, Task } from '../../../types';
import TableRow from './TableRow';
import { ArrowDownIcon, ArrowUpIcon, SortIcon, ScissorsIcon, CopyIcon, TrashIcon, FillColorIcon, BorderColorIcon, TextColorIcon, ClipboardIcon, SettingsIcon } from '../../common/Icons';
import { useProject } from '../../../context/ProjectContext';
import { useProjectData } from '../../../hooks/useProjectData';
import ViewControls from '../../layout/ViewControls';
import FieldsMenu from '../../layout/FieldsMenu';
import { Popover } from '../../common/ui/Popover';
import ColorPicker from '../../common/ui/ColorPicker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../common/ui/Tooltip';

interface TableViewProps {
  isScrolled: boolean;
  density?: DisplayDensity;
}

// Pastel colors for backgrounds to ensure readability of text
const BACKGROUND_COLORS = [
    '#fef2f2', // red-50
    '#fff7ed', // orange-50
    '#fffbeb', // amber-50
    '#f0fdf4', // green-50
    '#eff6ff', // blue-50
    '#eef2ff', // indigo-50
    '#faf5ff', // purple-50
    '#fdf2f8', // pink-50
    '#fafafa', // neutral-50
    '#ecfdf5', // emerald-50
    '#f0f9ff', // sky-50
    '#f5f3ff', // violet-50
    '#fff1f2', // rose-50
    '#fefce8', // yellow-50
];

// Saturated colors for text and borders
const TEXT_BORDER_COLORS = [
    '#000000', // Black
    '#4b5563', // gray-600
    '#dc2626', // red-600
    '#ea580c', // orange-600
    '#d97706', // amber-600
    '#16a34a', // green-600
    '#0d9488', // teal-600
    '#2563eb', // blue-600
    '#4f46e5', // indigo-600
    '#9333ea', // purple-600
    '#db2777', // pink-600
    '#e11d48', // rose-600
    '#2563eb', // blue-600
    '#0891b2', // cyan-600
];

const Resizer: React.FC<{ onMouseDown: (e: React.MouseEvent) => void; isActive: boolean }> = ({ onMouseDown, isActive }) => (
  <div
    onMouseDown={onMouseDown}
    className={`absolute top-0 right-0 h-full w-2 cursor-col-resize hover:bg-blue-400 group-hover:bg-blue-400 ${isActive ? 'bg-blue-400' : ''}`}
    style={{ zIndex: 10 }}
  />
);

const getHeaderHeight = (density: DisplayDensity) => {
  switch (density) {
    case 'compact': return 'h-9';
    case 'standard': return 'h-11';
    case 'comfortable': return 'h-14';
    default: return 'h-9';
  }
};

const TableView: React.FC<TableViewProps> = ({ isScrolled, density }) => {
  const { 
    tasks, 
    activeView, 
    searchTerm, 
    handleToggle, 
    selectedTaskIds,
    setSelectedTaskIds,
    editingCell,
    setEditingCell,
    handleUpdateTask,
    setDetailedTaskId,
    handleSort,
    setColumns,
  } = useProject();
  const { sortedTasks, visibleTaskIds, rowNumberMap } = useProjectData(tasks, activeView, searchTerm);

  const { columns, displayDensity: contextDensity, showGridLines, sort: sortConfig } = activeView;
  const displayDensity = density || contextDensity;

  const toolbarCheckboxRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLTableRowElement>(null);
  const activeResizerId = useRef<ColumnId | null>(null);
  const [resizingColumnId, setResizingColumnId] = useState<ColumnId | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{ id: ColumnId; position: 'left' | 'right' } | null>(null);

  const numVisible = visibleTaskIds.length;
  const numSelected = visibleTaskIds.filter(id => selectedTaskIds.has(id)).length;

  const isAllSelected = numVisible > 0 && numSelected === numVisible;
  const isSomeSelected = numSelected > 0 && numSelected < numVisible;

  useEffect(() => {
    if (toolbarCheckboxRef.current) {
      toolbarCheckboxRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);

  const handleToggleRow = (taskId: number) => {
    setSelectedTaskIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(taskId)) newSet.delete(taskId);
        else newSet.add(taskId);
        return newSet;
    });
  };

  const handleToggleAll = () => {
      if (isAllSelected) {
          setSelectedTaskIds(new Set());
      } else {
          setSelectedTaskIds(new Set(visibleTaskIds));
      }
  };

  const handleBulkStyleUpdate = (newStyle: Partial<TaskStyle>) => {
      const findTask = (taskList: Task[], id: number): Task | undefined => {
          for (const task of taskList) {
              if (task.id === id) return task;
              if (task.children) {
                  const found = findTask(task.children, id);
                  if (found) return found;
              }
          }
          return undefined;
      };

      selectedTaskIds.forEach(taskId => {
        // Recursively find the task to ensure we update sub-tasks correctly
        const task = findTask(tasks, taskId);
        if (task) {
            const updatedStyle = { ...task.style, ...newStyle };
            // Clean up undefined values
            if (newStyle.backgroundColor === undefined) delete updatedStyle.backgroundColor;
            if (newStyle.borderColor === undefined) delete updatedStyle.borderColor;
            if (newStyle.textColor === undefined) delete updatedStyle.textColor;

            handleUpdateTask(taskId, { style: updatedStyle });
        }
      });
  };

  const handleResize = useCallback((columnId: ColumnId, newWidth: number) => {
    setColumns(prev => prev.map(c => c.id === columnId ? { ...c, width: `${newWidth}px` } : c));
  }, [setColumns]);

  const onMouseDown = (columnId: ColumnId, minWidth: number | undefined) => (e: React.MouseEvent) => {
    e.preventDefault();
    activeResizerId.current = columnId;
    setResizingColumnId(columnId);
    
    const thElement = (e.target as HTMLElement).parentElement;
    if (!thElement) return;

    const startPos = e.clientX;
    const startWidth = thElement.offsetWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (activeResizerId.current !== columnId) return;
      const newWidth = startWidth + (moveEvent.clientX - startPos);
      if (newWidth > (minWidth ?? 60)) {
        handleResize(columnId, newWidth);
      }
    };

    const onMouseUp = () => {
      activeResizerId.current = null;
      setResizingColumnId(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.classList.remove('grabbing');
    };
    
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    document.body.classList.add('grabbing');
  };
  
  const handleDragStartHeader = (e: React.DragEvent, columnId: ColumnId) => {
    e.dataTransfer.setData('text/plain', columnId);
    e.dataTransfer.effectAllowed = 'move';

    const target = e.currentTarget as HTMLElement;
    const ghost = target.cloneNode(true) as HTMLElement;
    ghost.style.position = 'absolute';
    ghost.style.top = '-9999px';
    ghost.style.width = `${target.offsetWidth}px`;
    ghost.style.height = `${target.offsetHeight}px`;
    ghost.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    ghost.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };
  
  const handleDragOverHeader = (e: React.DragEvent, columnId: ColumnId) => {
      e.preventDefault();
      const sourceColumnId = e.dataTransfer.types.includes('text/plain') ? e.dataTransfer.getData('text/plain') : null;
      if (sourceColumnId === columnId) {
          setDropIndicator(null);
          return;
      }

      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const isRightHalf = e.clientX > rect.left + rect.width / 2;
      setDropIndicator({ id: columnId, position: isRightHalf ? 'right' : 'left' });
  };
  
  const handleDropHeader = (e: React.DragEvent, targetColumnId: ColumnId) => {
      e.preventDefault();
      const sourceColumnId = e.dataTransfer.getData('text/plain') as ColumnId;
      setDropIndicator(null);

      if (sourceColumnId && sourceColumnId !== targetColumnId) {
          setColumns(prev => {
               const newCols = [...prev];
               const sIndex = newCols.findIndex(c => c.id === sourceColumnId);
               let tIndex = newCols.findIndex(c => c.id === targetColumnId);
               
               if(dropIndicator?.position === 'right') {
                   tIndex++;
               }
               if(sIndex < tIndex) {
                   tIndex--;
               }
               const [moved] = newCols.splice(sIndex, 1);
               newCols.splice(tIndex, 0, moved);
               return newCols;
          });
      }
  };

  const visibleColumns = columns.filter(c => c.visible);
  const headerHeightClass = getHeaderHeight(displayDensity);
  const hasSelection = selectedTaskIds.size > 0;

  return (
    <div className="flex flex-col h-full p-4">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden relative flex flex-col flex-grow">
            
            {/* Contextual Toolbar Row */}
            <div className="flex items-center h-14 border-b border-gray-200 bg-white flex-shrink-0 transition-all z-40 relative pr-4">
                 <div className="w-14 flex items-center justify-center flex-shrink-0 border-r border-gray-200">
                     <input 
                        type="checkbox" 
                        checked={isAllSelected} 
                        onChange={handleToggleAll} 
                        ref={toolbarCheckboxRef}
                        aria-label="Select all visible rows"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                     />
                 </div>

                 <div className="flex-1 pl-4 flex items-center">
                    <AnimatePresence mode="wait">
                    {hasSelection ? (
                        <motion.div 
                            key="actions"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center gap-4 flex-1"
                        >
                            <TooltipProvider>
                                <div className="flex items-center gap-1 p-1.5 rounded-lg">
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <button className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-all shadow-sm border border-transparent hover:border-gray-200 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                <ScissorsIcon className="w-5 h-5" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>Cut</TooltipContent>
                                    </Tooltip>
                                    
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <button className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-all shadow-sm border border-transparent hover:border-gray-200 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                <CopyIcon className="w-5 h-5" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>Copy</TooltipContent>
                                    </Tooltip>
                                    
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <button className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-all shadow-sm border border-transparent hover:border-gray-200 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                <ClipboardIcon className="w-5 h-5" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>Paste</TooltipContent>
                                    </Tooltip>
                                    
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <button className="p-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-all shadow-sm border border-transparent hover:border-red-200 hover:shadow focus:outline-none focus:ring-2 focus:ring-red-500">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>Delete</TooltipContent>
                                    </Tooltip>
                                    
                                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                                    
                                    <ColorPicker 
                                        icon={<FillColorIcon className="w-5 h-5" />} 
                                        label="Background" 
                                        onColorSelect={(color) => handleBulkStyleUpdate({ backgroundColor: color })} 
                                        presets={BACKGROUND_COLORS}
                                    />
                                    <ColorPicker 
                                        icon={<BorderColorIcon className="w-5 h-5" />} 
                                        label="Border" 
                                        onColorSelect={(color) => handleBulkStyleUpdate({ borderColor: color })} 
                                        presets={TEXT_BORDER_COLORS}
                                    />
                                    <ColorPicker 
                                        icon={<TextColorIcon className="w-5 h-5" />} 
                                        label="Text" 
                                        onColorSelect={(color) => handleBulkStyleUpdate({ textColor: color })} 
                                        presets={TEXT_BORDER_COLORS}
                                    />
                                </div>
                            </TooltipProvider>
                            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                {selectedTaskIds.size} selected
                            </span>
                        </motion.div>
                    ) : (
                         <motion.div
                            key="controls"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                         >
                            <ViewControls />
                         </motion.div>
                    )}
                    </AnimatePresence>
                    
                    {!hasSelection && (
                        <div className="ml-auto pl-4 border-l border-gray-200 h-6 flex items-center">
                             <Popover
                                trigger={
                                    <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                                        <SettingsIcon className="w-4 h-4" />
                                    </button>
                                }
                                content={
                                    <FieldsMenu onClose={() => {}} disableClickOutside className="right-0 mt-2" />
                                }
                                align="end"
                             />
                        </div>
                    )}
                 </div>
            </div>

            <div className="overflow-x-auto flex-1">
                <table className="w-full table-fixed text-sm text-left text-gray-500 whitespace-nowrap border-collapse">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-20">
                    <tr ref={headerRef}>
                    <th scope="col" className={`sticky left-0 bg-gray-50 z-30 ${headerHeightClass} px-2 w-14 border-b border-gray-200 border-r border-gray-200 transition-shadow duration-200 ${isScrolled ? 'shadow-[2px_0_5px_rgba(0,0,0,0.05)]' : ''}`}>
                        <div className="flex items-center justify-center h-full text-xs font-semibold text-gray-500">
                            #
                        </div>
                    </th>
                    {visibleColumns.map((col, index) => {
                        const isLastVisibleColumn = index === visibleColumns.length - 1;
                        return (
                        <th 
                            key={col.id} 
                            scope="col" 
                            className={`${headerHeightClass} px-6 font-semibold border-b border-gray-200 relative group cursor-pointer align-middle ${showGridLines && !isLastVisibleColumn ? 'border-r border-gray-200' : ''}`}
                            style={{ width: col.width, zIndex: 5 }}
                            onClick={(e) => {
                            if (col.id === 'details') return;
                            if ((e.target as HTMLElement).closest('.absolute.top-0.right-0')) return;
                            handleSort(col.id);
                            }}
                            draggable
                            onDragStart={(e) => handleDragStartHeader(e, col.id)}
                            onDragOver={(e) => handleDragOverHeader(e, col.id)}
                            onDrop={(e) => handleDropHeader(e, col.id)}
                            onDragLeave={() => setDropIndicator(null)}
                        >
                            {dropIndicator?.id === col.id && (
                            <div className={`absolute top-0 h-full w-1 bg-blue-500 rounded-full ${dropIndicator.position === 'left' ? 'left-0' : 'right-0'}`} style={{ zIndex: 20 }} />
                            )}
                            <div className={`flex items-center gap-1 ${col.id === 'details' ? 'justify-center' : ''} overflow-hidden`}>
                            <span className="truncate">{col.label}</span>
                            {sortConfig?.columnId === col.id ? (
                                sortConfig.direction === 'asc' ? 
                                <ArrowUpIcon className="w-4 h-4 text-gray-600 flex-shrink-0" /> : 
                                <ArrowDownIcon className="w-4 h-4 text-gray-600 flex-shrink-0" />
                            ) : (
                                col.id !== 'details' && <SortIcon className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            )}
                            </div>
                            <Resizer onMouseDown={onMouseDown(col.id, col.minWidth)} isActive={resizingColumnId === col.id} />
                        </th>
                        );
                    })}
                    <th scope="col" className={`${headerHeightClass} border-b border-gray-200 w-full px-2`}></th>
                    </tr>
                </thead>
                <tbody>
                    {sortedTasks.map((task) => (
                    <TableRow 
                        key={task.id} 
                        task={task} 
                        level={0} 
                        columns={visibleColumns}
                        onToggle={handleToggle} 
                        rowNumberMap={rowNumberMap}
                        selectedTaskIds={selectedTaskIds}
                        onToggleRow={handleToggleRow}
                        editingCell={editingCell}
                        onEditCell={setEditingCell}
                        onUpdateTask={handleUpdateTask}
                        isScrolled={isScrolled}
                        displayDensity={displayDensity}
                        showGridLines={showGridLines}
                        onShowDetails={setDetailedTaskId}
                    />
                    ))}
                </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default TableView;
