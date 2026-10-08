import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { createBooking as createBookingApi, fetchBooking } from '../api/hotels'

export const createBooking = createAsyncThunk('bookings/create', (payload) =>
  createBookingApi(payload)           // POST /api/bookings
)

export const loadBooking = createAsyncThunk('bookings/load', (reference) =>
  fetchBooking(reference)             // GET /api/bookings/:reference
)

const initialState = {
  current: null,        // the booking shown on the confirmation page
  status: 'idle',       // idle | loading | succeeded | failed
  error: '',
  requestId: null,
}

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // a freshly created booking is stored right away, so the confirmation page opens instantly
      .addCase(createBooking.fulfilled, (state, action) => {
        state.current = action.payload.data
        state.status = 'succeeded'
        state.error = ''
      })
      .addCase(loadBooking.pending, (state, action) => {
        state.status = 'loading'
        state.error = ''
        state.requestId = action.meta.requestId
      })
      .addCase(loadBooking.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return
        state.current = action.payload.data
        state.status = 'succeeded'
      })
      .addCase(loadBooking.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return
        state.status = 'failed'
        state.error = action.error.message
      })
  },
})

export default bookingsSlice.reducer
