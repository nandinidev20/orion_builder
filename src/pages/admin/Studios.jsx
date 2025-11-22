import React, { useState } from 'react';

const AdminStudios = () => {
  const [studios] = useState([
    { id: 1, name: 'Music Studio Pro', owner: 'John Doe', email: 'john@example.com', experiences: 5, status: 'Active', created: '2024-01-15' },
    { id: 2, name: 'Art Gallery VR', owner: 'Jane Smith', email: 'jane@example.com', experiences: 3, status: 'Active', created: '2024-02-20' },
    { id: 3, name: 'Historical Tours', owner: 'Robert Johnson', email: 'robert@example.com', experiences: 8, status: 'Active', created: '2024-03-10' },
    { id: 4, name: 'Wellness Retreats', owner: 'Emily Davis', email: 'emily@example.com', experiences: 2, status: 'Pending', created: '2024-04-05' },
    { id: 5, name: 'Tech Innovations', owner: 'Michael Brown', email: 'michael@example.com', experiences: 12, status: 'Active', created: '2024-05-12' },
 ]);

  const [filter, setFilter] = useState('all');
  
  const filteredStudios = filter === 'all' 
    ? studios 
    : studios.filter(studio => studio.status.toLowerCase() === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Studios</h1>
          <p className="text-gray-600 mt-1">View and manage all studio accounts on the platform</p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
          Add New Studio
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Total Studios</p>
          <p className="text-3xl font-semibold text-gray-90">{studios.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Active Studios</p>
          <p className="text-3xl font-semibold text-gray-90">
            {studios.filter(s => s.status === 'Active').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Pending Studios</p>
          <p className="text-3xl font-semibold text-gray-900">
            {studios.filter(s => s.status === 'Pending').length}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'} hover:bg-gray-200 transition`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg ${filter === 'active' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'} hover:bg-gray-200 transition`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg ${filter === 'pending' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'} hover:bg-gray-200 transition`}
            >
              Pending
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search studios..."
              className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Studios Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Studio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experiences</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudios.map((studio) => (
                <tr key={studio.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10 flex items-center justify-center mr-3">
                        <span className="text-lg">🎵</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{studio.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{studio.owner}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{studio.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{studio.experiences}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      studio.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {studio.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{studio.created}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-indigo-600 hover:text-indigo-900">Edit</button>
                      <button className="text-red-600 hover:text-red-900">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminStudios;
