import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { checkAuth } from "../../services/api";
import { getProfile } from "../../services/api";

export const verifyAuth = createAsyncThunk("user/verifyAuth", async (_, { rejectWithValue }) => {
    try {
        const response = await checkAuth();
        console.log("verifyAuth response:", response.data);
        return { isAuthenticated: response.data.authenticated };
    } catch (error) {
        console.error("verifyAuth error:", error);
        return rejectWithValue(false);
    }
});

export const get_ProfileData = createAsyncThunk("user/get_ProfileData", async (_, { rejectWithValue }) => {
    try {
        const response = await getProfile();
        console.log("user profile datas with back: ", response.data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data || error.message);
    }
});

const userSlice = createSlice({
    name: "user",
    initialState: {
        isAuthenticated: false,
        role: {
            admin: false,
            user: false,
        },
        user: null,
        loading: false,
        error: null,
    },
    reducers: {
        setAuthenticated: (state, action) => {
            state.isAuthenticated = action.payload;
        },
        setUser(state, action) {
            state.user = action.payload;
        },
        setRole: (state, action) => {
            state.role = action.payload;
        },
        setIsUser: (state) => {
            state.role.user = true;
        },
        setNotUser: (state) => {
            state.role.user = false;
        },
        setIsAdmin: (state) => {
            state.role.admin = true;
        },
        setNotAdmin: (state) => {
            state.role.admin = false;
        },
        logoutReducer: (state) => {
            state.isAuthenticated = false;
            state.role = { admin: false, user: false };
            state.user = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(verifyAuth.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(verifyAuth.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = action.payload.isAuthenticated;
            })
            .addCase(verifyAuth.rejected, (state) => {
                state.loading = false;
                state.isAuthenticated = false;
            })

            .addCase(get_ProfileData.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(get_ProfileData.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.data;
            })
            .addCase(get_ProfileData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { setAuthenticated, setIsUser, setUser, setNotUser, setIsAdmin, setNotAdmin, logoutReducer, setRole } =
    userSlice.actions;

export default userSlice.reducer;

// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import { checkAuth } from "../../services/api";

// export const verifyAuth = createAsyncThunk("user/verifyAuth", async (_, { rejectWithValue }) => {
//     try {
//         const response = await checkAuth();
//         return { isAuthenticated: response.data.authenticated };
//     } catch (error) {
//         return rejectWithValue(false);
//     }
// });

// const userSlice = createSlice({
//     name: "user",
//     initialState: {
//         isAuthenticated: false,
//         user: null,
//         loading: false,
//         error: null,
//     },
//     reducers: {
//         setAuthenticated: (state, action) => {
//             state.isAuthenticated = action.payload;
//         },
//     },
//     extraReducers: (builder) => {
//         builder
//             .addCase(verifyAuth.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(verifyAuth.fulfilled, (state, action) => {
//                 state.loading = false;
//                 state.isAuthenticated = action.payload.isAuthenticated;
//             })
//             .addCase(verifyAuth.rejected, (state) => {
//                 state.loading = false;
//                 state.isAuthenticated = false;
//             });
//     },
// });

// export const { setAuthenticated } = userSlice.actions;

// export default userSlice.reducer;
