import React, { useEffect, useState } from 'react';
import { Plus, CheckCircle, Upload, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { newExperienceAPI } from '../../../services/api';
import { setupProgressStream, calculateCombinedProgress } from '../../../services/progressStreamService';
import useExperienceValidation from '../../../hooks/useExperienceValidation';
import { localToUTC } from '../../../utils/timezoneHelper';
import ToggleButton from './ToggleButton';
import ExperienceFlow from './ExperienceFlow';
import StageEditor from './StageEditor';
import SessionSettings from './SessionSettings';
import StylesEditor from './StylesEditor';
import Settings from './Settings';

const CreateExperience = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('content');

  // Validation hook for experience title
  const experienceNameValidation = useExperienceValidation();

  // Centralized state for the entire experience
  const [experienceData, setExperienceData] = useState({
    // Basic Information
    title: '',
    slug: '',
    subtitle: '',
    description: '',
    icon: null,
    iconName: '', // Added to store the icon file name
    
    // Session Settings
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    userTimezone: '', // Will be auto-detected from browser
    completionTitle: '',
    completionDescription: '',
    
    // Styling Options
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
    
    // New Border Colors (for styles editor)
    loadingScreenBorderColor: '#d1d5db',
    mediaPlayerBorderColor: '#d1d5db',
    mediaPlayerControlsBorderColor: '#d1d5db',
    
    // New Media Player Settings (for styles editor)
    playerBackgroundColor: '#0000',
    playerBackgroundOpacity: 0.8,
    playerControllersColor: '#ffffff',
    audioPlayerButtonColor: '#3b82f6',
    
    // Player Control Settings
    showPlayPauseButton: true,
    showBackButton: true,
    showNextButton: true,
    enableLoopTracks: false,
    enableShuffleTracks: false,
    
    // Stage Configuration Settings
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
    
    // Stages
    stages: []
  });
  
  // State for upload progress tracking
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('uploading'); // 'uploading', 'processing', 'success', 'error'
  const [uploadPhase, setUploadPhase] = useState('upload'); // 'upload' or 'processing'
  
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
  
  // Track whether the stage editor form is visible
  const [isStageEditorVisible, setIsStageEditorVisible] = useState(false);

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
    // Validate that content has been provided
    const hasContent = stageEditorData.uploadedFile || stageEditorData.pastedText;

    if (!hasContent) {
      alert(`Please ${stageEditorData.stageType === 'text' ? 'upload a file or paste text' : 'upload a file'} before saving the stage.`);
      return;
    }

    const stageData = {
      id: editingStageIndex !== null ? experienceData.stages[editingStageIndex].id : Date.now(), // Use existing ID if editing
      position: editingStageIndex !== null ? experienceData.stages[editingStageIndex].position : experienceData.stages.length, // Position index
      type: stageEditorData.stageType,
      title: stageEditorData.stageTitle || `Stage ${experienceData.stages.length + 1}`,
      description: stageEditorData.stageDescription,
      buttonSettings: stageEditorData.buttonSettings,
      buttonName: stageEditorData.buttonName,
      codeValue: stageEditorData.codeValue,
      uploadedFile: stageEditorData.uploadedFile,
      pastedText: stageEditorData.pastedText
    };

    if (editingStageIndex !== null) {
      // Update existing stage
      const updatedStages = [...experienceData.stages];
      updatedStages[editingStageIndex] = stageData;
      updateExperienceData('stages', updatedStages);
      console.log('Updated stage:', stageData);
      // Reset editing state
      setEditingStageIndex(null);
    } else {
      // Add new stage
      console.log('Adding new stage:', stageData);
      setExperienceData(prev => ({
        ...prev,
        stages: [...prev.stages, stageData]
      }));
    }

    // Reset stage editor after adding/updating
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
    
    // Reset file input element
    if (resetFileInput) {
      resetFileInput();
    }
    
    // Hide the stage editor form after adding a new stage (but not when editing)
    if (editingStageIndex === null) {
      setIsStageEditorVisible(false);
    }
  };

  // Function to handle editing an existing stage or showing the form for adding a new one
  const handleEditStage = (stage, index) => {
    if (stage && index !== undefined) {
      // Editing an existing stage
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
      // Editing an existing stage (without index provided)
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
      // Just showing the form for adding a new stage (from "Add New Stage" button)
      setEditingStageIndex(null);
      setIsStageEditorVisible(true);
    }
  };

  useEffect(() => {
    console.log('Current Experience Data:', experienceData);
  }, [experienceData]);

  // Helper function to reset form data
  const resetFormData = () => {
    setUploadPhase('upload');
    setExperienceData({
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
      completionTitle: '',
      completionDescription: '',
      primaryColor: '#3b82f6',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      secondaryTextColor: '#6b7280',
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
      waveColor: '#3b82f6',
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

    setEditingStageIndex(null);
    setIsStageEditorVisible(false);
  };

  const saveCompleteExperience = async () => {
    // Validate session schedule before attempting upload
    const scheduleValidation = validateSessionSchedule();
    if (!scheduleValidation.isValid) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Session Schedule',
        text: scheduleValidation.error,
        confirmButtonColor: '#3b82f6',
        confirmButtonText: 'OK'
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setShowProgressModal(true);
    setUploadStatus('uploading');
    setUploadPhase('upload');

    try {
      console.log('Creating new experience with data:', experienceData);

      // Convert local times to UTC before sending to server
      const dataToSend = { ...experienceData };
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

      // Create the experience and get the ID
      const response = await newExperienceAPI.createNewExperience(dataToSend, (progressEvent) => {
        // Track upload progress (0-50%)
        const uploadProgressPercent = Math.round((progressEvent.loaded / progressEvent.total) * 50);
        setUploadProgress(uploadProgressPercent);
      }, true); // Skip global error handler since we handle errors locally

      // Extract experience ID from response
      const experienceId = response?.data?._id || response?.data?.id;

      if (!experienceId) {
        throw new Error('Failed to create experience: No ID returned from server');
      }

      console.log('Experience created successfully with ID:', experienceId);

      // Update progress bar to 50% for upload completion
      setUploadProgress(50);

      // Switch to processing state - files are now being encoded
      setUploadStatus('processing');
      setUploadPhase('processing');

      // Set up real-time progress updates via SSE
      let progressTimeout;
      const resetTimeout = () => {
        clearTimeout(progressTimeout);
        // If no progress updates for 3 seconds, auto-complete
        progressTimeout = setTimeout(() => {
          console.warn('No progress updates received, auto-completing...');
          setUploadProgress(100);
          setUploadStatus('success');

          setTimeout(() => {
            setShowProgressModal(false);
            resetFormData();
            navigate(`/studio/experience-created/${experienceId}`);
          }, 1500);
        }, 3000);
      };

      resetTimeout();

      setupProgressStream(
        experienceId,
        // onProgress callback
        (progressData) => {
          resetTimeout();
          const totalProgress = calculateCombinedProgress(50, progressData.encodingProgress);
          setUploadProgress(totalProgress);
        },
        // onComplete callback
        (progressData) => {
          clearTimeout(progressTimeout);
          setUploadProgress(100);
          setUploadStatus('success');

          setTimeout(() => {
            setShowProgressModal(false);
            resetFormData();
            navigate(`/studio/experience-created/${experienceId}`);
          }, 1500);
        },
        // onError callback
        (error) => {
          console.error('Progress stream error:', error);
          clearTimeout(progressTimeout);
          // Still mark as success even if stream fails, since creation was successful
          setUploadStatus('success');
          setUploadProgress(100);

          setTimeout(() => {
            setShowProgressModal(false);
            resetFormData();
            navigate(`/studio/experience-created/${experienceId}`);
          }, 1500);
        }
      );
    } catch (error) {
      console.error('Error creating experience:', error);
      setUploadStatus('error');

      setTimeout(() => {
        setShowProgressModal(false);

        // Show comprehensive error message with Swal
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
        const errorDetails = error.response?.data?.details || '';

        Swal.fire({
          icon: 'error',
          title: 'Failed to Create Experience',
          html: `<p>${errorMessage}</p>${errorDetails ? `<p style="font-size: 0.9em; color: #666; margin-top: 10px;">${errorDetails}</p>` : ''}
                  <p style="font-size: 0.85em; color: #999; margin-top: 15px;">📁 Your files are preserved. Close this and try saving again.</p>`,
          confirmButtonColor: '#3b82f6',
          confirmButtonText: 'OK'
        });
        // Do NOT reset form data on error - files and state are preserved for retry
      }, 1500);
    } finally {
      setIsUploading(false);
    }
  };

  // Validate session schedule times
  const validateSessionSchedule = () => {
    const { startDate, startTime, endDate, endTime } = experienceData;

    // Check if all fields are filled
    if (!startDate || !startTime || !endDate || !endTime) {
      return { isValid: false, error: 'All date and time fields are required' };
    }

    // Create Date objects for comparison
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    // Check if dates are valid
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return { isValid: false, error: 'Invalid date or time format' };
    }

    // Check if start time is before end time
    if (startDateTime >= endDateTime) {
      return {
        isValid: false,
        error: 'Start date and time must be before end date and time'
      };
    }

    return { isValid: true, error: null };
  };

  // Check if all required session settings are filled and valid
  const isSessionSettingsFilled = () => {
    const titleValid = experienceData.title.trim() !== '';
    const scheduleValid = validateSessionSchedule().isValid;
    return titleValid && scheduleValid;
  };

  // Check if save button should be enabled
  const isSaveEnabled =
    experienceData.stages.length > 0 &&
    isSessionSettingsFilled() &&
    experienceNameValidation.isValid === true;

  return (
    <div className="max-w-full mx-auto h-full flex flex-col pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create Experience</h1>
        <p className="text-gray-600 mt-1 text-sm">Design and configure your experience flow</p>
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
                  onCancelEdit={() => {
                    setEditingStageIndex(null);
                    setIsStageEditorVisible(false); // Hide the form when canceling edit
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
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Stage Added Successfully!</h3>
                        <p className="text-gray-500 text-center mb-6 max-w-md">
                          Your stage has been created. Add more stages to build your complete experience.
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Start Building Your Experience</h3>
                        <p className="text-gray-500 text-center mb-6 max-w-md">
                          First, complete the session settings on the right (title and dates). Then click below to create your first stage and begin crafting an engaging experience.
                        </p>
                        {!isSessionSettingsFilled() && (
                          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg max-w-md">
                            <p className="text-sm text-amber-800">
                              <strong>Before creating a stage:</strong>
                            </p>
                            <ul className="text-xs text-amber-700 mt-2 space-y-1">
                              <li>✓ Enter experience title</li>
                              <li>✓ Set start date and time</li>
                              <li>✓ Set end date and time</li>
                            </ul>
                          </div>
                        )}
                      </>
                    )}

                    <button
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md ${
                        isSessionSettingsFilled()
                          ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                      }`}
                      onClick={() => setIsStageEditorVisible(true)}
                      disabled={!isSessionSettingsFilled()}
                      title={!isSessionSettingsFilled() ? 'Complete session settings first' : 'Create a new stage'}
                    >
                      <Plus className="w-5 h-5" />
                      {experienceData.stages.length > 0 ? 'Add Another Stage' : 'Create First Stage'}
                    </button>
                  </div>
                  
                  {experienceData.stages.length > 0 && (
                    <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 rounded-b-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          Total Stages: <span className="font-semibold text-gray-900">{experienceData.stages.length}</span>
                        </span>
                        <span className="text-gray-500">Keep building to complete your experience</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Column 3: Session Settings (smaller) - for content tab, we'll show a placeholder or keep it empty */}
            <div className="lg:col-span-3">
              <SessionSettings
                experienceData={experienceData}
                updateExperienceData={updateExperienceData}
                experienceNameValidation={experienceNameValidation}
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

      {/* Save Experience Button - Fixed at bottom right */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 shadow-lg z-50 py-4 px-6 flex items-center justify-between">
        {!isSaveEnabled && (
          <div className="text-sm text-gray-600 max-w-md">
            <p className="font-medium mb-1">Complete the following to save:</p>
            <ul className="text-xs space-y-0.5">
              {!experienceNameValidation.isValid && <li>• Valid experience title</li>}
              {!isSessionSettingsFilled() && <li>• Session start and end dates/times</li>}
              {experienceData.stages.length === 0 && <li>• At least one stage</li>}
            </ul>
          </div>
        )}
        <button
          onClick={saveCompleteExperience}
          disabled={!isSaveEnabled}
          className={`py-3 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm font-medium transition-all ${
            !isSaveEnabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          title={!isSaveEnabled ? 'Complete all required fields before saving' : 'Save your experience'}
        >
          Save Complete Experience
        </button>
      </div>
      
      {/* Upload Progress Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {uploadStatus === 'success' ? '✨ All Done!' :
                 uploadStatus === 'error' ? 'Upload Failed' :
                 uploadPhase === 'processing' ? 'Processing Files...' :
                 'Uploading Files...'}
              </h3>
              {uploadStatus === 'success' ? (
                <Check className="w-6 h-6 text-green-500" />
              ) : uploadStatus === 'error' ? (
                <X className="w-6 h-6 text-red-500" />
              ) : uploadPhase === 'processing' ? (
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

            {uploadPhase === 'upload' ? (
              <>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Uploading</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all duration-300 bg-blue-500"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Please wait while we upload your files...
                </p>
              </>
            ) : uploadPhase === 'processing' ? (
              <>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-3">
                    <span className="font-medium">Video Processing</span>
                    <span className="font-semibold">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-amber-400 to-amber-500"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-700">
                    Your files are being processed and encoded. This may take a few minutes for large videos.
                  </p>
                  <p className="text-xs text-gray-500">
                    ⏱️ Please keep this window open while we finish...
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>
                      {uploadStatus === 'success' ? 'Complete!' :
                       uploadStatus === 'error' ? 'Failed' :
                       'Uploading'}
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        uploadStatus === 'success' ? 'bg-green-500' :
                        uploadStatus === 'error' ? 'bg-red-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  {uploadStatus === 'success' ? 'Your experience has been saved successfully!' :
                   uploadStatus === 'error' ? 'There was an error saving your experience.' :
                   'Please wait while we upload your files...'}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateExperience;
