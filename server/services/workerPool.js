import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WorkerPool {
  constructor(workerScript, maxWorkers = 2) {
    this.workerScript = workerScript;
    this.maxWorkers = maxWorkers;
    this.activeWorkers = 0;
    this.queue = [];
  }

  execute(message) {
    return new Promise((resolve, reject) => {
      const task = { message, resolve, reject };

      if (this.activeWorkers < this.maxWorkers) {
        this.runTask(task);
      } else {
        this.queue.push(task);
      }
    });
  }

  runTask(task) {
    this.activeWorkers++;

    const worker = new Worker(this.workerScript);
    const progressCallbacks = [];

    worker.on('message', (message) => {
      if (message.type === 'progress' && task.progressCallback) {
        task.progressCallback(message.data);
      } else if (message.type === 'complete') {
        task.resolve(message.data);
        this.workerDone();
        worker.terminate();
      } else if (message.type === 'error') {
        task.reject(new Error(message.data.error));
        this.workerDone();
        worker.terminate();
      }
    });

    worker.on('error', (error) => {
      task.reject(error);
      this.workerDone();
      worker.terminate();
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        task.reject(new Error(`Worker exited with code ${code}`));
        this.workerDone();
      }
    });

    worker.postMessage(task.message);
  }

  workerDone() {
    this.activeWorkers--;

    if (this.queue.length > 0) {
      const task = this.queue.shift();
      this.runTask(task);
    }
  }
}

const hlsWorkerPool = new WorkerPool(
  path.join(__dirname, 'hlsWorker.js'),
  parseInt(process.env.HLS_WORKER_THREADS || '2')
);

export { hlsWorkerPool };
