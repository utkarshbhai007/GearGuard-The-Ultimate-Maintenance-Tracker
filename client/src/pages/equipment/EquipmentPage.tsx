import React from 'react';
import { Routes, Route } from 'react-router-dom';
import EquipmentList from './EquipmentList';
import EquipmentDetail from './EquipmentDetail';

const EquipmentPage: React.FC = () => {
  return (
    <Routes>
      <Route index element={<EquipmentList />} />
      <Route path=":id" element={<EquipmentDetail />} />
    </Routes>
  );
};

export default EquipmentPage;