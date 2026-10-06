const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  const isJson =
    response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const message =
      data?.mensagem ||
      data?.message ||
      data?.erro ||
      `Erro HTTP ${response.status}`;

    throw new Error(message);
  }

  return data;
}

const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, data) =>
    request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  put: (endpoint, data) =>
    request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  patch: (endpoint, data) =>
    request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (endpoint) =>
    request(endpoint, {
      method: "DELETE",
    }),
};

export default api;
