import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { newExperienceAPI } from '../../../services/api';
import { setupProgressStream, calculateCombinedProgress } from '../../../services/progressStreamService';
import { Plus, CheckCircle, Upload, Check, X } from 'lucide-react';
import { localToUTC, utcToLocal, getUserTimezone } from '../../../utils/timezoneHelper';
import ToggleButton from './ToggleButton';
import ExperienceFlow from './ExperienceFlow';
import StageEditor from './StageEditor';
import SessionSettings from './SessionSettings';
import StylesEditor from './StylesEditor';
import Settings from './Settings';

const EditExperience = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('content');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('uploading');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successRedirectTimer, setSuccessRedirectTimer] = useState(null);

  // Centralized state for the entire experience
  const [experienceData, setExperienceData] = useState({
    title: '',
    subtitle: '',
    description: '',
    icon: null,
    iconPreview: null,
    iconName: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    userTimezone: '', // Will be auto-detected from browser
    completionTitle: '',
    completionDescription: '',
    primaryColor: '#3b82f6',
    secondaryTextColor: '#6b7280',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    buttonColor: '#3b82f6',
    buttonTextColor: '#ffffff',
    borderColor: '#d1d5db',
    backgroundImage: null,
    fontFamily: 'sans-serif',
    headingSize: 'medium',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    loadingScreenBorderColor: '#d1d5db',
    mediaPlayerBorderColor: '#d1d5db',
    mediaPlayerControlsBorderColor: '#d1d5db',
    playerBackgroundColor: '#0000',
    playerBackgroundOpacity: 0.8,
    playerControllersColor: '#ffffff',
    audioPlayerButtonColor: '#3b82f6',
    showPlayPauseButton: true,
    showBackButton: true,
    showNextButton: true,
    enableLoopTracks: false,
    enableShuffleTracks: false,
    enableStageNavigation: true,
    autoAdvanceStage: false,
    allowComments: false,
    autoPlayMedia: false,
    visibility: 'public',
    emailNotifications: true,
    pushNotifications: false,
    passwordProtection: false,
    password: '',
    twoFactorAuth: false,
    trackInteractions: true,
    shareAnonymousData: false,
    stages: []
  });

  // Stage Editor state
  const [stageEditorData, setStageEditorData] = useState({
    stageType: 'video',
    stageTitle: '',
    stageDescription: '',
    buttonSettings: 'tap',
    buttonName: 'Tap to Unlock',
    codeValue: '',
    uploadedFile: null,
    pastedText: ''
  });

  // Track which stage is currently being edited (null if adding new)
  const [editingStageIndex, setEditingStageIndex] = useState(null);
  const [isStageEditorVisible, setIsStageEditorVisible] = useState(false);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (successRedirectTimer) {
        clearTimeout(successRedirectTimer);
      }
    };
  }, [successRedirectTimer]);

  // Auto-cancel editing if the stage being edited is deleted or array shrinks
  useEffect(() => {
    if (editingStageIndex !== null && editingStageIndex >= experienceData.stages.length) {
      setEditingStageIndex(null);
      setIsStageEditorVisible(false);
      setStageEditorData({
        stageType: 'video',
        stageTitle: '',
        stageDescription: '',
        buttonSettings: 'tap',
        buttonName: 'Tap to Unlock',
        codeValue: '',
        uploadedFile: null,
        pastedText: ''
      });
    }
  }, [experienceData.stages.length]);

  // Fetch experience data from API
  useEffect(() => {
    const fetchExperienceData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await newExperienceAPI.getNewExperienceById(id);
        const data = response.data || response;

        // Parse ISO UTC dates into separate date and time fields (in user's local timezone)
        const parseISODateTime = (isoString) => {
          return utcToLocal(isoString);
        };

        // Auto-detect and set user's timezone if not already set
        if (!data.userTimezone) {
          data.userTimezone = getUserTimezone();
        }

        const startDateTime = parseISODateTime(data.startDate);
        const endDateTime = parseISODateTime(data.endDate);

        // Helper function to construct full URL for assets
        const getAssetUrl = (path) => {
          if (!path) return null;
          if (path.startsWith('http://') || path.startsWith('https://')) return path;

          // Use a more robust way to access environment variables in Vite
          const baseUrl = (import.meta.env && import.meta.env.VITE_ASSET_BASE_URL) ? import.meta.env.VITE_ASSET_BASE_URL : 'https://api.werbz.com/';
          let normalizedPath = path.replace(/\\/g, '/');
          normalizedPath = normalizedPath.replace(/^\/+/, '');

          const uploadsIndex = normalizedPath.lastIndexOf('uploads/');
          if (uploadsIndex !== -1) {
            normalizedPath = normalizedPath.substring(uploadsIndex);
          }

          return `${baseUrl}/${normalizedPath}`;
        };

        setExperienceData({
          title: data.title || '',
          slug: data.slug || '',
          subtitle: data.subtitle || '',
          description: data.description || '',
          icon: data.icon || null,
          iconPreview: data.icon ? getAssetUrl(data.icon) : null,
          iconName: data.iconName || '',
          startDate: startDateTime.date,
          startTime: startDateTime.time,
          endDate: endDateTime.date,
          endTime: endDateTime.time,
          completionTitle: data.completionTitle || '',
          completionDescription: data.completionDescription || '',
          primaryColor: data.primaryColor || '#3b82f6',
          backgroundColor: data.backgroundColor || '#ffffff',
          textColor: data.textColor || '#000000',
          secondaryTextColor: data.secondaryTextColor || '#6b7280',
          buttonColor: data.buttonColor || '#3b82f6',
          buttonTextColor: data.buttonTextColor || '#ffffff',
          borderColor: data.borderColor || '#d1d5db',
          backgroundImage: data.backgroundImage || null,
          fontFamily: data.fontFamily || 'sans-serif',
          headingSize: data.headingSize || 'medium',
          padding: data.padding || 16,
          margin: data.margin || 16,
          borderRadius: data.borderRadius || 8,
          borderWidth: data.borderWidth || 1,
          loadingScreenBorderColor: data.loadingScreenBorderColor || '#d1d5db',
          mediaPlayerBorderColor: data.mediaPlayerBorderColor || '#d1d5db',
          mediaPlayerControlsBorderColor: data.mediaPlayerControlsBorderColor || '#d1d5db',
          playerBackgroundColor: data.playerBackgroundColor || '#0000',
          playerBackgroundOpacity: data.playerBackgroundOpacity || 0.8,
          playerControllersColor: data.playerControllersColor || '#ffffff',
          audioPlayerButtonColor: data.audioPlayerButtonColor || '#3b82f6',
          waveColor: data.waveColor || '#3b82f6',
          showPlayPauseButton: data.showPlayPauseButton !== false,
          showBackButton: data.showBackButton !== false,
          showNextButton: data.showNextButton !== false,
          enableLoopTracks: data.enableLoopTracks || false,
          enableShuffleTracks: data.enableShuffleTracks || false,
          enableStageNavigation: data.enableStageNavigation !== false,
          autoAdvanceStage: data.autoAdvanceStage || false,
          allowComments: data.allowComments || false,
          autoPlayMedia: data.autoPlayMedia || false,
          visibility: data.visibility || 'public',
          emailNotifications: data.emailNotifications !== false,
          pushNotifications: data.pushNotifications || false,
          passwordProtection: data.passwordProtection || false,
          password: data.password || '',
          twoFactorAuth: data.twoFactorAuth || false,
          trackInteractions: data.trackInteractions !== false,
          shareAnonymousData: data.shareAnonymousData || false,
          stages: data.stages || []
        });

        setLoading(false);
      } catch (err) {
        setError('Failed to load experience data');
        setLoading(false);
        console.error('Error fetching experience:', err);
      }
    };

    if (id) {
      fetchExperienceData();
    }
  }, [id]);

  // Function to update experience data
  const updateExperienceData = (field, value) => {
    setExperienceData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Function to update stage editor data
  const updateStageEditorData = (field, value) => {
    setStageEditorData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Function to add a new stage or update an existing one
  const addStage = (resetFileInput) => {
    // Safety check: if editingStageIndex is out of bounds, treat as new stage
    const isValidEditIndex = editingStageIndex !== null && editingStageIndex < experienceData.stages.length;
    const stageData = {
      id: isValidEditIndex ? experienceData.stages[editingStageIndex].id : Date.now(),
      position: isValidEditIndex ? experienceData.stages[editingStageIndex].position : experienceData.stages.length,
      type: stageEditorData.stageType,
      title: stageEditorData.stageTitle || `Stage ${experienceData.stages.length + 1}`,
      description: stageEditorData.stageDescription,
      buttonSettings: stageEditorData.buttonSettings,
      buttonName: stageEditorData.buttonName,
      codeValue: stageEditorData.codeValue,
      uploadedFile: stageEditorData.uploadedFile,
      pastedText: stageEditorData.pastedText
    };

    if (isValidEditIndex) {
      const updatedStages = [...experienceData.stages];
      updatedStages[editingStageIndex] = stageData;
      updateExperienceData('stages', updatedStages);
      setEditingStageIndex(null);
    } else {
      setExperienceData(prev => ({
        ...prev,
        stages: [...prev.stages, stageData]
      }));
    }

    setStageEditorData(prev => ({
      ...prev,
      stageTitle: '',
      stageDescription: '',
      buttonSettings: 'tap',
      buttonName: 'Tap to Unlock',
      codeValue: '',
      uploadedFile: null,
      pastedText: ''
    }));

    if (resetFileInput) {
      resetFileInput();
    }

    if (editingStageIndex === null) {
      setIsStageEditorVisible(false);
    }
  };

  // Function to handle editing an existing stage
  const handleEditStage = (stage, index) => {
    if (stage && index !== undefined) {
      setEditingStageIndex(index);
      setStageEditorData({
        stageType: stage.type || 'video',
        stageTitle: stage.title || '',
        stageDescription: stage.description || '',
        buttonSettings: stage.buttonSettings || 'tap',
        buttonName: stage.buttonName || 'Tap to Unlock',
        codeValue: stage.codeValue || '',
        uploadedFile: stage.uploadedFile || null,
        pastedText: stage.pastedText || ''
      });
    } else if (stage) {
      const stageIndex = experienceData.stages.findIndex(s => s.id === stage.id);
      if (stageIndex !== -1) {
        setEditingStageIndex(stageIndex);
        setStageEditorData({
          stageType: stage.type || 'video',
          stageTitle: stage.title || '',
          stageDescription: stage.description || '',
          buttonSettings: stage.buttonSettings || 'tap',
          buttonName: stage.buttonName || 'Tap to Unlock',
          codeValue: stage.codeValue || '',
          uploadedFile: stage.uploadedFile || null,
          pastedText: stage.pastedText || ''
        });
      }
    } else {
      setEditingStageIndex(null);
      setIsStageEditorVisible(true);
    }
  };

  // OPTIMIZED: Update the experience via API
  const saveExperience = async () => {
    let hasNewFiles = false; // Declare at function scope for catch block access
    
    try {
      // OPTIMIZATION 1: Efficient file detection with better logic
      const hasNewStageFiles = experienceData.stages.some(stage => {
        const file = stage.uploadedFile;
        // Only count as new file if it's an actual File/Blob object (not string path)
        return file && (file instanceof File || file instanceof Blob);
      });

      const hasBackgroundImageFile = experienceData.backgroundImage &&
        (experienceData.backgroundImage instanceof File || experienceData.backgroundImage instanceof Blob);

      hasNewFiles = hasNewStageFiles || hasBackgroundImageFile;

      console.log('File detection:', {
        hasNewStageFiles,
        hasBackgroundImageFile,
        totalNewFiles: hasNewFiles,
        stagesCount: experienceData.stages.length
      });

      // Prepare data for API submission
      const dataToSend = {
        ...experienceData,
        startDate: experienceData.startDate,
        startTime: experienceData.startTime,
        endDate: experienceData.endDate,
        endTime: experienceData.endTime
      };

      // Convert local times to UTC before sending to server
      if (dataToSend.startDate && dataToSend.startTime) {
        const startUTC = localToUTC(dataToSend.startDate, dataToSend.startTime);
        dataToSend.startDate = startUTC.toISOString();
        dataToSend.startTime = '';
      }
      if (dataToSend.endDate && dataToSend.endTime) {
        const endUTC = localToUTC(dataToSend.endDate, dataToSend.endTime);
        dataToSend.endDate = endUTC.toISOString();
        dataToSend.endTime = '';
      }

      // OPTIMIZATION 2: Send minimal data when no new files
      if (!hasNewStageFiles) {
        dataToSend.stages = experienceData.stages.map(stage => {
          const cleanStage = {
            id: stage.id,
            position: stage.position,
            type: stage.type,
            title: stage.title,
            description: stage.description,
            buttonSettings: stage.buttonSettings,
            buttonName: stage.buttonName,
            codeValue: stage.codeValue,
            pastedText: stage.pastedText
          };
          
          // Only include uploadedFile if it's a valid string path (not blob URL)
          if (stage.uploadedFile && typeof stage.uploadedFile === 'string' && !stage.uploadedFile.startsWith('blob:')) {
            cleanStage.uploadedFile = stage.uploadedFile;
          }
          
          return cleanStage;
        });
      }

      // Clean background image if not uploading new one
      if (!hasBackgroundImageFile && dataToSend.backgroundImage &&
          typeof dataToSend.backgroundImage === 'string' &&
          dataToSend.backgroundImage.startsWith('blob:')) {
        delete dataToSend.backgroundImage;
      }

      console.log('Updating experience ID:', id);

      // FAST PATH: No new files = instant update
      if (!hasNewFiles) {
        console.log('✨ Fast path: Metadata-only update');
        setIsUploading(true);

        const response = await newExperienceAPI.updateNewExperience(id, dataToSend, null);
        console.log('Metadata updated:', response);

        // Immediate success feedback
        setShowSuccessPopup(true);
        const timer = setTimeout(() => {
          navigate('/studio/experiences');
        }, 2000); // Reduced from 2500ms
        setSuccessRedirectTimer(timer);
        setIsUploading(false);
        return;
      }

      // SLOW PATH: New files require upload + transcoding
      console.log('📤 Slow path: Uploading and processing files');
      setIsUploading(true);
      setUploadProgress(0);
      setShowProgressModal(true);
      setUploadStatus('uploading');

      // Upload with progress tracking
      const response = await newExperienceAPI.updateNewExperience(
        id,
        dataToSend,
        (progressEvent) => {
          const uploadPercent = Math.round((progressEvent.loaded / progressEvent.total) * 50);
          setUploadProgress(uploadPercent);
        }
      );

      console.log('Upload completed:', response);
      setUploadProgress(50);
      setUploadStatus('processing');

      // OPTIMIZATION 3: Increased timeout to 10 seconds for large files
      let progressTimeout;
      let lastProgressUpdate = Date.now();
      
      const resetTimeout = () => {
        clearTimeout(progressTimeout);
        lastProgressUpdate = Date.now();
        
        // Auto-complete if no updates for 10 seconds (was 3 seconds)
        progressTimeout = setTimeout(() => {
          const timeSinceLastUpdate = Date.now() - lastProgressUpdate;
          console.warn(`No progress for ${timeSinceLastUpdate}ms, auto-completing...`);
          handleComplete();
        }, 10000);
      };

      const handleComplete = () => {
        clearTimeout(progressTimeout);
        setUploadProgress(100);
        setUploadStatus('success');

        setTimeout(() => {
          setShowProgressModal(false);
          setShowSuccessPopup(true);

          const timer = setTimeout(() => {
            navigate('/studio/experiences');
          }, 2000);
          setSuccessRedirectTimer(timer);
        }, 1000); // Reduced delay
      };

      resetTimeout();

      // Set up progress stream with optimized callbacks
      setupProgressStream(
        id,
        // onProgress
        (progressData) => {
          resetTimeout();
          const totalProgress = calculateCombinedProgress(50, progressData.encodingProgress);
          setUploadProgress(Math.min(totalProgress, 99)); // Cap at 99% until complete
          console.log('Progress:', totalProgress + '%');
        },
        // onComplete
        (progressData) => {
          console.log('Processing complete:', progressData);
          handleComplete();
        },
        // onError
        (error) => {
          console.error('Progress stream error:', error);
          clearTimeout(progressTimeout);
          // Treat as success since upload succeeded
          handleComplete();
        }
      );

    } catch (error) {
      console.error('Error updating experience:', error);
      setUploadStatus('error');
      setIsUploading(false);

      if (showProgressModal) {
        setTimeout(() => {
          setShowProgressModal(false);
          alert(`Error: ${error.message || 'Failed to update experience'}`);
        }, 1500);
      } else {
        alert(`Error: ${error.message || 'Failed to update experience'}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-70">
              <span className="font-medium">Error!</span> {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isSaveEnabled = experienceData.stages.length > 0 && experienceData.title.trim() !== '' && experienceData.startDate.trim() !== '' && experienceData.startTime.trim() !== '' && experienceData.endDate.trim() !== '' && experienceData.endTime.trim() !== '';

  return (
    <div className="max-w-full mx-auto h-full flex flex-col pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Experience</h1>
        <p className="text-gray-600 mt-1 text-sm">Modify and update your existing experience</p>
      </div>

      {/* Toggle Button */}
      <ToggleButton activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Conditional Rendering Based on Active Tab */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow">
        {activeTab === 'content' && (
          <>
            {/* Column 1: Experience Flow (smaller) */}
            <div className="lg:col-span-3">
              <ExperienceFlow
                experiences={experienceData.stages}
                setExperiences={(stages) => updateExperienceData('stages', stages)}
                onEdit={handleEditStage}
              />
            </div>

            {/* Column 2: Stage Editor (larger) */}
            <div className="lg:col-span-6">
              {(isStageEditorVisible || editingStageIndex !== null) ? (
                <StageEditor
                  stageEditorData={stageEditorData}
                  updateStageEditorData={updateStageEditorData}
                  addStage={addStage}
                  isEditing={editingStageIndex !== null}
                  editingStageIndex={editingStageIndex}
                  experienceData={experienceData}
                  updateExperienceData={updateExperienceData}
                  onCancelEdit={() => {
                    setEditingStageIndex(null);
                    setIsStageEditorVisible(false);
                    setStageEditorData({
                      stageType: 'video',
                      stageTitle: '',
                      stageDescription: '',
                      buttonSettings: 'tap',
                      buttonName: 'Tap to Unlock',
                      codeValue: '',
                      uploadedFile: null,
                      pastedText: ''
                    });
                  }}
                  experienceId={id}
                  stageId={editingStageIndex !== null && editingStageIndex < experienceData.stages.length ? experienceData.stages[editingStageIndex]?.id : null}
                />
              ) : (
                <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors h-full min-h-[400px] flex flex-col">
                  <div className="flex flex-col items-center pt-16 pb-8 px-8">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                      {experienceData.stages.length > 0 ? (
                        <CheckCircle className="w-10 h-10 text-green-500" />
                      ) : (
                        <Plus className="w-10 h-10 text-blue-500" />
                      )}
                    </div>

                    {experienceData.stages.length > 0 ? (
                      <>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Stage Updated Successfully!</h3>
                        <p className="text-gray-500 text-center mb-6 max-w-md">
                          Your stage has been updated. Add or edit more stages to update your complete experience.
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Create New Stages</h3>
                        <p className="text-gray-500 text-center mb-6 max-w-md">
                          Click the button below to add a new stage to your experience.
                        </p>
                      </>
                    )}

                    <button
                      className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
                      onClick={() => setIsStageEditorVisible(true)}
                    >
                      <Plus className="w-5 h-5" />
                      Add Another Stage
                    </button>
                  </div>

                  {experienceData.stages.length > 0 && (
                    <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 rounded-b-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          Total Stages: <span className="font-semibold text-gray-900">{experienceData.stages.length}</span>
                        </span>
                        <span className="text-gray-500">Update your stages as needed</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Column 3: Session Settings */}
            <div className="lg:col-span-3">
              <SessionSettings
                experienceData={experienceData}
                updateExperienceData={updateExperienceData}
              />
            </div>
          </>
        )}

        {activeTab === 'styles' && (
          <div className="lg:col-span-12">
            <StylesEditor
              experienceData={experienceData}
              updateExperienceData={updateExperienceData}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="lg:col-span-12">
            <Settings
              experienceData={experienceData}
              updateExperienceData={updateExperienceData}
            />
          </div>
        )}
      </div>

      {/* Update Experience Button - Fixed at bottom right */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 shadow-lg z-50 py-4 px-6 flex justify-end">
        <button
          onClick={saveExperience}
          disabled={!isSaveEnabled || isUploading}
          className={`py-3 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm font-medium transition-all flex items-center gap-2 ${
            !isSaveEnabled || isUploading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isUploading ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Updating...</span>
            </>
          ) : (
            'Update Experience'
          )}
        </button>
      </div>

      {/* Upload Progress Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {uploadStatus === 'success' ? '✨ Complete!' :
                 uploadStatus === 'error' ? 'Update Failed' :
                 uploadStatus === 'processing' ? '⚙️ Processing Files...' :
                 '📤 Uploading...'}
              </h3>
              {uploadStatus === 'success' ? (
                <Check className="w-6 h-6 text-green-500" />
              ) : uploadStatus === 'error' ? (
                <X className="w-6 h-6 text-red-500" />
              ) : uploadStatus === 'processing' ? (
                <div className="animate-spin">
                  <svg className="w-6 h-6 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                <Upload className="w-6 h-6 text-blue-500" />
              )}
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>
                  {uploadStatus === 'success' ? 'Complete!' :
                   uploadStatus === 'error' ? 'Failed' :
                   uploadStatus === 'processing' ? 'Processing' :
                   'Uploading'}
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    uploadStatus === 'success' ? 'bg-green-500' :
                    uploadStatus === 'error' ? 'bg-red-500' :
                    uploadStatus === 'processing' ? 'bg-amber-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              {uploadStatus === 'success' ? 'Your experience has been updated successfully!' :
               uploadStatus === 'error' ? 'There was an error updating your experience.' :
               uploadStatus === 'processing' ? 'Processing your files. Large videos may take several minutes...' :
               'Uploading your files...'}
            </p>
          </div>
        </div>
      )}

      {/* Success Popup Modal */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md mx-4 shadow-xl">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Success!
            </h3>
            <p className="text-center text-gray-600 mb-6">
              Your experience has been updated successfully.
            </p>

            <p className="text-center text-sm text-gray-500">
              Redirecting to your experiences...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditExperience;
