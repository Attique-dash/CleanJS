// Simple WebSocket pub/sub registry for server-side notifications

const channels = new Map(); // channel => Set<WebSocket>

export function subscribe(channel, ws) {
  if (!channels.has(channel)) channels.set(channel, new Set());
  channels.get(channel).add(ws);
  ws.on('close', () => {
    const set = channels.get(channel);
    if (set) {
      set.delete(ws);
      if (set.size === 0) channels.delete(channel);
    }
  });
}

export function publish(channel, message) {
  const set = channels.get(channel);
  if (!set) return 0;
  const data = typeof message === 'string' ? message : JSON.stringify(message);
  let count = 0;
  for (const ws of set) {
    try {
      ws.send(data);
      count++;
    } catch (_) {}
  }
  return count;
}


