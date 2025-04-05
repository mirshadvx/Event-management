import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    selectedTickets: {}
}

const ticketSlicer = createSlice({
    name: "ticketSlicer",
    initialState,
    reducers: {
        setTicketCount: (state, action) => {
            const { eventId, ticketType, count} = action.payload;
            if (!state.selectedTickets[eventId]) {
                state.selectedTickets[eventId] = {}
            }
            state.selectedTickets[eventId][ticketType] = count;
        },
        clearTickets: (state, action) => {
            const eventId = action.payload;
            delete state.selectedTickets[eventId];
        },
        resetAllTickets: (state) => {
            state.selectedTickets = {};
        }
    }
})

export const { setTicketCount, clearTickets, resetAllTickets} = ticketSlicer.actions;
export default ticketSlicer.reducer;