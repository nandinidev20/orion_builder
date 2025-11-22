import React, { useState, useEffect } from 'react';

const PublicDashboard = () => {
 const [stats, setStats] = useState({
    totalExperiences: 0,
    totalViews: 0,
    uniqueVisitors: 0,
    completionRate: '0%'
  });

  const [recentExperiences, setRecentExperiences] = useState([]);

  // Mock data initialization
  useEffect(() => {
    // Mock dashboard statistics
    setStats({
      totalExperiences: 12,
      totalViews: 1245,
      uniqueVisitors: 876,
      completionRate: '72%'
    });

    // Mock recent experiences
    setRecentExperiences([
      {
        id: 1,
        title: 'Product Demo Experience',
        views: 120,
        completions: 85,
        status: 'Published',
        createdAt: '2023-06-15'
      },
      {
        id: 2,
        title: 'Onboarding Journey',
        views: 98,
        completions: 72,
        status: 'Published',
        createdAt: '2023-06-18'
      },
      {
        id: 3,
        title: 'Feature Walkthrough',
        views: 76,
        completions: 45,
        status: 'Draft',
        createdAt: '2023-06-20'
      }
    ]);
 }, []);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Public Studio Dashboard</h1>
        <p className="text-gray-600">View your public experience analytics and data</p>
      </div>

      {/* Stats Grid - Only showing Total Experiences */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-purple-100 p-3">
              <svg className="w-6 h-6 text-purple-60" fill="none" stroke="currentColor" viewBox="0 0 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 0 01-2 2H5a2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Total Experiences</h3>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalExperiences}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Experiences */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Experiences</h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience URL</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentExperiences.map((experience) => (
                  <tr key={experience.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{experience.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      https://example.com/experience/{experience.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        experience.status === 'Published' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {experience.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{experience.createdAt}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          View QR
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          Copy URL
                        </button>
                        <button className="text-indigo-600 hover:text-indigo-900">
                          Edit
                        </button>
                        <button className="text-purple-600 hover:text-purple-900">
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicDashboard;
