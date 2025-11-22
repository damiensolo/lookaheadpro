
import React, { useState } from 'react';
import { Popover } from './Popover';
import { ChevronDownIcon } from '../Icons';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './Tooltip';

interface ColorPickerProps {
  icon: React.ReactNode;
  label: string;
  onColorSelect: (color: string | undefined) => void;
  presets?: string[];
}

const DEFAULT_PRESET_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef',
    '#f43f5e', '#64748b', '#94a3b8', '#000000'
];

const ColorPicker: React.FC<ColorPickerProps> = ({ icon, label, onColorSelect, presets = DEFAULT_PRESET_COLORS }) => {
    const [open, setOpen] = useState(false);
    const [customColor, setCustomColor] = useState('#000000');

    const handleSelect = (color: string | undefined) => {
        onColorSelect(color);
        setOpen(false);
    };

    return (
        <Popover
            open={open}
            onOpenChange={setOpen}
            trigger={
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <button 
                                className="flex items-center gap-1 p-2.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-all shadow-sm border border-transparent hover:border-gray-200 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {icon}
                                <ChevronDownIcon className="w-3 h-3 text-gray-400" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>{label}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            }
            content={
                <div className="p-3 w-52 bg-white rounded-lg shadow-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase">{label} Color</span>
                        <button 
                            onClick={() => handleSelect(undefined)} 
                            className="text-[10px] text-gray-500 hover:text-red-500 flex items-center gap-1 border border-gray-200 rounded px-1.5 py-0.5 hover:bg-gray-50 transition-colors"
                            title="Reset to default"
                        >
                            <span className="w-3 h-3 border border-gray-400 rounded-full relative overflow-hidden">
                                <span className="absolute top-1/2 left-1/2 w-full h-[1px] bg-red-500 -translate-x-1/2 -translate-y-1/2 rotate-45"></span>
                            </span>
                            None
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-2 mb-3">
                        {presets.map(color => (
                            <button
                                key={color}
                                onClick={() => handleSelect(color)}
                                className="w-5 h-5 rounded-full border border-gray-200 hover:scale-110 transition-transform shadow-sm ring-offset-1 hover:ring-2 hover:ring-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                    </div>

                    <div className="pt-2 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                            <input 
                                type="color" 
                                value={customColor}
                                onChange={(e) => setCustomColor(e.target.value)}
                                className="w-8 h-8 p-0 border-0 rounded cursor-pointer overflow-hidden shadow-sm"
                            />
                            <button
                                onClick={() => handleSelect(customColor)}
                                className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 px-2 rounded border border-gray-200 transition-colors font-medium"
                            >
                                Apply Custom
                            </button>
                        </div>
                    </div>
                </div>
            }
            align="start"
            className="z-50"
        />
    );
};

export default ColorPicker;
