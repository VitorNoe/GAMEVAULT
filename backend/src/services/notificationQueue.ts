/**
 * Notification Queue — In-process background worker
 *
 * Provides a simple in-memory job queue for dispatching email and push
 * notifications without blocking the request cycle.
 *
 * In production this can be swapped for Bull/Redis or any other queue
 * by replacing the enqueue/process functions.
 *
 * Jobs are processed sequentially with a configurable concurrency of 1
 * and a small delay between jobs to avoid hammering external APIs.
 */

import User from '../models/User';
import { sendNotificationEmail } from './emailService';
import { sendPushToDevice, PushPayload } from './pushService';

// ─── Types ───────────────────────────────────────────────────────────

export interface NotificationJobPayload {
  type: string;
  title: string;
  message: string;
  gameId?: number;
}

export interface NotificationJob {
  channel: 'email' | 'push';
  userId: number;
  payload: NotificationJobPayload;
}

// ─── Queue internals ─────────────────────────────────────────────────

const jobQueue: NotificationJob[] = [];
let isProcessing = false;
const JOB_DELAY_MS = 200; // ms between jobs

function enqueue(job: NotificationJob): void {
  jobQueue.push(job);
  // Kick the processor if not already running
  if (!isProcessing) {
    processNext();
  }
}

async function processNext(): Promise<void> {
  if (jobQueue.length === 0) {
    isProcessing = false;
    return;
  }
  isProcessing = true;

  const job = jobQueue.shift()!;
  try {
    await processJob(job);
  } catch (err) {
    console.error(`[NotificationQueue] Error processing ${job.channel} job for user ${job.userId}:`, err);
  }

  // Short delay then next job
  setTimeout(() => processNext(), JOB_DELAY_MS);
}

async function processJob(job: NotificationJob): Promise<void> {
  const user = await User.findByPk(job.userId, {
    attributes: ['id', 'name', 'email'],
  });
  if (!user) return;

  if (job.channel === 'email') {
    await sendNotificationEmail(
      user.email,
      user.name,
      job.payload.title,
      job.payload.message,
      job.payload.type,
    );
  } else if (job.channel === 'push') {
    // For the PoC we use userId as a placeholder token.
    // In production, look up the user's registered device tokens.
    const deviceToken = process.env[`FCM_TOKEN_USER_${job.userId}`] || `device-token-user-${job.userId}`;
    const pushPayload: PushPayload = {
      title: job.payload.title,
      body: job.payload.message,
      data: {
        type: job.payload.type,
        ...(job.payload.gameId ? { gameId: String(job.payload.gameId) } : {}),
      },
    };
    await sendPushToDevice(deviceToken, pushPayload);
  }
}

// ─── Public API ──────────────────────────────────────────────────────

export { enqueue as enqueueNotificationJob };

/**
 * Return current queue depth (for monitoring / health endpoints).
 */
export function getQueueDepth(): number {
  return jobQueue.length;
}
