

import React from 'react';
import { useProject } from '../../context/ProjectContext';
import TableView from '../views/table/TableView';
import BoardView from '../views/board/BoardView';
import GanttView from '../views/gantt/GanttView';
import LookaheadView from '../views/lookahead/LookaheadView';
import SpreadsheetView from '../views/spreadsheet/SpreadsheetView';

const MainContent: React.FC<{ isScrolled: boolean }> = ({ isScrolled }) => {
    const { activeViewMode, activeView } = useProject();

    const renderView = () => {
        // Using activeView.id as a key forces a complete remount of the component
        // whenever the view ID changes. This is the definitive fix to ensure that when switching
        // to a "Default View" (which generates a new transient ID), all internal state and
        // DOM elements for that view are completely reset.
        switch(activeViewMode) {
          case 'table':
            return <TableView key={activeView.id} isScrolled={isScrolled} />;
          case 'spreadsheet':
            return <SpreadsheetView key={activeView.id} />;
          case 'board':
            return <BoardView key={activeView.id} />;
          case 'gantt':
            return <GanttView key={activeView.id} />;
          case 'lookahead':
            return <LookaheadView key={activeView.id} />;
          default:
            return null;
        }
    }

    // Return the view directly without a scrolling wrapper.
    // The parent <main> element in AppLayout now handles all scrolling.
    return <>{renderView()}</>;
};

export default MainContent;
