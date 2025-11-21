import React from 'react';
import { useProject } from '../../context/ProjectContext';
import FieldsMenu from './FieldsMenu';
import { SettingsIcon, PlusIcon } from '../common/Icons';

const AppHeader: React.FC = () => {
    const { 
        showFieldsMenu, setShowFieldsMenu
    } = useProject();

    return (
        <header className="flex-shrink-0 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-900 pl-2">Project Plan</h1>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <button 
                            onClick={() => setShowFieldsMenu(p => !p)} 
                            className="p-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            aria-label="View settings"
                        >
                            <SettingsIcon className="w-4 h-4" />
                        </button>
                        {showFieldsMenu && <FieldsMenu 
                            onClose={() => setShowFieldsMenu(false)} 
                        />}
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-zinc-800 rounded-md hover:bg-zinc-700">
                        <PlusIcon className="w-4 h-4" />
                        <span>New Task</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default AppHeader;