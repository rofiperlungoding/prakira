// Records what the server actually did for one briefing, step by step, with measured durations.
// Each start and end is passed to `onStep` as it happens (for a live display); finished steps are kept in
// `list` (returned with the briefing). Nothing here is on a timer: a step exists only if the code ran it.
export function tracer(onStep = () => {}, now = Date.now) {
  const open = new Map();
  const list = [];
  const emit = (e) => {
    // The listener writes to a client connection that may already be closed. That must not break the briefing.
    try { onStep(e); } catch { /* listener gone */ }
  };
  const end = (id, state, detail) => {
    const ms = Math.max(0, now() - (open.get(id) ?? now()));
    open.delete(id);
    const e = { id, state, ms, ...detail };
    list.push(e);
    emit(e);
  };
  return {
    list,
    start(id, detail = {}) { open.set(id, now()); emit({ id, state: 'start', ...detail }); },
    done(id, detail = {}) { end(id, 'done', detail); },
    fail(id, error, detail = {}) { end(id, 'fail', { ...detail, error }); },
  };
}
