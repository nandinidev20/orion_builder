import React, { useState, useRef, useMemo, useEffect } from 'react';
import Hls from 'hls.js';
import { newExperienceAPI } from '../../../services/api.js';
import DocumentViewer from '../../../components/common/DocumentViewer';
import api from '../../../services/api.js';

// Helper function to convert relative paths to full URLs with correct backend base URL
const getAssetUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  // Extract base URL from the configured API instance to ensure consistency
  const apiBaseUrl = api.defaults.baseURL || 'http://localhost:5000/api';
  // Remove '/api' from the end of base URL to get the root URL
  const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '') + '/';
  
  if (path.startsWith('/api/')) return `${baseUrl.slice(0, -1)}${path}`;

  let normalizedPath = path.replace(/\\/g, '/');
  normalizedPath = normalizedPath.replace(/^\/+/, '');

  return `${baseUrl}${normalizedPath}`;
};

const HLSMediaPreview = ({ src, fileType, fileName, experienceId, stageId, isStoredAsHls = true }) => {
  const mediaRef = useRef(null);
  const hlsRef = useRef(null);
  const [streamError, setStreamError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media || !src) return;

    const initializeHls = async () => {
      try {
        setStreamError(null);
        setLoading(true);

        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }

        let manifestUrl = src;
        let token = '';

        // If file is stored as HLS and we have experience/stage IDs, get the JWT token
        if (isStoredAsHls && experienceId && stageId) {
          try {
            const tokenData = await newExperienceAPI.getEditStreamAccess(experienceId, stageId);
            const { manifestUrl: tokenManifestUrl, token: accessToken } = tokenData.data;
            // Convert the relative manifest URL to absolute URL with correct backend base URL
            manifestUrl = getAssetUrl(tokenManifestUrl);
            token = accessToken;
          } catch (error) {
            console.warn('Failed to get edit stream token:', error);
            setStreamError('Failed to get edit stream access');
            setLoading(false);
            return;
          }
        }

        const isHlsManifest = manifestUrl.includes('.m3u8');

        if (isHlsManifest && Hls.isSupported()) {
          const separator = manifestUrl.includes('?') ? '&' : '?';
          const fullManifestUrl = token ? `${manifestUrl}${separator}token=${token}` : manifestUrl;

          const hls = new Hls({
            xhrSetup: (xhr, url) => {
              if (url.includes('/api/media/') || url.includes('/api/media-v2/') || url.includes('/api/studio/edit-media/') || url.includes('/api/get-key')) {
                const sep = url.includes('?') ? '&' : '?';
                const newUrl = token && !url.includes('token=') ? `${url}${sep}token=${token}` : url;
                xhr.open('GET', newUrl, true);
              } else {
                xhr.open('GET', url, true);
              }
            }
          });

          hls.loadSource(fullManifestUrl);
          hls.attachMedia(media);
          hlsRef.current = hls;

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setLoading(false);
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS error in preview:', data);
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError();
                  break;
                default:
                  setStreamError('Unable to load media stream');
                  setLoading(false);
              }
            }
          });
        } else if (isHlsManifest && media.canPlayType('application/vnd.apple.mpegurl')) {
          media.src = manifestUrl;
          setLoading(false);
        } else {
          media.src = manifestUrl;
          setLoading(false);
        }
      } catch (error) {
        console.error('HLS initialization failed:', error);
        setStreamError('Failed to initialize media stream');
        setLoading(false);
      }
    };

    initializeHls();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, experienceId, stageId, isStoredAsHls]);

  const isVideo = fileType === 'video' || fileType === 'mov' || fileType === 'mp4' || fileType === 'webm';

  if (isVideo) {
    return (
      <div className="w-full">
        {streamError && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {streamError}
          </div>
        )}
        <video
          ref={mediaRef}
          controls
          className="w-full max-h-60 rounded-lg bg-black"
          preload="metadata"
        />
        <div className="mt-2 text-sm text-gray-600 truncate flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
          </svg>
          {fileName}
        </div>
      </div>
    );
  } else {
    return (
      <div className="w-full">
        {streamError && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {streamError}
          </div>
        )}
        <audio
          ref={mediaRef}
          controls
          className="w-full"
          preload="metadata"
        />
        <div className="mt-2 text-sm text-gray-600 truncate flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" />
          </svg>
          {fileName}
        </div>
      </div>
    );
  }
};

const StageEditor = ({ stageEditorData, updateStageEditorData, addStage, isEditing, onCancelEdit, experienceId, stageId, editingStageIndex, experienceData, updateExperienceData, onSaveStage }) => {
  const {
    stageType,
    stageTitle,
    stageDescription,
    buttonSettings,
    buttonName,
    codeValue,
    uploadedFile,
    pastedText
  } = stageEditorData;

  const fileInputRef = useRef(null);

  // Auto-sync changes to the stages array when editing
  // Note: We use useRef to store the updateExperienceData function to avoid dependency changes
  const updateExperienceDataRef = useRef(updateExperienceData);
  const experienceDataRef = useRef(experienceData);

  useEffect(() => {
    updateExperienceDataRef.current = updateExperienceData;
    experienceDataRef.current = experienceData;
  }, [updateExperienceData, experienceData]);

  useEffect(() => {
    if (isEditing && editingStageIndex !== null && experienceDataRef.current && updateExperienceDataRef.current) {
      const updatedStages = [...experienceDataRef.current.stages];
      updatedStages[editingStageIndex] = {
        ...updatedStages[editingStageIndex],
        type: stageEditorData.stageType,
        title: stageEditorData.stageTitle || `Stage ${editingStageIndex + 1}`,
        description: stageEditorData.stageDescription,
        buttonSettings: stageEditorData.buttonSettings,
        buttonName: stageEditorData.buttonName,
        codeValue: stageEditorData.codeValue,
        uploadedFile: stageEditorData.uploadedFile,
        pastedText: stageEditorData.pastedText
      };
      updateExperienceDataRef.current('stages', updatedStages);
    }
  }, [stageEditorData, isEditing, editingStageIndex]);

  const setStageType = (value) => updateStageEditorData('stageType', value);
  const setStageTitle = (value) => updateStageEditorData('stageTitle', value);
  const setStageDescription = (value) => updateStageEditorData('stageDescription', value);
  const setButtonSettings = (value) => updateStageEditorData('buttonSettings', value);
  const setButtonName = (value) => updateStageEditorData('buttonName', value);
  const setCodeValue = (value) => updateStageEditorData('codeValue', value);
  const setUploadedFile = (value) => updateStageEditorData('uploadedFile', value);
  const setPastedText = (value) => updateStageEditorData('pastedText', value);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      setPastedText(''); // Clear pasted text when file is uploaded
    }
  };

  const handleTextChange = (e) => {
    setPastedText(e.target.value);
    setUploadedFile(null); // Clear uploaded file when text is pasted
    // Reset file input when text is pasted
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Memoize the preview element to avoid re-creating the object URL on every render
  const previewElement = useMemo(() => {
    if (!uploadedFile) return null;

    const isFileObject = uploadedFile instanceof File || uploadedFile instanceof Blob;
    const isHlsManifest = !isFileObject && typeof uploadedFile === 'string' && uploadedFile.includes('.m3u8');

    const fileUrl = isFileObject ? URL.createObjectURL(uploadedFile) : getAssetUrl(uploadedFile);
    const fileName = isFileObject ? uploadedFile.name : (typeof uploadedFile === 'string' ? uploadedFile.split('/').pop() : 'File');

    const fileType = isFileObject
      ? uploadedFile.type.split('/')[0]
      : typeof uploadedFile === 'string'
        ? uploadedFile.split('.').pop().toLowerCase()
        : 'file';

    let preview;

    // For HLS manifest URLs, use HLS preview component
    if (isHlsManifest) {
      preview = (
        <HLSMediaPreview
          src={fileUrl}
          fileType={fileType}
          fileName={fileName}
          experienceId={experienceId}
          stageId={stageId}
          isStoredAsHls={true}
        />
      );
    } else if ((fileType === 'video' || fileType === 'mov' || fileType === 'mp4' || fileType === 'webm') && (isFileObject || typeof uploadedFile === 'string')) {
      preview = (
        <div className="w-full">
          <video
            src={fileUrl}
            controls
            className="w-full max-h-60 rounded-lg"
            onLoadedMetadata={() => isFileObject && URL.revokeObjectURL(fileUrl)}
            preload="metadata"
          />
          <div className="mt-2 text-sm text-gray-600 truncate flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
            </svg>
            {fileName}
          </div>
        </div>
      );
    } else if ((fileType === 'audio' || fileType === 'mp3' || fileType === 'wav' || fileType === 'ogg' || fileType === 'm4a') && (isFileObject || typeof uploadedFile === 'string')) {
      preview = (
        <div className="w-full">
          <audio
            src={fileUrl}
            controls
            className="w-full"
            onLoadedMetadata={() => isFileObject && URL.revokeObjectURL(fileUrl)}
            preload="metadata"
          />
          <div className="mt-2 text-sm text-gray-600 truncate flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" />
            </svg>
            {fileName}
          </div>
        </div>
      );
    } else if (fileType === 'image' || fileType === 'png' || fileType === 'jpg' || fileType === 'jpeg' || fileType === 'gif' || fileType === 'webp') {
      preview = (
        <div className="w-full">
          <img
            src={fileUrl}
            alt={fileName}
            className="w-full max-h-60 object-contain rounded-lg"
            onLoad={() => isFileObject && URL.revokeObjectURL(fileUrl)}
          />
          <div className="mt-2 text-sm text-gray-600 truncate flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            {fileName}
          </div>
        </div>
      );
    } else if (fileType === 'txt' || fileType === 'doc' || fileType === 'docx' || fileType === 'pdf' || fileType === 'rtf') {
      preview = (
        <div className="w-full">
          <DocumentViewer
            fileUrl={fileUrl}
            fileName={fileName}
            fileType={fileType}
            containerStyle={{}}
          />
          <div className="mt-2 text-sm text-gray-600 truncate flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            {fileName}
          </div>
        </div>
      );
    } else {
      preview = (
        <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-gray-700 truncate flex-1">{fileName}</span>
        </div>
      );
    }

    return preview;
  }, [uploadedFile, experienceId, stageId]);

  const typeIcons = {
    video: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
        <path fillRule="evenodd" d="M10.555 7.168A1 1 0 009 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
      </svg>
    ),
    audio: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" />
      </svg>
    ),
    image: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
      </svg>
    ),
    text: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    ),
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-lg p-2 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {isEditing ? 'Edit Stage' : 'Create New Stage'}
            </h3>
            <p className="text-sm text-gray-600">
              {isEditing ? 'Changes update automatically' : 'Add a new experience stage'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Main content area - scrollable */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Stage Type Toggle Buttons */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Stage Type</label>
          <div className="grid grid-cols-4 gap-2">
            {['video', 'audio', 'image', 'text'].map((type) => (
              <button
                key={type}
                className={`px-4 py-3 rounded-lg text-sm font-medium capitalize transition-all duration-200 flex flex-col items-center gap-2 ${
                  stageType === type
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md scale-105'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
                onClick={() => {
                  setStageType(type);
                  // Clear content when switching types
                  if (type !== 'text') {
                    setPastedText('');
                  }
                  // Reset file input when switching types
                  resetFileInput();
                }}
              >
                <span className={stageType === type ? 'text-white' : 'text-gray-500'}>
                  {typeIcons[type]}
                </span>
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Stage Title */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Stage Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={stageTitle}
            onChange={(e) => setStageTitle(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Enter a descriptive title for this stage"
          />
        </div>

        {/* Stage Description */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Stage Description
          </label>
          <textarea
            value={stageDescription}
            onChange={(e) => setStageDescription(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            placeholder="Describe what this stage is about"
            rows="3"
          />
        </div>

        {/* Button Settings */}
        <div className="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-gray-700">Unlock Settings</label>
            <select
              value={buttonSettings}
              onChange={(e) => setButtonSettings(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="none">None (Auto-advance)</option>
              <option value="tap">Tap to Unlock</option>
              <option value="code">Code to Unlock</option>
            </select>
          </div>

          <div className="space-y-3">
            {buttonSettings !== 'none' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Button Label {buttonSettings === 'code' && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={buttonName}
                  onChange={(e) => setButtonName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder={buttonSettings === 'tap' ? 'e.g., Next, Continue, Unlock' : 'e.g., Submit Code, Verify'}
                />
              </div>
            )}

            {buttonSettings === 'code' && (
              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={codeValue}
                  onChange={(e) => setCodeValue(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter unlock code"
                />
              </div>
            )}

            {buttonSettings === 'none' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Auto-advance:</strong> This stage will automatically progress to the next stage after content plays without requiring user interaction.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Add File Section */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Add {stageType} Content
          </label>
          {stageType === 'text' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Upload Document File</label>
                <p className="text-xs text-gray-500 mb-2">Supported: .txt, .pdf, .docx (Word documents)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-600
                    file:mr-4 file:py-2.5 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100 file:cursor-pointer
                    cursor-pointer border border-gray-300 rounded-lg"
                />
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Paste Text Directly</label>
                <textarea
                  value={pastedText}
                  onChange={handleTextChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="Paste your text content here..."
                  rows="6"
                />
              </div>
            </div>
          ) : (
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept={
                  stageType === 'video' ? 'video/*' : 
                  stageType === 'audio' ? 'audio/*' : 
                  stageType === 'image' ? 'image/*' : 
                  '*'
                }
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-600
                  file:mr-4 file:py-2.5 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100 file:cursor-pointer
                  cursor-pointer border border-gray-300 rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Uploaded File Preview */}
        {uploadedFile && (
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Preview</label>
            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
              {previewElement}
            </div>
          </div>
        )}

        {/* Pasted Text Preview */}
        {stageType === 'text' && pastedText && !uploadedFile && (
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Text Preview</label>
            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{pastedText}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons - Fixed at bottom */}
      <div className="flex-shrink-0 p-5 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-end gap-3">
          {isEditing && onCancelEdit && (
            <button
              className="px-5 py-2.5 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg text-sm font-semibold transition-all duration-200 hover:shadow-md"
              onClick={onCancelEdit}
            >
              Discard Changes
            </button>
          )}
          {isEditing ? (
            <button
              className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
              onClick={() => {
                // Validate that content has been provided
                const hasContent = uploadedFile || pastedText;
                if (!hasContent) {
                  alert(`Please ${stageType === 'text' ? 'upload a file or paste text' : 'upload a file'} before saving the stage.`);
                  return;
                }
                // Close editor after validation
                onCancelEdit();
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l1.293 1.293-1.293 1.293a1 1 0 101.414 1.414L9 12.414l1.293 1.293a1 1 0 001.414-1.414l-1.293-1.293 1.293-1.293z" clipRule="evenodd" />
              </svg>
              Done
            </button>
          ) : (
            <button
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
              onClick={() => {
                addStage(resetFileInput);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Stage
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StageEditor;
