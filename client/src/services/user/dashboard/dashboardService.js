import api from "@/services/api";

export const getOngoingDetails = async (eventId) => {
  try {
    const response = await api.get(`organizer/event-ongoing/${eventId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching event details:', error);
    throw error;
  }
};

export const getRevenueDetails = async (eventId) => {
  try {
    const response = await api.get(`organizer/revenue-event/${eventId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching revenue details:', error);
    throw error;
  }
};