import React from 'react';
import { useProject } from '../../context/ProjectContext';
import TableView from '../views/table/TableView';
import BoardView from '../views/board/BoardView';
import GanttView from '../views/gantt/GanttView';
import LookaheadView from '../views/lookahead/LookaheadView';

const MainContent: React.FC<{ isScrolled: boolean }> = ({ isScrolled }) => {
    const { activeViewMode } = useProject();

    switch(activeViewMode) {
      case 'table':
        return <TableView isScrolled={isScrolled} />;
      case 'board':
        return <BoardView />;
      case 'gantt':
        return <GanttView />;
      case 'lookahead':
        return <LookaheadView />;
      default:
        return null;
    }
};

export default MainContent;