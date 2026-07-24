import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  staff: null,
  isAuthenticated: false,
  error: null,
  loading: false,
};

const guardAuthSlice = createSlice({
  name: "guardAuth",
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(state, action) {
      state.staff = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
    },
    loginFailure(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
    logout(state) {
      state.staff = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const { loginStart,loginSuccess,loginFailure,logout,clearError,} = guardAuthSlice.actions;

export default guardAuthSlice.reducer;