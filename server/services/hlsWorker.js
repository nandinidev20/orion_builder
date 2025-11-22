import { parentPort } from 'worker_threads';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { spawn, execSync } from 'child_process';

const checkFfmpeg = () => {
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
};

const ffmpegAvailable = checkFfmpeg();

const ensureKeyFile = async (keyPath) => {
  try {
    await fs.access(keyPath);
  } catch (error) {
    const key = crypto.randomBytes(16);
    await fs.writeFile(keyPath, key);
  }
};

const createKeyInfoFile = async (keyInfoPath, fileId, outDir) => {
  const absoluteKeyPath = path.resolve(`${outDir}/${fileId}.key`);
  const iv = crypto.randomBytes(16).toString('hex');
  // Use absolute path starting with / so it's relative to the root domain
  const keyUrl = `/api/get-key-v2?track=${fileId}`;
  const keyInfoContent = `${keyUrl}\n${absoluteKeyPath}\n${iv}\n`;
  await fs.writeFile(keyInfoPath, keyInfoContent, 'utf8');
};

const transcodeToHls = async (inputPath, fileId, onProgress) => {
  if (!ffmpegAvailable) {
    throw new Error('FFmpeg is not available');
  }

  const outDir = `server/media/hls/${fileId}`;
  const keyPath = `${outDir}/${fileId}.key`;
  const keyInfoPath = `${outDir}/${fileId}.keyinfo`;

  try {
    await fs.mkdir(outDir, { recursive: true });
    await ensureKeyFile(keyPath);
    await createKeyInfoFile(keyInfoPath, fileId, outDir);

    const isAudio = ['.mp3', '.wav', '.aac', '.flac', '.ogg'].some(ext => 
      inputPath.toLowerCase().endsWith(ext));

    return new Promise((resolve, reject) => {
      let ffmpegArgs = [
        '-y',
        '-i', inputPath,
      ];

      if (isAudio) {
        ffmpegArgs = ffmpegArgs.concat([
          '-codec:a', 'libmp3lame',
          '-ar', '44100',
          '-b:a', '192k',
          '-hls_time', '6',
          '-hls_playlist_type', 'vod',
          '-hls_key_info_file', keyInfoPath,
          '-hls_segment_filename', `${outDir}/seg%05d.ts`,
          `${outDir}/index.m3u8`
        ]);
      } else {
        ffmpegArgs = ffmpegArgs.concat([
          '-codec:v', 'libx264',
          '-codec:a', 'aac',
          '-hls_time', '6',
          '-hls_playlist_type', 'vod',
          '-hls_key_info_file', keyInfoPath,
          '-hls_segment_filename', `${outDir}/seg%05d.ts`,
          `${outDir}/index.m3u8`
        ]);
      }

      const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
      let stderr = '';
      let lastProgressUpdate = 0;
      const progressUpdateInterval = 500;

      ffmpegProcess.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;

        const timeMatch = output.match(/time=(\d+):(\d+):(\d+)/);
        const durationMatch = stderr.match(/Duration: (\d+):(\d+):(\d+)/);

        if (timeMatch && durationMatch && Date.now() - lastProgressUpdate > progressUpdateInterval) {
          const currentTime = timeMatch[1] * 3600 + timeMatch[2] * 60 + parseInt(timeMatch[3]);
          const duration = durationMatch[1] * 3600 + durationMatch[2] * 60 + parseInt(durationMatch[3]);
          const progress = Math.min(Math.round((currentTime / duration) * 100), 99);

          if (onProgress) {
            onProgress({ progress, stage: 'encoding' });
          }

          lastProgressUpdate = Date.now();
        }
      });

      ffmpegProcess.on('close', (code) => {
        if (code === 0) {
          if (onProgress) {
            onProgress({ progress: 100, stage: 'encoding' });
          }
          resolve(`${outDir}/index.m3u8`);
        } else {
          reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
        }
      });

      ffmpegProcess.on('error', (error) => {
        reject(error);
      });
    });
  } catch (error) {
    throw error;
  }
};

parentPort.on('message', async (message) => {
  const { inputPath, fileId } = message;

  try {
    const hlsPath = await transcodeToHls(inputPath, fileId, (progressData) => {
      parentPort.postMessage({ type: 'progress', data: progressData });
    });

    parentPort.postMessage({ type: 'complete', data: { hlsPath, fileId } });
  } catch (error) {
    parentPort.postMessage({ type: 'error', data: { error: error.message } });
  }
});
