import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export interface Account {
    id: string;
    accountNumber: string;
    accountType: 'CHECKING' | 'SAVINGS';
    balance: number;
    active: boolean;
    createdAt: string;
}

export interface AccountState {
    accounts: Account[];
    loading: boolean;
    error: string | null;
}

const initialState: AccountState = {
    accounts: [],
    loading: false,
    error: null,
};

export const fetchAccounts = createAsyncThunk(
    'accounts/fetchAccounts',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/accounts/my');
            return response.data.data;
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            return rejectWithValue(
                error.response?.data?.message || 'Failed to fetch accounts'
            );
        }
    }
);

export const createAccount = createAsyncThunk(
    'accounts/createAccount',
    async (type: 'CHECKING' | 'SAVINGS', { rejectWithValue }) => {
        try {
            const response = await api.post(`/accounts?type=${type}`);
            return response.data.data;
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            return rejectWithValue(
                error.response?.data?.message || 'Failed to create account'
            );
        }
    }
);

const accountSlice = createSlice({
    name: 'accounts',
    initialState,
    reducers: {
        clearAccounts(state) {
            state.accounts = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAccounts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAccounts.fulfilled, (state, action) => {
                state.loading = false;
                state.accounts = action.payload;
            })
            .addCase(fetchAccounts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createAccount.fulfilled, (state, action) => {
                state.accounts.push(action.payload);
            });
    },
});

export const { clearAccounts } = accountSlice.actions;
export default accountSlice.reducer;
