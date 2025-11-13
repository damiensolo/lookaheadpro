import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Column, ColumnId, DisplayDensity } from '../../../types';
import TableRow from './TableRow';
import { ArrowDownIcon, ArrowUpIcon, SortIcon } from '../../common/Icons';
import { useProject } from '../../../context/ProjectContext';
import { useProjectData } from '../../../hooks/useProjectData';

interface TableViewProps {
  isScrolled: boolean;
}

const Resizer: React.FC<{ onMouseDown: (e: React.MouseEvent) => void }> = ({ onMouseDown }) => (
  <div
    onMouseDown={onMouseDown}
    className="absolute top-0 right-0 h-full w-2 cursor-col-resize hover:bg-blue-400 group-hover:bg-blue-400"
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


const TableView: React.FC<TableViewProps> = ({ isScrolled }) => {
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
    setColumns
  } = useProject();
  const { sortedTasks, visibleTaskIds, rowNumberMap } = useProjectData(tasks, activeView, searchTerm);

  const { columns, displayDensity, showGridLines, sort: sortConfig } = activeView;

  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLTableRowElement>(null);
  const activeResizerId = useRef<ColumnId | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{ id: ColumnId; position: 'left' | 'right' } | null>(null);

  const numVisible = visibleTaskIds.length;
  const numSelected = visibleTaskIds.filter(id => selectedTaskIds.has(id)).length;

  const isAllSelected = numVisible > 0 && numSelected === numVisible;
  const isSomeSelected = numSelected > 0 && numSelected < numVisible;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isSomeSelected;
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

  const handleResize = useCallback((columnId: ColumnId, newWidth: number) => {
    setColumns(prev => prev.map(c => c.id === columnId ? { ...c, width: `${newWidth}px` } : c));
  }, [setColumns]);

  const onMouseDown = (columnId: ColumnId, minWidth: number | undefined) => (e: React.MouseEvent) => {
    e.preventDefault();
    activeResizerId.current = columnId;
    
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

  return (
    <table className="w-full table-fixed text-sm text-left text-gray-500 whitespace-nowrap border-collapse">
      <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-20">
        <tr ref={headerRef}>
          <th scope="col" className={`sticky left-0 bg-gray-50 z-30 ${headerHeightClass} px-2 w-14 border-b border-gray-200 border-r border-gray-200 transition-shadow duration-200 ${isScrolled ? 'shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)]' : ''}`}>
            <div className="flex items-center justify-center h-full">
              <input
                type="checkbox"
                ref={headerCheckboxRef}
                checked={isAllSelected}
                onChange={handleToggleAll}
                aria-label="Select all visible rows"
                aria-checked={isSomeSelected ? 'mixed' : (isAllSelected ? 'true' : 'false')}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
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
                <div className={`flex items-center gap-1 ${col.id === 'details' ? 'justify-center' : ''}`}>
                  {col.label}
                  {sortConfig?.columnId === col.id ? (
                    sortConfig.direction === 'asc' ? 
                      <ArrowUpIcon className="w-4 h-4 text-gray-600" /> : 
                      <ArrowDownIcon className="w-4 h-4 text-gray-600" />
                  ) : (
                    col.id !== 'details' && <SortIcon className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
                <Resizer onMouseDown={onMouseDown(col.id, col.minWidth)} />
              </th>
            );
          })}
          <th scope="col" className={`${headerHeightClass} border-b border-gray-200 w-full`}></th>
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
  );
};

export default TableView;