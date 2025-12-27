import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TeamsList from './TeamsList';
import TeamDetail from './TeamDetail';

const TeamsPage: React.FC = () => {
  return (
    <Routes>
      <Route index element={<TeamsList />} />
      <Route path=":id" element={<TeamDetail />} />
    </Routes>
  );
};

export default TeamsPage;