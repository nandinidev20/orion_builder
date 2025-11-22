import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { newExperienceAPI, publicExperienceAPI } from '../services/api.js';
import DocumentViewer from '../components/common/DocumentViewer';
import { utcToLocalDate } from '../utils/timezoneHelper.js';
import Hls from 'hls.js';

/**
 * GuestExperience Component
 *
 * Synced Settings from Settings.jsx:
 * ✅ showPlayPauseButton - Shows/hides play/pause button in video player
 * ✅ showBackButton - Shows/hides back button in video player and navigation
 * ✅ showNextButton - Shows/hides next button in video player and navigation
 * ✅ enableLoopTracks - When enabled, loops back to first stage instead of completion
 * ✅ enableShuffleTracks - When enabled, randomizes the playback order of stages
 * ✅ enableStageNavigation - Controls visibility of progress dots and backward navigation
 * ✅ autoAdvanceStage - When enabled, automatically advances to next stage when media ends
 *
 * Features:
 * - All stages are shuffled on load if enableShuffleTracks is true
 * - Progress dots show playback progress and respect enableStageNavigation
 * - Auto-advance delays 500ms before moving to next stage
 * - Loop functionality redirects to first stage when reaching the end
 * - All button visibility is controlled by the respective settings
 */
const GuestExperience = () => {
  const { slug } = useParams();
  const mediaRef = useRef(null);
  const hlsRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const fetchInterceptorRef = useRef(null);
  const originalFetchRef = useRef(null);

  // Experience state
  const [experience, setExperience] = useState(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [experienceStatus, setExperienceStatus] = useState('loading');
  const [timeUntilStart, setTimeUntilStart] = useState(null);
  const [subdomainVerified, setSubdomainVerified] = useState(false);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playerError, setPlayerError] = useState(null);
  const [isBuffering, setIsBuffering] = useState(false);

  // Access control state
  const [showCodePreviewModal, setShowCodePreviewModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockCode, setUnlockCode] = useState('');
  const [unlockError, setUnlockError] = useState(null);
  const [stageUnlocked, setStageUnlocked] = useState(new Set());
  const [currentUnlockCode, setCurrentUnlockCode] = useState('');

  // Completion state
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);

  // Stream state
  const [streamToken, setStreamToken] = useState(null);
  const [manifestUrl, setManifestUrl] = useState(null);

  // Shuffle and loop tracking
  const [stageOrder, setStageOrder] = useState([]);
  const [isShuffled, setIsShuffled] = useState(false);

  // Join and Start modal state
  const [showJoinStartModal, setShowJoinStartModal] = useState(false);
  const [hasSessionStarted, setHasSessionStarted] = useState(false);
  const [firstStageAutoPlayed, setFirstStageAutoPlayed] = useState(false);

  // Reset firstStageAutoPlayed when moving to next stage via handleNextStage
  useEffect(() => {
    if (currentStageIndex > 0) {
      setFirstStageAutoPlayed(true); // Prevent re-autoplay on subsequent stages
    }
  }, [currentStageIndex])

  // Get current stage based on shuffle order
  const getCurrentStageIndex = () => {
    if (!stageOrder || stageOrder.length === 0) return currentStageIndex;
    return stageOrder[currentStageIndex] ?? currentStageIndex;
  };

  const currentStage = experience?.stages?.[getCurrentStageIndex()];
  const totalStages = experience?.stages?.length || 0;

  // Show Join and Start modal on first load if play button is hidden
  useEffect(() => {
    if (experienceStatus === 'active' &&
        currentStageIndex === 0 &&
        experience?.showPlayPauseButton === false &&
        !hasSessionStarted &&
        currentStage) {
      setShowJoinStartModal(true);
    }
  }, [experienceStatus, currentStageIndex, experience?.showPlayPauseButton, hasSessionStarted, currentStage]);

  // Initialize stage order (shuffle if enabled)
  useEffect(() => {
    if (!experience?.stages || experience.stages.length === 0) return;

    const indices = Array.from({ length: experience.stages.length }, (_, i) => i);

    // If shuffle is enabled, randomize the order
    if (experience.enableShuffleTracks) {
      const shuffled = [...indices].sort(() => Math.random() - 0.5);
      setStageOrder(shuffled);
      setIsShuffled(true);
      console.log('🎵 Stages shuffled:', shuffled);
    } else {
      setStageOrder(indices);
      setIsShuffled(false);
    }

    // Log all active player settings
    console.log('📺 Experience Settings:', {
      enableShuffleTracks: experience.enableShuffleTracks,
      enableLoopTracks: experience.enableLoopTracks,
      autoAdvanceStage: experience.autoAdvanceStage,
      enableStageNavigation: experience.enableStageNavigation,
      showPlayPauseButton: experience.showPlayPauseButton,
      showBackButton: experience.showBackButton,
      showNextButton: experience.showNextButton
    });
  }, [experience?.enableShuffleTracks, experience?.stages]);

  // Helper: Extract subdomain from hostname
  const extractSubdomain = (hostname) => {
    if (!hostname) return null;

    const parts = hostname.split('.');

    // Handle cases like "mystudio.lvh.me" or "mystudio.lvh.me:5173"
    if (parts.length >= 2) {
      // Remove port if present
      const host = parts[0];

      // Skip "localhost" and "127.0.0.1"
      if (host === 'localhost' || host === '127.0.0.1') {
        return null;
      }

      return host.toLowerCase();
    }

    return null;
  };

  // Helper: Verify subdomain matches on experience load
  useEffect(() => {
    if (!experience || !experience.studioSubdomain) {
      return;
    }

    const currentHostname = window.location.hostname;
    const currentSubdomain = extractSubdomain(currentHostname);
    const expectedSubdomain = experience.studioSubdomain.toLowerCase();

    console.log('Subdomain verificationss:', {
      currentHostname,
      currentSubdomain,
      expectedSubdomain,
      match: currentSubdomain === expectedSubdomain
    });

    // If subdomain doesn't match, redirect to correct subdomain
    if (currentSubdomain !== expectedSubdomain) {
      const port = window.location.port ? `:${window.location.port}` : '';
      const protocol = window.location.protocol;
      const baseDomain = currentHostname.split('.').slice(1).join('.') || 'lvh.me';

      const newUrl = `${protocol}//${expectedSubdomain}.${baseDomain}${port}/experience/${slug}`;
      console.log(`Subdomain mismatch detected! Redirecting from ${currentSubdomain} to ${expectedSubdomain}`);
      console.log(`Redirect URL: ${newUrl}`);

      // Perform redirect
      window.location.href = newUrl;
      return; // Exit without setting verified flag
    }

    // Subdomain matches, allow page to load
    setSubdomainVerified(true);
  }, [experience, slug]);

  // Get asset URL helper
  const getAssetUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;

    const apiBaseUrl = localStorage.getItem('apiBaseUrl') || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '');

    let normalizedPath = path.replace(/\\/g, '/');
    normalizedPath = normalizedPath.replace(/^\/+/, '');

    return `${baseUrl}/${normalizedPath}`;
  };

  // Check experience status
  const checkExperienceStatus = useCallback(() => {
    if (!experience) return;

    const now = new Date();
    // Convert UTC dates from server to local time for proper comparison
    const startDate = experience.startDate ? utcToLocalDate(experience.startDate) : null;
    const endDate = experience.endDate ? utcToLocalDate(experience.endDate) : null;

    if (!startDate && !endDate) {
      setExperienceStatus('active');
      setTimeUntilStart(null);
      return;
    }

    if (endDate && now > endDate) {
      setExperienceStatus('expired');
      setTimeUntilStart(null);
      return;
    }

    if (startDate && now < startDate) {
      const secondsUntilStart = Math.floor((startDate - now) / 1000);
      setExperienceStatus('scheduled');
      setTimeUntilStart(secondsUntilStart);
      return;
    }

    setExperienceStatus('active');
    setTimeUntilStart(null);
  }, [experience]);

  // Countdown timer
  useEffect(() => {
    if (experienceStatus !== 'scheduled') return;

    countdownIntervalRef.current = setInterval(() => {
      setTimeUntilStart(prev => {
        if (prev === null || prev <= 0) {
          checkExperienceStatus();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [experienceStatus, checkExperienceStatus]);

  // Fetch experience
  useEffect(() => {
    const fetchExperience = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await newExperienceAPI.getNewExperienceBySlug(slug);
        setExperience(response.data);
      } catch (err) {
        setError(err.message || 'Failed to load experience');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchExperience();
    }
  }, [slug]);

  // Check status on experience load
  useEffect(() => {
    if (experience) {
      checkExperienceStatus();
    }
  }, [experience, checkExperienceStatus]);

  // Get stream access token (proper JWT flow)
  const getStreamAccess = useCallback(async () => {
    if (!experience || !currentStage) {
      console.log('Missing experience or currentStage:', { hasExperience: !!experience, hasStage: !!currentStage });
      return null;
    }

    try {
      const experienceId = experience._id || experience.id;
      if (!experienceId) {
        console.error('Experience has no ID:', experience);
        setPlayerError('Experience ID not found');
        return null;
      }

      console.log('Calling getStreamAccessTokenV2 with:', { experienceId, stageId: currentStage.id });
      const response = await publicExperienceAPI.getStreamAccessTokenV2(experienceId, currentStage.id);
      console.log('Stream access response:', response);

      const data = response.data ? response.data : response;
      const { manifestUrl: url, token } = data;

      if (!url || !token) {
        console.error('Missing manifestUrl or token in response:', data);
        setPlayerError('Invalid stream access response');
        return null;
      }

      console.log('Got stream access:', { url, token });
      setManifestUrl(url);
      setStreamToken(token);
      return { manifestUrl: url, token };
    } catch (err) {
      console.error('Failed to get stream token:', err);
      setPlayerError('Failed to get stream access: ' + (err.message || 'Unknown error'));
      return null;
    }
  }, [experience, currentStage]);

  // Initialize HLS player with proper token flow
  useEffect(() => {
    if (experienceStatus !== 'active' || !currentStage) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    const initializeHls = async () => {
      const media = mediaRef.current;
      if (!media) {
        console.error('Media element not found');
        return;
      }

      console.log('Initializing media for stage:', currentStage?.id, 'Type:', currentStage?.type);

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      try {
        setPlayerError(null);
        setIsBuffering(true);

        const streamAccess = await getStreamAccess();
        if (!streamAccess) {
          console.error('No stream access returned');
          setPlayerError('Failed to access media stream');
          setIsBuffering(false);
          return;
        }

        const { manifestUrl: url, token: accessToken } = streamAccess;
        console.log('Stream access obtained:', { url, hasToken: !!accessToken });

        originalFetchRef.current = window.fetch;
        fetchInterceptorRef.current = function(...args) {
          let urlStr = args[0];
          if (typeof urlStr === 'string' && !urlStr.includes('token=') && accessToken) {
            if (urlStr.includes('get-key') || urlStr.includes('.m3u8') || urlStr.includes('.ts') ||
                urlStr.includes('/api/media-v2/')) {
              const sep = urlStr.includes('?') ? '&' : '?';
              args[0] = `${urlStr}${sep}token=${accessToken}`;
            }
          }
          // Intercept response to validate Content-Type
          return originalFetchRef.current.apply(window, args).then(response => {
            const contentType = response.headers.get('content-type');
            const url = response.url;
            if (url && url.includes('/api/media-v2/') && contentType) {
              // Log Content-Type for validation
              const fileExtension = url.split('.').pop().toLowerCase();
              console.log(`Content-Type validation: ${url.substring(url.lastIndexOf('/'))} => ${contentType}`);

              // Check for potential mismatches
              if (fileExtension === 'wav' && !contentType.includes('audio')) {
                console.warn(`⚠️ Content-Type mismatch for .wav file: got "${contentType}", expected "audio/wav"`);
              } else if ((fileExtension === 'mp3' || fileExtension === 'm4a') && !contentType.includes('audio')) {
                console.warn(`⚠️ Content-Type mismatch for audio file: got "${contentType}", expected audio type`);
              } else if ((fileExtension === 'mp4' || fileExtension === 'webm' || fileExtension === 'avi') && !contentType.includes('video')) {
                console.warn(`⚠️ Content-Type mismatch for video file: got "${contentType}", expected video type`);
              }
            }
            return response;
          });
        };
        window.fetch = fetchInterceptorRef.current;

    const apiBaseUrl = localStorage.getItem('apiBaseUrl') || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
        const separator = url.includes('?') ? '&' : '?';
        const fullUrl = `${baseUrl}${url}${separator}token=${accessToken}`;

        if (fullUrl.includes('.m3u8')) {
          // HLS stream
          if (Hls.isSupported()) {
            const hls = new Hls({
              debug: false,
              enableWorker: true,
              lowLatencyMode: false,
              xhrSetup: (xhr, requestUrl) => {
                let finalUrl = requestUrl;
                if (!requestUrl.includes('token=') && accessToken) {
                  const sep = requestUrl.includes('?') ? '&' : '?';
                  finalUrl = `${requestUrl}${sep}token=${accessToken}`;
                }
                xhr.open('GET', finalUrl, true);
              }
            });

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              console.log('HLS manifest parsed');
              setIsBuffering(false);
            });
            hls.on(Hls.Events.BUFFER_APPENDED, () => setIsBuffering(false));
            hls.on(Hls.Events.ERROR, (event, data) => {
              console.error('HLS error:', data);
              if (data.fatal) {
                setIsBuffering(false);
                console.error('Fatal HLS error, showing message');
                setPlayerError('Unable to load media stream. Try refreshing the page.');
              }
            });

            hls.loadSource(fullUrl);
            hls.attachMedia(media);
            hlsRef.current = hls;
            console.log('HLS.js attached');
          } else if (media.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari, iOS)
            media.src = fullUrl;
            console.log('Using native HLS support');
            setIsBuffering(false);
          } else {
            setPlayerError('HLS playback not supported in this browser. Please try Chrome, Safari, or Edge.');
            setIsBuffering(false);
          }
        } else {
          // Direct media file (MP4, WebM, Ogg, WAV, etc.)
          console.log('Setting direct media source:', fullUrl);

          // Clear any existing source elements
          while (media.firstChild) {
            media.removeChild(media.firstChild);
          }

          // Determine media type from file extension
          let mediaType = 'audio/mpeg'; // default
          if (fullUrl.includes('.wav')) {
            mediaType = 'audio/wav';
          } else if (fullUrl.includes('.mp3')) {
            mediaType = 'audio/mpeg';
          } else if (fullUrl.includes('.mp4')) {
            mediaType = 'video/mp4';
          } else if (fullUrl.includes('.webm')) {
            mediaType = 'video/webm';
          } else if (fullUrl.includes('.ogg') || fullUrl.includes('.oga')) {
            mediaType = 'audio/ogg';
          } else if (fullUrl.includes('.m4a')) {
            mediaType = 'audio/mp4';
          }

          // Create source element with correct type
          const sourceElement = document.createElement('source');
          sourceElement.src = fullUrl;
          sourceElement.type = mediaType;
          media.appendChild(sourceElement);

          console.log('Media source added:', { type: mediaType, src: fullUrl });

          // IMPORTANT: Call load() to trigger loading after adding source element
          media.load();
          console.log('🎬 Calling media.load() to trigger loading...');

          // Add error event listener for better debugging
          const handleError = () => {
            const errorCode = media.error?.code;
            const errorMessages = {
              1: 'Media loading aborted',
              2: 'Network error while loading media',
              3: 'Media decoding failed - format may not be supported',
              4: 'Media format not supported by this browser'
            };
            const message = errorMessages[errorCode] || 'Unknown media error';
            console.error(`Media error (${errorCode}): ${message}`);
            setPlayerError(`${message}. Try using a different browser like Chrome or Edge.`);
            setIsBuffering(false);
          };

          media.addEventListener('error', handleError);
          setIsBuffering(false);
        }
      } catch (err) {
        console.error('HLS init failed:', err);
        setPlayerError('Failed to initialize player: ' + err.message);
        setIsBuffering(false);
      }
    };

    initializeHls();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (fetchInterceptorRef.current && window.fetch === fetchInterceptorRef.current && originalFetchRef.current) {
        window.fetch = originalFetchRef.current;
      }
    };
  }, [currentStage, experienceStatus, getStreamAccess]);

  // Media event listeners with auto-advance logic
  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const handleTimeUpdate = () => {
      setCurrentTime(media.currentTime);
      const progressPercent = media.duration ? Math.floor((media.currentTime / media.duration) * 100) : 0;
      setProgress(progressPercent);
    };

    const handleLoadedMetadata = async () => {
      setDuration(media.duration || 0);
      console.log('Media loaded successfully:', { duration: media.duration });

      // Auto-play logic:
      // 1. First stage after "Join and Start" - always auto-play
      // 2. Subsequent stages after auto-advance - use smart auto-play logic
      const shouldAutoPlayFirstStage = hasSessionStarted && !firstStageAutoPlayed && currentStageIndex === 0;
      const shouldAutoPlayAfterAutoAdvance = hasSessionStarted && firstStageAutoPlayed && currentStageIndex > 0 && (!experience?.showPlayPauseButton || experience?.autoAdvanceStage);

      if ((shouldAutoPlayFirstStage || shouldAutoPlayAfterAutoAdvance) && (currentStage?.type === 'audio' || currentStage?.type === 'video')) {
        console.log('🎬 Auto-playing stage...');

        try {
          // Unmute if needed
          media.muted = false;
          media.volume = 1;
          setIsMuted(false);
          setVolume(1);

          const playPromise = media.play();
          if (playPromise !== undefined) {
            await playPromise;
            console.log('✅ Stage auto-playing');
            setIsPlaying(true);
            if (currentStageIndex === 0) {
              setFirstStageAutoPlayed(true);
            }
          }
        } catch (err) {
          console.warn('⚠️ Auto-play failed:', err.name);
        }
      }
    };

    const handleLoadStart = () => {
      console.log('Media load started');
      setPlayerError(null);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);

    // Handle media loading errors
    const handleError = () => {
      setIsBuffering(false);
      const errorCode = media.error?.code;
      let errorMessage = 'Failed to load media';
      if (errorCode === 1) {
        errorMessage = 'Media loading aborted';
      } else if (errorCode === 2) {
        errorMessage = 'Network error while loading media';
      } else if (errorCode === 3) {
        errorMessage = 'Media decoding failed';
      } else if (errorCode === 4) {
        errorMessage = 'Media format not supported';
      }
      console.error('Media error:', { code: errorCode, message: media.error?.message });
      setPlayerError(errorMessage);
    };

    // Handle media end - check for auto-advance or code unlock
    const handleEnded = () => {
      setIsPlaying(false);

      // Check if there's a next stage
      const hasNextStage = currentStageIndex < totalStages - 1;

      if (!hasNextStage) {
        // At the end - check for loop or completion
        if (experience?.enableLoopTracks) {
          // Auto-advance back to first stage if loop is enabled
          // Auto-play will be handled by handleLoadedMetadata when media is ready
          setTimeout(() => {
            setCurrentStageIndex(0);
            setProgress(0);
            setCurrentTime(0);
            setPlayerError(null);
          }, 500);
        }
        return;
      }

      // Get the next stage from shuffled order
      const nextShuffledIndex = currentStageIndex + 1;
      const nextActualStageIndex = stageOrder[nextShuffledIndex];
      const nextStage = experience?.stages?.[nextActualStageIndex];

      // If next stage requires code unlock, show code preview modal first
      if (nextStage?.buttonSettings === 'code' && !stageUnlocked.has(nextStage.id)) {
        setCurrentUnlockCode(nextStage.codeValue || '');
        setShowCodePreviewModal(true);
        return;
      }

      // Auto-advance if current stage has 'none' unlock type
      // Auto-play will be handled by handleLoadedMetadata when media is ready
      if (currentStage?.buttonSettings === 'none') {
        setTimeout(() => {
          setCurrentStageIndex(prev => prev + 1);
          setProgress(0);
          setCurrentTime(0);
          setPlayerError(null);
        }, 500); // 500ms delay before advancing to next stage
      }
    };

    media.addEventListener('timeupdate', handleTimeUpdate);
    media.addEventListener('loadedmetadata', handleLoadedMetadata);
    media.addEventListener('loadstart', handleLoadStart);
    media.addEventListener('play', handlePlay);
    media.addEventListener('pause', handlePause);
    media.addEventListener('waiting', handleWaiting);
    media.addEventListener('canplay', handleCanPlay);
    media.addEventListener('ended', handleEnded);
    media.addEventListener('error', handleError);
    media.volume = isMuted ? 0 : volume;

    return () => {
      media.removeEventListener('timeupdate', handleTimeUpdate);
      media.removeEventListener('loadedmetadata', handleLoadedMetadata);
      media.removeEventListener('loadstart', handleLoadStart);
      media.removeEventListener('play', handlePlay);
      media.removeEventListener('pause', handlePause);
      media.removeEventListener('waiting', handleWaiting);
      media.removeEventListener('canplay', handleCanPlay);
      media.removeEventListener('ended', handleEnded);
      media.removeEventListener('error', handleError);
    };
  }, [volume, isMuted, currentStageIndex, experience, stageOrder, totalStages, hasSessionStarted, firstStageAutoPlayed, currentStage, stageUnlocked]);


  // Format time
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCountdown = (seconds) => {
    if (!seconds) return '00:00:00';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Player controls
  const handlePlayPause = () => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play().catch(err => console.warn('Playback error:', err));
      }
    }
  };

  const handleProgressClick = (e) => {
    const media = mediaRef.current;
    if (!media || isNaN(media.duration)) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    media.currentTime = pos * media.duration;
  };

  const handleNextStage = () => {
    console.log('Next stage clicked');
    const hasNextStage = currentStageIndex < totalStages - 1;

    if (!hasNextStage) {
      // If loop is enabled, go back to first stage
      if (experience?.enableLoopTracks) {
        setCurrentStageIndex(0);
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        setPlayerError(null);
        return;
      }

      // Otherwise show completion screen
      setShowCompletionScreen(true);
      return;
    }

    // Check if this is the last stage (completion)
    const isLastStage = currentStageIndex === totalStages - 1;

    // Check if current track has finished playing
    const trackHasEnded = mediaRef.current && duration > 0 && currentTime >= duration - 0.5;

    // If on last stage, enforce track completion
    if (isLastStage) {
      if (!trackHasEnded) {
        // Track hasn't finished yet - show error message
        setUnlockError('You must watch the full track to complete the experience');
        return;
      }
      // Track has ended - show completion screen
      setShowCompletionScreen(true);
      return;
    }

    // Get the actual stage index from the shuffled order
    const nextShuffledIndex = currentStageIndex + 1;
    const nextActualStageIndex = stageOrder[nextShuffledIndex];
    const nextStage = experience?.stages?.[nextActualStageIndex];

    // Check if next stage requires code unlock
    if (nextStage?.buttonSettings === 'code' && !stageUnlocked.has(nextStage.id)) {
      if (!trackHasEnded) {
        // Track hasn't finished yet - show error message
        setUnlockError('You must listen to the entire track before unlocking the next stage');
        return;
      }

      // Track has ended - show code preview modal (this path is normally taken from handleEnded)
      setCurrentUnlockCode(nextStage.codeValue || '');
      setShowCodePreviewModal(true);
    } else {
      setCurrentStageIndex(prev => prev + 1);
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      setPlayerError(null);
    }
  };

  const handlePreviousStage = () => {
    if (experience?.enableStageNavigation !== false && currentStageIndex > 0) {
      setCurrentStageIndex(prev => prev - 1);
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      setPlayerError(null);
      setShowCompletionScreen(false);
    }
  };

  const handleUnlockStage = async (e) => {
    e.preventDefault();
    setUnlockError(null);

    if (!unlockCode.trim()) {
      setUnlockError('Please enter a code');
      return;
    }

    // Get next stage from shuffled order
    const nextShuffledIndex = currentStageIndex + 1;
    const nextActualStageIndex = stageOrder[nextShuffledIndex];
    const nextStage = experience?.stages?.[nextActualStageIndex];

    if (!nextStage) {
      setUnlockError('No next stage found');
      return;
    }

    if (unlockCode.trim() === nextStage.codeValue) {
      setStageUnlocked(prev => new Set([...prev, nextStage.id]));
      setShowUnlockModal(false);
      setUnlockCode('');

      setCurrentStageIndex(prev => prev + 1);
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      setPlayerError(null);
    } else {
      setUnlockError('Invalid code. Please try again.');
    }
  };

  const isStageUnlocked = !currentStage?.buttonSettings ||
                          currentStage?.buttonSettings === 'tap' ||
                          currentStage?.buttonSettings === 'none' ||
                          stageUnlocked.has(currentStage?.id);

  // Helper function to get player background color with opacity
  const getPlayerBackgroundColor = () => {
    const hex = experience.playerBackgroundColor?.replace('#', '') || '0a0a0a';
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const opacity = experience.playerBackgroundOpacity ?? 0.8;
    return `rgba(${r},${g},${b},${opacity})`;
  };

  // Helper function for progress bar background
  const getProgressBarBackground = () => {
    const secondaryColor = experience.secondaryTextColor || '#6b7280';
    const hex = secondaryColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r},${g},${b},0.25)`;
  };

  // Handle Join and Start button click
  const handleJoinAndStart = async () => {
    setShowJoinStartModal(false);
    setHasSessionStarted(true);

    // Try to autoplay immediately (user gesture satisfied)
    if (mediaRef.current) {
      try {
        // Unmute and set volume to normal
        mediaRef.current.muted = false;
        mediaRef.current.volume = 1;
        setIsMuted(false);
        setVolume(1);
        console.log('🔊 Volume unmuted for autoplay');
        console.log('Media readyState:', mediaRef.current.readyState);
        console.log('Media src:', mediaRef.current.src);

        // Wait a bit for media to be ready if needed
        if (mediaRef.current.readyState < 2) {
          console.log('Waiting for media to load...');
          // Wait for canplay event
          const canPlayPromise = new Promise((resolve) => {
            const handleCanPlay = () => {
              mediaRef.current?.removeEventListener('canplay', handleCanPlay);
              resolve();
            };
            mediaRef.current?.addEventListener('canplay', handleCanPlay);
            // Timeout after 3 seconds
            setTimeout(resolve, 3000);
          });
          await canPlayPromise;
        }

        const playPromise = mediaRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          console.log('✅ Autoplay started on user gesture');
          setIsPlaying(true);
        }
      } catch (err) {
        console.warn('⚠️ Autoplay failed:', err.name);
      }
    }
  };

  // Auto-advance stages with 'none' unlock type when they have no media
  useEffect(() => {
    if (experienceStatus === 'active' && currentStage?.buttonSettings === 'none') {
      // Check if stage has media to play
      const hasMedia = currentStage?.uploadedFile || currentStage?.type === 'text';

      // If no media, auto-advance after a short delay
      if (!hasMedia && currentStageIndex < totalStages - 1) {
        const timer = setTimeout(() => {
          setCurrentStageIndex(prev => prev + 1);
          setProgress(0);
          setCurrentTime(0);
          setPlayerError(null);
        }, 500);

        return () => clearTimeout(timer);
      }
    }
  }, [currentStage?.buttonSettings, currentStageIndex, totalStages, experienceStatus, currentStage?.uploadedFile, currentStage?.type]);

  // Loading state
  if (loading || !subdomainVerified) {
    const isRedirecting = experience && !subdomainVerified;

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: experience?.backgroundColor || '#ffffff',
        fontFamily: "'Inter', -apple-system, sans-serif"
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 24px',
            borderRadius: '50%',
            backgroundColor: `${experience?.primaryColor || '#3b82f6'}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            animation: 'spin 2s linear infinite'
          }}>⭐</div>
          <p style={{ color: experience?.primaryColor || '#3b82f6', fontSize: '18px', fontWeight: '600' }}>
            {isRedirecting ? 'Verifying access...' : 'Loading experience...'}
          </p>
          {isRedirecting && (
            <p style={{ color: experience.secondaryTextColor || '#6b7280', fontSize: '14px', marginTop: '12px' }}>
              Redirecting to correct studio domain...
            </p>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !experience) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: experience?.backgroundColor || '#ffffff',
        padding: '20px',
        fontFamily: "'Inter', -apple-system, sans-serif"
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          padding: '48px 32px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          border: `1px solid ${experience?.borderColor || '#e5e7eb'}`
        }}>
          <div style={{ fontSize: '56px', marginBottom: '24px' }}>������</div>
          <h2 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '12px', color: experience?.textColor || '#1f2937' }}>Error</h2>
          <p style={{ color: '#6b7280', marginBottom: '32px', fontSize: '15px', lineHeight: '1.6' }}>
            {error || 'The experience you requested could not be found.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              width: '100%',
              padding: '14px 24px',
              backgroundColor: experience?.primaryColor || '#3b82f6',
              color: experience?.buttonTextColor || '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: `0 4px 12px ${experience?.primaryColor}40`
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Completion Screen
  if (showCompletionScreen) {
    // Determine if background is dark for text color adaptation
    const isDarkBackground = experience.backgroundColor &&
      parseInt(experience.backgroundColor.slice(1), 16) < 0x808080;

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: experience.backgroundColor || '#ffffff',
        backgroundImage: experience.backgroundImage ? `url(${experience.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        padding: '20px',
        fontFamily: "'Inter', -apple-system, sans-serif",
        position: 'relative'
      }}>
        {experience.backgroundImage && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            pointerEvents: 'none'
          }}></div>
        )}
        <div style={{
          backgroundColor: 'white',
          borderRadius: `${experience.borderRadius || 24}px`,
          padding: '48px 32px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          border: `1px solid ${experience?.borderColor || '#e5e7eb'}`,
          position: 'relative',
          zIndex: 10
        }}>
          <div style={{ fontSize: '56px', marginBottom: '24px' }}>🎉</div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '12px',
            color: experience?.textColor || '#1f2937'
          }}>
            {experience.completionTitle || 'Experience Complete!'}
          </h2>
          <p style={{
            color: experience?.secondaryTextColor || '#6b7280',
            marginBottom: '32px',
            fontSize: '15px',
            lineHeight: '1.6'
          }}>
            {experience.completionDescription || 'Thank you for participating in this experience.'}
          </p>
        </div>
      </div>
    );
  }

  // Expired state
  if (experienceStatus === 'expired') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: experience.backgroundColor || '#ffffff',
        backgroundImage: experience.backgroundImage ? `url(${experience.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        padding: '20px',
        fontFamily: "'Inter', -apple-system, sans-serif",
        position: 'relative'
      }}>
        {experience.backgroundImage && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            pointerEvents: 'none'
          }}></div>
        )}
        <div style={{
          backgroundColor: 'white',
          borderRadius: `${experience.borderRadius || 24}px`,
          padding: '48px 32px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          border: `1px solid ${experience?.borderColor || '#e5e7eb'}`,
          position: 'relative',
          zIndex: 10
        }}>
          <div style={{ fontSize: '56px', marginBottom: '24px' }}>⏰</div>
          <h2 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '12px', color: experience?.textColor || '#1f2937' }}>
            Experience Ended
          </h2>
          <p style={{ color: experience.secondaryTextColor || '#6b7280', marginBottom: '32px', fontSize: '15px' }}>
            This experience has ended and is no longer available.
          </p>
          {experience.completionTitle && (
            <div style={{
              backgroundColor: `${experience.primaryColor}15`,
              padding: '20px',
              borderRadius: `${experience.borderRadius || 16}px`,
              border: `2px solid ${experience.primaryColor}40`
            }}>
              <h3 style={{ fontWeight: '700', marginBottom: '8px', color: experience?.textColor || '#1f2937' }}>{experience.completionTitle}</h3>
              {experience.completionDescription && (
                <p style={{ fontSize: '14px', color: experience.secondaryTextColor || '#6b7280', margin: 0 }}>{experience.completionDescription}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Scheduled state
  if (experienceStatus === 'scheduled' && timeUntilStart !== null) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: experience.backgroundColor || '#ffffff',
        backgroundImage: experience.backgroundImage ? `url(${getAssetUrl(experience.backgroundImage)})` : 'none',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        padding: '20px',
        fontFamily: "'Inter', -apple-system, sans-serif"
      }}>
        {/* Background overlay for better readability */}
        {experience.backgroundImage && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: `${experience.backgroundColor}ee`,
            zIndex: 0
          }}/>
        )}
        <div style={{
          backgroundColor: experience.backgroundColor || '#ffffff',
          borderRadius: `${(experience.borderRadius || 8) + 8}px`,
          padding: '48px 32px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          border: `2px solid ${experience.borderColor || '#e5e7eb'}`,
          position: 'relative',
          zIndex: 1
        }}>
          {experience.icon && (
            <img
              src={getAssetUrl(experience.icon)}
              alt={experience.title}
              style={{
                width: '100px',
                height: '100px',
                margin: '0 auto 32px',
                borderRadius: `${experience.borderRadius || 8}px`,
                objectFit: 'cover',
                border: `2px solid ${experience.borderColor || '#e5e7eb'}`
              }}
            />
          )}
          <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px', color: experience?.textColor || '#1f2937' }}>
            {experience.title}
          </h1>
          {experience.subtitle && (
            <p style={{ color: experience?.textColor === '#ffffff' ? '#e5e7eb' : '#6b7280', marginBottom: '32px', fontSize: '15px' }}>{experience.subtitle}</p>
          )}
          <div style={{
            backgroundColor: `${experience.primaryColor}15`,
            borderRadius: `${(experience.borderRadius || 8) + 4}px`,
            padding: '32px 24px',
            marginBottom: '32px',
            border: `2px solid ${experience.primaryColor}40`
          }}>
            <p style={{
              fontSize: '13px',
              color: experience?.textColor === '#ffffff' ? '#d1d5db' : '#6b7280',
              marginBottom: '12px',
              fontWeight: '500',
              letterSpacing: '0.5px'
            }}>EXPERIENCE STARTS IN</p>
            <p style={{
              fontSize: '56px',
              fontFamily: "'Courier New', monospace",
              fontWeight: '700',
              color: experience.primaryColor || '#3b82f6',
              margin: 0,
              letterSpacing: '3px'
            }}>
              {formatCountdown(timeUntilStart)}
            </p>
          </div>
          {experience.description && (
            <p style={{
              fontSize: '14px',
              color: experience?.textColor === '#ffffff' ? '#d1d5db' : '#6b7280',
              lineHeight: '1.6'
            }}>{experience.description}</p>
          )}
        </div>
      </div>
    );
  }

  // Main experience
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: experience.backgroundColor || '#ffffff',
      backgroundImage: experience.backgroundImage ? `url(${getAssetUrl(experience.backgroundImage)})` : 'none',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      color: experience.textColor || '#1f2937',
      fontFamily: "'Inter', -apple-system, sans-serif",
      position: 'relative'
    }}>
      {/* Top Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        backgroundColor: `${experience.backgroundColor}dd`,
        backdropFilter: 'blur(12px)',
        zIndex: 40,
        borderBottom: `1px solid ${experience.borderColor}40`,
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {experience.icon && (
            <img 
              src={getAssetUrl(experience.icon)} 
              alt={experience.title}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: `${Math.min(experience.borderRadius || 8, 8)}px`,
                objectFit: 'cover',
                border: `1px solid ${experience.borderColor || '#e5e7eb'}`
              }}
            />
          )}
          <div>
            <h3 style={{
              fontSize: '15px',
              fontWeight: '700',
              color: experience.textColor || '#1f2937',
              margin: 0,
              letterSpacing: '0.5px'
            }}>
              {experience.title}
            </h3>
            <p style={{
              fontSize: '12px',
              color: experience.secondaryTextColor || '#9ca3af',
              margin: 0
            }}>
              Stage {currentStageIndex + 1} of {totalStages}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '60px 24px',
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Stage Header */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <span style={{
              fontSize: '12px',
              fontWeight: '700',
              color: experience.textColor || '#1f2937',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Stage {currentStageIndex + 1}
            </span>
            <span style={{
              fontSize: '12px',
              color: experience.secondaryTextColor || '#6b7280'
            }}>
              {totalStages > 1 && `of ${totalStages}`}
            </span>
          </div>
          <h1 style={{
            fontSize: '42px',
            fontWeight: '800',
            color: experience.textColor || '#1f2937',
            marginBottom: '16px',
            lineHeight: '1.2'
          }}>
            {currentStage?.title}
          </h1>
          {currentStage?.description && (
            <p style={{
              fontSize: '16px',
              color: experience.secondaryTextColor || '#6b7280',
              lineHeight: '1.7',
              maxWidth: '600px',
              margin: 0
            }}>
              {currentStage.description}
            </p>
          )}
        </div>

        {/* Content Area */}
        {isStageUnlocked ? (
          <div style={{ marginBottom: '48px', flex: 1 }}>
            {/* Video Player */}
            {(currentStage?.type === 'video' || currentStage?.uploadedFile?.includes('.m3u8')) && (
              <div style={{
                backgroundColor: getPlayerBackgroundColor(), // Use helper function
                borderRadius: `${(experience.borderRadius || 8) + 4}px`,
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                marginBottom: '40px',
                position: 'relative',
                border: `1px solid ${experience.mediaPlayerBorderColor || '#d1d5db'}`
              }}>
                <video
                  ref={mediaRef}
                  muted={experience?.showPlayPauseButton === false}
                  playsInline={true}
                  crossOrigin="anonymous"
                  style={{
                    width: '100%',
                    maxHeight: '600px',
                    objectFit: 'contain',
                    backgroundColor: 'transparent', // Let container handle background
                    display: 'block'
                  }}
                  preload="metadata"
                />
                
                {/* Video Controls */}
                <div style={{
                  padding: '24px',
                  backgroundColor: getPlayerBackgroundColor(), // Use helper function
                  borderTop: `1px solid ${experience.mediaPlayerControlsBorderColor || '#1f2937'}`
                }}>
                  {/* Progress Bar */}
                  <div style={{ marginBottom: '20px' }}>
                    <div
                      onClick={handleProgressClick}
                      style={{
                        height: '6px',
                        backgroundColor: `${(experience.buttonColor || experience.primaryColor || '#3b82f6')}30`,
                        borderRadius: '3px',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        position: 'relative'
                      }}
                    >
                      <div style={{
                        height: '100%',
                        width: `${progress}%`,
                        backgroundColor: experience.buttonColor || experience.primaryColor || '#3b82f6',
                        borderRadius: '3px',
                        transition: 'width 0.1s linear'
                      }} />
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: experience.secondaryTextColor || experience.playerControllersColor || '#fff',
                      marginTop: '8px',
                      opacity: 0.8
                    }}>
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px'
                  }}>
                    {experience.showBackButton && (
                      <button
                        onClick={handlePreviousStage}
                        disabled={currentStageIndex === 0}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          border: 'none',
                          backgroundColor: experience.buttonColor || '#3b82f6',
                          cursor: currentStageIndex === 0 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: experience.buttonTextColor || '#ffffff',
                          opacity: currentStageIndex === 0 ? 0.4 : 1,
                          transition: 'all 0.2s'
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                        </svg>
                      </button>
                    )}

                    {experience?.showPlayPauseButton && (
                      <button
                        onClick={handlePlayPause}
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '50%',
                          border: 'none',
                          backgroundColor: experience.buttonColor || experience.primaryColor || '#3b82f6',
                          color: experience.buttonTextColor || '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 8px 24px ${(experience.buttonColor || experience.primaryColor || '#3b82f6')}60`,
                          transition: 'all 0.2s'
                        }}
                      >
                        {isPlaying ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                          </svg>
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </button>
                    )}

                    {experience.showNextButton && (
                      <button
                        onClick={handleNextStage}
                        disabled={currentStageIndex === totalStages - 1}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          border: 'none',
                          backgroundColor: experience.buttonColor || '#3b82f6',
                          cursor: currentStageIndex === totalStages - 1 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: experience.buttonTextColor || '#ffffff',
                          opacity: currentStageIndex === totalStages - 1 ? 0.4 : 1,
                          transition: 'all 0.2s'
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
                        </svg>
                      </button>
                    )}

                  </div>
                </div>

                {/* Buffering */}
                {isBuffering && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: '24px 32px',
                    borderRadius: '12px',
                    color: experience.playerControllersColor || 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{ animation: 'spin 1s linear infinite' }}>⭐</div>
                    <span>Loading...</span>
                  </div>
                )}

                {/* Player Error */}
                {playerError && (
                  <div style={{
                    padding: '16px',
                    margin: '16px',
                    backgroundColor: '#fee',
                    color: '#dc2626',
                    borderRadius: `${experience.borderRadius || 8}px`,
                    fontSize: '14px',
                    border: '1px solid #fca5a5'
                  }}>
                    ⚠️ {playerError}
                  </div>
                )}
              </div>
            )}

            {/* Audio Player */}
            {currentStage?.type === 'audio' && (
              <div>
                <audio
                  ref={mediaRef}
                  style={{ display: 'none' }}
                  preload="metadata"
                  crossOrigin="anonymous"
                  muted={experience?.showPlayPauseButton === false}
                />
                
                <div style={{
                  backgroundColor: getPlayerBackgroundColor(), // Use helper function
                  borderRadius: `${(experience.borderRadius || 8) + 4}px`,
                  padding: '60px 40px',
                  marginBottom: '40px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                  position: 'relative',
                  overflow: 'hidden',
                  border: `1px solid ${experience.mediaPlayerBorderColor || '#d1d5db'}`,
                  width: '100%',
                  boxSizing: 'border-box'
                }}>

                  {/* Waveform Animation */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '3px',
                    height: '60px',
                    marginBottom: '24px',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    {Array.from({ length: 40 }).map((_, i) => {
                      // Convert wave color to RGB for dynamic opacity
                      const waveColor = experience.waveColor || experience.buttonColor || experience.primaryColor || '#3b82f6';
                      const hex = waveColor.replace('#', '');
                      const r = parseInt(hex.substring(0, 2), 16);
                      const g = parseInt(hex.substring(2, 4), 16);
                      const b = parseInt(hex.substring(4, 6), 16);

                      return (
                        <div
                          key={i}
                          style={{
                            width: '2px',
                            height: `${25 + Math.random() * 70}%`,
                            backgroundColor: `rgba(${r},${g},${b},${isPlaying ? 0.85 : 0.35})`,
                            borderRadius: '1px',
                            animation: isPlaying ? `wave ${0.5 + Math.random() * 0.5}s ease-in-out ${i * 0.05}s infinite` : 'none',
                            opacity: isPlaying ? 1 : 0.35
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Audio Controls - Always show for audio (need mute button) */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '20px',
                    marginBottom: '24px',
                    position: 'relative',
                    zIndex: 1
                  }}>
                      {experience?.showBackButton && (
                        <button
                          onClick={handlePreviousStage}
                          disabled={currentStageIndex === 0}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: experience.buttonColor || '#3b82f6',
                            cursor: currentStageIndex === 0 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: experience.buttonTextColor || '#ffffff',
                            opacity: currentStageIndex === 0 ? 0.4 : 1,
                            transition: 'all 0.2s'
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                          </svg>
                        </button>
                      )}

                      {experience?.showPlayPauseButton && (
                        <button
                          onClick={handlePlayPause}
                        style={{
                          width: '72px',
                          height: '72px',
                          borderRadius: '50%',
                          border: 'none',
                          backgroundColor: experience.playerControllersColor || '#ffffff',
                          color: experience.buttonColor || experience.primaryColor || '#3b82f6',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                          transition: 'all 0.2s'
                        }}
                      >
                        {isPlaying ? (
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                          </svg>
                        ) : (
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                        </button>
                      )}

                      {experience?.showNextButton && (
                        <button
                          onClick={handleNextStage}
                          disabled={currentStageIndex === totalStages - 1}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: experience.buttonColor || '#3b82f6',
                            cursor: currentStageIndex === totalStages - 1 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: experience.buttonTextColor || '#ffffff',
                            opacity: currentStageIndex === totalStages - 1 ? 0.4 : 1,
                            transition: 'all 0.2s'
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
                          </svg>
                        </button>
                      )}

                    </div>

                  {/* Progress */}
                  <div style={{ marginBottom: '16px', position: 'relative', zIndex: 1 }}>
                    <div
                      onClick={handleProgressClick}
                      style={{
                        height: '6px',
                        backgroundColor: getProgressBarBackground(), // Use helper function
                        borderRadius: '3px',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.max(0, progress)}%`,
                          backgroundColor: experience.playerControllersColor || '#ffffff',
                          borderRadius: '3px',
                          transition: isBuffering ? 'none' : 'width 0.1s linear',
                          boxShadow: `0 0 6px ${experience.playerControllersColor || '#ffffff'}80`,
                          minWidth: progress > 0 ? '2px' : '0px'
                        }}
                      />
                      {isBuffering && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '100%',
                            background: `linear-gradient(90deg, transparent, rgba(255,255,0.3), transparent)`,
                            animation: 'shimmer 1.5s infinite'
                          }}
                        />
                      )}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: experience.secondaryTextColor || experience.playerControllersColor || '#ffffff',
                    fontWeight: '600',
                    position: 'relative',
                    zIndex: 1,
                    opacity: 0.85,
                    paddingTop: '6px',
                    letterSpacing: '0.3px'
                  }}>
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>

                  {/* Buffering for Audio */}
                  {isBuffering && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      padding: '16px 24px',
                      borderRadius: '8px',
                      color: experience.playerControllersColor || 'white',
                      fontSize: '14px',
                      zIndex: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{ animation: 'spin 1s linear infinite' }}>⭐</div>
                      <span>Loading...</span>
                    </div>
                  )}

                  {/* Player Error for Audio */}
                  {playerError && (
                    <div style={{
                      position: 'absolute',
                      bottom: '16px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      color: '#dc2626',
                      padding: '12px 20px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      maxWidth: '90%',
                      zIndex: 2,
                      border: '1px solid #fca5a5'
                    }}>
                      ⚠️ {playerError}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Text Content */}
            {currentStage?.type === 'text' && (
              <>
                {currentStage?.uploadedFile ? (
                  <DocumentViewer
                    fileUrl={getAssetUrl(currentStage.uploadedFile)}
                    fileName={currentStage.uploadedFile.split('/').pop() || 'document'}
                    fileType={currentStage.uploadedFile.split('.').pop()?.toLowerCase()}
                    containerStyle={{
                      marginBottom: '40px'
                    }}
                  />
                ) : currentStage?.pastedText ? (
                  <div style={{
                    backgroundColor: '#fff',
                    borderRadius: `${(experience.borderRadius || 8) + 4}px`,
                    padding: '48px',
                    marginBottom: '40px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                    lineHeight: '1.8',
                    fontSize: '16px',
                    color: experience.textColor || '#374151',
                    whiteSpace: 'pre-wrap',
                    border: `1px solid ${experience.borderColor || '#e5e7eb'}`
                  }}>
                    {currentStage.pastedText}
                  </div>
                ) : null}
              </>
            )}

            {/* Image Content */}
            {currentStage?.type === 'image' && currentStage?.uploadedFile && (
              <div style={{
                backgroundColor: '#fff',
                borderRadius: `${(experience.borderRadius || 8) + 4}px`,
                overflow: 'hidden',
                marginBottom: '40px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                border: `1px solid ${experience.borderColor || '#e5e7eb'}`
              }}>
                <img
                  src={getAssetUrl(currentStage.uploadedFile)}
                  alt={currentStage.title}
                  style={{
                    width: '100%',
                    maxHeight: '600px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          /* Unlock Button Section */
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px'
          }}>
            <button
              onClick={() => {
                console.log('Unlock button clicked');
                // Check if this stage requires code unlock
                if (currentStage?.buttonSettings === 'code' && !stageUnlocked.has(currentStage.id)) {
                  // Check if current track has finished playing
                  const trackHasEnded = mediaRef.current && duration > 0 && currentTime >= duration - 0.5;

                  if (!trackHasEnded) {
                    // Track hasn't finished yet - show error message
                    setUnlockError('You must complete the track');
                    setShowUnlockModal(true);
                    return;
                  }

                  // Track has ended - show code preview modal
                  setUnlockError(null);
                  setCurrentUnlockCode(currentStage.codeValue || '');
                  setShowCodePreviewModal(true);
                } else {
                  setShowUnlockModal(true);
                }
              }}
              style={{
                padding: '20px 60px',
                backgroundColor:'black',
                color: experience.buttonTextColor || '#ffffff',
                border: 'none',
                borderRadius: `${(experience.borderRadius || 8) + 4}px`,
                fontSize: '18px',
                fontWeight: '700',
                cursor: 'pointer',
                letterSpacing: '1px',
                boxShadow: `0 8px 24px ${experience.primaryColor}60`,
                transition: 'all 0.3s',
                textTransform: 'uppercase'
              }}
            >
              {currentStage?.buttonName || 'TAP TO UNLOCK'}
            </button>
          </div>
        )}

        {/* Code Preview Modal */}
        {showCodePreviewModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: `${(experience.borderRadius || 8) + 4}px`,
              padding: '48px 32px',
              maxWidth: '420px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              border: `1px solid ${experience.borderColor || '#e5e7eb'}`
            }}>
              <div style={{ fontSize: '56px', marginBottom: '24px' }}>🔑</div>
              <h3 style={{
                fontSize: '26px',
                fontWeight: '700',
                marginBottom: '12px',
                color: experience.textColor || '#1f2937'
              }}>
                Your Access Code
              </h3>
              <p style={{ fontSize: '15px', color: experience.secondaryTextColor || '#6b7280', marginBottom: '32px' }}>
                Here's the code to unlock the next stage
              </p>

              <div style={{
                backgroundColor: `${experience.primaryColor || '#3b82f6'}15`,
                border: `2px dashed ${experience.primaryColor || '#3b82f6'}`,
                borderRadius: `${experience.borderRadius || 8}px`,
                padding: '28px 24px',
                marginBottom: '32px'
              }}>
                <div style={{
                  fontSize: '48px',
                  fontWeight: '800',
                  letterSpacing: '8px',
                  color: experience.primaryColor || '#3b82f6',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  lineHeight: '1.4'
                }}>
                  {currentUnlockCode || '••••••'}
                </div>
              </div>

              <button
                onClick={() => {
                  setShowCodePreviewModal(false);
                  setShowUnlockModal(true);
                }}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  backgroundColor: experience.primaryColor || '#3b82f6',
                  color: experience.buttonTextColor || '#ffffff',
                  border: 'none',
                  borderRadius: `${experience.borderRadius || 8}px`,
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: `0 4px 12px ${experience.primaryColor}40`
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = `0 6px 20px ${experience.primaryColor}60`;
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = `0 4px 12px ${experience.primaryColor}40`;
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Unlock Modal */}
        {(showUnlockModal || unlockError) && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: `${(experience.borderRadius || 8) + 4}px`,
              padding: '48px 32px',
              maxWidth: '420px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              border: `1px solid ${experience.borderColor || '#e5e7eb'}`
            }}>
              <div style={{ fontSize: '56px', marginBottom: '24px' }}>🔐</div>
              <h3 style={{
                fontSize: '26px',
                fontWeight: '700',
                marginBottom: '12px',
                color: experience.textColor || '#1f2937'
              }}>
                Enter Access Code
              </h3>
              <p style={{ fontSize: '15px', color: experience.secondaryTextColor || '#6b7280', marginBottom: '32px' }}>
                Enter the code to unlock the next stage
              </p>

              <form onSubmit={handleUnlockStage}>
                {unlockError && (
                  <div style={{
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    padding: '12px 16px',
                    borderRadius: `${experience.borderRadius || 8}px`,
                    marginBottom: '16px',
                    fontSize: '14px',
                    border: '1px solid #fca5a5'
                  }}>
                    {unlockError}
                  </div>
                )}
                
                <input
                  type="text"
                  value={unlockCode}
                  onChange={(e) => setUnlockCode(e.target.value)}
                  placeholder="Enter code"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: `2px solid ${experience.borderColor || '#e5e7eb'}`,
                    borderRadius: `${experience.borderRadius || 8}px`,
                    fontSize: '16px',
                    marginBottom: '24px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s',
                    color: experience.textColor || '#1f2937'
                  }}
                  autoFocus
                  onFocus={(e) => {
                    e.target.style.borderColor = experience.primaryColor || '#3b82f6';
                    e.target.style.boxShadow = `0 0 0 3px ${experience.primaryColor}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = experience.borderColor || '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUnlockModal(false);
                      setUnlockCode('');
                      setUnlockError(null);
                    }}
                    style={{
                      flex: 1,
                      padding: '12px 20px',
                      backgroundColor: '#f3f4f6',
                      color: '#6b7280',
                      border: 'none',
                      borderRadius: `${experience.borderRadius || 8}px`,
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '12px 20px',
                      backgroundColor: experience.primaryColor || '#3b82f6',
                      color: experience.buttonTextColor || '#ffffff',
                      border: 'none',
                      borderRadius: `${experience.borderRadius || 8}px`,
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: `0 4px 12px ${experience.primaryColor}40`
                    }}
                  >
                    Unlock
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Navigation Buttons */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginTop: 'auto',
          paddingTop: '40px'
        }}>
          {experience.showBackButton && (
            <button
              onClick={handlePreviousStage}
              disabled={currentStageIndex === 0 || !experience.enableStageNavigation}
              style={{
                flex: 1,
                padding: '16px 24px',
                backgroundColor: '#fff',
                color: experience.buttonColor || experience.primaryColor || '#3b82f6',
                border: `2px solid ${experience.buttonColor || experience.primaryColor || '#3b82f6'}`,
                borderRadius: `${experience.borderRadius || 8}px`,
                fontSize: '15px',
                fontWeight: '700',
                cursor: (currentStageIndex === 0 || !experience.enableStageNavigation) ? 'not-allowed' : 'pointer',
                opacity: (currentStageIndex === 0 || !experience.enableStageNavigation) ? 0.3 : 1,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                transition: 'all 0.2s'
              }}
            >
              ← Back
            </button>
          )}

          {experience.showNextButton && currentStage?.buttonSettings !== 'none' && (
            <button
              onClick={handleNextStage}
              disabled={currentStageIndex === totalStages - 1 && (mediaRef.current && duration > 0 && currentTime < duration - 0.5)}
              title={currentStageIndex === totalStages - 1 && (mediaRef.current && duration > 0 && currentTime < duration - 0.5) ? 'Watch the full track to complete' : ''}
              style={{
                flex: 1,
                padding: '16px 24px',
                backgroundColor: currentStageIndex === totalStages - 1 && (mediaRef.current && duration > 0 && currentTime < duration - 0.5)
                  ? '#d1d5db'
                  : (experience.buttonColor || experience.primaryColor || '#3b82f6'),
                color: experience.buttonTextColor || '#ffffff',
                border: 'none',
                borderRadius: `${experience.borderRadius || 8}px`,
                fontSize: '15px',
                fontWeight: '700',
                cursor: currentStageIndex === totalStages - 1 && (mediaRef.current && duration > 0 && currentTime < duration - 0.5)
                  ? 'not-allowed'
                  : 'pointer',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                boxShadow: currentStageIndex === totalStages - 1 && (mediaRef.current && duration > 0 && currentTime < duration - 0.5)
                  ? 'none'
                  : `0 4px 12px ${(experience.buttonColor || experience.primaryColor || '#3b82f6')}40`,
                opacity: currentStageIndex === totalStages - 1 && (mediaRef.current && duration > 0 && currentTime < duration - 0.5)
                  ? 0.6
                  : 1,
                transition: 'all 0.2s'
              }}
            >
              {currentStageIndex === totalStages - 1 ? 'Complete ✓' : (currentStage?.buttonName || 'Next ��')}
            </button>
          )}
        </div>

        {/* Stage Progress Dots */}
        {experience.enableStageNavigation !== false && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '40px',
            paddingBottom: '20px'
          }}>
            {Array.from({ length: totalStages }).map((_, index) => {
              // Check if this stage has been visited in the shuffled order
              const isCompleted = index < currentStageIndex;
              const isCurrent = index === currentStageIndex;

              return (
                <div
                  key={index}
                  onClick={() => {
                    if (experience.enableStageNavigation && isCompleted) {
                      setCurrentStageIndex(index);
                      setIsPlaying(false);
                      setProgress(0);
                      setCurrentTime(0);
                      setPlayerError(null);
                    }
                  }}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: (isCompleted || isCurrent)
                      ? experience.primaryColor || '#3b82f6'
                      : '#d1d5db',
                    transition: 'all 0.3s ease',
                    cursor: experience.enableStageNavigation && isCompleted ? 'pointer' : 'default',
                    transform: isCurrent ? 'scale(1.2)' : 'scale(1)',
                    boxShadow: isCurrent ? `0 0 0 3px ${experience.primaryColor}40` : 'none',
                    opacity: experience.enableStageNavigation === false ? 0.5 : 1
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Join and Start Modal */}
      {showJoinStartModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: `${(experience.borderRadius || 8) + 8}px`,
            padding: '60px 40px',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            border: `1px solid ${experience.borderColor || '#e5e7eb'}`
          }}>
            <div style={{
              fontSize: '80px',
              marginBottom: '32px'
            }}>
              🎬
            </div>

            <h2 style={{
              fontSize: '32px',
              fontWeight: '700',
              marginBottom: '16px',
              color: experience.textColor || '#1f2937'
            }}>
              Ready to Begin?
            </h2>

            <p style={{
              fontSize: '16px',
              color: experience.secondaryTextColor || '#6b7280',
              marginBottom: '40px',
              lineHeight: '1.6'
            }}>
              Tap "Join and Start" to begin the experience
            </p>

            <button
              onClick={handleJoinAndStart}
              style={{
                width: '100%',
                padding: '16px 32px',
                backgroundColor: experience.primaryColor || '#3b82f6',
                color: experience.buttonTextColor || '#ffffff',
                border: 'none',
                borderRadius: `${experience.borderRadius || 8}px`,
                fontSize: '18px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: `0 8px 24px ${(experience.primaryColor || '#3b82f6')}60`,
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = `0 12px 32px ${(experience.primaryColor || '#3b82f6')}80`;
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = `0 8px 24px ${(experience.primaryColor || '#3b82f6')}60`;
              }}
            >
              Join and Start
            </button>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes wave {
          0%, 100% { height: 30%; }
          50% { height: 100%; }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          transition: transform 0.2s ease;
        }
        
        button:active:not(:disabled) {
          transform: translateY(0);
        }

        input:focus {
          border-color: ${experience?.primaryColor || '#3b82f6'} !important;
          box-shadow: 0 0 0 3px ${experience?.primaryColor}20 !important;
        }
      `}</style>
    </div>
  );
};

export default GuestExperience;
