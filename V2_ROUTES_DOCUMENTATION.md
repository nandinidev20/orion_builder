# Public Experience Routes V2 Documentation

This document explains the V2 routes for accessing published experiences using the `NewExperience` model with stages and HLS streaming support.

## Overview

The V2 routes are designed to work with the `NewExperience` model instead of the legacy `Experience`/`Track` model. Key differences:

### Original (V1) Model
- **Experience** → contains multiple **Tracks**
- Each Track is a separate database document
- Tracks have properties like `title`, `duration`, `audioFile`, `videoFile`, `progressRule`, `unlockCode`
- Uses separate collections for Experience and Track

### New (V2) Model
- **NewExperience** → contains embedded **Stages** array
- Stages are embedded subdocuments within the Experience
- Stages have properties like `id`, `position`, `type`, `title`, `description`, `buttonSettings`, `codeValue`, `uploadedFile`
- Support for various media types: `audio`, `video`, `text`, `image`
- Built-in HLS streaming support via `uploadedFile` field

## Routes Summary

All V2 routes are prefixed with `/api`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/experiences/:id/public-v2` | Get published experience with all stage metadata |
| POST | `/experiences/:id/stages/:stageId/access` | Request access token for a specific stage |
| POST | `/experiences/:id/stages/:stageId/unlock` | Validate unlock code for password-protected stage |
| GET | `/experiences/:id/stages/:stageId/stream` | Get JWT token and manifest URL for stage media (alias for access endpoint) |
| GET | `/media-v2/:stageId/:filename` | Serve media file or HLS stream segment with JWT authentication |
| GET | `/get-key-v2` | Get encryption key for HLS streams with JWT authentication |

## Detailed Route Documentation

### 1. GET `/experiences/:id/public-v2`

Retrieve a published experience with all its stage information.

**Parameters:**
- `id` (string, path): Experience title (matches the `title` field in database)

**Response (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "My Experience",
  "subtitle": "Subtitle text",
  "description": "Full description",
  "studioName": "My Studio",
  "primaryColor": "#3b82f6",
  "secondaryColor": "#6b7280",
  "backgroundColor": "#ffffff",
  "textColor": "#000000",
  "buttonColor": "#3b82f6",
  "buttonTextColor": "#ffffff",
  "icon": "icon-url",
  "logo": "logo-url",
  "allowComments": false,
  "autoPlayMedia": false,
  "emailNotifications": true,
  "passwordProtection": false,
  "trackInteractions": true,
  "showPlayPauseButton": true,
  "showBackButton": true,
  "showNextButton": true,
  "enableLoopTracks": false,
  "enableShuffleTracks": false,
  "enableStageNavigation": true,
  "autoAdvanceStage": false,
  "playerBackgroundColor": "#000000",
  "playerBackgroundOpacity": 0.8,
  "playerControllersColor": "#ffffff",
  "audioPlayerButtonColor": "#3b82f6",
  "completionTitle": "Thank you!",
  "completionDescription": "You've completed the experience",
  "analytics": {
    "totalViews": 100,
    "uniqueVisitors": 85,
    "completionRate": 75,
    "avgSessionTime": "15m 30s"
  },
  "stages": [
    {
      "id": "stage-1",
      "position": 0,
      "type": "video",
      "title": "Introduction",
      "description": "Welcome to the experience",
      "buttonSettings": "tap",
      "buttonName": "Tap to Continue",
      "mediaUrl": "/api/experiences/My%20Experience/stages/stage-1/stream",
      "uploadedFile": "/media/hls/1761416888140/index.m3u8",
      "pastedText": null,
      "hasUnlockCode": false,
      "unlockCode": null,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "stage-2",
      "position": 1,
      "type": "audio",
      "title": "Audio Content",
      "description": "Listen to this audio",
      "buttonSettings": "code",
      "buttonName": "Enter Code",
      "mediaUrl": "/api/experiences/My%20Experience/stages/stage-2/stream",
      "uploadedFile": "/uploads/experiences/audio/file.mp3",
      "pastedText": null,
      "hasUnlockCode": true,
      "unlockCode": "SECRET123",
      "createdAt": "2024-01-15T10:32:00Z",
      "updatedAt": "2024-01-15T10:32:00Z"
    }
  ]
}
```

**Error Responses:**
- `400`: Experience not found
- `403`: Experience is not published

---

### 2. POST `/experiences/:id/stages/:stageId/access`

Request access token for a specific stage to play its media.

**Parameters:**
- `id` (string, path): Experience ID (MongoDB ObjectId)
- `stageId` (string, path): Stage ID

**Response (200 OK):**
```json
{
  "manifestUrl": "/api/media-v2/stage-1/index.m3u8?token=eyJhbGc...",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "mediaType": "video",
  "uploadedFile": "/media/hls/1761416888140/index.m3u8"
}
```

**Usage Example:**
```javascript
// Request access token
const response = await fetch('/api/experiences/507f1f77bcf86cd799439011/stages/stage-1/access', {
  method: 'POST'
});

const { manifestUrl, token } = await response.json();

// Use manifestUrl and token with video/audio player
const videoPlayer = document.getElementById('player');
videoPlayer.src = `${manifestUrl}?token=${token}`;
```

**Error Responses:**
- `400`: Invalid experience/stage ID
- `403`: Experience is not published
- `404`: Stage not found

---

### 3. POST `/experiences/:id/stages/:stageId/unlock`

Validate an unlock code for a password-protected stage.

**Parameters:**
- `id` (string, path): Experience ID
- `stageId` (string, path): Stage ID

**Request Body:**
```json
{
  "code": "SECRET123"
}
```

**Response (200 OK):**
```json
{
  "codeValid": true
}
```

**Error Responses:**
- `400`: Code is invalid or stage doesn't require code
- `403`: Code doesn't match
- `404`: Experience or stage not found

---

### 4. GET `/experiences/:id/stages/:stageId/stream`

Get stream access with JWT token for a stage (similar to `/access` endpoint).

**Parameters:**
- `id` (string, path): Experience ID
- `stageId` (string, path): Stage ID

**Response (200 OK):**
```json
{
  "manifestUrl": "/api/media-v2/stage-1/index.m3u8",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "mediaType": "video",
  "uploadedFile": "/media/hls/1761416888140/index.m3u8"
}
```

---

### 5. GET `/media-v2/:stageId/:filename`

Serve media files or HLS stream segments with JWT authentication.

**Parameters:**
- `stageId` (string, path): Stage ID
- `filename` (string, path): Filename (e.g., `index.m3u8`, `seg00000.ts`)
- `token` (string, query): JWT token from `/stream` or `/access` endpoint

**Response:**
- For HLS playlist files: Returns modified M3U8 with rewritten segment URLs
- For media files: Returns the actual file with appropriate MIME type
- For HLS segments: Returns TS file

**Supported File Types:**
- `.mp3` - Audio files
- `.mp4` - Video files
- `.m4a` - Audio files
- `.webm` - Video files
- `.ts` - HLS video segments
- `.m3u8` - HLS playlists
- `.keyinfo` - Encryption key information
- `.txt`, `.json`, `.png`, `.jpg`, `.gif` - Other formats

**Example Usage:**
```javascript
// Get access token first
const streamResponse = await fetch('/api/experiences/expId/stages/stageId/stream');
const { manifestUrl, token } = await streamResponse.json();

// Play HLS stream
import Hls from 'hls.js';
const video = document.getElementById('video');
const hls = new Hls();
hls.loadSource(`${manifestUrl}?token=${token}`);
hls.attachMedia(video);
```

**Error Responses:**
- `401`: Missing or invalid token
- `403`: Token doesn't authorize access to this stage
- `404`: Media file not found

---

### 6. GET `/get-key-v2`

Get encryption key for encrypted HLS streams.

**Parameters:**
- `token` (string, query): JWT token from stream access endpoint

**Response:**
- Returns the content of the `.keyinfo` file (encrypted key information)
- Or empty response if no encryption key exists

**Error Responses:**
- `401`: Missing or invalid token
- `404`: Experience or stage not found

---

## JWT Token Payload

The JWT tokens generated by V2 routes contain the following payload:

```json
{
  "stageId": "stage-1",
  "experienceId": "507f1f77bcf86cd799439011",
  "mediaType": "video",
  "manifestFile": "/media/hls/1761416888140/index.m3u8",
  "iat": 1704984600,
  "exp": 1704985200
}
```

**Token Expiration:** 10 minutes from creation

---

## HLS Streaming Support

The V2 routes support HLS (HTTP Live Streaming) out of the box. Here's how it works:

### HLS File Structure
```
server/media/hls/
  1761416888140/
    ├── index.m3u8          # Main playlist
    ├── seg00000.ts         # Video segment 1
    ├── seg00001.ts         # Video segment 2
    ├── seg00002.ts         # Video segment 3
    ├── ...
    └── 1761416888140.keyinfo  # Encryption key info
```

### Playlist Rewriting
When serving the M3U8 playlist, the V2 controller automatically rewrites segment URLs to use the authenticated endpoint:

**Original M3U8:**
```
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
seg00000.ts
seg00001.ts
seg00002.ts
#EXT-X-ENDLIST
```

**Rewritten M3U8:**
```
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
/api/media-v2/stage-1/seg00000.ts?token=<JWT_TOKEN>
/api/media-v2/stage-1/seg00001.ts?token=<JWT_TOKEN>
/api/media-v2/stage-1/seg00002.ts?token=<JWT_TOKEN>
#EXT-X-ENDLIST
```

---

## Stage Types

The NewExperience model supports different stage types:

| Type | Description | Common File Extensions |
|------|-------------|----------------------|
| `video` | Video content | .mp4, .webm, .m3u8 (HLS) |
| `audio` | Audio content | .mp3, .m4a, .m3u8 (HLS) |
| `text` | Text content | .txt, .json |
| `image` | Image content | .png, .jpg, .jpeg, .gif |

---

## Button Settings

Stages support different interaction modes:

| Setting | Description | Related Field |
|---------|-------------|---------------|
| `tap` | User taps to continue | `buttonName` |
| `code` | User must enter code to continue | `codeValue` |

When `buttonSettings` is `code`, the `codeValue` field contains the unlock code.

---

## Security Features

1. **JWT Authentication:** All media serving endpoints require valid JWT tokens
2. **Token Expiration:** Tokens expire after 10 minutes
3. **Scoped Access:** Each token is scoped to a specific stage and experience
4. **Experience Status Check:** Only published experiences can be accessed
5. **Secure File Paths:** Direct file paths are not exposed to clients

---

## Comparison: V1 vs V2 Routes

### V1 Routes (Track-based)
```
GET  /api/experiences/:id/public
POST /api/experiences/:id/tracks/:trackId/access
POST /api/experiences/:id/tracks/:trackId/unlock
GET  /api/experiences/:id/tracks/:trackId/stream
GET  /api/media/:trackId/:filename
GET  /api/get-key
```

**Data Model:**
- Separate Experience and Track documents
- Track contains single media file (audioFile or videoFile)
- Limited styling options

### V2 Routes (Stage-based)
```
GET  /api/experiences/:id/public-v2
POST /api/experiences/:id/stages/:stageId/access
POST /api/experiences/:id/stages/:stageId/unlock
GET  /api/experiences/:id/stages/:stageId/stream
GET  /api/media-v2/:stageId/:filename
GET  /api/get-key-v2
```

**Data Model:**
- NewExperience with embedded stages array
- Stages support multiple media types (video, audio, text, image)
- Comprehensive styling and customization options
- Built-in HLS streaming support

---

## Error Handling

All V2 routes follow a consistent error response format:

**Error Response (4xx/5xx):**
```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad request (invalid parameters)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (access denied)
- `404` - Not found (resource doesn't exist)
- `500` - Server error

---

## Rate Limiting & Performance

The V2 routes are designed for performance:

1. **Lean Queries:** Database queries use `.lean()` for read-only operations
2. **Static File Serving:** HLS segments are served via Express static middleware
3. **Cache Headers:** Media files include appropriate cache control headers
4. **Token-based Access:** Reduces database queries during streaming

---

## Integration Example

Here's a complete example of using the V2 API:

```javascript
// 1. Get experience details
const expRes = await fetch('/api/experiences/My%20Experience/public-v2');
const experience = await expRes.json();

// 2. For each stage that needs unlocking
const stage = experience.stages[0];
if (stage.hasUnlockCode) {
  const unlockRes = await fetch(
    `/api/experiences/${experience.id}/stages/${stage.id}/unlock`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'SECRET123' })
    }
  );
  const { codeValid } = await unlockRes.json();
  if (!codeValid) throw new Error('Invalid code');
}

// 3. Get stream access
const streamRes = await fetch(
  `/api/experiences/${experience.id}/stages/${stage.id}/stream`
);
const { manifestUrl, token } = await streamRes.json();

// 4. Play the media
if (stage.type === 'video' || stage.type === 'audio') {
  const player = document.getElementById('player');
  player.src = `${manifestUrl}?token=${token}`;
}
```

---

## Database Schema Reference

### NewExperience Schema
```javascript
{
  _id: ObjectId,
  title: String,
  subtitle: String,
  description: String,
  studioId: ObjectId (ref: Studio),
  
  // Styling
  primaryColor: String,
  secondaryColor: String,
  backgroundColor: String,
  textColor: String,
  buttonColor: String,
  buttonTextColor: String,
  fontFamily: String,
  headingSize: String,
  
  // Settings
  visibility: 'public' | 'private' | 'unlisted',
  status: 'draft' | 'published' | 'archived',
  allowComments: Boolean,
  autoPlayMedia: Boolean,
  passwordProtection: Boolean,
  trackInteractions: Boolean,
  
  // Player Controls
  showPlayPauseButton: Boolean,
  showBackButton: Boolean,
  showNextButton: Boolean,
  enableLoopTracks: Boolean,
  enableStageNavigation: Boolean,
  
  // Stages
  stages: [
    {
      id: String,
      position: Number,
      type: 'audio' | 'video' | 'text' | 'image',
      title: String,
      description: String,
      buttonSettings: 'tap' | 'code',
      buttonName: String,
      codeValue: String,
      uploadedFile: String,  // URL or path to file
      pastedText: String,
      createdAt: Date,
      updatedAt: Date
    }
  ],
  
  // Analytics
  analytics: {
    totalViews: Number,
    uniqueVisitors: Number,
    completionRate: Number,
    avgSessionTime: String
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

---

## Troubleshooting

### Token Expired
- Tokens expire after 10 minutes
- Request a new token before expiration
- Solution: Refresh token by calling `/stream` endpoint again

### Media File Not Found
- Verify the stage's `uploadedFile` path is correct
- Check if the file exists in the server's media directory
- Ensure the filename in the request matches the actual file

### HLS Playback Issues
- Verify HLS.js or compatible player is being used
- Check that segment URLs include the token parameter
- Confirm encryption keys are available if stream is encrypted

### Access Denied
- Verify the experience is published (`status: 'published'`)
- Check that the JWT token is valid and not expired
- Ensure the stage exists in the experience

---

## Related Files

- Route Definition: `server/routes/publicExperienceRoutesV2.js`
- Controller Functions: `server/controler/experienceControllerV2.js`
- Data Model: `server/model/NewExperience.js`
- Server Configuration: `server/index.js`
