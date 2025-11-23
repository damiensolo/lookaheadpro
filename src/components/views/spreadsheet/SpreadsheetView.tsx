
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { BudgetLineItemStyle, SpreadsheetColumn } from '../../../types';
import { MOCK_BUDGET_DATA } from '../../../data';
import { useProject } from '../../../context/ProjectContext';
import SpreadsheetToolbar from './components/SpreadsheetToolbar';
import SpreadsheetHeader from './components/SpreadsheetHeader';
import SpreadsheetRow from './components/SpreadsheetRow';

// --- Constants ---

const formatCurrency = (amount: number | null) => {
  if (amount === null) return '';
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

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
      const newSet = multiSelect ? new Set(prev) : new Set<string>();
      if (prev.has(id) && multiSelect) {
        newSet.delete(id);
      } else if (!multiSelect) {
        if (prev.has(id) && prev.size === 1) {
            return new Set<string>();
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

  return (
    <div className="flex flex-col h-full p-4 outline-none focus:outline-none" onKeyDown={handleKeyDown} tabIndex={0}>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden relative flex flex-col flex-grow focus:outline-none">
            
            <SpreadsheetToolbar
                isAllSelected={isAllSelected}
                handleToggleAll={handleToggleAll}
                toolbarCheckboxRef={toolbarCheckboxRef}
                hasRowSelection={selectedRowIds.size > 0}
                selectedCount={selectedRowIds.size}
                onStyleUpdate={handleBulkStyleUpdate}
            />
      
            <div className="flex-grow overflow-auto relative select-none" ref={scrollContainerRef}>
            <table 
                className="border-collapse min-w-max table-fixed"
                style={{ fontSize: activeView.fontSize }}
            >
                <SpreadsheetHeader
                    columns={columns}
                    focusedCell={focusedCell}
                    resizingColumnId={resizingColumnId}
                    isScrolled={isScrolled}
                    fontSize={activeView.fontSize}
                    onMouseDown={onMouseDown}
                />
                
                <tbody>
                {budgetData.map((row) => (
                    <SpreadsheetRow
                        key={row.id}
                        row={row}
                        columns={columns}
                        isSelected={selectedRowIds.has(row.id)}
                        focusedCell={focusedCell}
                        isScrolled={isScrolled}
                        fontSize={activeView.fontSize}
                        onRowHeaderClick={handleRowHeaderClick}
                        onCellClick={handleCellClick}
                    />
                ))}
                </tbody>
                
                {/* Summary Footer */}
                <tfoot className="bg-gray-100 text-gray-900 border-t-2 border-gray-300 sticky bottom-0 z-30 font-semibold shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <tr className="h-8">
                        <td className={`sticky left-0 z-40 border-r border-gray-300 p-0 text-center bg-gray-100 ${isScrolled ? 'shadow-[2px_0_5px_rgba(0,0,0,0.1)]' : ''}`}>
                            <div className="flex items-center justify-center h-full" style={{ fontSize: activeView.fontSize }}>Total</div>
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
