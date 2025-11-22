import React, { useState, useEffect } from 'react';

const PublicAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    dailyViews: [],
    weeklyCompletions: [],
    experiencePerformance: []
  });

  // Mock data initialization
  useEffect(() => {
    // Mock daily views data
    const dailyViews = [
      { date: '2023-06-01', count: 45 },
      { date: '2023-06-02', count: 52 },
      { date: '2023-06-03', count: 48 },
      { date: '2023-06-04', count: 67 },
      { date: '2023-06-05', count: 78 },
      { date: '2023-06-06', count: 65 },
      { date: '2023-06-07', count: 82 }
    ];

    // Mock weekly completions data
    const weeklyCompletions = [
      { week: 'Week 1', count: 120 },
      { week: 'Week 2', count: 145 },
      { week: 'Week 3', count: 167 },
      { week: 'Week 4', count: 189 }
    ];

    // Mock experience performance data
    const experiencePerformance = [
      { title: 'Product Demo Experience', views: 245, completionRate: 72 },
      { title: 'Onboarding Journey', views: 198, completionRate: 68 },
      { title: 'Feature Walkthrough', views: 156, completionRate: 75 },
      { title: 'Tutorial Series', views: 134, completionRate: 65 }
    ];

    setAnalyticsData({
      dailyViews,
      weeklyCompletions,
      experiencePerformance
    });
  }, []);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Public Analytics</h1>
        <p className="text-gray-600">View analytics for your public experiences</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-blue-100 p-3">
              <svg className="w-6 h-6 text-blue-60" fill="none" stroke="currentColor" viewBox="0 0 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.47 0-8.268-2.943-9.542-7z"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Total Views</h3>
              <p className="text-2xl font-semibold text-gray-900">1,245</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-green-100 p-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 0 002 2h2a2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Total Completions</h3>
              <p className="text-2xl font-semibold text-gray-900">876</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-purple-100 p-3">
              <svg className="w-6 h-6 text-purple-60" fill="none" stroke="currentColor" viewBox="0 0 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Avg. Completion Rate</h3>
              <p className="text-2xl font-semibold text-gray-900">72%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Views Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Daily Views (Last 7 Days)</h2>
          <div className="h-64 flex items-end space-x-2">
            {analyticsData.dailyViews.map((day, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div 
                  className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                  style={{ height: `${(day.count / 90) * 100}%` }}
                ></div>
                <div className="text-xs text-gray-500 mt-2">{day.date.split('-')[2]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Completions Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Weekly Completions</h2>
          <div className="h-64 flex items-end space-x-2">
            {analyticsData.weeklyCompletions.map((week, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div 
                  className="w-full bg-green-500 rounded-t hover:bg-green-600 transition-colors"
                  style={{ height: `${(week.count / 200) * 100}%` }}
                ></div>
                <div className="text-xs text-gray-500 mt-2">{week.week}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Experience Performance */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Experience Performance</h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analyticsData.experiencePerformance.map((exp, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{exp.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{exp.views}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${exp.completionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{exp.completionRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-blue-600 hover:text-blue-900">View Details</button>
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

export default PublicAnalytics;
