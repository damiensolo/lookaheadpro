
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangleIcon, ScissorsIcon, CopyIcon, TrashIcon, ClipboardIcon, FillColorIcon, BorderColorIcon, TextColorIcon, ActivityIcon, DatabaseIcon, CalculatorIcon, SettingsIcon } from '../../common/Icons';
import ViewControls from '../../layout/ViewControls';
import FieldsMenu from '../../layout/FieldsMenu';
import { Popover } from '../../common/ui/Popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../common/ui/Tooltip';
import ColorPicker from '../../common/ui/ColorPicker';
import { BudgetLineItem, BudgetLineItemStyle, SpreadsheetColumn } from '../../../types';
import { MOCK_BUDGET_DATA } from '../../../data';
import { useProject } from '../../../context/ProjectContext';

// --- Constants ---

const formatCurrency = (amount: number | null) => {
  if (amount === null) return '';
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const Resizer: React.FC<{ onMouseDown: (e: React.MouseEvent) => void; isActive: boolean }> = ({ onMouseDown, isActive }) => (
  <div
    onMouseDown={onMouseDown}
    className={`absolute top-0 right-0 h-full w-2 cursor-col-resize hover:bg-blue-400 group-hover:bg-blue-400 ${isActive ? 'bg-blue-400' : ''}`}
    style={{ zIndex: 10 }}
  />
);

// Pastel colors for backgrounds
const BACKGROUND_COLORS = ['#fef2f2', '#fff7ed', '#fffbeb', '#f0fdf4', '#eff6ff', '#eef2ff', '#faf5ff', '#fdf2f8', '#fafafa', '#ecfdf5', '#f0f9ff', '#f5f3ff', '#fff1f2', '#fefce8'];
// Saturated colors for text/borders
const TEXT_BORDER_COLORS = ['#000000', '#4b5563', '#dc2626', '#ea580c', '#d97706', '#16a34a', '#0d9488', '#2563eb', '#4f46e5', '#9333ea', '#db2777', '#e11d48', '#0891b2'];

const DEFAULT_COLUMNS: SpreadsheetColumn[] = [
    { id: 'costCode', label: 'Cost Code', width: 120 },
    { id: 'name', label: 'Name', width: 250 },
    { id: 'divisionCode', label: 'Division Code', width: 130 },
    { id: 'divisionName', label: 'Division Name', width: 200 },
    { id: 'type', label: 'Type', width: 130 },
    { id: 'quantity', label: 'Quantity', width: 100, align: 'right' },
    { id: 'unit', label: 'Quantity Unit', width: 110 },
    { id: 'effortHours', label: 'Effort hours', width: 110, align: 'right', isTotal: true },
    { id: 'calcType', label: 'Type of Calculation', width: 160 },
    { id: 'totalBudget', label: 'Total Budget Amount', width: 160, align: 'right', isTotal: true },
    { id: 'labor', label: 'Labor', width: 130, align: 'right', isTotal: true },
    { id: 'equipment', label: 'Equipment', width: 130, align: 'right', isTotal: true },
    { id: 'subcontractor', label: 'Subcontractor', width: 130, align: 'right', isTotal: true },
    { id: 'material', label: 'Material', width: 130, align: 'right', isTotal: true },
    { id: 'others', label: 'Others', width: 130, align: 'right', isTotal: true },
];

const SpreadsheetView: React.FC = () => {
  const { activeView, updateView } = useProject();
  
  // Initialize state from view persistence or defaults
  const budgetData = useMemo(() => activeView.spreadsheetData || MOCK_BUDGET_DATA, [activeView.spreadsheetData]);
  const columns = useMemo(() => activeView.spreadsheetColumns || DEFAULT_COLUMNS, [activeView.spreadsheetColumns]);

  // Persist defaults if missing (on mount)
  useEffect(() => {
      if (!activeView.spreadsheetData || !activeView.spreadsheetColumns) {
          updateView({
              spreadsheetData: activeView.spreadsheetData || MOCK_BUDGET_DATA,
              spreadsheetColumns: activeView.spreadsheetColumns || DEFAULT_COLUMNS
          });
      }
  }, [activeView.spreadsheetData, activeView.spreadsheetColumns, updateView]);

  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [focusedCell, setFocusedCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const toolbarCheckboxRef = useRef<HTMLInputElement>(null);
  const [resizingColumnId, setResizingColumnId] = useState<string | null>(null);
  const activeResizerId = useRef<string | null>(null);

  const isAllSelected = selectedRowIds.size === budgetData.length;
  const isSomeSelected = selectedRowIds.size > 0 && selectedRowIds.size < budgetData.length;

  useEffect(() => {
    if (toolbarCheckboxRef.current) {
      toolbarCheckboxRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    const handleScroll = () => {
        if (container) {
            setIsScrolled(container.scrollLeft > 0);
        }
    };
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  const handleToggleAll = () => {
    if (isAllSelected) {
        setSelectedRowIds(new Set());
    } else {
        setSelectedRowIds(new Set(budgetData.map(item => item.id)));
    }
  };

  const handleRowHeaderClick = (id: string, multiSelect: boolean) => {
    // Clear focused cell when selecting a row via header
    setFocusedCell(null);
    setSelectedRowIds(prev => {
      const newSet = multiSelect ? new Set(prev) : new Set();
      if (prev.has(id) && multiSelect) {
        newSet.delete(id);
      } else if (!multiSelect) {
        if (prev.has(id) && prev.size === 1) {
            return new Set();
        }
        newSet.add(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleCellClick = (rowId: string, colId: string) => {
      setFocusedCell({ rowId, colId });
      // Clear row selection when focusing a cell
      setSelectedRowIds(new Set()); 
  };

  // Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!focusedCell) return;

      // Map IDs to indices
      const rowIndex = budgetData.findIndex(item => item.id === focusedCell.rowId);
      const colIndex = columns.findIndex(col => col.id === focusedCell.colId);

      if (rowIndex === -1 || colIndex === -1) return;

      let nextRowIndex = rowIndex;
      let nextColIndex = colIndex;

      switch (e.key) {
          case 'ArrowUp':
              nextRowIndex = Math.max(0, rowIndex - 1);
              e.preventDefault();
              break;
          case 'ArrowDown':
              nextRowIndex = Math.min(budgetData.length - 1, rowIndex + 1);
              e.preventDefault();
              break;
          case 'ArrowLeft':
              nextColIndex = Math.max(0, colIndex - 1);
              e.preventDefault();
              break;
          case 'ArrowRight':
              nextColIndex = Math.min(columns.length - 1, colIndex + 1);
              e.preventDefault();
              break;
          default:
              return;
      }

      if (nextRowIndex !== rowIndex || nextColIndex !== colIndex) {
          setFocusedCell({
              rowId: budgetData[nextRowIndex].id,
              colId: columns[nextColIndex].id
          });
      }
  };

  const handleResize = useCallback((columnId: string, newWidth: number) => {
    const updatedColumns = columns.map(c => c.id === columnId ? { ...c, width: Math.max(newWidth, 60) } : c);
    updateView({ spreadsheetColumns: updatedColumns });
  }, [columns, updateView]);

  const onMouseDown = (columnId: string) => (e: React.MouseEvent) => {
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
      handleResize(columnId, newWidth);
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

  const handleBulkStyleUpdate = (newStyle: Partial<BudgetLineItemStyle>) => {
    const updatedData = budgetData.map(item => {
        if (selectedRowIds.has(item.id)) {
            const currentStyle = item.style || {};
            const mergedStyle = { ...currentStyle, ...newStyle };
            
            // clean up undefined values to allow "unsetting"
            (Object.keys(newStyle) as (keyof BudgetLineItemStyle)[]).forEach(key => {
                if (newStyle[key] === undefined) {
                    delete mergedStyle[key];
                }
            });

            return { ...item, style: mergedStyle };
        }
        return item;
    });
    updateView({ spreadsheetData: updatedData });
  };

  const totals = useMemo(() => {
    return budgetData.reduce((acc, item) => ({
      effortHours: acc.effortHours + (item.effortHours || 0),
      totalBudget: acc.totalBudget + (item.totalBudget || 0),
      labor: acc.labor + (item.labor || 0),
      equipment: acc.equipment + (item.equipment || 0),
      subcontractor: acc.subcontractor + (item.subcontractor || 0),
      material: acc.material + (item.material || 0),
      others: acc.others + (item.others || 0),
    }), { effortHours: 0, totalBudget: 0, labor: 0, equipment: 0, subcontractor: 0, material: 0, others: 0 });
  }, [budgetData]);

  const hasRowSelection = selectedRowIds.size > 0;

  return (
    <div className="flex flex-col h-full p-4 outline-none focus:outline-none" onKeyDown={handleKeyDown} tabIndex={0}>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden relative flex flex-col flex-grow focus:outline-none">
            
            {/* Toolbar Row */}
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
                    {hasRowSelection ? (
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
                                {selectedRowIds.size} selected
                            </span>
                        </motion.div>
                    ) : (
                         <motion.div
                            key="controls"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center gap-4 w-full"
                         >
                            <ViewControls />
                            <div className="w-px h-6 bg-gray-300"></div>
                            
                            {/* Mini Actions */}
                            <div className="flex items-center gap-1">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                                                <ActivityIcon className="w-4 h-4" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>Toggle Critical Path</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                                                <CalculatorIcon className="w-4 h-4" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>Compute Critical Path</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                                                <DatabaseIcon className="w-4 h-4" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>Create Baseline</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>

                            {/* Settings Menu */}
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
                         </motion.div>
                    )}
                    </AnimatePresence>
                 </div>
            </div>
      
        <div className="flex-grow overflow-auto relative select-none" ref={scrollContainerRef}>
          <table className="border-collapse text-xs min-w-max table-fixed">
            <thead className="bg-gray-50 text-gray-700 font-semibold sticky top-0 z-30">
              <tr className="h-8">
                {/* Sticky Row Number Header */}
                <th className={`sticky left-0 z-40 w-14 border-b border-r border-gray-200 px-1 text-center transition-shadow ${isScrolled ? 'shadow-[2px_0_5px_rgba(0,0,0,0.05)]' : ''} bg-gray-50`}>
                  <div className="flex items-center justify-center h-full w-full text-xs text-gray-500 font-semibold">
                    #
                  </div>
                </th>
                {columns.map(col => (
                  <th 
                    key={col.id} 
                    className={`border-b border-r border-gray-200 px-2 whitespace-nowrap uppercase text-xs font-semibold relative group ${col.align === 'right' ? 'text-right' : 'text-left'} 
                        ${focusedCell?.colId === col.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-50 text-gray-700'}`}
                    style={{ width: col.width }}
                  >
                    <div className="flex items-center h-full w-full overflow-hidden">
                       {col.align === 'right' ? <span className="w-full truncate">{col.label}</span> : <span className="truncate">{col.label}</span>}
                    </div>
                    <Resizer onMouseDown={onMouseDown(col.id)} isActive={resizingColumnId === col.id} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {budgetData.map((row) => {
                const isSelected = selectedRowIds.has(row.id);
                const isRowFocused = focusedCell?.rowId === row.id;
                
                const customStyle = row.style || {};
                const customBorder = customStyle.borderColor;

                const rowStyle: React.CSSProperties = {};
                if (customStyle.backgroundColor) rowStyle.backgroundColor = customStyle.backgroundColor;
                if (customStyle.textColor) rowStyle.color = customStyle.textColor;

                let rowClasses = 'h-7 group';
                if (!customStyle.backgroundColor) {
                    rowClasses += isSelected ? ' bg-blue-50' : ' hover:bg-gray-50';
                }

                return (
                  <tr 
                    key={row.id} 
                    className={rowClasses}
                    style={rowStyle}
                  >
                    {/* Row Number Cell */}
                    <td 
                      onClick={(e) => handleRowHeaderClick(row.id, e.metaKey || e.ctrlKey)}
                      className={`sticky left-0 z-20 border-r border-gray-200 text-center cursor-pointer transition-colors p-0 relative
                        ${!customBorder ? 'border-b' : ''}
                        ${isSelected ? 'bg-blue-600 text-white' : isRowFocused ? 'bg-blue-100 text-blue-800 font-semibold' : 'bg-white text-gray-500 group-hover:bg-gray-50'}
                        ${isScrolled ? 'shadow-[2px_0_5px_rgba(0,0,0,0.05)]' : ''}
                      `}
                      style={{
                          backgroundColor: isSelected ? undefined : isRowFocused ? undefined : customStyle.backgroundColor,
                          color: isSelected ? undefined : isRowFocused ? undefined : customStyle.textColor,
                      }}
                    >
                      <div className="flex items-center justify-center h-full text-[10px] relative z-20">
                        {row.sNo}
                      </div>
                      {/* Absolute Custom Borders for Row Header */}
                      {customBorder && (
                        <>
                            <div className="absolute top-0 left-0 right-0 h-px z-10 pointer-events-none" style={{ backgroundColor: customBorder }} />
                            <div className="absolute bottom-0 left-0 right-0 h-px z-10 pointer-events-none" style={{ backgroundColor: customBorder }} />
                        </>
                      )}
                    </td>

                    {/* Data Cells */}
                    {columns.map(col => {
                        const isCellFocused = focusedCell?.rowId === row.id && focusedCell?.colId === col.id;
                        let content: React.ReactNode = (row as any)[col.id];
                        
                        // Formatting specific cells
                        if (col.id === 'costCode' && row.hasWarning) {
                            content = <div className="flex items-center justify-center w-full h-full"><AlertTriangleIcon className="w-3 h-3 text-orange-500" /></div>;
                        } else if (['totalBudget', 'labor', 'equipment', 'subcontractor', 'material', 'others'].includes(col.id)) {
                            content = formatCurrency(content as number);
                        }

                        return (
                            <td 
                                key={col.id}
                                onClick={() => handleCellClick(row.id, col.id)}
                                className={`border-r border-gray-200 px-2 text-gray-600 relative cursor-cell 
                                    ${!customBorder ? 'border-b' : ''}
                                    ${col.align === 'right' ? 'text-right' : 'text-left'}
                                    ${col.id === 'name' || col.id === 'totalBudget' ? 'font-medium text-gray-900' : ''}
                                `}
                            >
                                <div className="truncate w-full relative z-20" title={typeof content === 'string' ? content : undefined} style={{ color: customStyle.textColor }}>
                                    {content}
                                </div>
                                {isCellFocused && (
                                    <div className="absolute inset-0 border-2 border-blue-600 z-30 pointer-events-none"></div>
                                )}
                                {/* Absolute Custom Borders for Data Cells */}
                                {customBorder && (
                                    <>
                                        <div className="absolute top-0 left-0 right-0 h-px z-10 pointer-events-none" style={{ backgroundColor: customBorder }} />
                                        <div className="absolute bottom-0 left-0 right-0 h-px z-10 pointer-events-none" style={{ backgroundColor: customBorder }} />
                                    </>
                                )}
                            </td>
                        );
                    })}
                  </tr>
                );
              })}
            </tbody>
            
            {/* Summary Footer */}
            <tfoot className="bg-gray-100 text-gray-900 border-t-2 border-gray-300 sticky bottom-0 z-30 font-semibold shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <tr className="h-8">
                    <td className={`sticky left-0 z-40 border-r border-gray-300 p-0 text-center bg-gray-100 ${isScrolled ? 'shadow-[2px_0_5px_rgba(0,0,0,0.1)]' : ''}`}>
                        <div className="flex items-center justify-center h-full text-xs">Total</div>
                    </td>
                    {columns.map((col) => {
                        let value: React.ReactNode = '';
                        if (col.isTotal) {
                            const key = col.id as keyof typeof totals;
                            const totalVal = totals[key];
                            value = col.id === 'effortHours' ? totalVal : formatCurrency(totalVal);
                        }

                        return (
                            <td 
                                key={col.id} 
                                className={`border-r border-gray-300 px-2 whitespace-nowrap ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                            >
                                {value}
                            </td>
                        )
                    })}
                </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SpreadsheetView;
