import crypto from 'crypto';
import { pushPackageToTasoko, pushManifestToTasoko } from './tasokoService.js';
import { publish } from '../config/websocket.js';
import { queuePackageNotification } from './notificationService.js';

// Webhook configuration
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret-key';
const TASOKO_BASE_URL = process.env.TASOKO_BASE_URL || 'https://tasoko.example.com/api';
const API_TOKEN = process.env.TASOKO_API_TOKEN || 'your-api-token';

// Webhook event types
export const WEBHOOK_EVENTS = {
  PACKAGE_CREATED: 'package.created',
  PACKAGE_UPDATED: 'package.updated',
  PACKAGE_DELETED: 'package.deleted',
  PACKAGE_STATUS_CHANGED: 'package.status_changed',
  MANIFEST_CREATED: 'manifest.created',
  MANIFEST_UPDATED: 'manifest.updated',
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
  NOTIFICATION_SENT: 'notification.sent',
  TRACKING_UPDATED: 'tracking.updated'
};

// Webhook delivery status
export const DELIVERY_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  RETRYING: 'retrying'
};

// In-memory webhook queue (in production, use Redis or a proper queue system)
const webhookQueue = new Map();
const deliveryAttempts = new Map();
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // 1s, 5s, 15s

/**
 * Generate webhook signature for security
 */
function generateSignature(payload, secret = WEBHOOK_SECRET) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(payload, signature, secret = WEBHOOK_SECRET) {
  const expectedSignature = generateSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * Create a webhook event
 */
export function createWebhookEvent(eventType, data, options = {}) {
  const eventId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  const webhookEvent = {
    id: eventId,
    type: eventType,
    timestamp,
    data,
    metadata: {
      source: options.source || 'system',
      version: options.version || '1.0',
      environment: process.env.NODE_ENV || 'development',
      ...options.metadata
    }
  };
  
  // Add signature
  webhookEvent.signature = generateSignature(webhookEvent);
  
  return webhookEvent;
}

/**
 * Queue webhook for delivery
 */
export function queueWebhook(event, endpoints = [], options = {}) {
  const queueId = crypto.randomUUID();
  const queuedAt = new Date();
  
  const queueItem = {
    id: queueId,
    event,
    endpoints: endpoints.map(url => ({
      url,
      status: DELIVERY_STATUS.PENDING,
      attempts: 0,
      lastAttempt: null,
      nextRetry: null,
      response: null,
      error: null
    })),
    priority: options.priority || 'normal',
    queuedAt,
    options
  };
  
  webhookQueue.set(queueId, queueItem);
  
  // Process immediately if not delayed
  if (!options.delay) {
    setTimeout(() => processWebhookQueue(), 100);
  }
  
  return queueId;
}

/**
 * Process webhook queue
 */
export async function processWebhookQueue() {
  const now = new Date();
  
  for (const [queueId, queueItem] of webhookQueue.entries()) {
    try {
      // Check if all endpoints are processed
      const pendingEndpoints = queueItem.endpoints.filter(
        endpoint => endpoint.status === DELIVERY_STATUS.PENDING || 
                   (endpoint.status === DELIVERY_STATUS.FAILED && 
                    endpoint.nextRetry && 
                    new Date(endpoint.nextRetry) <= now)
      );
      
      if (pendingEndpoints.length === 0) {
        // Check if all endpoints are done (success or max retries reached)
        const allDone = queueItem.endpoints.every(
          endpoint => endpoint.status === DELIVERY_STATUS.SUCCESS || 
                     endpoint.attempts >= MAX_RETRY_ATTEMPTS
        );
        
        if (allDone) {
          webhookQueue.delete(queueId);
        }
        continue;
      }
      
      // Process pending endpoints
      for (const endpoint of pendingEndpoints) {
        try {
          endpoint.status = DELIVERY_STATUS.PROCESSING;
          endpoint.attempts++;
          endpoint.lastAttempt = now;
          
          const response = await deliverWebhook(endpoint.url, queueItem.event);
          
          endpoint.status = DELIVERY_STATUS.SUCCESS;
          endpoint.response = {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: await response.text()
          };
          
          console.log(`✅ Webhook delivered successfully to ${endpoint.url}`);
          
        } catch (error) {
          endpoint.status = DELIVERY_STATUS.FAILED;
          endpoint.error = error.message;
          
          // Schedule retry if attempts remaining
          if (endpoint.attempts < MAX_RETRY_ATTEMPTS) {
            const delay = RETRY_DELAYS[endpoint.attempts - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
            endpoint.nextRetry = new Date(now.getTime() + delay);
            endpoint.status = DELIVERY_STATUS.RETRYING;
            
            console.log(`⚠️ Webhook delivery failed to ${endpoint.url}, retrying in ${delay}ms`);
          } else {
            console.error(`❌ Webhook delivery failed to ${endpoint.url} after ${MAX_RETRY_ATTEMPTS} attempts:`, error);
          }
        }
      }
      
    } catch (error) {
      console.error(`Error processing webhook queue item ${queueId}:`, error);
    }
  }
}

/**
 * Deliver webhook to endpoint
 */
async function deliverWebhook(url, event, timeout = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': event.signature,
        'X-Webhook-Event': event.type,
        'X-Webhook-ID': event.id,
        'X-Webhook-Timestamp': event.timestamp,
        'User-Agent': 'Tasoko-Webhook/1.0'
      },
      body: JSON.stringify(event),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error(`Webhook delivery timeout after ${timeout}ms`);
    }
    
    throw error;
  }
}

/**
 * Handle package created webhook
 */
export async function handlePackageCreated(packageData, options = {}) {
  try {
    const event = createWebhookEvent(WEBHOOK_EVENTS.PACKAGE_CREATED, {
      package: packageData.toTasokoFormat ? packageData.toTasokoFormat() : packageData
    }, options);
    
    // Send to Tasoko if configured
    if (TASOKO_BASE_URL && API_TOKEN) {
      try {
        await pushPackageToTasoko(TASOKO_BASE_URL, API_TOKEN, [event.data.package]);
      } catch (error) {
        console.error('Failed to push package to Tasoko:', error);
        // Don't fail the webhook if Tasoko push fails
      }
    }
    
    // Publish to WebSocket clients
    publish('packages', {
      type: 'package_created',
      data: packageData
    });
    
    // Queue notification
    try {
      await queuePackageNotification(
        packageData.trackingNumber,
        'package_received',
        `Your package ${packageData.trackingNumber} has been received and is being processed.`
      );
    } catch (error) {
      console.error('Failed to queue package notification:', error);
    }
    
    return event;
  } catch (error) {
    console.error('Error handling package created webhook:', error);
    throw error;
  }
}

/**
 * Handle package updated webhook
 */
export async function handlePackageUpdated(packageData, changes = {}, options = {}) {
  try {
    const event = createWebhookEvent(WEBHOOK_EVENTS.PACKAGE_UPDATED, {
      package: packageData.toTasokoFormat ? packageData.toTasokoFormat() : packageData,
      changes
    }, options);
    
    // Send to Tasoko if configured
    if (TASOKO_BASE_URL && API_TOKEN) {
      try {
        await pushPackageToTasoko(TASOKO_BASE_URL, API_TOKEN, [event.data.package]);
      } catch (error) {
        console.error('Failed to push package update to Tasoko:', error);
      }
    }
    
    // Publish to WebSocket clients
    publish('packages', {
      type: 'package_updated',
      data: packageData,
      changes
    });
    
    // Send notification if status changed
    if (changes.packageStatus !== undefined) {
      try {
        await queuePackageNotification(
          packageData.trackingNumber,
          'status_update',
          `Your package ${packageData.trackingNumber} status has been updated.`
        );
      } catch (error) {
        console.error('Failed to queue status update notification:', error);
      }
    }
    
    return event;
  } catch (error) {
    console.error('Error handling package updated webhook:', error);
    throw error;
  }
}

/**
 * Handle package deleted webhook
 */
export async function handlePackageDeleted(packageData, options = {}) {
  try {
    const event = createWebhookEvent(WEBHOOK_EVENTS.PACKAGE_DELETED, {
      package: packageData.toTasokoFormat ? packageData.toTasokoFormat() : packageData
    }, options);
    
    // Send to Tasoko if configured
    if (TASOKO_BASE_URL && API_TOKEN) {
      try {
        await pushPackageToTasoko(TASOKO_BASE_URL, API_TOKEN, [event.data.package]);
      } catch (error) {
        console.error('Failed to push package deletion to Tasoko:', error);
      }
    }
    
    // Publish to WebSocket clients
    publish('packages', {
      type: 'package_deleted',
      data: packageData
    });
    
    return event;
  } catch (error) {
    console.error('Error handling package deleted webhook:', error);
    throw error;
  }
}

/**
 * Handle manifest updated webhook
 */
export async function handleManifestUpdated(manifestData, collectionCodes = [], packageAWBs = [], options = {}) {
  try {
    const event = createWebhookEvent(WEBHOOK_EVENTS.MANIFEST_UPDATED, {
      APIToken: API_TOKEN,
      CollectionCodes: collectionCodes,
      PackageAWBs: packageAWBs,
      Manifest: manifestData.toTasokoFormat ? manifestData.toTasokoFormat() : manifestData
    }, options);
    
    // Send to Tasoko if configured
    if (TASOKO_BASE_URL && API_TOKEN) {
      try {
        await pushManifestToTasoko(TASOKO_BASE_URL, API_TOKEN, event.data);
      } catch (error) {
        console.error('Failed to push manifest to Tasoko:', error);
      }
    }
    
    // Publish to WebSocket clients
    publish('manifests', {
      type: 'manifest_updated',
      data: manifestData
    });
    
    return event;
  } catch (error) {
    console.error('Error handling manifest updated webhook:', error);
    throw error;
  }
}

/**
 * Handle package status change
 */
export async function handlePackageStatusChanged(packageData, oldStatus, newStatus, options = {}) {
  try {
    const event = createWebhookEvent(WEBHOOK_EVENTS.PACKAGE_STATUS_CHANGED, {
      package: packageData.toTasokoFormat ? packageData.toTasokoFormat() : packageData,
      statusChange: {
        from: oldStatus,
        to: newStatus,
        timestamp: new Date().toISOString()
      }
    }, options);
    
    // Publish to WebSocket clients
    publish(`package_${packageData.trackingNumber}`, {
      type: 'status_changed',
      trackingNumber: packageData.trackingNumber,
      oldStatus,
      newStatus,
      statusName: packageData.statusName || `Status ${newStatus}`,
      timestamp: new Date().toISOString()
    });
    
    // Queue appropriate notification based on status
    let notificationType = 'status_update';
    let message = `Your package ${packageData.trackingNumber} status has been updated.`;
    
    switch (newStatus) {
      case 1: // DELIVERED TO AIRPORT
        message = `Your package ${packageData.trackingNumber} has been delivered to the airport.`;
        break;
      case 2: // IN TRANSIT TO LOCAL PORT
        message = `Your package ${packageData.trackingNumber} is in transit to the local port.`;
        break;
      case 3: // AT LOCAL PORT
        message = `Your package ${packageData.trackingNumber} has arrived at the local port.`;
        break;
      case 4: // AT LOCAL SORTING
        notificationType = 'delivery_ready';
        message = `Your package ${packageData.trackingNumber} is at the local sorting facility and ready for delivery.`;
        break;
    }
    
    try {
      await queuePackageNotification(packageData.trackingNumber, notificationType, message);
    } catch (error) {
      console.error('Failed to queue status change notification:', error);
    }
    
    return event;
  } catch (error) {
    console.error('Error handling package status change webhook:', error);
    throw error;
  }
}

/**
 * Get webhook queue statistics
 */
export function getWebhookStats() {
  const stats = {
    totalQueued: webhookQueue.size,
    byStatus: {
      pending: 0,
      processing: 0,
      success: 0,
      failed: 0,
      retrying: 0
    },
    oldestQueueItem: null,
    newestQueueItem: null
  };
  
  let oldestDate = null;
  let newestDate = null;
  
  for (const [queueId, item] of webhookQueue.entries()) {
    for (const endpoint of item.endpoints) {
      stats.byStatus[endpoint.status]++;
    }
    
    if (!oldestDate || item.queuedAt < oldestDate) {
      oldestDate = item.queuedAt;
      stats.oldestQueueItem = { id: queueId, queuedAt: item.queuedAt };
    }
    
    if (!newestDate || item.queuedAt > newestDate) {
      newestDate = item.queuedAt;
      stats.newestQueueItem = { id: queueId, queuedAt: item.queuedAt };
    }
  }
  
  return stats;
}

/**
 * Get webhook queue items
 */
export function getWebhookQueueItems(options = {}) {
  const { limit = 50, status = null, eventType = null } = options;
  const items = [];
  
  for (const [queueId, item] of webhookQueue.entries()) {
    if (eventType && item.event.type !== eventType) continue;
    
    if (status) {
      const hasMatchingEndpoint = item.endpoints.some(endpoint => endpoint.status === status);
      if (!hasMatchingEndpoint) continue;
    }
    
    items.push({
      id: queueId,
      eventType: item.event.type,
      queuedAt: item.queuedAt,
      endpoints: item.endpoints.map(endpoint => ({
        url: endpoint.url,
        status: endpoint.status,
        attempts: endpoint.attempts,
        lastAttempt: endpoint.lastAttempt,
        nextRetry: endpoint.nextRetry,
        error: endpoint.error
      }))
    });
    
    if (items.length >= limit) break;
  }
  
  return items.sort((a, b) => b.queuedAt - a.queuedAt);
}

/**
 * Retry failed webhook
 */
export async function retryWebhook(queueId, endpointUrl = null) {
  const queueItem = webhookQueue.get(queueId);
  
  if (!queueItem) {
    throw new Error(`Webhook queue item ${queueId} not found`);
  }
  
  let endpointsToRetry = queueItem.endpoints;
  
  if (endpointUrl) {
    endpointsToRetry = queueItem.endpoints.filter(endpoint => endpoint.url === endpointUrl);
    if (endpointsToRetry.length === 0) {
      throw new Error(`Endpoint ${endpointUrl} not found in queue item ${queueId}`);
    }
  }
  
  // Reset failed endpoints for retry
  for (const endpoint of endpointsToRetry) {
    if (endpoint.status === DELIVERY_STATUS.FAILED) {
      endpoint.status = DELIVERY_STATUS.PENDING;
      endpoint.nextRetry = null;
      endpoint.error = null;
    }
  }
  
  // Process immediately
  setTimeout(() => processWebhookQueue(), 100);
  
  return true;
}

/**
 * Cancel webhook
 */
export function cancelWebhook(queueId) {
  const deleted = webhookQueue.delete(queueId);
  if (!deleted) {
    throw new Error(`Webhook queue item ${queueId} not found`);
  }
  return true;
}

/**
 * Start webhook queue processor (call this on app startup)
 */
export function startWebhookProcessor(intervalMs = 5000) {
  setInterval(processWebhookQueue, intervalMs);
  console.log(`🔄 Webhook queue processor started (interval: ${intervalMs}ms)`);
}

/**
 * Clean old completed webhooks (should be run periodically)
 */
export function cleanCompletedWebhooks(maxAgeHours = 24) {
  const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
  let cleaned = 0;
  
  for (const [queueId, item] of webhookQueue.entries()) {
    if (item.queuedAt < cutoffTime) {
      const allCompleted = item.endpoints.every(
        endpoint => endpoint.status === DELIVERY_STATUS.SUCCESS || 
                   endpoint.attempts >= MAX_RETRY_ATTEMPTS
      );
      
      if (allCompleted) {
        webhookQueue.delete(queueId);
        cleaned++;
      }
    }
  }
  
  console.log(`🧹 Cleaned ${cleaned} completed webhook queue items`);
  return cleaned;
}