export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let res = await fetch(input, init);

  if (res.status === 401) {
    try {
      const refreshRes = await fetch("/api/auth/refresh", { method: "POST" });
      if (refreshRes.ok) {
        // Retry original request once
        res = await fetch(input, init);
      }
    } catch (err) {
      console.error("Silent token refresh failed:", err);
    }
  }

  return res;
}
