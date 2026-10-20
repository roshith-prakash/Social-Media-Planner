/**
 * In-memory SSE client registry.
 * Maps projectId -> Set of active HTTP response streams.
 */
const clients = new Map();

export const registerClient = (projectId, res) => {
  if (!clients.has(projectId)) {
    clients.set(projectId, new Set());
  }
  clients.get(projectId).add(res);
};

export const removeClient = (projectId, res) => {
  const set = clients.get(projectId);
  if (set) {
    if (res) {
      set.delete(res);
      if (set.size === 0) clients.delete(projectId);
    } else {
      clients.delete(projectId);
    }
  }
};

export const emit = (projectId, event, data) => {
  const set = clients.get(projectId);
  if (set && set.size > 0) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of set) {
      try {
        res.write(payload);
      } catch (err) {
        console.warn(`Failed to write SSE event '${event}':`, err.message);
      }
    }
  }
};
