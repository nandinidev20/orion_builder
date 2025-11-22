import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ToggleButton from './CreateExperiencV2/ToggleButton';
import ExperienceFlow from './CreateExperiencV2/ExperienceFlow';
import StageEditor from './CreateExperiencV2/StageEditor';
import SessionSettings from './CreateExperiencV2/SessionSettings';
import StylesEditor from './CreateExperiencV2/StylesEditor';
import Settings from './CreateExperiencV2/Settings';

const EditExperience = () => {
  const { id } = useParams(); // Get experience ID from URL params
  const [activeTab, setActiveTab] = useState('content');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Centralized state for the entire experience
  const [experienceData, setExperienceData] = useState({
    // Basic Information
    title: '',
    subtitle: '',
    description: '',
    icon: null,
    iconName: '', // Added to store the icon file name
    
    // Session Settings
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    completionTitle: '',
    completionDescription: '',
    
    // Styling Options
    primaryColor: '#3b82f6',
    secondaryColor: '#6b7280',
    backgroundColor: '#ffffff',
    textColor: '#000',
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

  // Mock function to fetch experience data from API
  useEffect(() => {
    const fetchExperienceData = async () => {
      try {
        setLoading(true);
        
        // Mock API call - in real implementation, this would be an actual API call
        // For now, we'll simulate fetching data with a timeout
        setTimeout(() => {
          const mockExperienceData = {
            // Basic Information
            title: 'My Edited Experience',
            subtitle: 'An amazing journey',
            description: 'This is a sample edited experience with multiple stages',
            icon: null,
            iconName: '', // Added to store the icon file name
            
            // Session Settings
            startDate: '2024-12-01',
            startTime: '09:00',
            endDate: '2024-12-31',
            endTime: '17:00',
            completionTitle: 'Congratulations!',
            completionDescription: 'You have completed this experience successfully!',
            
            // Styling Options
            primaryColor: '#ef4444',
            secondaryColor: '#8b5cf6',
            backgroundColor: '#f3f4f6',
            textColor: '#1f2937',
            buttonColor: '#ef4444',
            buttonTextColor: '#ffffff',
            borderColor: '#9ca3af',
            backgroundImage: null,
            fontFamily: 'Arial, sans-serif',
            headingSize: 'large',
            padding: 20,
            margin: 20,
            borderRadius: 12,
            borderWidth: 2,
            allowComments: true,
            autoPlayMedia: true,
            visibility: 'private',
            emailNotifications: true,
            pushNotifications: true,
            passwordProtection: false,
            password: '',
            twoFactorAuth: false,
            trackInteractions: true,
            shareAnonymousData: true,
            
            // Stages
            stages: [
              {
                id: 1,
                position: 0,
                type: 'video',
                title: 'Welcome Video',
                description: 'Watch this welcome video to get started',
                buttonSettings: 'tap',
                buttonName: 'Tap to Continue',
                codeValue: '',
                uploadedFile: null,
                pastedText: ''
              },
              {
                id: 2,
                position: 1,
                type: 'image',
                title: 'Introduction Image',
                description: 'View this introductory image',
                buttonSettings: 'swipe',
                buttonName: 'Swipe to Next',
                codeValue: '',
                uploadedFile: null,
                pastedText: ''
              },
              {
                id: 3,
                position: 2,
                type: 'text',
                title: 'Final Stage',
                description: 'This is the final stage of the experience',
                buttonSettings: 'tap',
                buttonName: 'Complete Experience',
                codeValue: '',
                uploadedFile: null,
                pastedText: 'Thank you for completing this experience!'
              }
            ]
          };
          
          setExperienceData(mockExperienceData);
          setLoading(false);
        }, 1000); // Simulate network delay
      } catch (err) {
        setError('Failed to load experience data');
        setLoading(false);
        console.error('Error fetching experience:', err);
      }
    };

    fetchExperienceData();
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
  };

  // Function to finalize stage save when editing
  const finalizeStageSave = () => {
    // Validate that content has been provided
    const hasContent = stageEditorData.uploadedFile || stageEditorData.pastedText;

    if (!hasContent) {
      alert(`Please ${stageEditorData.stageType === 'text' ? 'upload a file or paste text' : 'upload a file'} before saving the stage.`);
      return;
    }

    // The auto-sync has already updated the stages array, we just need to finalize
    console.log('Stage save finalized for index:', editingStageIndex);

    // Reset editing state
    setEditingStageIndex(null);

    // Reset stage editor
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
  };

  // Function to handle editing an existing stage
  const handleEditStage = (stage, index) => {
    // Use the provided index or find the index of the stage in the array
    const stageIndex = index !== undefined ? index : experienceData.stages.findIndex(s => s.id === stage.id);
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
  };

  // Mock function to update the experience
  const updateExperience = async () => {
    console.log('Updating experience with data:', experienceData);
    
    // Mock API call - in real implementation, this would be an actual API call
    try {
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Experience updated successfully!');
      alert('Experience updated successfully!');
    } catch (error) {
      console.error('Error updating experience:', error);
      alert('Failed to update experience');
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
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 00 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              <span className="font-medium">Error!</span> {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto h-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-s font-bold text-gray-90">Edit Experience</h1>
        <p className="text-gray-600 mt-1 text-sm">Modify and update your existing experience</p>
      </div>

      {/* Toggle Button */}
      <ToggleButton activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Conditional Rendering Based on Active Tab */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
            </div>

            {/* Column 3: Session Settings (smaller) - for content tab, we'll show a placeholder or keep it empty */}
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
      
      {/* Update Experience Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={updateExperience}
          className="py-3 px-6 bg-blue-60 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm font-medium"
        >
          Update Experience
        </button>
      </div>
    </div>
  );
};

export default EditExperience;
