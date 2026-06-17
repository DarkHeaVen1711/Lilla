import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://dummy-dsn@sentry.io/123456",
  tracesSampleRate: 1.0,
  beforeSend(event) {
    // Scrub Authorization and cookies from request headers
    if (event.request && event.request.headers) {
      for (const key of Object.keys(event.request.headers)) {
        const lowerKey = key.toLowerCase();
        if (lowerKey === "authorization" || lowerKey === "cookie" || lowerKey === "set-cookie") {
          event.request.headers[key] = "[SCRUBBED]";
        }
      }
    }
    // Scrub sensitive JSON body properties (e.g. otp, password)
    if (event.request && event.request.data) {
      try {
        let parsed = typeof event.request.data === "string" ? JSON.parse(event.request.data) : event.request.data;
        if (parsed && typeof parsed === "object") {
          for (const key of ["otp", "password", "token", "access", "refresh"]) {
            if (key in parsed) {
              parsed[key] = "[SCRUBBED]";
            }
          }
          event.request.data = JSON.stringify(parsed);
        }
      } catch (err) {
        // Suppress parsing error if body is not valid JSON
      }
    }
    return event;
  },
});
