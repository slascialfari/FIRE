export function encodeStateToUrl(inputs) {
  try {
    const json = JSON.stringify(inputs);
    const b64 = btoa(unescape(encodeURIComponent(json)));
    const url = new URL(window.location.href);
    url.searchParams.set('s', b64);
    window.history.replaceState(null, '', url.toString());
  } catch {
    // non-fatal: sharing state is a nice-to-have, never block the app on it
  }
}

export function decodeStateFromUrl() {
  try {
    const url = new URL(window.location.href);
    const b64 = url.searchParams.get('s');
    if (!b64) return null;
    const json = decodeURIComponent(escape(atob(b64)));
    return JSON.parse(json);
  } catch {
    return null;
  }
}
