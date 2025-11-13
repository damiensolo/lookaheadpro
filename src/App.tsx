import React from 'react';
import { ProjectProvider } from './context/ProjectContext';
import AppLayout from './components/layout/AppLayout';

const App: React.FC = () => {
  return (
    <ProjectProvider>
      <AppLayout />
    </ProjectProvider>
  );
};

export default App;