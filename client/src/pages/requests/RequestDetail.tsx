import React from 'react';
import { useParams } from 'react-router-dom';

const RequestDetail: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Request Detail</h1>
        <p className="mt-1 text-sm text-gray-500">
          Request ID: {id}
        </p>
      </div>

      <div className="card">
        <div className="card-body">
          <p className="text-gray-500">Request details will be implemented here.</p>
        </div>
      </div>
    </div>
  );
};

export default RequestDetail;