import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api, { setAuthToken } from '../services/api';

export interface AuthState {
    token: string | null;
    username: string | null;
    role: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    token: null,
    username: null,
    role: null,
    isAuthenticated: false,
    loading: false,
    error: null,
};

export const loginUser = createAsyncThunk(
    'auth/login',
    async (
        credentials: { username: string; password: string },
        { rejectWithValue }
    ) => {
        try {
            const response = await api.post('/auth/login', credentials);
            return response.data.data;
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            return rejectWithValue(
                error.response?.data?.message || 'Login failed'
            );
        }
    }
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
    await api.post('/auth/logout');
});

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setToken(state, action: PayloadAction<string>) {
            state.token = action.payload;
        },
        clearAuth(state) {
            state.token = null;
            state.username = null;
            state.role = null;
            state.isAuthenticated = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.token = action.payload.accessToken;
                state.username = action.payload.username;
                state.role = action.payload.role;
                state.isAuthenticated = true;
                // Set the token for the API interceptor immediately
                setAuthToken(action.payload.accessToken);
                localStorage.setItem('token', action.payload.accessToken);
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.token = null;
                state.username = null;
                state.role = null;
                state.isAuthenticated = false;
            });
    },
});

export const { setToken, clearAuth } = authSlice.actions;
export default authSlice.reducer;
