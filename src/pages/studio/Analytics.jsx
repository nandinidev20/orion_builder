import React, { useState } from 'react';

const StudioAnalytics = () => {
  const [dateRange, setDateRange] = useState('7d');
  
  // Mock data for analytics
  const stats = [
    { name: 'Total Views', value: '2,450', change: '+12.5%', changeType: 'positive' },
    { name: 'Unique Visitors', value: '1,820', change: '+8.3%', changeType: 'positive' },
    { name: 'Completion Rate', value: '78%', change: '+3.2%', changeType: 'positive' },
    { name: 'Avg. Session Time', value: '8m 24s', change: '+1.1m', changeType: 'positive' },
 ];

  const experiences = [
    { id: 1, title: 'Classical Music Journey', views: 1240, completions: 980, completionRate: '79%' },
    { id: 2, title: 'Modern Art Exploration', views: 890, completions: 650, completionRate: '73%' },
    { id: 3, title: 'Ancient Rome Tour', views: 2100, completions: 1800, completionRate: '86%' },
    { id: 4, title: 'Meditation Sessions', views: 450, completions: 320, completionRate: '71%' },
  ];

  const topPerforming = [
    { id: 3, title: 'Ancient Rome Tour', views: 2100, completions: 1800 },
    { id: 1, title: 'Classical Music Journey', views: 1240, completions: 980 },
    { id: 2, title: 'Modern Art Exploration', views: 890, completions: 650 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Track performance of your experiences</p>
        </div>
        <div className="flex space-x-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart Placeholder */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h2>
          <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500">Chart visualization would appear here</p>
          </div>
        </div>

        {/* Top Performing Experiences */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing</h2>
          <div className="space-y-4">
            {topPerforming.map((exp, index) => (
              <div key={exp.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{exp.title}</p>
                  <p className="text-xs text-gray-500">{exp.views} views, {exp.completions} completions</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{(exp.completions / exp.views * 100).toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">completion</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Experiences Performance */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Experiences Performance</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {experiences.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{exp.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{exp.views.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{exp.completions.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{exp.completionRate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Engagement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Usage */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Device Usage</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-30">
            <p className="text-gray-500">Device usage chart would appear here</p>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-90 mb-4">Geographic Distribution</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-30">
            <p className="text-gray-50">Geographic distribution chart would appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

 export default StudioAnalytics;
