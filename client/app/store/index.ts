export * from './slices';

export * from './selectors';

export * from './types';

import { configureStore } from "@reduxjs/toolkit";
import {
    apiErrorMiddleware,
    listenerMiddleware,
    localStorageSyncMiddleware,
    loggerMiddleware,
    networkMiddleware
} from "./middleware";
import rootReducer from "./rootReducer";

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types for secure storage
                ignoredActions: [
                    'auth/login',
                    'auth/updateToken',
                    'persist/PERSIST',
                    'persist/REHYDRATE'
                ],
                // Ignore these field paths in all actions
                ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
                // Ignore these paths in the state
                ignoredPaths: ['auth.secureStorage'],
            },
            thunk: {
                extraArgument: {
                    api: null,
                }
            }
        })
            .prepend(listenerMiddleware.middleware)
            .concat([
                apiErrorMiddleware,
                networkMiddleware,
                localStorageSyncMiddleware,
                ...(process.env.NODE_ENV === 'development' ? [loggerMiddleware] : [])
            ]),
    devTools: process.env.NODE_ENV !== 'production' && {
        name: 'E-commerce App',
        trace: true,
        traceLimit: 25,
    },
    enhancers: (getDefaultEnhancers) =>
        getDefaultEnhancers({
            autoBatch: { type: 'tick' } // Enable auto-batching
        })
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Hot reload support for Vite (client-side only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    if (import.meta.hot) {
        import.meta.hot.accept('./rootReducer', (newModule) => {
            if (newModule) {
                store.replaceReducer(newModule.default);
            }
        });
    }
}