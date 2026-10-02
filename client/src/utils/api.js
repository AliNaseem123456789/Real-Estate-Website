// Small helper for calling our backend.
//   const data = await api("/properties?page=2");
//   await api("/enquiries", { method: "POST", body: { name, message } });
// Throws an Error with the server's message if something goes wrong.
export async function api(path, { method = "GET", body } = {}) {
  const isFormData = body instanceof FormData;

  const res = await fetch(`/api${path}`, {
    method,
    headers: body && !isFormData ? { "Content-Type": "application/json" } : undefined,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    const error = new Error(data.message || "Something went wrong, please try again");
    error.status = res.status; // e.g. 401 = not signed in
    throw error;
  }
  return data;
}
