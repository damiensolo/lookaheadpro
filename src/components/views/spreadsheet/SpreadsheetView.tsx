
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangleIcon, ScissorsIcon, CopyIcon, TrashIcon, ClipboardIcon, FillColorIcon, BorderColorIcon, TextColorIcon, ActivityIcon, DatabaseIcon, CalculatorIcon, SettingsIcon } from '../../common/Icons';
import ViewControls from '../../layout/ViewControls';
import FieldsMenu from '../../layout/FieldsMenu';
import { Popover } from '../../common/ui/Popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../common/ui/Tooltip';
import ColorPicker from '../../common/ui/ColorPicker';

// --- Types & Data ---

interface BudgetLineItem {
  id: string;
  sNo: number;
  costCode: string;
  name: string;
  divisionCode: string;
  divisionName: string;
  type: 'Original Bid' | 'Upcoming CO';
  quantity: number | null;
  unit: string;
  effortHours: number | null;
  calcType: string;
  totalBudget: number;
  labor: number | null;
  equipment: number | null;
  subcontractor: number | null;
  material: number | null;
  others: number | null;
  hasWarning?: boolean;
}

const MOCK_BUDGET_DATA: BudgetLineItem[] = [
  { id: '1', sNo: 1, costCode: '01 89 00', name: 'Site Construction Performance Req...', divisionCode: '01', divisionName: 'General Requirements', type: 'Original Bid', quantity: 1000, unit: 'sq', effortHours: 36, calcType: 'AU', totalBudget: 115000.00, labor: 10000.00, equipment: 10000.00, subcontractor: 15000.00, material: 10000.00, others: 20000.00 },
  { id: '2', sNo: 2, costCode: '31 10 00', name: 'Site Clearing', divisionCode: '31', divisionName: 'Earthwork', type: 'Original Bid', quantity: 1000, unit: 'sq', effortHours: 120, calcType: 'AU', totalBudget: 107000.00, labor: 15000.00, equipment: 10000.00, subcontractor: 15000.00, material: 12000.00, others: 10000.00 },
  { id: '3', sNo: 3, costCode: '31 00 00', name: 'Earthwork', divisionCode: '31', divisionName: 'Earthwork', type: 'Original Bid', quantity: 800, unit: 'sq', effortHours: 35928, calcType: 'AU', totalBudget: 119000.00, labor: 15000.00, equipment: 10000.00, subcontractor: 12000.00, material: 10000.00, others: 12000.00 },
  { id: '4', sNo: 4, costCode: '04 00 00', name: 'Masonry', divisionCode: '04', divisionName: 'Masonry', type: 'Original Bid', quantity: 800, unit: 'sq', effortHours: 435, calcType: 'AU', totalBudget: 115000.00, labor: 20000.00, equipment: 10000.00, subcontractor: 10000.00, material: 18000.00, others: 20000.00 },
  { id: '5', sNo: 5, costCode: '26 00 00', name: 'Electrical', divisionCode: '26', divisionName: 'Electrical', type: 'Original Bid', quantity: 1000, unit: 'l', effortHours: 470, calcType: 'AU', totalBudget: 100000.00, labor: 10000.00, equipment: 12000.00, subcontractor: 15000.00, material: 10000.00, others: 15000.00 },
  { id: '6', sNo: 6, costCode: '3060', name: 'Windows and Doors', divisionCode: '30', divisionName: 'Windows and Doors', type: 'Original Bid', quantity: 1200, unit: 'Nos', effortHours: 680, calcType: 'AU', totalBudget: 127000.00, labor: 13000.00, equipment: 12000.00, subcontractor: 10000.00, material: 15000.00, others: 12000.00 },
  { id: '7', sNo: 7, costCode: '22 00 00', name: 'Plumbing', divisionCode: '22', divisionName: 'Plumbing', type: 'Original Bid', quantity: 700, unit: 'Nos', effortHours: 387, calcType: 'AU', totalBudget: 114000.00, labor: 15000.00, equipment: 10000.00, subcontractor: 12000.00, material: 20000.00, others: 22000.00 },
  { id: '8', sNo: 8, costCode: '23 00 00', name: 'Heating, Ventilating, and Air Con...', divisionCode: '23', divisionName: 'Heating, Ventilating, An...', type: 'Original Bid', quantity: 1000, unit: 'Tons', effortHours: 616, calcType: 'AU', totalBudget: 111000.00, labor: 10000.00, equipment: 12000.00, subcontractor: 15000.00, material: 17000.00, others: 15000.00 },
  { id: '9', sNo: 9, costCode: '5010', name: 'Interior Finishes', divisionCode: '50', divisionName: 'Interior Finishes', type: 'Original Bid', quantity: 600, unit: 'Nos', effortHours: 780, calcType: 'AU', totalBudget: 113000.00, labor: 15000.00, equipment: 10000.00, subcontractor: 12000.00, material: 14000.00, others: 20000.00 },
  { id: '10', sNo: 10, costCode: '10 70 00', name: 'Exterior Specialties', divisionCode: '10', divisionName: 'Specialties', type: 'Original Bid', quantity: 500, unit: 'Nos', effortHours: 380, calcType: 'AU', totalBudget: 123000.00, labor: 13000.00, equipment: 15000.00, subcontractor: 20000.00, material: 16000.00, others: 4000.00 },
  { id: '11', sNo: 11, costCode: '48 70 00', name: 'Electrical Power Generation Testi...', divisionCode: '48', divisionName: 'Electrical Power Gener...', type: 'Original Bid', quantity: 400, unit: 'Nos', effortHours: 30, calcType: 'AU', totalBudget: 98000.00, labor: 12000.00, equipment: 11000.00, subcontractor: 10000.00, material: 14000.00, others: 15000.00 },
  { id: '12', sNo: 12, costCode: '23 05 93', name: 'Testing, Adjusting, and Balancing ...', divisionCode: '23', divisionName: 'Heating, Ventilating, An...', type: 'Original Bid', quantity: 300, unit: 'Tons', effortHours: 80, calcType: 'AU', totalBudget: 82000.00, labor: 10000.00, equipment: 15000.00, subcontractor: 10000.00, material: 7000.00, others: 5000.00 },
  { id: '13', sNo: 13, costCode: '22 08 00', name: 'Commissioning of Plumbing', divisionCode: '22', divisionName: 'Plumbing', type: 'Original Bid', quantity: 400, unit: 'Nos', effortHours: 50, calcType: 'AU', totalBudget: 70000.00, labor: 10000.00, equipment: 5000.00, subcontractor: 5000.00, material: 10000.00, others: 15000.00 },
  { id: '14', sNo: 14, costCode: '', name: 'Concrete 1', divisionCode: '', divisionName: '', type: 'Upcoming CO', quantity: null, unit: '', effortHours: null, calcType: '', totalBudget: 4740.00, labor: null, equipment: null, subcontractor: null, material: null, others: null, hasWarning: true },
];

interface ColumnState {
    id: string;
    label: string;
    width: number;
    align?: 'left' | 'right';
    isTotal?: boolean;
}

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


const SpreadsheetView: React.FC = () => {
  const [columns, setColumns] = useState<ColumnState[]>([
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
  ]);

  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [focusedCell, setFocusedCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const toolbarCheckboxRef = useRef<HTMLInputElement>(null);
  const [resizingColumnId, setResizingColumnId] = useState<string | null>(null);
  const activeResizerId = useRef<string | null>(null);

  const isAllSelected = selectedRowIds.size === MOCK_BUDGET_DATA.length;
  const isSomeSelected = selectedRowIds.size > 0 && selectedRowIds.size < MOCK_BUDGET_DATA.length;

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
        setSelectedRowIds(new Set(MOCK_BUDGET_DATA.map(item => item.id)));
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

  const handleResize = useCallback((columnId: string, newWidth: number) => {
    setColumns(prev => prev.map(c => c.id === columnId ? { ...c, width: Math.max(newWidth, 60) } : c));
  }, []);

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

  const totals = useMemo(() => {
    return MOCK_BUDGET_DATA.reduce((acc, item) => ({
      effortHours: acc.effortHours + (item.effortHours || 0),
      totalBudget: acc.totalBudget + (item.totalBudget || 0),
      labor: acc.labor + (item.labor || 0),
      equipment: acc.equipment + (item.equipment || 0),
      subcontractor: acc.subcontractor + (item.subcontractor || 0),
      material: acc.material + (item.material || 0),
      others: acc.others + (item.others || 0),
    }), { effortHours: 0, totalBudget: 0, labor: 0, equipment: 0, subcontractor: 0, material: 0, others: 0 });
  }, []);

  const hasRowSelection = selectedRowIds.size > 0;

  return (
    <div className="flex flex-col h-full p-4">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden relative flex flex-col flex-grow">
            
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
                                        onColorSelect={() => {}} 
                                        presets={BACKGROUND_COLORS}
                                    />
                                    <ColorPicker 
                                        icon={<BorderColorIcon className="w-5 h-5" />} 
                                        label="Border" 
                                        onColorSelect={() => {}} 
                                        presets={TEXT_BORDER_COLORS}
                                    />
                                    <ColorPicker 
                                        icon={<TextColorIcon className="w-5 h-5" />} 
                                        label="Text" 
                                        onColorSelect={() => {}} 
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
              {MOCK_BUDGET_DATA.map((row) => {
                const isSelected = selectedRowIds.has(row.id);
                const isRowFocused = focusedCell?.rowId === row.id;

                return (
                  <tr 
                    key={row.id} 
                    className={`h-7 group ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    {/* Row Number Cell */}
                    <td 
                      onClick={(e) => handleRowHeaderClick(row.id, e.metaKey || e.ctrlKey)}
                      className={`sticky left-0 z-20 border-b border-r border-gray-200 text-center cursor-pointer transition-colors p-0
                        ${isSelected ? 'bg-blue-600 text-white' : isRowFocused ? 'bg-blue-100 text-blue-800 font-semibold' : 'bg-white text-gray-500 group-hover:bg-gray-50'}
                        ${isScrolled ? 'shadow-[2px_0_5px_rgba(0,0,0,0.05)]' : ''}
                      `}
                    >
                      <div className="flex items-center justify-center h-full text-[10px]">
                        {row.sNo}
                      </div>
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
                                className={`border-b border-r border-gray-200 px-2 text-gray-600 relative cursor-cell 
                                    ${col.align === 'right' ? 'text-right' : 'text-left'}
                                    ${col.id === 'name' || col.id === 'totalBudget' ? 'font-medium text-gray-900' : ''}
                                `}
                            >
                                <div className="truncate w-full" title={typeof content === 'string' ? content : undefined}>
                                    {content}
                                </div>
                                {isCellFocused && (
                                    <div className="absolute inset-0 border-2 border-blue-600 z-10 pointer-events-none"></div>
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
