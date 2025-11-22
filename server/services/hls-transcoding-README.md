# HLS Transcoding Service

This service handles the conversion of audio/video files to HLS (HTTP Live Streaming) format for secure streaming.

## Requirements

- FFmpeg must be installed and available in the system PATH
  - On Windows: Download from https://ffmpeg.org/download.html
  - On macOS: Install via Homebrew with `brew install ffmpeg`
  - On Linux: Install via package manager (e.g., `sudo apt install ffmpeg`)

## How it Works

1. When a track with audio or video content is uploaded, the HLS transcoding service is triggered automatically
2. The service creates an encrypted HLS stream with the following components:
   - Playlist file (index.m3u8) containing the manifest
   - Encrypted segments (seg00000.ts, seg0001.ts, etc.)
   - Encryption key file (.key)

3. The process follows these steps:
   - Create a unique output directory for the track using its MongoDB _id
   - Generate a deterministic encryption key
   - Create a keyinfo file for FFmpeg
   - Run FFmpeg to transcode the input file to HLS format
   - Update the Track document with HLS path and file ID
   - Clean up temporary files

## File Structure

After processing, the following files are created:

```
server/
└── media/
    ├── hls/
    │   └── <fileId>/
    │       ├── index.m3u8      # HLS playlist
    │       ├── seg00000.ts     # Encrypted segment
    │       ├── seg00001.ts     # Encrypted segment
    │       └── <fileId>.key    # Encryption key
    └── tmp/                    # Temporary files (cleaned up after processing)
        └── <fileId>.keyinfo    # Temporary keyinfo file
```

## Configuration

The CDN host is configured via the `CDN_HOST` environment variable in the `.env` file:

```
CDN_HOST=your-cdn-domain.com
```

If not set, it defaults to 'localhost'.

## Track Model Updates

The HLS transcoding service adds two fields to the Track model:

- `hlsPath`: Path to the HLS playlist file
- `fileId`: Unique file identifier (same as MongoDB _id)

## Error Handling

- If FFmpeg is not available, the service logs a warning and the upload proceeds without HLS transcoding
- Any errors during the transcoding process are logged but do not affect the original upload
- The original track upload is always successful regardless of HLS processing outcome
