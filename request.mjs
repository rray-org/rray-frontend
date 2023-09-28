let progressHandler;
let requests = 0;

function triggerProgress() {
  if (requests <= 0) return;
  setTimeout(() => {
    if (!progressHandler || requests <= 0) return;
    progressHandler.start();
  }, 1500); // 1.5 seconds grace period
}

export function setProgressHandler(handler) {
  progressHandler = handler;
  triggerProgress();
}

function buildUrl(base, data) {
  if (!data) return base;
  const url = new URL(base, window.location.href);
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      for (const el of value) url.searchParams.append(key, el);
    } else {
      url.searchParams.append(key, value);
    }
  }
  return url;
}

export function get(url, options, data = null) {
  requests++;
  triggerProgress();
  return fetch(buildUrl(url, data), options)
    .then(res => res.json())
    .then(res => {
      if (res.errorCode) {
        if (res.errorCode === 'E_INVITATION') {
          location.replace('/invitation.html');
        }
        // TODO: show .errorCode and .errorMessage
        const err = new Error(`[${res.errorCode}] ${res.errorMessage}`);
        err.errorCode = res.errorCode;
        if (window.Sentry) window.Sentry.captureException(err);
        throw err;
      }
      return res;
    })
    .finally(() => {
      requests--;
      if (progressHandler && requests <= 0) progressHandler.done();
    });
}

export function post(url, data) {
  return get(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(data),
  });
}
