# HLS Preview Update - Edit Mode with API-Stored Files

## Overview

Updated the stage editor preview to handle files that are **stored as HLS on the server**. When editing a stage, the component now automatically:

1. Detects if the file comes from the API (string path from database)
2. Calls `getStreamAccessTokenV2()` to get JWT token and proper manifest URL
3. Streams the HLS content with authentication

## How It Works Now

### File Type Detection

```javascript
const isFileObject = uploadedFile instanceof File || uploadedFile instanceof Blob;

if (isHlsManifest || !isFileObject) {
  // String from API or HLS manifest → Show HLSMediaPreview with API call
  <HLSMediaPreview
    src={fileUrl}
    isStoredAsHls={!isFileObject}  // true for API files
    experienceId={experienceId}
    stageId={stageId}
  />
} else if (isFileObject) {
  // New File object → Direct browser playback
  <video src={fileUrl} controls />
}
```

### Preview Workflow

#### **Scenario 1: Editing Existing Stage (API-Stored HLS)**

1. User opens EditExperience and selects a stage to edit
2. Experience data loads from API with stage info:
   ```json
   {
     "stages": [{
       "id": "1761459163550",
       "uploadedFile": "/uploads/experiences/audio/experience-xyz.mp3",
       "type": "audio"
     }]
   }
   ```
3. StageEditor component receives this stage data
4. `uploadedFile` is a **string** (from API)
5. HLSMediaPreview component:
   - Detects it's **NOT** a File object (`!isFileObject = true`)
   - Sets `isStoredAsHls={true}`
   - Calls `getStreamAccessTokenV2(experienceId, stageId)`
   - Receives JWT token + `manifestUrl` from API
   - Uses HLS.js with JWT authentication to stream the file

**Request Flow:**
```
EditExperience loads stage data from API
        ↓
uploadedFile is a string: "/uploads/experiences/audio/experience-xyz.mp3"
        ↓
HLSMediaPreview detects it's from API (!isFileObject)
        ↓
Calls getStreamAccessTokenV2(experienceId, stageId)
        ↓
API returns:
{
  "manifestUrl": "/api/media-v2/stage-123/index.m3u8",
  "token": "eyJhbGc...",
  "mediaType": "audio"
}
        ↓
HLS.js loads manifest with JWT token
        ↓
Player streams audio with authentication
```

#### **Scenario 2: New File Upload (Browser File Object)**

1. User uploads a new file in the stage editor
2. `uploadedFile` is a **File object**
3. HLSMediaPreview component:
   - Detects `isFileObject === true`
   - Uses `URL.createObjectURL()` for direct playback
   - **No API call needed**
   - Browser plays file directly

## HLSMediaPreview Component Updates

### New Parameters

| Parameter | Type | Purpose |
|-----------|------|---------|
| `src` | string | File path (converted to full URL internally) |
| `experienceId` | string | Experience ID (for API calls) |
| `stageId` | string | Stage ID (for API calls) |
| `isStoredAsHls` | boolean | `true` if file is API-stored and needs JWT token |
| `fileType` | string | Media type (audio, video, etc.) |
| `fileName` | string | Display name for the file |

### New Logic

```javascript
const HLSMediaPreview = ({ 
  src, 
  fileType, 
  fileName, 
  experienceId, 
  stageId,
  isStoredAsHls = true  // Default to true for API files
}) => {
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Step 1: Get JWT token if file is API-stored
    if (isStoredAsHls && experienceId && stageId) {
      const tokenData = await publicExperienceAPI.getStreamAccessTokenV2(
        experienceId, 
        stageId
      );
      // Step 2: Use returned manifestUrl and token
      manifestUrl = tokenData.manifestUrl;
      token = tokenData.token;
    }
    
    // Step 3: Load HLS stream with JWT authentication
    const hls = new Hls({
      xhrSetup: (xhr, url) => {
        if (token) {
          // Add token to segment requests
          xhr.open('GET', url + '?token=' + token);
        }
      }
    });
    
    hls.loadSource(manifestUrl);
    hls.attachMedia(mediaRef.current);
  }, [src, experienceId, stageId, isStoredAsHls]);
}
```

## File Path Conversion

When `uploadedFile` is a string from the API, the component converts it to a full URL:

```javascript
const getAssetUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/api/')) return `http://localhost:5000${path}`;
  
  const baseUrl = 'http://localhost:5000/';
  let normalizedPath = path.replace(/\\/g, '/');
  normalizedPath = normalizedPath.replace(/^\/+/, '');
  
  return `${baseUrl}${normalizedPath}`;
};

// Examples:
// "/uploads/experiences/audio/file.mp3" 
//   → "http://localhost:5000/uploads/experiences/audio/file.mp3"
//
// "/api/media-v2/stage-123/index.m3u8"
//   → "http://localhost:5000/api/media-v2/stage-123/index.m3u8"
```

## Error Handling

The component includes comprehensive error handling:

- **API call fails:** Shows "Failed to get stream access" error
- **HLS loading fails:** Displays error message in preview
- **Network error:** Automatic retry with HLS.js
- **Invalid manifest:** Shows appropriate error to user

```javascript
try {
  const tokenData = await publicExperienceAPI.getStreamAccessTokenV2(...);
  // Continue with playback
} catch (error) {
  setStreamError('Failed to get stream access');
  console.warn('Failed to get stream token:', error);
  return;
}
```

## Loading State

Added loading state for better UX:

```javascript
const [loading, setLoading] = useState(false);

// Set loading when stream access is requested
setLoading(true);

// Clear loading when manifest is parsed
hls.on(Hls.Events.MANIFEST_PARSED, () => {
  setLoading(false);
});
```

## Dependency Updates

### Files Modified

1. **`src/pages/studio/CreateExperiencV2/StageEditor.jsx`**
   - Updated `HLSMediaPreview` component to accept `isStoredAsHls` parameter
   - Added loading and error states
   - Updated preview logic to detect API-stored files
   - Added full URL conversion for file paths

2. **`src/services/api.js`** (already updated)
   - `getStreamAccessTokenV2()` method available

3. **`server/controler/experienceControllerV2.js`** (already created)
   - Handles JWT token generation
   - Returns manifest URL with authenticated paths

## Workflow Summary

### Edit Mode (API-Stored Files)
```
1. User edits stage
2. API returns uploadedFile path (string)
3. Component detects string (API file)
4. Calls getStreamAccessTokenV2()
5. Receives JWT token + manifestUrl
6. HLS.js streams with authentication
```

### Create Mode (New Uploads)
```
1. User uploads file
2. uploadedFile is File object
3. Component detects File object
4. Creates object URL for direct playback
5. Browser plays file directly
```

## Testing

To test the updated preview:

1. **Edit an experience** with an uploaded audio/video stage
2. **Stage editor loads** and displaysprevious stage data
3. **Preview should appear** with:
   - Loading state initially
   - Audio/video player when ready
   - File name below player
4. **Check browser console** - should see V2 API call
5. **Network tab** - should see authenticated requests to `/api/media-v2/`

## Benefits

✅ **Secure Streaming:** Files streamed with JWT authentication
✅ **HLS Support:** Proper handling of HLS streams
✅ **Two Workflows:** Different handling for new uploads vs API files
✅ **Better UX:** Loading states and error messages
✅ **Flexible:** Works with any media type (audio, video, HLS)

## Future Improvements

- [ ] Add retry logic for failed token requests
- [ ] Show loading percentage for large files
- [ ] Support for subtitles/captions
- [ ] Adaptive bitrate streaming
- [ ] Token refresh for long streams
