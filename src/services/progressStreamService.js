const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Set up Server-Sent Events (SSE) listener for real-time progress updates
 * @param {string} experienceId - The ID of the experience being processed
 * @param {function} onProgress - Callback function to handle progress updates
 * @param {function} onComplete - Callback function when processing is complete
 * @param {function} onError - Callback function when an error occurs
 */
export const setupProgressStream = async (
  experienceId,
  onProgress = null,
  onComplete = null,
  onError = null
) => {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(
      `${API_BASE_URL}/studio/new-experiences/${experienceId}/progress`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const readStream = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();

          if (value) {
            buffer += decoder.decode(value, { stream: true });
          }

          if (done) {
            // Process any remaining data in the buffer
            if (buffer.trim()) {
              const line = buffer.trim();
              if (line.startsWith('data: ')) {
                try {
                  const progressData = JSON.parse(line.slice(6));
                  if (onProgress) {
                    onProgress(progressData);
                  }
                  if (progressData.status === 'complete' && onComplete) {
                    onComplete(progressData);
                  }
                } catch (parseError) {
                  console.error('Error parsing progress:', parseError);
                }
              }
            }
            break;
          }

          const lines = buffer.split('\n');

          // Process all complete lines
          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            if (line.startsWith('data: ')) {
              try {
                const progressData = JSON.parse(line.slice(6));

                if (onProgress) {
                  onProgress(progressData);
                }

                if (progressData.status === 'complete' && onComplete) {
                  onComplete(progressData);
                  reader.cancel();
                  return;
                }
              } catch (parseError) {
                console.error('Error parsing progress:', parseError);
              }
            }
          }

          // Keep the last incomplete line in the buffer
          buffer = lines[lines.length - 1];
        }
      } catch (error) {
        console.error('Stream reading error:', error);
        if (onError) {
          onError(error);
        }
      }
    };

    await readStream();
  } catch (error) {
    console.error('Failed to set up progress stream:', error);
    if (onError) {
      onError(error);
    }
  }
};

/**
 * Calculate combined progress from upload and encoding
 * @param {number} uploadProgress - Upload progress (0-100)
 * @param {number} encodingProgress - Encoding progress (0-100)
 * @returns {number} Combined progress (0-100)
 */
export const calculateCombinedProgress = (uploadProgress, encodingProgress) => {
  // 50% from upload + 50% from encoding
  return Math.min(Math.round(50 + (encodingProgress || 0) * 0.5), 99);
};
