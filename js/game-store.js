/* Guarded local storage for game progress (stars, unlocks, best results, points).
   Every read and write is wrapped so a blocked or full localStorage cannot crash a game.
   SCOPED=false keeps the existing unscoped keys exactly as before (no progress is hidden or moved).
   The account-scoped mode (SCOPED=true) is held in a separate patch pending a recovery decision. */
(function () {
  if (window.CQGameStore) return;
  var SCOPED = false;
  var uid = null, ready = !SCOPED, waiting = [];
  function k(key) { return SCOPED ? 'cq-game:' + uid + ':' + key : key; }
  function usable() { return !SCOPED || !!uid; }
  function safe(fn, fallback) { try { return fn(); } catch (e) { return fallback; } }
  var store = {
    get ready() { return ready && usable(); },
    get uid() { return uid; },
    get scoped() { return SCOPED; },
    get: function (key) { return usable() ? safe(function () { return localStorage.getItem(k(key)); }, null) : null; },
    set: function (key, value) { return usable() ? safe(function () { localStorage.setItem(k(key), String(value)); return true; }, false) : false; },
    remove: function (key) { return usable() ? safe(function () { localStorage.removeItem(k(key)); return true; }, false) : false; },
    whenReady: function (fn) { if (ready && usable()) fn(); else waiting.push(fn); },
    setUid: function (value) {
      if (!SCOPED || ready) return;
      ready = true;
      uid = (typeof value === 'string' && value) ? value : null;
      if (!uid) return;
      var queue = waiting; waiting = [];
      queue.forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } });
      window.dispatchEvent(new CustomEvent('cq-game-ready', { detail: { uid: uid } }));
    },
    /* Account changed or signed out while the page is open: stop all reads and writes at once. */
    revoke: function () { if (!SCOPED) return; uid = null; ready = true; waiting = []; window.dispatchEvent(new CustomEvent('cq-game-revoked')); }
  };
  window.CQGameStore = store;
})();
