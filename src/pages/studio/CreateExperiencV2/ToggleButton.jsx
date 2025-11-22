import React from 'react';

const ToggleButton = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex border-b border-gray-200 mb-6">
      <button
        className={`px-4 py-2 font-medium text-sm ${
          activeTab === 'content'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700'
        }`}
        onClick={() => setActiveTab('content')}
      >
        Content
      </button>
      <button
        className={`px-4 py-2 font-medium text-sm ${
          activeTab === 'styles'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700'
        }`}
        onClick={() => setActiveTab('styles')}
      >
        Styles
      </button>
      <button
        className={`px-4 py-2 font-medium text-sm ${
          activeTab === 'settings'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700'
        }`}
        onClick={() => setActiveTab('settings')}
      >
        Settings
      </button>
    </div>
  );
};

export default ToggleButton;
