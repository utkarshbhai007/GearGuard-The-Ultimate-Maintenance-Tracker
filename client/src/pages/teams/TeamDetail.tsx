import React from 'react';
import { useParams } from 'react-router-dom';

const TeamDetail: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Detail</h1>
        <p className="mt-1 text-sm text-gray-500">
          Team ID: {id}
        </p>
      </div>

      <div className="card">
        <div className="card-body">
          <p className="text-gray-500">Team details will be implemented here.</p>
        </div>
      </div>
    </div>
  );
};

export default TeamDetail;