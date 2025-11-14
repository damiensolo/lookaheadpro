import React from 'react';
import { useProject } from '../../context/ProjectContext';
import ViewControls from './ViewControls';
import FilterMenu from './FilterMenu';
import FieldsMenu from './FieldsMenu';
import { FilterIcon, SearchIcon, PlusIcon, SettingsIcon } from '../common/Icons';

const AppHeader: React.FC = () => {
    const { 
        activeViewMode, setActiveViewMode,
        views, activeViewId, defaultViewId, setActiveViewId, setModalState, handleDeleteView, setDefaultViewId, setViews,
        searchTerm, setSearchTerm,
        showFilterMenu, setShowFilterMenu, activeView,
        showFieldsMenu, setShowFieldsMenu
    } = useProject();

    return (
        <header className="flex-shrink-0 border-b border-gray-200">
            <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-900 pl-2">Project Plan</h1>
                    <ViewControls
                        views={views}
                        activeViewId={activeViewId}
                        defaultViewId={defaultViewId}
                        onSelectView={setActiveViewId}
                        onCreateView={() => setModalState({ type: 'create' })}
                        onRenameView={(view) => setModalState({ type: 'rename', view })}
                        onDeleteView={handleDeleteView}
                        onSetDefaultView={setDefaultViewId}
                        onReorderViews={setViews}
                        activeMode={activeViewMode}
                        onModeChange={setActiveViewMode}
                    />
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search tasks..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 w-48"
                        />
                    </div>
                    <div className="relative">
                        <button onClick={() => setShowFilterMenu(p => !p)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                            <FilterIcon className="w-4 h-4" />
                            <span>Filter</span>
                            {activeView.filters.length > 0 && <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-1.5 py-0.5 rounded-full">{activeView.filters.length}</span>}
                        </button>
                        {showFilterMenu && <FilterMenu onClose={() => setShowFilterMenu(false)} />}
                    </div>
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