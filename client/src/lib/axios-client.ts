//Learning
// Axios JavaScript library used to make HTTP requests (like GET, POST, PUT, DELETE) from:
// Browsers (frontend)
// Node.js (backend)

import axios from "axios";

export const API = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? `${import.meta.env.VITE_API_URL}/api`
      : "/api",
  withCredentials: true,
});
