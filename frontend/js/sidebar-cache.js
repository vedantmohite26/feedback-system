/**
 * Sidebar Cache — eliminates the "Loading…" flicker when navigating between pages.
 *
 * How it works:
 *   1. On page load, immediately pre-fills sidebar from sessionStorage cache.
 *   2. After auth resolves and fresh data is fetched, updates the cache.
 *
 * Usage: Include this script AFTER neumorphism.css and BEFORE </body>.
 *        Then call `saveSidebarCache(name, role, avatarUrl, email)` once data is ready.
 */

(function () {
  const CACHE_KEY = 'sidebarUserCache';

  // Pre-fill sidebar from cache immediately
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY));
    if (cached) {
      const nameEl = document.getElementById('user-name-sidebar');
      const roleEl = document.getElementById('user-role-sidebar');
      const emailEl = document.getElementById('user-email-sidebar');
      const avatarEl = document.getElementById('user-avatar');
      if (nameEl) nameEl.textContent = cached.name || 'User';
      if (roleEl) roleEl.textContent = cached.role || 'Premium Member';
      if (emailEl) emailEl.textContent = cached.email || '';
      if (avatarEl) {
        if (cached.avatarUrl) {
          avatarEl.innerHTML = `<img src="${cached.avatarUrl}" class="w-full h-full object-cover rounded-full"/>`;
        } else if (cached.initials) {
          avatarEl.textContent = cached.initials;
        }
      }
    }
  } catch (e) { /* ignore parse errors */ }

  // Expose save function globally
  window.saveSidebarCache = function (name, role, avatarUrl, email) {
    try {
      const initials = (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ name, role, avatarUrl, initials, email }));
    } catch (e) { /* ignore */ }
  };

  // Clear cache on logout
  window.clearSidebarCache = function () {
    try { sessionStorage.removeItem(CACHE_KEY); } catch (e) { /* ignore */ }
  };
})();
