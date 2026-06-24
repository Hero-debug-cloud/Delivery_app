import { createBunWebSocket } from "hono/bun";

// Initialize Bun WebSocket helpers for Hono
export const { upgradeWebSocket, websocket } = createBunWebSocket();

// Active tracking client sockets (Next.js admin dashboards): maps raw socket -> Hono WSContext wrapper
export const trackingSockets = new Map<any, any>();

// Map from raw WebSocket client reference to the driverId they are actively tracking
export const socketSubscriptions = new Map<any, string>();

// WebSocket route handlers
export const trackingWsRoute = upgradeWebSocket(() => {
  return {
    onOpen(_evt, ws) {
      trackingSockets.set(ws.raw, ws);
      console.log(`[WebSocket] Admin tracking client connected. Active: ${trackingSockets.size}`);
    },
    onMessage(event, ws) {
      try {
        const msg = JSON.parse(event.data.toString());
        // Keep the latest ws context reference mapped to ws.raw
        trackingSockets.set(ws.raw, ws);
        
        if (msg.action === "subscribe" && msg.driverId) {
          socketSubscriptions.set(ws.raw, msg.driverId);
          console.log(`[WebSocket] Client subscribed to driver telemetry: ${msg.driverId}`);
        } else if (msg.action === "unsubscribe") {
          socketSubscriptions.delete(ws.raw);
          console.log(`[WebSocket] Client unsubscribed from telemetry`);
        }
      } catch (err) {
        console.error("[WebSocket] Failed to parse client message:", err);
      }
    },
    onClose(_evt, ws) {
      trackingSockets.delete(ws.raw);
      socketSubscriptions.delete(ws.raw);
      console.log(`[WebSocket] Admin tracking client disconnected. Active: ${trackingSockets.size}`);
    },
    onError(err, ws) {
      console.error("[WebSocket] Connection error:", err);
      trackingSockets.delete(ws.raw);
      socketSubscriptions.delete(ws.raw);
    },
  };
});

/**
 * Broadcasts driver location telemetry ONLY to clients actively tracking that driver.
 */
export function broadcastTelemetry(driverId: string, data: any) {
  const payload = JSON.stringify({
    type: "telemetry",
    ...data,
  });
  
  for (const [rawSocket, wsContext] of trackingSockets.entries()) {
    if (socketSubscriptions.get(rawSocket) === driverId) {
      try {
        wsContext.send(payload);
      } catch (err) {
        console.error("[WebSocket] Failed to send telemetry update, removing socket:", err);
        trackingSockets.delete(rawSocket);
        socketSubscriptions.delete(rawSocket);
      }
    }
  }
}

/**
 * Broadcasts driver online/offline status changes to ALL connected clients.
 */
export function broadcastStatusChange(driverId: string, status: "online" | "offline", name?: string) {
  const payload = JSON.stringify({
    type: "status_change",
    id: driverId,
    name,
    status,
  });

  for (const [rawSocket, wsContext] of trackingSockets.entries()) {
    try {
      wsContext.send(payload);
    } catch (err) {
      console.error("[WebSocket] Failed to send status change event, removing socket:", err);
      trackingSockets.delete(rawSocket);
      socketSubscriptions.delete(rawSocket);
    }
  }
}
