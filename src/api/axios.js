import axios from "axios";


//http://localhost:5000/api
const api = axios.create({
  baseURL: "https://social-automation-backend.vercel.app/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;