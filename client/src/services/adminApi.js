import axios from "axios";
import { logout, refreshToken } from "./api";
import { store } from "@/store/store";
import { setAuthenticated } from "@/store/user/userSlice";

const adminApi = axios.create({
    baseURL: 'http://localhost:8000/api/v1/admin/',
    headers: {
        'Content-Type' : 'application/json',
    },
    withCredentials: true,
});

export const admin_login = (data) => adminApi.post("/login/",data)

adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await refreshToken();
        if (refreshResponse.data.refreshtoken) {
          console.log('Token refreshed successfully');
          return adminApi(originalRequest);
        }
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError);
        store.dispatch(setAuthenticated(false))
        store.dispatch(logout())
        window.location.href = '/admin/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default adminApi;