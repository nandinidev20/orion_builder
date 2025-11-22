# Stage Editor V2 API Integration

## Overview
The stage editor preview has been updated to use the V2 APIs for fetching and playing HLS streams. This allows the preview to work with the new `NewExperience` model using embedded stages instead of separate track documents.

## Changes Made

### 1. API Service (`src/services/api.js`)

Added four new V2 methods to the `publicExperienceAPI` object:

#### `getPublicExperienceByIdV2(id)`
- **Endpoint:** `GET /experiences/:id/public-v2`
- **Purpose:** Fetch published experience details with embedded stages (NewExperience model)
- **Returns:** Experience object with all stage metadata and styling configuration

#### `validateStageAccessV2(experienceId, stageId)`
- **Endpoint:** `POST /experiences/:experienceId/stages/:stageId/access`
- **Purpose:** Request access token for a specific stage to play its media
- **Returns:** JWT token, manifest URL, and media type

#### `validateUnlockCodeV2(experienceId, stageId, code)`
- **Endpoint:** `POST /experiences/:experienceId/stages/:stageId/unlock`
- **Purpose:** Validate unlock code for password-protected stages
- **Returns:** `{ codeValid: true }` on success

#### `getStreamAccessTokenV2(experienceId, stageId)`
- **Endpoint:** `GET /experiences/:experienceId/stages/:stageId/stream`
- **Purpose:** Get JWT token and manifest URL for stage media (alias for access endpoint)
- **Returns:** JWT token, manifest URL, and media type

### 2. HLSMediaPreview Component Update (`src/pages/studio/CreateExperiencV2/StageEditor.jsx`)

**Changes:**
- Updated parameter from `trackId` to `stageId`
- Updated API call from `getStreamAccessToken()` to `getStreamAccessTokenV2()`
- Updated HLS manifest detection to include `/api/media-v2/` paths
- Updated `xhrSetup` to handle both `/api/media/` and `/api/media-v2/` endpoints
- Updated dependency array in `useEffect` to include `stageId`

**Code:**
```javascript
// Before
const HLSMediaPreview = ({ src, fileType, fileName, experienceId, trackId }) => {
  // ...
  const tokenData = await publicExperienceAPI.getStreamAccessToken(experienceId, trackId);
  // ...
  if (url.includes('/api/media/') || url.includes('/api/get-key')) {
    // ...
  }
}

// After
const HLSMediaPreview = ({ src, fileType, fileName, experienceId, stageId }) => {
  // ...
  const tokenData = await publicExperienceAPI.getStreamAccessTokenV2(experienceId, stageId);
  // ...
  if (url.includes('/api/media/') || url.includes('/api/media-v2/') || url.includes('/api/get-key')) {
    // ...
  }
}
```

### 3. StageEditor Component Update

**Changes:**
- Updated component signature from `trackId` to `stageId`
- Updated `useMemo` dependency array to include `experienceId` and `stageId`
- Updated HLSMediaPreview component call to pass `stageId` instead of `trackId`

**Function Signature:**
```javascript
// Before
const StageEditor = ({ 
  stageEditorData, 
  updateStageEditorData, 
  addStage, 
  isEditing, 
  onCancelEdit, 
  experienceId, 
  trackId 
})

// After
const StageEditor = ({ 
  stageEditorData, 
  updateStageEditorData, 
  addStage, 
  isEditing, 
  onCancelEdit, 
  experienceId, 
  stageId 
})
```

### 4. EditExperience Component Update (`src/pages/studio/CreateExperiencV2/EditExperience.jsx`)

**Changes:**
- Updated `StageEditor` component prop from `trackId` to `stageId`
- The stageId is now correctly extracted from the current editing stage's `id` field

**Code:**
```javascript
// Before
<StageEditor
  // ...
  trackId={editingStageIndex !== null ? experienceData.stages[editingStageIndex].id : null}
/>

// After
<StageEditor
  // ...
  stageId={editingStageIndex !== null ? experienceData.stages[editingStageIndex].id : null}
/>
```

## How It Works

### Preview Workflow

1. **User uploads/selects a stage file** in the StageEditor
2. **HLSMediaPreview component detects** if it's an HLS manifest (`.m3u8`) or regular media file
3. **For HLS streams:**
   - Component calls `publicExperienceAPI.getStreamAccessTokenV2(experienceId, stageId)`
   - Backend V2 route returns JWT token and manifest URL with authenticated paths
   - HLS.js is initialized with `xhrSetup` that includes JWT token on all requests
   - All HLS segment requests are automatically authenticated
4. **For regular media files:**
   - Direct browser preview (no token needed for local/uploaded files)

### JWT Token Flow

```
User selects HLS stream file
        ↓
HLSMediaPreview detects .m3u8
        ↓
Call getStreamAccessTokenV2(experienceId, stageId)
        ↓
V2 API endpoint validates experience and stage
        ↓
Returns JWT token + manifest URL
        ↓
HLS.js loads manifest with token in query params
        ↓
HLS.js requests segments, xhrSetup adds token to each request
        ↓
V2 media endpoint verifies token, serves segment
        ↓
Player receives segment and continues playback
```

## API Response Examples

### getStreamAccessTokenV2 Response
```json
{
  "success": true,
  "data": {
    "manifestUrl": "/api/media-v2/stage-1/index.m3u8",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "mediaType": "video",
    "uploadedFile": "/media/hls/1761416888140/index.m3u8"
  }
}
```

### HLS Playlist (Rewritten by V2 Controller)
```
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
/api/media-v2/stage-1/seg00000.ts?token=eyJhbGc...
/api/media-v2/stage-1/seg00001.ts?token=eyJhbGc...
/api/media-v2/stage-1/seg00002.ts?token=eyJhbGc...
#EXT-X-ENDLIST
```

## Backward Compatibility

- ✅ V1 API methods (`getStreamAccessToken`, `validateTrackAccess`, etc.) remain unchanged
- ✅ V1 routes and controllers are not affected
- ✅ Existing experiences using Track model continue to work
- ✅ Both V1 and V2 APIs can coexist

## Benefits

1. **Stage-based Architecture:** Works with embedded stages in NewExperience model
2. **HLS Security:** JWT tokens protect media streaming in preview
3. **Multiple Media Types:** Supports video, audio, text, and image stages
4. **Scalability:** Pagination and filtering ready in V2 API
5. **Analytics:** V2 model includes built-in analytics tracking
6. **Styling:** Comprehensive customization options via NewExperience model

## Testing

To test the V2 integration:

1. **Create a NewExperience** with HLS video/audio stage
2. **Edit the Experience** and select a stage with HLS stream
3. **Preview should play** the HLS stream with JWT authentication
4. **Check browser console** for any errors (should be none)
5. **Network tab** should show authenticated requests to `/api/media-v2/` endpoints

## Files Modified

1. `src/services/api.js` - Added 4 V2 API methods
2. `src/pages/studio/CreateExperiencV2/StageEditor.jsx` - Updated HLSMediaPreview and StageEditor
3. `src/pages/studio/CreateExperiencV2/EditExperience.jsx` - Updated StageEditor props

## Server-Side Components

The following server-side files were created to support V2:

- `server/routes/publicExperienceRoutesV2.js` - V2 route definitions
- `server/controler/experienceControllerV2.js` - V2 controller implementations
- Updated `server/index.js` - Registered V2 routes and media directory

See `V2_ROUTES_DOCUMENTATION.md` and `V2_IMPLEMENTATION_SUMMARY.md` for server-side details.

## Error Handling

The component includes comprehensive error handling:

- **Token request fails:** Falls back to direct stream URL (if accessible)
- **HLS load error:** Displays error message in preview
- **Invalid manifest:** Shows appropriate error to user
- **Network issues:** Automatic retry with HLS.js error recovery

## Performance Considerations

- HLS segments are cached with appropriate cache-control headers
- JWT tokens expire after 10 minutes (configurable)
- Database queries use `.lean()` for optimal performance
- Static file serving for HLS segments bypasses controller overhead

## Future Enhancements

Potential improvements for future versions:

1. **Token Refresh:** Automatic token refresh for long-playing streams
2. **Adaptive Bitrate:** Multiple quality variants in HLS
3. **Encryption:** Support for encrypted HLS streams
4. **Analytics:** Track preview metrics and engagement
5. **CDN Integration:** Serve HLS segments from CDN
6. **Thumbnail Generation:** Preview thumbnails from HLS streams
