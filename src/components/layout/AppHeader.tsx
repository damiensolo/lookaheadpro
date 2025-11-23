
import React from 'react';
import { useProject } from '../../context/ProjectContext';
import { PlusIcon, DownloadIcon } from '../common/Icons';

const AppHeader: React.FC = () => {
    return (
        <header className="flex-shrink-0 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-900">Project Plan</h1>
                </div>
                
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm transition-colors">
                        <DownloadIcon className="w-4 h-4" />
                        <span>Download</span>
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-zinc-800 rounded-md hover:bg-zinc-700 shadow-sm transition-colors">
                        <PlusIcon className="w-4 h-4" />
                        <span>Create</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default AppHeader;
