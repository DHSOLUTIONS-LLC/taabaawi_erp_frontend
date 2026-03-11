// app/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import posReducer from '../features/pos/posSlice';
import branchReducer from '../features/branch/branchSlice'; // NEW
import { api } from '../services/api';
import { inventoryApi } from '../services/inventoryApi';
import inventoryReducer from '../features/inventory/inventorySlice';
import salesReducer from '../features/sales/salesSlice';
import crmReducer from '../features/crm/crmSlice';
import reportsReducer from '../features/reports/reportsSlice';
import helpReducer from '../features/help/helpSlice';
import systemReducer from '../features/system/systemSlice';
import paymentMethodReducer from '../features/system/paymentMethodSlice';
import seoReducer from '../features/system/seoSlice';
import blogReducer from '../features/system/blogSlice';
import aiContentReducer from '../features/ai/aiContentSlice';
import securityReducer from '../features/security/securitySlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        branch: branchReducer, // NEW - Add branch reducer
        [api.reducerPath]: api.reducer,
        [inventoryApi.reducerPath]: inventoryApi.reducer,
        inventory: inventoryReducer,
        pos: posReducer,
        sales: salesReducer,
        crm: crmReducer,
        reports: reportsReducer,
        help: helpReducer,
        system: systemReducer,
        paymentMethods: paymentMethodReducer,
        seo: seoReducer,
        blog: blogReducer,
        aiContent: aiContentReducer,
        security: securityReducer,
    },
    middleware: (getDefault) =>
        getDefault().concat(
            api.middleware,
            inventoryApi.middleware,
        ),
    devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;