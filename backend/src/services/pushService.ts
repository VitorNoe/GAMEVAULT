/**
 * Push Notification Service — FCM PoC
 *
 * Provides a proof-of-concept interface for sending push notifications
 * via Firebase Cloud Messaging (FCM). In development / when FCM is not
 * configured the service logs the payload to console.
 *
 * To enable in production:
 *  1. Set FCM_SERVER_KEY env var (legacy) or FCM_SERVICE_ACCOUNT_JSON
 *  2. Install firebase-admin: npm i firebase-admin
 */

import axios from 'axios';

// ─── Types ───────────────────────────────────────────────────────────

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface PushResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ─── Configuration ───────────────────────────────────────────────────

const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY || '';
const FCM_SEND_URL = 'https://fcm.googleapis.com/fcm/send';
const isConfigured = FCM_SERVER_KEY.length > 0;

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Send push notification to a single device token.
 */
export async function sendPushToDevice(
  deviceToken: string,
  payload: PushPayload,
): Promise<PushResult> {
  if (!isConfigured) {
    console.log('\n' + '='.repeat(60));
    console.log('🔔 [DEV PUSH] Would send push notification:');
    console.log(`   Token:   ${deviceToken.substring(0, 20)}...`);
    console.log(`   Title:   ${payload.title}`);
    console.log(`   Body:    ${payload.body}`);
    if (payload.data) console.log(`   Data:    ${JSON.stringify(payload.data)}`);
    console.log('='.repeat(60) + '\n');
    return { success: true, messageId: `dev-push-${Date.now()}` };
  }

  try {
    const response = await axios.post(
      FCM_SEND_URL,
      {
        to: deviceToken,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl && { image: payload.imageUrl }),
        },
        data: payload.data || {},
      },
      {
        headers: {
          Authorization: `key=${FCM_SERVER_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const result = response.data;
    if (result.success === 1) {
      return { success: true, messageId: result.results?.[0]?.message_id };
    }
    return { success: false, error: result.results?.[0]?.error || 'Unknown FCM error' };
  } catch (err: any) {
    console.error('FCM push error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send push notification to multiple device tokens (multicast).
 */
export async function sendPushToDevices(
  deviceTokens: string[],
  payload: PushPayload,
): Promise<PushResult[]> {
  // In dev mode, log once
  if (!isConfigured) {
    console.log('\n' + '='.repeat(60));
    console.log(`🔔 [DEV PUSH] Would send push to ${deviceTokens.length} devices:`);
    console.log(`   Title:   ${payload.title}`);
    console.log(`   Body:    ${payload.body}`);
    console.log('='.repeat(60) + '\n');
    return deviceTokens.map(() => ({ success: true, messageId: `dev-push-${Date.now()}` }));
  }

  try {
    const response = await axios.post(
      FCM_SEND_URL,
      {
        registration_ids: deviceTokens,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl && { image: payload.imageUrl }),
        },
        data: payload.data || {},
      },
      {
        headers: {
          Authorization: `key=${FCM_SERVER_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const results: PushResult[] = (response.data.results || []).map((r: any) => ({
      success: !r.error,
      messageId: r.message_id,
      error: r.error,
    }));
    return results;
  } catch (err: any) {
    console.error('FCM multicast error:', err.message);
    return deviceTokens.map(() => ({ success: false, error: err.message }));
  }
}

/**
 * Send push to a topic (e.g. "game_123_watchers").
 */
export async function sendPushToTopic(
  topic: string,
  payload: PushPayload,
): Promise<PushResult> {
  if (!isConfigured) {
    console.log('\n' + '='.repeat(60));
    console.log(`🔔 [DEV PUSH] Would send push to topic "${topic}":`);
    console.log(`   Title:   ${payload.title}`);
    console.log(`   Body:    ${payload.body}`);
    console.log('='.repeat(60) + '\n');
    return { success: true, messageId: `dev-topic-${Date.now()}` };
  }

  try {
    const response = await axios.post(
      FCM_SEND_URL,
      {
        to: `/topics/${topic}`,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl && { image: payload.imageUrl }),
        },
        data: payload.data || {},
      },
      {
        headers: {
          Authorization: `key=${FCM_SERVER_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return { success: true, messageId: response.data.message_id };
  } catch (err: any) {
    console.error('FCM topic push error:', err.message);
    return { success: false, error: err.message };
  }
}
