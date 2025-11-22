import EventEmitter from 'events';

class ProgressService extends EventEmitter {
  constructor() {
    super();
    this.progressMap = new Map();
  }

  startTracking(experienceId) {
    this.progressMap.set(experienceId, {
      uploadProgress: 0,
      encodingProgress: 0,
      status: 'uploading',
      totalStages: 0,
      completedStages: 0
    });
  }

  updateUploadProgress(experienceId, progress) {
    if (this.progressMap.has(experienceId)) {
      const data = this.progressMap.get(experienceId);
      data.uploadProgress = progress;
      data.status = 'uploading';
      this.emit(`progress:${experienceId}`, data);
    }
  }

  updateEncodingProgress(experienceId, stageIndex, progress) {
    if (this.progressMap.has(experienceId)) {
      const data = this.progressMap.get(experienceId);
      data.status = 'encoding';
      data.currentStage = stageIndex;
      data.encodingProgress = progress;
      this.emit(`progress:${experienceId}`, data);
    }
  }

  setTotalStages(experienceId, count) {
    if (this.progressMap.has(experienceId)) {
      const data = this.progressMap.get(experienceId);
      data.totalStages = count;
    }
  }

  completeStage(experienceId) {
    if (this.progressMap.has(experienceId)) {
      const data = this.progressMap.get(experienceId);
      data.completedStages = (data.completedStages || 0) + 1;
      this.emit(`progress:${experienceId}`, data);
    }
  }

  completeTracking(experienceId) {
    if (this.progressMap.has(experienceId)) {
      const data = this.progressMap.get(experienceId);
      data.status = 'complete';
      data.uploadProgress = 100;
      data.encodingProgress = 100;
      this.emit(`progress:${experienceId}`, data);
      
      setTimeout(() => {
        this.progressMap.delete(experienceId);
      }, 5000);
    }
  }

  getProgress(experienceId) {
    return this.progressMap.get(experienceId) || null;
  }
}

export const progressService = new ProgressService();
