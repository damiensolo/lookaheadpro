import React from 'react';
import { SpreadsheetColumn } from '../../../../types';
import { Resizer } from '../../../common/ui/Resizer';

interface SpreadsheetHeaderProps {
    columns: SpreadsheetColumn[];
    focusedCell: { rowId: string; colId: string } | null;
    resizingColumnId: string | null;
    isScrolled: boolean;
    fontSize: number;
    onMouseDown: (columnId: string) => (e: React.MouseEvent) => void;
    onContextMenu: (e: React.MouseEvent, columnId: string) => void;
}

const SpreadsheetHeader: React.FC<SpreadsheetHeaderProps> = ({
    columns,
    focusedCell,
    resizingColumnId,
    isScrolled,
    fontSize,
    onMouseDown,
    onContextMenu
}) => {
    return (
        <thead className="bg-gray-50 text-gray-700 font-semibold sticky top-0 z-30">
            <tr className="h-8">
                {/* Sticky Row Number Header */}
                <th className={`sticky left-0 z-40 w-14 border-b border-r border-gray-200 px-1 text-center transition-shadow ${isScrolled ? 'shadow-[2px_0_5px_rgba(0,0,0,0.05)]' : ''} bg-gray-50`}>
                    <div className="flex items-center justify-center h-full w-full text-gray-500 font-semibold" style={{ fontSize }}>
                        #
                    </div>
                </th>
                {columns.map(col => (
                    <th 
                        key={col.id} 
                        className={`border-b border-r border-gray-200 px-2 whitespace-nowrap uppercase font-semibold relative group ${col.align === 'right' ? 'text-right' : 'text-left'} 
                            ${focusedCell?.colId === col.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-50 text-gray-700'}`}
                        style={{ width: col.width, fontSize }}
                        onContextMenu={(e) => onContextMenu(e, col.id)}
                    >
                        <div className="flex items-center h-full w-full overflow-hidden">
                            {col.align === 'right' ? <span className="w-full truncate">{col.label}</span> : <span className="truncate">{col.label}</span>}
                        </div>
                        <Resizer onMouseDown={onMouseDown(col.id)} isActive={resizingColumnId === col.id} />
                    </th>
                ))}
            </tr>
        </thead>
    );
};

export default SpreadsheetHeader;