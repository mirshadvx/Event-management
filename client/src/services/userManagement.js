import api from "./api";

// Fetch all managed users for a specific event
export const getManagedUsers = async (eventId) => {
  try {
    const response = await api.get(`gatekeeper/events/${eventId}/managed-users/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching managed users:", error);
    throw error;
  }
};

// Create a new managed user for an event
export const createManagedUser = async (eventId, data) => {
  try {
    const response = await api.post(`gatekeeper/events/${eventId}/managed-users/`, data);
    return response.data;
  } catch (error) {
    console.error("Error creating managed user:", error);
    throw error;
  }
};

// Toggle the active status of a managed user
export const toggleUserStatus = async (eventId, userId, status) => {
  try {
    const response = await api.patch(
      `gatekeeper/events/${eventId}/managed-users/${userId}/`,
      { active: status }
    );
    return response.data;
  } catch (error) {
    console.error("Error toggling user status:", error);
    throw error;
  }
};

// Delete a managed user
export const deleteManagedUser = async (eventId, userId) => {
  try {
    await api.delete(`gatekeeper/events/${eventId}/managed-users/${userId}/`);
    return true;
  } catch (error) {
    console.error("Error deleting managed user:", error);
    throw error;
  }
};