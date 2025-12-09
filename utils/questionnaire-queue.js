/**
 * Submission queue for offline scenarios
 * Queues saves when offline and processes when online
 */

class QuestionnaireQueue {
  constructor(leadId) {
    this.leadId = leadId;
    this.queueName = `questionnaire_queue_${leadId}`;
    this.processing = false;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
  }

  // Add to queue
  async enqueue(data, isComplete = false) {
    const queueItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      leadId: this.leadId,
      data: data,
      isComplete: isComplete,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending'
    };

    try {
      const queue = this.getQueue();
      queue.push(queueItem);
      this.saveQueue(queue);
      return queueItem.id;
    } catch (error) {
      console.error('Failed to enqueue:', error);
      return null;
    }
  }

  // Process queue
  async processQueue() {
    if (this.processing) return;
    if (!this.isOnline()) return;

    this.processing = true;
    const queue = this.getQueue();

    while (queue.length > 0) {
      const item = queue[0];

      try {
        const response = await fetch('/api/questionnaire/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            leadId: item.leadId,
            ...item.data,
            isComplete: item.isComplete,
            _queueId: item.id // Track queued submissions
          })
        });

        if (response.ok) {
          // Success - remove from queue
          queue.shift();
          this.saveQueue(queue);
        } else {
          // Failed - increment retries
          item.retries += 1;
          if (item.retries >= this.maxRetries) {
            // Max retries reached - move to failed queue
            this.moveToFailedQueue(item);
            queue.shift();
            this.saveQueue(queue);
          } else {
            // Retry later
            queue[0] = item;
            this.saveQueue(queue);
            break; // Wait before next retry
          }
        }
      } catch (error) {
        // Network error - stop processing, will retry when online
        console.warn('Queue processing error:', error);
        break;
      }
    }

    this.processing = false;

    // Schedule next processing if queue not empty
    if (queue.length > 0) {
      setTimeout(() => this.processQueue(), this.retryDelay);
    }
  }

  // Get queue from localStorage
  getQueue() {
    try {
      const stored = localStorage.getItem(this.queueName);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get queue:', error);
      return [];
    }
  }

  // Save queue to localStorage
  saveQueue(queue) {
    try {
      localStorage.setItem(this.queueName, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to save queue:', error);
    }
  }

  // Move item to failed queue
  moveToFailedQueue(item) {
    try {
      const failedQueueName = `questionnaire_failed_${this.leadId}`;
      const failed = this.getFailedQueue();
      failed.push({
        ...item,
        failedAt: Date.now()
      });
      localStorage.setItem(failedQueueName, JSON.stringify(failed));
    } catch (error) {
      console.error('Failed to move to failed queue:', error);
    }
  }

  // Get failed queue
  getFailedQueue() {
    try {
      const failedQueueName = `questionnaire_failed_${this.leadId}`;
      const stored = localStorage.getItem(failedQueueName);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  // Check if online
  isOnline() {
    return navigator.onLine !== false;
  }

  // Get queue status
  getStatus() {
    const queue = this.getQueue();
    const failed = this.getFailedQueue();
    return {
      pending: queue.length,
      failed: failed.length,
      processing: this.processing,
      online: this.isOnline()
    };
  }

  // Clear queue
  clear() {
    try {
      localStorage.removeItem(this.queueName);
      localStorage.removeItem(`questionnaire_failed_${this.leadId}`);
    } catch (error) {
      console.error('Failed to clear queue:', error);
    }
  }
}

export default QuestionnaireQueue;



