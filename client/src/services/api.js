import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000/api/v1/",
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

let dispatch = null;

export const setApiDispatch = (storeDispatch) => {
    dispatch = storeDispatch;
};

export const RegisterApi = (data) => api.post("users/register/", data);
export const checkUsername = (username) => api.get("users/check-username/", { params: { username } });
export const verifyOTP = (data) => api.post("users/verify-otp/", data);
export const login = (data) => api.post("users/token/", data);
export const refreshToken = () => api.post("users/token/refresh/");
export const logout = () => api.post("users/logout/");
export const checkAuth = () => api.post("users/authenticated/");
export const getProfile = () => api.get("users/profile/");
export const CheckOrganizerStatus = () => api.get("users/organizer-request-status/");
export const forgotPassword = (data) => api.post("users/password-reset/", data);
export const resetPassword = (data) => api.post("users/password-reset/confirm/", data);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshResponse = await refreshToken();
                if (refreshResponse.data.refreshtoken) {
                    console.log("Token refreshed successfully");
                    return api(originalRequest);
                }
            } catch (refreshError) {
                console.error("Refresh token failed:", refreshError);
                if (dispatch) {
                    dispatch({ type: "user/setAuthenticated", payload: false });
                }
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
