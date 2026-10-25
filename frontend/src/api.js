// All calls to the FastAPI backend live here.
// In production VITE_API_URL points at the hosted backend; locally it is empty and the
// Vite dev server forwards /api to http://localhost:8000.
const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "") + "/api";
const CODE_KEY = "access_code";

export const getAccessCode = () => sessionStorage.getItem(CODE_KEY) || "";
export const setAccessCode = (code) => sessionStorage.setItem(CODE_KEY, code);

function authHeaders() {
  const code = getAccessCode();
  return code ? { "X-Access-Code": code } : {};
}

async function errorFrom(res) {
  let detail = res.statusText;
  try {
    const data = await res.json();
    detail = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
  } catch {
    // response had no JSON body; keep the status text
  }
  const error = new Error(detail || `Request failed (${res.status})`);
  error.status = res.status;
  return error;
}

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
  if (!res.ok) throw await errorFrom(res);
  return res.json();
}

export const checkAccess = () => request("/auth/check");

export const createProject = (requirement) =>
  request("/projects", { method: "POST", body: JSON.stringify({ requirement }) });

export const listProjects = () => request("/projects");

export const getProject = (id) => request(`/projects/${id}`);

// A plain <a href> can't send the access code header, so fetch the zip and save it from memory.
export async function downloadProject(id) {
  const res = await fetch(`${BASE}/projects/${id}/download`, { headers: authHeaders() });
  if (!res.ok) throw await errorFrom(res);
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = `project-${id}.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
