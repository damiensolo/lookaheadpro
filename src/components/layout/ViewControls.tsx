import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { View } from '../../types';
import { PlusIcon, MoreHorizontalIcon, TableIcon, BoardIcon, GanttIcon, LookaheadIcon } from '../common/Icons';

export type ViewMode = 'table' | 'board' | 'gantt' | 'lookahead';

const modes: { id: ViewMode; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { id: 'table', label: 'Table', icon: TableIcon },
  { id: 'board', label: 'Board', icon: BoardIcon },
  { id: 'gantt', label: 'Gantt', icon: GanttIcon },
  { id: 'lookahead', label: 'Lookahead', icon: LookaheadIcon },
];

const TabMenu: React.FC<{ view: View, isDefault: boolean, onRename: () => void, onDelete: () => void, onSetDefault: () => void, canDelete: boolean }> = 
({ view, isDefault, onRename, onDelete, onSetDefault, canDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const MENU_WIDTH = 160; // w-40 is 10rem = 160px
      let left = rect.left;
      
      // Align right if it goes off screen
      if (left + MENU_WIDTH > window.innerWidth) {
        left = rect.right - MENU_WIDTH;
      }
      
      setCoords({
        top: rect.bottom + 4,
        left: left
      });
    }
  }, [isOpen]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current && !buttonRef.current.contains(event.target as Node) &&
        menuRef.current && !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    
    const handleScroll = () => { if(isOpen) setIsOpen(false); };

    if(isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleScroll);
    }
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen]);


  return (
    <>
      <button 
        ref={buttonRef}
        onClick={(e) => { e.stopPropagation(); setIsOpen(prev => !prev); }} 
        className="p-1 rounded-md hover:bg-gray-200 focus:outline-none"
      >
        <MoreHorizontalIcon className="w-4 h-4 text-gray-500" />
      </button>
      {isOpen && createPortal(
        <div 
            ref={menuRef}
            className="fixed w-40 bg-white rounded-md shadow-lg border border-gray-200 z-[9999]"
            style={{ top: coords.top, left: coords.left }}
            onClick={(e) => e.stopPropagation()}
        >
          <ul className="py-1">
            <li className="px-1">
                <button 
                    onClick={() => { if(!isDefault) onSetDefault(); setIsOpen(false); }} 
                    disabled={isDefault}
                    className={`w-full text-left px-2 py-1.5 text-sm rounded-md flex items-center ${isDefault ? 'text-gray-400 cursor-default' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                    {isDefault ? 'Default view' : 'Set as default'}
                </button>
            </li>
            <li className="px-1">
                <button onClick={() => { onRename(); setIsOpen(false); }} className="w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                    Rename
                </button>
            </li>
            {canDelete && (
                <li className="px-1">
                    <button onClick={() => { onDelete(); setIsOpen(false); }} className="w-full text-left px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md">
                        Delete
                    </button>
                </li>
            )}
          </ul>
        </div>,
        document.body
      )}
    </>
  );
};

interface ViewControlsProps {
  views: View[];
  activeViewId: string;
  defaultViewId: string | null;
  onSelectView: (id: string) => void;
  onCreateView: () => void;
  onRenameView: (view: View) => void;
  onDeleteView: (id: string) => void;
  onSetDefaultView: (id: string) => void;
  onReorderViews: (views: View[]) => void;
  activeMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

const ViewControls: React.FC<ViewControlsProps> = ({
  views, activeViewId, defaultViewId, onSelectView, onCreateView, onRenameView, onDeleteView, onSetDefaultView, onReorderViews,
  activeMode, onModeChange
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDropIndex(index);
  };
  
  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newViews = [...views];
    const [draggedItem] = newViews.splice(draggedIndex, 1);
    newViews.splice(index, 0, draggedItem);
    onReorderViews(newViews);
    
    setDraggedIndex(null);
    setDropIndex(null);
  };

  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-1">
      <nav className="flex items-center gap-1" onDragLeave={() => setDropIndex(null)}>
        {views.map((view, index) => {
          const isActive = view.id === activeViewId;
          const isDropTarget = dropIndex === index;
          const isBeingDragged = draggedIndex === index;

          return (
            <div
              key={view.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={() => { setDraggedIndex(null); setDropIndex(null); }}
              className={`flex items-center rounded-md transition-all duration-150 ${ isBeingDragged ? 'opacity-50' : '' } ${ isDropTarget ? 'bg-gray-300' : '' } ${ isActive ? 'bg-white shadow-sm border border-gray-200' : 'hover:bg-gray-200'}`}
            >
              <button
                onClick={() => onSelectView(view.id)}
                className={`px-3 py-1.5 text-sm font-medium text-gray-800 rounded-l-md`}
              >
                {view.name}
              </button>
              <div className="pr-1">
                 <TabMenu 
                  view={view}
                  isDefault={view.id === defaultViewId}
                  onRename={() => onRenameView(view)}
                  onDelete={() => onDeleteView(view.id)}
                  onSetDefault={() => onSetDefaultView(view.id)}
                  canDelete={views.length > 1}
                 />
              </div>
            </div>
          );
        })}
      </nav>
      <button onClick={onCreateView} className="ml-1 p-1.5 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-800">
        <PlusIcon className="w-4 h-4" />
      </button>

      <div className="h-6 w-px bg-gray-300 mx-2"></div>

      <div className="flex items-center">
        {modes.map(({ id, label, icon: Icon }) => {
          const isActive = activeMode === id;
          return (
            <button
              key={id}
              title={label}
              onClick={() => onModeChange(id)}
              className={`p-2 text-sm font-medium rounded-md transition-colors ${
                isActive ? 'bg-white shadow-sm border border-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
              }`}
              aria-label={`Switch to ${label} view`}
              aria-pressed={isActive}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ViewControls;