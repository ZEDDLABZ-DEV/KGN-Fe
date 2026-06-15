import axios from "axios";

// When VITE_USE_PROXY=true (Netlify), requests stay on the same origin
// and netlify.toml proxies /v1/* to the EC2 backend.
const baseURL =
  import.meta.env.VITE_USE_PROXY === "true"
    ? ""
    : import.meta.env.VITE_BASE_URL;

const Request = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },

});

// 🔹 Request Interceptor: add token dynamically
Request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ Automatically adjust Content-Type for FormData or Binary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"]; // Let browser set multipart/form-data boundary
    }

    if (config.headers["Content-Type"] === "application/octet-stream") {
      // binary upload → keep as is
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 🔹 Response Interceptor
Request.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
);

export { Request };
