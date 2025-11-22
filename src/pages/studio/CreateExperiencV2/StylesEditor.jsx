import React, { useState, useEffect } from 'react';

const StylesEditor = ({ experienceData, updateExperienceData }) => {
  // Get asset URL helper function
  const getAssetUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;

    const apiBaseUrl = localStorage.getItem('apiBaseUrl') || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '');

    let normalizedPath = path.replace(/\\/g, '/');
    normalizedPath = normalizedPath.replace(/^\/+/, '');

    return `${baseUrl}/${normalizedPath}`;
  };

  // Initialize preview based on backgroundImage type
  const [backgroundImagePreview, setBackgroundImagePreview] = useState(() => {
    if (!experienceData.backgroundImage) return null;
    if (typeof experienceData.backgroundImage === 'string') return getAssetUrl(experienceData.backgroundImage);
    if (experienceData.backgroundImage instanceof File || experienceData.backgroundImage instanceof Blob) {
      return URL.createObjectURL(experienceData.backgroundImage);
    }
    return null;
  });
  
  // Clean up object URLs when component unmounts or when image changes
  useEffect(() => {
    return () => {
      // Only revoke blob URLs, not server URLs
      if (backgroundImagePreview && backgroundImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(backgroundImagePreview);
      }
    };
  }, [backgroundImagePreview]);

  // When experienceData changes externally (from API load), update preview if needed
  useEffect(() => {
    if (!experienceData.backgroundImage) {
      setBackgroundImagePreview(null);
      return;
    }

    // If it's a string URL (from server), use the getAssetUrl helper
    if (typeof experienceData.backgroundImage === 'string') {
      setBackgroundImagePreview(getAssetUrl(experienceData.backgroundImage));
      return;
    }

    // If it's a File object, create blob URL
    if (experienceData.backgroundImage instanceof File || experienceData.backgroundImage instanceof Blob) {
      const blobUrl = URL.createObjectURL(experienceData.backgroundImage);
      setBackgroundImagePreview(blobUrl);
    }
  }, [experienceData.backgroundImage]);
  
  // Function to handle color changes
  const handleColorChange = (field, value) => {
    updateExperienceData(field, value);
  };

  // Function to handle font changes
  const handleFontChange = (field, value) => {
    updateExperienceData(field, value);
  };

  // Function to handle spacing changes
  const handleSpacingChange = (field, value) => {
    updateExperienceData(field, value);
  };

  // Function to handle background image upload
  const handleBackgroundImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create a temporary URL for the image file for preview
      const tempUrl = URL.createObjectURL(file);
      // IMPORTANT: Save the File object itself, not the blob URL
      // The backend will handle uploading and return the proper file path
      updateExperienceData('backgroundImage', file);
      setBackgroundImagePreview(tempUrl);
    }
  };

  // Function to remove background image
  const removeBackgroundImage = () => {
    updateExperienceData('backgroundImage', null);
    setBackgroundImagePreview(null);
  };

  // Function to handle opacity changes
  const handleOpacityChange = (field, value) => {
    updateExperienceData(field, parseFloat(value));
  };

  // Function to reset all styles to default
  const resetToDefaults = () => {
    const defaults = {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      secondaryTextColor: '#6b7280',
      buttonColor: '#3b82f6',
      buttonTextColor: '#ffffff',
      loadingScreenBorderColor: '#d1d5db',
      mediaPlayerBorderColor: '#d1d5db',
      mediaPlayerControlsBorderColor: '#d1d5db',
      playerBackgroundColor: '#000000',
      playerBackgroundOpacity: 0.8,
      playerControllersColor: '#ffffff',
      audioPlayerButtonColor: '#3b82f6',
      waveColor: '#3b82f6',
      backgroundImage: null
    };

    Object.keys(defaults).forEach(key => {
      updateExperienceData(key, defaults[key]);
    });
    
    setBackgroundImagePreview(null);
  };

  // State for color picker modal
  const [colorPickerOpen, setColorPickerOpen] = useState(null);
  const [tempColor, setTempColor] = useState('');
  const [hsvColor, setHsvColor] = useState({ h: 0, s: 100, v: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const gradientRef = React.useRef(null);

  // Color utility functions
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const rgbToHex = (r, g, b) => {
    return "#" + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join('').toUpperCase();
  };

  const rgbToHsv = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max !== min) {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, v: v * 100 };
  };

  const hsvToRgb = (h, s, v) => {
    h = h / 360;
    s = s / 100;
    v = v / 100;
    let r = 0, g = 0, b = 0;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  };

  const openColorPicker = (fieldName, currentColor) => {
    const rgb = hexToRgb(currentColor);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    setColorPickerOpen(fieldName);
    setTempColor(currentColor);
    setHsvColor(hsv);
  };

  const closeColorPicker = () => {
    setColorPickerOpen(null);
  };

  const selectColor = (fieldName) => {
    updateExperienceData(fieldName, tempColor);
    closeColorPicker();
  };

  const handleHueChange = (e) => {
    const h = parseFloat(e.target.value);
    setHsvColor({ ...hsvColor, h });
    const rgb = hsvToRgb(h, hsvColor.s, hsvColor.v);
    setTempColor(rgbToHex(rgb.r, rgb.g, rgb.b));
  };

  const updateColorFromPosition = (clientX, clientY) => {
    if (!gradientRef.current) return;

    const rect = gradientRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    const s = (x / rect.width) * 100;
    const v = 100 - (y / rect.height) * 100;
    setHsvColor({ ...hsvColor, s, v });
    const rgb = hsvToRgb(hsvColor.h, s, v);
    setTempColor(rgbToHex(rgb.r, rgb.g, rgb.b));
  };

  const handleGradientMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    updateColorFromPosition(e.clientX, e.clientY);
  };

  const handleGradientTouchStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const touch = e.touches[0];
    updateColorFromPosition(touch.clientX, touch.clientY);
  };

  // Add mouse move listener when dragging
  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      updateColorFromPosition(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        updateColorFromPosition(touch.clientX, touch.clientY);
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, hsvColor]);

  const handleTextChange = (e) => {
    const val = e.target.value;
    if (/^#[0-9A-F]{6}$/i.test(val) || val === '') {
      setTempColor(val);
      if (/^#[0-9A-F]{6}$/i.test(val)) {
        const rgb = hexToRgb(val);
        const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        setHsvColor(hsv);
      }
    }
  };

  // Color picker modal component
  const ColorPickerModal = ({ fieldName, currentColor }) => {
    const rgb = hsvToRgb(hsvColor.h, hsvColor.s, hsvColor.v);

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Select Color</h3>

          {/* Color Gradient Area */}
          <div
            ref={gradientRef}
            className="w-full h-48 rounded-lg mb-4 border-2 border-gray-200 cursor-crosshair relative select-none"
            style={{
              background: `linear-gradient(to right, white, hsl(${hsvColor.h}, 100%, 50%)), linear-gradient(to top, black, transparent)`,
              backgroundBlendMode: 'multiply',
              userSelect: 'none'
            }}
            onMouseDown={handleGradientMouseDown}
            onTouchStart={handleGradientTouchStart}
          >
            {/* Crosshair indicator */}
            <div
              className="absolute w-5 h-5 border-2 border-white rounded-full pointer-events-none shadow-lg"
              style={{
                left: `${hsvColor.s}%`,
                top: `${100 - hsvColor.v}%`,
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.5), 0 0 6px rgba(0,0,0,0.3)'
              }}
            />
          </div>

          {/* Hue Slider */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Hue</label>
            <input
              type="range"
              min="0"
              max="360"
              value={hsvColor.h}
              onChange={handleHueChange}
              className="w-full h-3 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-red-500 rounded-lg appearance-none cursor-pointer"
              style={{
                background: 'linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)'
              }}
            />
          </div>

          {/* RGB Display */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center">
              <input
                type="number"
                min="0"
                max="255"
                value={rgb.r}
                readOnly
                className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-center bg-gray-50"
              />
              <label className="text-xs text-gray-600 mt-1 block">R</label>
            </div>
            <div className="text-center">
              <input
                type="number"
                min="0"
                max="255"
                value={rgb.g}
                readOnly
                className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-center bg-gray-50"
              />
              <label className="text-xs text-gray-600 mt-1 block">G</label>
            </div>
            <div className="text-center">
              <input
                type="number"
                min="0"
                max="255"
                value={rgb.b}
                readOnly
                className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-center bg-gray-50"
              />
              <label className="text-xs text-gray-600 mt-1 block">B</label>
            </div>
          </div>

          {/* Hex Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Hex Color</label>
            <input
              type="text"
              value={tempColor}
              onChange={handleTextChange}
              placeholder="#000000"
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm font-mono focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* Color Preview */}
          <div className="w-full h-12 rounded-lg mb-4 border-2 border-gray-200" style={{ backgroundColor: tempColor }} />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={closeColorPicker}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => selectColor(fieldName)}
              className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors"
            >
              Select Color
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Color picker component with smooth UX
  const ColorPicker = ({ label, fieldName, value, onChange, defaultValue }) => {
    const handleTextChange = (e) => {
      const val = e.target.value;
      // Validate hex color format
      if (/^#[0-9A-F]{6}$/i.test(val) || val === '') {
        onChange(val);
      }
    };

    return (
      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-pink-300 transition-all">
          <button
            type="button"
            onClick={() => openColorPicker(fieldName, value || defaultValue)}
            className="w-12 h-12 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-pink-500 transition-colors flex-shrink-0"
            style={{ backgroundColor: value || defaultValue }}
            title="Click to open color picker"
          />
          <div className="flex-1">
            <input
              type="text"
              value={value || defaultValue}
              onChange={handleTextChange}
              placeholder="#000000"
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm font-mono focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 border-b border-gray-200 p-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-lg p-2 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Styles Editor</h3>
            <p className="text-sm text-gray-600">Customize your experience appearance</p>
          </div>
        </div>
      </div>
      
      {/* Main content area - scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Background Image Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <h4 className="text-md font-bold text-gray-800">Background Image</h4>
          </div>
          
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-4 border border-pink-100">
            <label className="block text-sm font-medium text-gray-700 mb-3">Upload Background</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleBackgroundImageUpload}
              className="block w-full text-sm text-gray-600
                file:mr-4 file:py-2.5 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-pink-100 file:text-pink-700
                hover:file:bg-pink-200 file:cursor-pointer
                cursor-pointer border border-gray-300 rounded-lg"
            />
            
            {backgroundImagePreview && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-pink-600" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    Preview
                  </span>
                  <button
                    type="button"
                    onClick={removeBackgroundImage}
                    className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Remove
                  </button>
                </div>
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <img
                    src={backgroundImagePreview}
                    alt="Background preview"
                    className="w-full h-auto object-cover max-h-48"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Basic Colors Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
            </svg>
            <h4 className="text-md font-bold text-gray-800">Basic Colors</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ColorPicker
              label="Background Color"
              fieldName="backgroundColor"
              value={experienceData.backgroundColor}
              onChange={(value) => handleColorChange('backgroundColor', value)}
              defaultValue="#ffffff"
            />

            <ColorPicker
              label="Primary Text Color"
              fieldName="textColor"
              value={experienceData.textColor}
              onChange={(value) => handleColorChange('textColor', value)}
              defaultValue="#000000"
            />

            <ColorPicker
              label="Secondary Text Color"
              fieldName="secondaryTextColor"
              value={experienceData.secondaryTextColor}
              onChange={(value) => handleColorChange('secondaryTextColor', value)}
              defaultValue="#6b7280"
            />

            <ColorPicker
              label="Brand/Button Color(all the buttons in the screen)"
              fieldName="buttonColor"
              value={experienceData.buttonColor}
              onChange={(value) => handleColorChange('buttonColor', value)}
              defaultValue="#3b82f6"
            />

            <ColorPicker
              label="Button Text Color"
              fieldName="buttonTextColor"
              value={experienceData.buttonTextColor}
              onChange={(value) => handleColorChange('buttonTextColor', value)}
              defaultValue="#ffffff"
            />
          </div>
        </div>

        {/* Border Colors Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <h4 className="text-md font-bold text-gray-800">Border Colors</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* <ColorPicker
              label="Loading Screen Border"
              fieldName="loadingScreenBorderColor"
              value={experienceData.loadingScreenBorderColor}
              onChange={(value) => handleColorChange('loadingScreenBorderColor', value)}
              defaultValue="#d1d5db"
            /> */}
            
            <ColorPicker
              label="Media Player Border"
              fieldName="mediaPlayerBorderColor"
              value={experienceData.mediaPlayerBorderColor}
              onChange={(value) => handleColorChange('mediaPlayerBorderColor', value)}
              defaultValue="#d1d5db"
            />
            
            <div className="md:col-span-2">
             {/*  <ColorPicker
                label="Media Player Controls Border"
                fieldName="mediaPlayerControlsBorderColor"
                value={experienceData.mediaPlayerControlsBorderColor}
                onChange={(value) => handleColorChange('mediaPlayerControlsBorderColor', value)}
                defaultValue="#d1d5db"
              /> */}
            </div>
          </div>
        </div>

        {/* Media Player Settings Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            <h4 className="text-md font-bold text-gray-800">Media Player</h4>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ColorPicker
                label="Player Background"
                fieldName="playerBackgroundColor"
                value={experienceData.playerBackgroundColor}
                onChange={(value) => handleColorChange('playerBackgroundColor', value)}
                defaultValue="#000000"
              />
              
              <ColorPicker
                label="Player Controllers"
                fieldName="playerControllersColor"
                value={experienceData.playerControllersColor}
                onChange={(value) => handleColorChange('playerControllersColor', value)}
                defaultValue="#ffffff"
              />
            </div>
            
            {/* Opacity Slider */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">Player Background Opacity</label>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={experienceData.playerBackgroundOpacity || 0.8}
                  onChange={(e) => handleOpacityChange('playerBackgroundOpacity', e.target.value)}
                  className="w-full h-2 bg-gradient-to-r from-transparent via-gray-400 to-gray-900 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, transparent 0%, rgba(0,0,0,${experienceData.playerBackgroundOpacity || 0.8}) 100%)`
                  }}
                />
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded">0%</span>
                  <span className="text-sm font-bold text-pink-600 bg-pink-50 px-3 py-1 rounded-full">
                    {Math.round((experienceData.playerBackgroundOpacity || 0.8) * 100)}%
                  </span>
                  <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded">100%</span>
                </div>
              </div>
            </div>
            
            <ColorPicker
              label="Audio Player Button"
              fieldName="audioPlayerButtonColor"
              value={experienceData.audioPlayerButtonColor}
              onChange={(value) => handleColorChange('audioPlayerButtonColor', value)}
              defaultValue="#3b82f6"
            />

            <ColorPicker
              label="Wave/Amplitude Color"
              fieldName="waveColor"
              value={experienceData.waveColor}
              onChange={(value) => handleColorChange('waveColor', value)}
              defaultValue="#3b82f6"
            />
          </div>
        </div>

        {/* Live Preview Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            <h4 className="text-md font-bold text-gray-800">Style Preview</h4>
          </div>
          
          <div className="rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm">
            <div 
              className="p-6 relative"
              style={{
                backgroundColor: experienceData.backgroundColor || '#ffffff',
                backgroundImage: backgroundImagePreview ? `url(${backgroundImagePreview})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="bg-white bg-opacity-90 rounded-lg p-4 backdrop-blur-sm">
                <h5 
                  className="font-bold mb-2"
                  style={{ color: experienceData.textColor || '#000000' }}
                >
                  Preview Text
                </h5>
                <p
                  className="text-sm mb-4"
                  style={{ color: experienceData.secondaryTextColor || '#6b7280' }}
                >
                  This is how your secondary text appears
                </p>
                <button
                  className="px-4 py-2 rounded-lg font-medium text-sm shadow-sm"
                  style={{
                    backgroundColor: experienceData.buttonColor || '#3b82f6',
                    color: experienceData.buttonTextColor || '#ffffff'
                  }}
                >
                  Sample Button
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Fixed at bottom */}
    {/*   <div className="flex-shrink-0 p-5 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-end gap-3">
          <button 
            className="px-5 py-2.5 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg text-sm font-semibold transition-all duration-200 hover:shadow-md"
            onClick={resetToDefaults}
          >
            Reset to Default
          </button>
          <button 
            className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            onClick={() => console.log('Apply Styles')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Apply Styles
          </button>
        </div>
      </div> */}

      {/* Color Picker Modal */}
      {colorPickerOpen && (
        <ColorPickerModal fieldName={colorPickerOpen} currentColor={tempColor} />
      )}
    </div>
  );
};

export default StylesEditor;
