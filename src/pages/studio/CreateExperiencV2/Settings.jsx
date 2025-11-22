import React from 'react';

const Settings = ({ experienceData, updateExperienceData }) => {
  // Function to handle player control setting changes
 const handlePlayerControlChange = (field, value) => {
    updateExperienceData(field, value);
  };

  // Function to handle stage configuration setting changes
 const handleStageConfigChange = (field, value) => {
    updateExperienceData(field, value);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-4">Player Settings</h3>
      
      {/* Main content area - using flex-grow to push buttons to bottom */}
      <div className="flex-grow overflow-y-auto">
        {/* Player Control Section */}
        <div className="mb-6">
          <h4 className="text-md font-semibold mb-3 text-gray-800">Player Control</h4>
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded border">
              <label className="block text-sm font-medium text-gray-700 mb-1">Play/Pause Button</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={experienceData.showPlayPauseButton !== undefined ? experienceData.showPlayPauseButton : true}
                  onChange={(e) => handlePlayerControlChange('showPlayPauseButton', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="ml-2">
                  <span className="text-sm font-medium text-gray-700">Show play/pause button in player controls</span>
                  <p className="text-xs text-gray-500 mt-1">When disabled, stages will auto-play automatically. Browser may request permission for autoplay.</p>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded border">
              <label className="block text-sm font-medium text-gray-700 mb-1">Back Button</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={experienceData.showBackButton !== undefined ? experienceData.showBackButton : true}
                  onChange={(e) => handlePlayerControlChange('showBackButton', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show back button in player controls</span>
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded border">
              <label className="block text-sm font-medium text-gray-700 mb-1">Next Button</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={experienceData.showNextButton !== undefined ? experienceData.showNextButton : true}
                  onChange={(e) => handlePlayerControlChange('showNextButton', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show next button in player controls</span>
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded border">
              <label className="block text-sm font-medium text-gray-700 mb-1">Loop Tracks Button</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={experienceData.enableLoopTracks || false}
                  onChange={(e) => handlePlayerControlChange('enableLoopTracks', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Enable loop functionality for tracks</span>
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded border">
              <label className="block text-sm font-medium text-gray-700 mb-1">Shuffle Tracks Button</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={experienceData.enableShuffleTracks || false}
                  onChange={(e) => handlePlayerControlChange('enableShuffleTracks', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Enable shuffle functionality for tracks</span>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Settings Section */}
        <div className="mb-6">
          <h4 className="text-md font-semibold mb-3 text-gray-80">Advanced Settings</h4>
          <div className="space-y-4">
            {/* Stage Configuration Sub-section */}
            <div className="p-3 bg-gray-50 rounded border">
              <h5 className="text-sm font-semibold mb-2 text-gray-700">Stage Configuration</h5>
              
              <div className="space-y-3 mt-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={experienceData.enableStageNavigation !== undefined ? experienceData.enableStageNavigation : true}
                    onChange={(e) => handleStageConfigChange('enableStageNavigation', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="ml-2">
                    <span className="text-sm font-medium text-gray-700">Show Next/Back Buttons</span>
                    <p className="text-xs text-gray-500">Display forward and backward navigation buttons between stages</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={experienceData.autoAdvanceStage || false}
                    onChange={(e) => handleStageConfigChange('autoAdvanceStage', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="ml-2">
                    <span className="text-sm font-medium text-gray-700">Auto advance stage</span>
                    <p className="text-xs text-gray-500 mt-1">Automatically advance to next stage when current stage finishes playing</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - positioned at the bottom right */}
     {/*  <div className="mt-6 flex justify-end">
        <div className="flex space-x-2">
          <button 
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm"
            onClick={() => console.log('Save Settings')}
          >
            Save Settings
          </button>
          <button className="px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md text-sm">
            Reset
          </button>
        </div>
      </div> */}
    </div>
  );
};

export default Settings;
