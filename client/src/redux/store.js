import { combineReducers, configureStore } from '@reduxjs/toolkit';
import userReducer from './user/userSlice';

import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const rootReducer = combineReducers({ user: userReducer });
//setting the name of the key in local storage
const persistConfig = {
  key: 'root',
  storage,
  version: 1,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

export const persistor = persistStore(store);
// redux-persist allows you to persist the Redux store's state to a storage layer eg: users won't need to log in again after refreshing the page