import axios from "axios";
import { store } from "@/store/store";
import { logout } from "@/store/GuardTicketValidator/guardAuthSlice";

const guardApi = axios.create({
  baseURL: "http://localhost:8000/api/v1/gatekeeper/",
  withCredentials: true,
});

guardApi.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

guardApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      store.dispatch(logout());

      const match = window.location.pathname.match(/\/event\/([^/]+)\/guard/);
      const eventId = match?.[1];
      if (eventId && !window.location.pathname.endsWith("/guard/login")) {
        window.location.href = `/event/${eventId}/guard/login`;
      }
    }
    return Promise.reject(error);
  }
);

export const loginGuard = async (event_id,username, password) => {
  const response = await guardApi.post(`event/${event_id}/guard/login/`, { username, password });
  return response.data;
};

export const getGuardSession = async (event_id) => {
  const response = await guardApi.get(`event/${event_id}/guard/me/`);
  return response.data;
};

export const logoutGuard = async () => {
  await guardApi.post("event/guard/logout/");
};

export const getTicketScanHistory = async (event_id) => {
  const response = await guardApi.get(`event/${event_id}/guard/scans/`);
  return response.data;
};

export const verifyTicket = async (event_id, ticketId) => {
  const response = await guardApi.post(`event/${event_id}/guard/verify-ticket/`, { ticket_id: ticketId });
  return response.data;
};

export default guardApi;
