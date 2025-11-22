# V2 Public Experience Routes - Implementation Summary

## What Was Created

This implementation provides a complete V2 API for accessing published experiences using the `NewExperience` model with **stages** instead of **tracks**, and built-in **HLS streaming** support.

## Files Created

### 1. `server/routes/publicExperienceRoutesV2.js`
Route definitions for V2 API endpoints. Mirrors the structure of `publicExperienceRoutes.js` but uses:
- `/public-v2` endpoint for fetching experience data
- `/stages/:stageId/` endpoints instead of `/tracks/:trackId/`
- `/media-v2/` endpoint for serving stage media
- `/get-key-v2` endpoint for encryption keys

### 2. `server/controler/experienceControllerV2.js`
Controller functions implementing the V2 API logic:

**Functions Implemented:**
- `getPublicExperienceByIdV2()` - Fetch published experience with stage metadata
- `validateStageAccessV2()` - Generate JWT token for stage access
- `validateUnlockCodeV2()` - Validate unlock codes for password-protected stages
- `getStreamAccessV2()` - Get stream access token (alias for validateStageAccessV2)
- `serveStageMediaFileV2()` - Serve media files/HLS segments with JWT auth
- `getEncryptionKeyWithAuthV2()` - Serve encryption keys for encrypted HLS streams

### 3. `V2_ROUTES_DOCUMENTATION.md`
Comprehensive documentation covering:
- API endpoint specifications
- Request/response formats
- HLS streaming details
- Security features
- Error handling
- Integration examples
- Database schema reference

### 4. `V2_IMPLEMENTATION_SUMMARY.md`
This file - a quick overview of what was implemented.

## Key Features

### ✅ Data Model Changes
**V1 (Original):**
```
Experience (Document) 
  └── Tracks[] (Separate documents)
       ├── audioFile
       ├── videoFile
       ├── progressRule: 'code' | 'auto'
       └── unlockCode
```

**V2 (New):**
```
NewExperience (Document)
  └── stages[] (Embedded array)
       ├── type: 'audio' | 'video' | 'text' | 'image'
       ├── buttonSettings: 'tap' | 'code'
       ├── uploadedFile (supports HLS URLs!)
       ├── codeValue
       └── Full styling configuration
```

### ✅ HLS Streaming Support
- Automatic detection of HLS streams via `.m3u8` files
- Playlist rewriting to include JWT token in segment URLs
- Support for encrypted HLS streams with `.keyinfo` files
- Proper MIME type handling for all HLS segments

### ✅ Security
- JWT token-based access control (10 minute expiration)
- Scoped tokens (each token tied to specific stage + experience)
- Published status verification before serving content
- No direct file paths exposed to clients

### ✅ Media Type Support
- **Video:** .mp4, .webm, .m3u8 (HLS video)
- **Audio:** .mp3, .m4a, .m3u8 (HLS audio)
- **Text:** .txt, .json
- **Image:** .png, .jpg, .gif

### ✅ Interaction Modes
- **Tap Mode:** User taps to continue (`buttonSettings: 'tap'`)
- **Code Mode:** User must enter code (`buttonSettings: 'code'`, validated via `codeValue`)

### ✅ Comprehensive Styling
- Color customization (primary, secondary, background, text, button colors)
- Font settings (family, heading size)
- Layout settings (padding, margin, border radius/width)
- Player customization (controller colors, opacity)
- Background images support

## API Endpoints Summary

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/experiences/:id/public-v2` | Get experience details |
| POST | `/api/experiences/:id/stages/:stageId/access` | Get access token for stage |
| POST | `/api/experiences/:id/stages/:stageId/unlock` | Validate unlock code |
| GET | `/api/experiences/:id/stages/:stageId/stream` | Get stream token (alias) |
| GET | `/api/media-v2/:stageId/:filename?token=` | Serve media/HLS segment |
| GET | `/api/get-key-v2?token=` | Get encryption key |

## Workflow Example

```javascript
// 1️⃣ Fetch experience
GET /api/experiences/My-Experience/public-v2

// 2️⃣ Get stage details, check for unlock code requirement
if (stage.hasUnlockCode) {
  POST /api/experiences/{expId}/stages/{stageId}/unlock
  Body: { code: "USER_CODE" }
}

// 3️⃣ Request stream access
GET /api/experiences/{expId}/stages/{stageId}/stream

// 4️⃣ Play media using JWT token
Video: /api/media-v2/{stageId}/index.m3u8?token={JWT}
Audio: /api/media-v2/{stageId}/audio.mp3?token={JWT}

// 5️⃣ For HLS streams, player fetches segments
Player requests: /api/media-v2/{stageId}/seg00000.ts?token={JWT}
Player requests: /api/media-v2/{stageId}/seg00001.ts?token={JWT}
```

## Integration with Server

The V2 routes are already registered in `server/index.js`:

```javascript
import publicExperienceRoutesV2 from './routes/publicExperienceRoutesV2.js';

app.use('/api', publicExperienceRoutesV2);
```

HLS media directory is served statically:
```javascript
app.use('/media', express.static('server/media'));
```

## Database Queries

### Getting Experience Details
```javascript
NewExperience.findOne({ title: id })
  .populate('studioId')
  .lean()
```

Returns all stages with their metadata, including:
- Stage metadata (type, title, description, etc.)
- Styling configuration
- Analytics data
- Media file paths

### Finding Stages
```javascript
const stage = experience.stages.find(s => s.id === stageId);
```

No separate database queries needed - stages are embedded.

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Your data here
  },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Security Implementation Details

### JWT Token Contents
```javascript
{
  stageId: "stage-id",
  experienceId: "experience-object-id",
  mediaType: "video|audio|text|image",
  manifestFile: "/media/hls/fileId/index.m3u8",
  iat: 1704984600,
  exp: 1704985200  // 10 minutes
}
```

### Token Validation
1. Check token exists in request
2. Verify JWT signature
3. Check token not expired
4. Verify stage ID matches
5. Re-verify experience is published
6. Check stage exists

### File Serving Security
- Tokens validated before serving any media
- File paths must match stage's `uploadedFile` field
- Directory traversal prevented by path validation
- HLS segments require valid token with matching stage ID

## HLS Playlist Rewriting

When serving `.m3u8` playlists, the controller automatically:

1. Reads the original playlist file
2. Finds all segment references (`.ts` files)
3. Rewrites them to include authenticated endpoint and token
4. Returns modified playlist to client

**Example:**
```
Original:   seg00000.ts
Rewritten:  /api/media-v2/{stageId}/seg00000.ts?token={JWT}
```

This ensures all segments are protected by the same JWT authentication.

## Error Handling

All endpoints implement consistent error handling:

- **Missing/Invalid Parameters:** 400 Bad Request
- **Missing/Invalid Token:** 401 Unauthorized
- **Access Denied:** 403 Forbidden
- **Resource Not Found:** 404 Not Found
- **Server Errors:** 500 Internal Server Error

## Performance Optimizations

1. **Lean Queries:** Read operations use `.lean()` for minimal memory overhead
2. **Static File Serving:** HLS segments served via Express static middleware (not through controller)
3. **Cache Headers:** Media files include cache control headers
4. **Token-based Access:** Reduces database queries during playback

## Backward Compatibility

The V2 implementation:
- ✅ Does NOT modify V1 routes or controllers
- ✅ Works alongside existing V1 implementation
- ✅ Uses separate database model (NewExperience vs Experience)
- ✅ Can be gradually migrated without affecting existing experiences

## Next Steps

1. **Frontend Integration:** Update frontend to call V2 endpoints for NewExperience
2. **Migration Script:** Create script to migrate experiences from V1 to V2 format
3. **Admin Panel:** Update admin routes to manage V2 experiences
4. **Player Update:** Ensure video/audio player supports JWT token in URLs

## Testing Recommendations

```bash
# Test getting experience
curl http://localhost:5000/api/experiences/My-Experience/public-v2

# Test getting stream access
curl -X POST http://localhost:5000/api/experiences/{EXPERIENCE_ID}/stages/{STAGE_ID}/access

# Test media serving
curl http://localhost:5000/api/media-v2/{STAGE_ID}/index.m3u8?token={JWT_TOKEN}

# Test unlock code validation
curl -X POST http://localhost:5000/api/experiences/{EXPERIENCE_ID}/stages/{STAGE_ID}/unlock \
  -H "Content-Type: application/json" \
  -d '{"code":"SECRET123"}'
```

## Related Documentation

- **Full API Docs:** See `V2_ROUTES_DOCUMENTATION.md`
- **NewExperience Schema:** `server/model/NewExperience.js`
- **Route Definitions:** `server/routes/publicExperienceRoutesV2.js`
- **Controller Implementation:** `server/controler/experienceControllerV2.js`

---

## Summary

The V2 implementation provides a modern, secure, and scalable API for accessing published experiences with:

- ✅ Stage-based architecture (embedded array vs separate documents)
- ✅ HLS streaming support with automatic playlist rewriting
- ✅ JWT token authentication for secure media access
- ✅ Multiple media types (video, audio, text, image)
- ✅ Code-based interaction mode
- ✅ Comprehensive styling and customization
- ✅ Built-in analytics tracking
- ✅ Backward compatible with existing V1 implementation

All routes follow REST conventions and include comprehensive error handling, security validation, and performance optimizations.
