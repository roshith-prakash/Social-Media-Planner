/**
 * Server-Sent Events subscriber for real-time video analysis progress.
 */
export const subscribeToAnalysis = (projectId, onEvent, onDone, onError) => {
  const base = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const url = `${base}/api/v1/analysis/stream/${projectId}`;
  const es = new EventSource(url);

  es.addEventListener("connected", (e) => {
    console.log("SSE connected:", e.data);
  });

  es.addEventListener("agent_start", (e) => {
    try {
      if (onEvent) onEvent("agent_start", JSON.parse(e.data));
    } catch (err) {
      console.error(err);
    }
  });

  es.addEventListener("agent_done", (e) => {
    try {
      if (onEvent) onEvent("agent_done", JSON.parse(e.data));
    } catch (err) {
      console.error(err);
    }
  });

  es.addEventListener("video_upload_start", (e) => {
    try {
      if (onEvent) onEvent("video_upload_start", JSON.parse(e.data));
    } catch (err) {
      console.error(err);
    }
  });

  es.addEventListener("video_processing", (e) => {
    try {
      if (onEvent) onEvent("video_processing", JSON.parse(e.data));
    } catch (err) {
      console.error(err);
    }
  });

  es.addEventListener("video_ready", (e) => {
    try {
      if (onEvent) onEvent("video_ready", JSON.parse(e.data));
    } catch (err) {
      console.error(err);
    }
  });

  es.addEventListener("cache_hit", (e) => {
    try {
      if (onEvent) onEvent("cache_hit", JSON.parse(e.data));
    } catch (err) {
      console.error(err);
    }
  });

  es.addEventListener("complete", (e) => {
    try {
      const data = JSON.parse(e.data);
      if (onDone) onDone(data);
    } catch {
      if (onDone) onDone();
    }
    es.close();
  });

  es.onerror = (err) => {
    console.warn("SSE connection notice:", err);
    if (onError) onError(err);
  };

  return () => es.close();
};
