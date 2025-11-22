import React from 'react';

const AdminDashboard = () => {
  // Mock data for the dashboard
  const stats = [
    { name: 'Total Studios', value: '24', change: '+2', changeType: 'positive' },
    { name: 'Total Experiences', value: '142', change: '+12', changeType: 'positive' },
    { name: 'Active Users', value: '1.2K', change: '+120', changeType: 'positive' },
    { name: 'Total Revenue', value: '$24.8K', change: '+$2.4K', changeType: 'positive' },
  ];

  const recentStudios = [
    { id: 1, name: 'Music Studio Pro', owner: 'John Doe', experiences: 5, status: 'Active' },
    { id: 2, name: 'Art Gallery VR', owner: 'Jane Smith', experiences: 3, status: 'Active' },
    { id: 3, name: 'Historical Tours', owner: 'Robert Johnson', experiences: 8, status: 'Active' },
    { id: 4, name: 'Wellness Retreats', owner: 'Emily Davis', experiences: 2, status: 'Pending' },
  ];

  const recentExperiences = [
    { id: 1, title: 'Classical Music Journey', studio: 'Music Studio Pro', views: 1240, status: 'active' },
    { id: 2, title: 'Modern Art Exploration', studio: 'Art Gallery VR', views: 890, status: 'active' },
    { id: 3, title: 'Ancient Rome Tour', studio: 'Historical Tours', views: 2100, status: 'active' },
    { id: 4, title: 'Meditation Sessions', studio: 'Wellness Retreats', views: 450, status: 'scheduled' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
          Create New Studio
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-gray-600">{stat.name}</p>
            <div className="mt-2 flex items-baseline">
              <p className="text-3xl font-semibold text-gray-900">{stat.value}</p>
              <p className={`ml-2 text-sm ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Studios */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Studios</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Studio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experiences</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentStudios.map((studio) => (
                  <tr key={studio.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{studio.name}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{studio.owner}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{studio.experiences}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        studio.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {studio.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Experiences */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Experiences</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Studio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentExperiences.map((experience) => (
                  <tr key={experience.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{experience.title}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{experience.studio}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{experience.views}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        experience.status === 'active' ? 'bg-green-100 text-green-800' : experience.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {experience.status?.charAt(0).toUpperCase() + experience.status?.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Platform Overview Chart Placeholder */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Overview</h2>
        <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500">Chart visualization would appear here</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
