import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./user/userSlice";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { setApiDispatch } from "@/services/api";
import ticketReducer from "./user/ticketSlicer"

// console.log("userReducer:", userReducer); // Debug log

const persistConfig = {
    key: "user",
    storage,
    whitelist: ["role","isAuthenticated"],
    // whitelist: ["user","role","isAuthenticated"],
};

export const store = configureStore({
    reducer: {
        user: persistReducer(persistConfig, userReducer),
        tickets: ticketReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
            },
        }),
});

export const persistor = persistStore(store);


setApiDispatch(store.dispatch);

// import { configureStore } from "@reduxjs/toolkit";
// import userReducer from "../store/user/userSlice";
// import { persistStore, persistReducer } from "redux-persist";
// import storage from "redux-persist/lib/storage";

// // Persist configuration
// const persistConfig = {
//     key: "user", // Give it a unique key
//     storage,
//     whitelist: ["user"], // Only persist 'user' state
// };

// // Configure store with persistReducer inside configureStore
// export const store = configureStore({
//     reducer: {
//         user: persistReducer(persistConfig, userReducer), // Apply persistReducer here
//     },
//     middleware: (getDefaultMiddleware) =>
//         getDefaultMiddleware({
//             serializableCheck: {
//                 ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
//             },
//         }),
// });

// export const persistor = persistStore(store);


// import { configureStore, combineReducers } from "@reduxjs/toolkit";
// // import userReducer from "../store/user/userSlice";
// import userReducer from '../store/user/userSlicer'
// import { persistStore, persistReducer } from "redux-persist";
// import storage from "redux-persist/lib/storage"; // defaults to localStorage for web

// // Persist configuration
// const persistConfig = {
//     key: "root", // Key for the persisted state in storage
//     storage,     // Use localStorage (can switch to sessionStorage if preferred)
//     whitelist: ["user"], // Only persist the 'user' reducer
// };

// const rootReducer = combineReducers({
//     user: userReducer,
// });

// // Wrap the rootReducer with persistReducer
// const persistedReducer = persistReducer(persistConfig, rootReducer);

// export const store = configureStore({
//     reducer: persistedReducer,
//     middleware: (getDefaultMiddleware) =>
//         getDefaultMiddleware({
//             serializableCheck: {
//                 // Ignore redux-persist actions for serializability warnings
//                 ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
//             },
//         }),
// });

// // Create a persistor object to manage persistence
// export const persistor = persistStore(store);


// import { configureStore, combineReducers } from "@reduxjs/toolkit";
// import userReducer from "../store/user/userSlicer";
// import { persistStore, persistReducer } from "redux-persist";
// import storage from "redux-persist/lib/storage"; // defaults to localStorage for web

// // Persist configuration
// const persistConfig = {
//     key: "root", // Key for the persisted state in storage
//     storage,     // Use localStorage (can switch to sessionStorage if preferred)
//     whitelist: ["user"], // Only persist the 'user' reducer
// };

// const rootReducer = combineReducers({
//     user: userReducer,
// });

// // Wrap the userReducer with persistReducer
// const persistedReducer = persistReducer(persistConfig, rootReducer);

// export const store = configureStore({
//     reducer: persistedReducer,
//     middleware: (getDefaultMiddleware) =>
//         getDefaultMiddleware({
//             serializableCheck: {
//                 // Ignore these redux-persist actions for serializability
//                 ignoredActions: ["persist/PERSIST"],
//             },
//         }),
// });

// // Create a persistor object to manage persistence
// export const persistor = persistStore(store);



// import { configureStore } from "@reduxjs/toolkit";
// import userReducer from "../store/user/userSlicer";


// const store = configureStore({
//     reducer: {
//         user: userReducer
//     }
// })

// export default store;
// 
// 
// 
// 
// // import { configureStore } from "@reduxjs/toolkit";
// import userReducer from "../store/user/userSlicer";
// import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
// import storage from "redux-persist/lib/storage"; // defaults to localStorage for web
// import { createTransform } from "redux-persist";

// // Transform to persist only specific fields
// const userTransform = createTransform(
//     (inboundState) => ({
//         isAuthenticated: inboundState.isAuthenticated,
//         user: inboundState.user,
//     }),
//     (outboundState) => ({
//         ...outboundState,
//         loading: false,
//         error: null,
//     }),
//     { whitelist: ["user"] }
// );

// // Persist configuration
// const persistConfig = {
//     key: "root",
//     storage,
//     whitelist: ["user"], // Optional here, keep if you plan to add more reducers
//     transforms: [userTransform], // Filter out transient fields
// };

// // Wrap the userReducer with persistReducer
// const persistedReducer = persistReducer(persistConfig, userReducer);

// const store = configureStore({
//     reducer: {
//         user: persistedReducer,
//     },
//     middleware: (getDefaultMiddleware) =>
//         getDefaultMiddleware({
//             serializableCheck: {
//                 ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
//             },
//         }),
// });

// // Create a persistor object to manage persistence
// export const persistor = persistStore(store);

// export default store;