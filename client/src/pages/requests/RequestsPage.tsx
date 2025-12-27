import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RequestsList from './RequestsList';
import RequestDetail from './RequestDetail';
import KanbanBoard from './KanbanBoard';

const RequestsPage: React.FC = () => {
  return (
    <Routes>
      <Route index element={<RequestsList />} />
      <Route path="kanban" element={<KanbanBoard />} />
      <Route path=":id" element={<RequestDetail />} />
    </Routes>
  );
};

export default RequestsPage;