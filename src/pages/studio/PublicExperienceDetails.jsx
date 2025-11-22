import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const PublicExperienceDetails = () => {
  const { id } = useParams();
  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

 // Mock data initialization
  useEffect(() => {
    // Simulate API call delay
    setTimeout(() => {
      // Mock experience data
      const mockExperience = {
        id: id || 1,
        title: 'Product Demo Experience',
        description: 'This is a comprehensive product demo experience showcasing the key features and benefits of our product.',
        type: 'video',
        status: 'Published',
        views: 245,
        completions: 176,
        completionRate: 72,
        createdAt: '2023-06-15',
        updatedAt: '2023-06-20',
        tags: ['demo', 'product', 'features'],
        thumbnail: 'https://via.placeholder.com/800x450',
        duration: '5:24',
        fileSize: '15.2 MB'
      };

      // Mock analytics data
      const mockAnalytics = {
        dailyViews: [
          { date: '2023-06-01', count: 45 },
          { date: '2023-06-02', count: 52 },
          { date: '2023-06-03', count: 48 },
          { date: '2023-06-04', count: 67 },
          { date: '2023-06-05', count: 78 },
          { date: '2023-06-06', count: 65 },
          { date: '2023-06-07', count: 82 }
        ],
        engagement: [
          { minute: 1, engagement: 85 },
          { minute: 2, engagement: 78 },
          { minute: 3, engagement: 72 },
          { minute: 4, engagement: 65 },
          { minute: 5, engagement: 58 }
        ],
        demographics: {
          ageGroups: [
            { group: '18-24', percentage: 25 },
            { group: '25-34', percentage: 35 },
            { group: '35-44', percentage: 20 },
            { group: '45+', percentage: 20 }
          ],
          locations: [
            { country: 'United States', percentage: 45 },
            { country: 'United Kingdom', percentage: 20 },
            { country: 'Canada', percentage: 15 },
            { country: 'Australia', percentage: 12 },
            { country: 'Other', percentage: 8 }
          ]
        }
      };

      setExperience(mockExperience);
      setAnalytics(mockAnalytics);
      setLoading(false);
    }, 500);
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Experience Details</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Experience not found</h3>
          <p className="mt-1 text-sm text-gray-500">The requested experience could not be found.</p>
        </div>
      </div>
    );
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 0 002-2V8a2 2 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
        );
      case 'audio':
        return (
          <svg className="w-5 h-5 text-purple-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
          </svg>
        );
      case 'image':
        return (
          <svg className="w-5 h-5 text-green-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Experience Details</h1>
        <p className="text-gray-600">Detailed information and analytics for your experience</p>
      </div>

      {/* Experience Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex items-center space-x-1 text-gray-500">
                {getTypeIcon(experience.type)}
                <span className="text-sm capitalize">{experience.type}</span>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                experience.status === 'Published' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-10 text-yellow-800'
              }`}>
                {experience.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{experience.title}</h2>
            <p className="text-gray-600 mb-4">{experience.description}</p>
            <div className="flex flex-wrap gap-2">
              {experience.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="ml-6 text-right">
            <div className="text-2xl font-bold text-gray-90">{experience.views}</div>
            <div className="text-sm text-gray-500">Views</div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-blue-100 p-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.47 0-8.268-2.943-9.542-7z"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Total Views</h3>
              <p className="text-2xl font-semibold text-gray-90">{experience.views}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-green-100 p-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Completions</h3>
              <p className="text-2xl font-semibold text-gray-900">{experience.completions}</p>
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
              <h3 className="text-sm font-medium text-gray-600">Completion Rate</h3>
              <p className="text-2xl font-semibold text-gray-90">{experience.completionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Experience Preview */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Experience Preview</h3>
        <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg overflow-hidden">
          <img
            src={experience.thumbnail}
            alt={experience.title}
            className="w-full h-64 object-cover"
          />
        </div>
        <div className="mt-4 flex justify-between text-sm text-gray-500">
          <span>Duration: {experience.duration}</span>
          <span>File Size: {experience.fileSize}</span>
          <span>Created: {experience.createdAt}</span>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Views Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Views (Last 7 Days)</h3>
          <div className="h-64 flex items-end space-x-2">
            {analytics.dailyViews.map((day, index) => (
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

        {/* Engagement Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Engagement Over Time</h3>
          <div className="h-64 flex items-end space-x-2">
            {analytics.engagement.map((point, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div 
                  className="w-full bg-green-500 rounded-t hover:bg-green-60 transition-colors"
                  style={{ height: `${point.engagement}%` }}
                ></div>
                <div className="text-xs text-gray-500 mt-2">{point.minute}m</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicExperienceDetails;
