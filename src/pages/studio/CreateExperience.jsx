import React, { useEffect, useState } from 'react';
import ToggleButton from './CreateExperiencV2/ToggleButton';
import ExperienceFlow from './CreateExperiencV2/ExperienceFlow';
import StageEditor from './CreateExperiencV2/StageEditor';
import SessionSettings from './CreateExperiencV2/SessionSettings';
import StylesEditor from './CreateExperiencV2/StylesEditor';
import Settings from './CreateExperiencV2/Settings';
import useExperienceValidation from '../../hooks/useExperienceValidation';

const CreateExperience = () => {
  const [activeTab, setActiveTab] = useState('content');

  // Experience name validation hook
  const experienceNameValidation = useExperienceValidation();

  // Sync title with validation hook
  useEffect(() => {
    setExperienceData(prev => ({
      ...prev,
      title: experienceNameValidation.value
    }));
  }, [experienceNameValidation.value]);

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
  useEffect(() => {
    console.log('Current Experience Data:', experienceData);
  }, [experienceData]);

  const saveCompleteExperience = () => {
    console.log('Complete Experience Data:', experienceData);
  };

  return (
    <div className="max-w-full mx-auto h-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-s font-bold text-gray-90">Create Experience</h1>
        <p className="text-gray-600 mt-1 text-sm">Design and configure your experience flow</p>
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
      
      {/* Save Experience Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={saveCompleteExperience}
          className="py-3 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm font-medium"
        >
          Save Complete Experience
        </button>
      </div>
    </div>
  );
};

export default CreateExperience;
