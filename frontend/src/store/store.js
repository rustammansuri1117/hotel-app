import { configureStore } from '@reduxjs/toolkit'
import hotelsReducer from './hotelsSlice'
import bookingsReducer from './bookingsSlice'

// The single Redux store: state.hotels (list + selected hotel) and state.bookings (confirmation)
export const store = configureStore({
  reducer: {
    hotels: hotelsReducer,
    bookings: bookingsReducer,
  },
})
