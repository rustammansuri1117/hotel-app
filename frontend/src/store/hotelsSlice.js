import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { fetchHotels, fetchHotel, createHotel, updateHotel, deleteHotel } from '../api/hotels'

// Each thunk = one REST call to the Express API.
// If the API call throws, the thunk is "rejected" and .unwrap() re-throws the error message.

export const loadHotels = createAsyncThunk('hotels/load', (queryString) =>
  fetchHotels(queryString)            // GET /api/hotels?...
)

export const loadHotel = createAsyncThunk('hotels/loadOne', (id) =>
  fetchHotel(id)                      // GET /api/hotels/:id  (used by the booking page)
)

export const addHotel = createAsyncThunk('hotels/add', (formData) =>
  createHotel(formData)               // POST /api/hotels
)

export const editHotel = createAsyncThunk('hotels/edit', ({ id, formData }) =>
  updateHotel(id, formData)           // PUT /api/hotels/:id
)

export const removeHotel = createAsyncThunk('hotels/remove', (id) =>
  deleteHotel(id)                     // DELETE /api/hotels/:id
)

const initialState = {
  // list (home / update / delete pages)
  items: [],            // hotels on the current page
  pagination: null,     // { page, limit, total, totalPages, hasNext, hasPrev }
  status: 'idle',       // idle | loading | succeeded | failed
  error: '',
  requestId: null,      // used to ignore out-of-date responses

  // one hotel (booking page)
  selected: null,
  selectedStatus: 'idle',
  selectedError: '',
  selectedRequestId: null,
}

const hotelsSlice = createSlice({
  name: 'hotels',
  initialState,
  reducers: {
    // called when a page that showed the list is left, so the next page starts clean
    clearList(state) {
      state.items = []
      state.pagination = null
      state.status = 'idle'
      state.error = ''
      state.requestId = null
    },
    clearSelected(state) {
      state.selected = null
      state.selectedStatus = 'idle'
      state.selectedError = ''
      state.selectedRequestId = null
    },
  },
  extraReducers: (builder) => {
    builder
      // ----- list -----
      .addCase(loadHotels.pending, (state, action) => {
        state.status = 'loading'
        state.error = ''
        state.requestId = action.meta.requestId
      })
      .addCase(loadHotels.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return // stale response
        state.items = action.payload.data
        state.pagination = action.payload.pagination
        state.status = 'succeeded'
      })
      .addCase(loadHotels.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return
        state.items = []
        state.pagination = null
        state.status = 'failed'
        state.error = action.error.message
      })

      // ----- one hotel -----
      .addCase(loadHotel.pending, (state, action) => {
        state.selected = null
        state.selectedStatus = 'loading'
        state.selectedError = ''
        state.selectedRequestId = action.meta.requestId
      })
      .addCase(loadHotel.fulfilled, (state, action) => {
        if (state.selectedRequestId !== action.meta.requestId) return
        state.selected = action.payload.data
        state.selectedStatus = 'succeeded'
      })
      .addCase(loadHotel.rejected, (state, action) => {
        if (state.selectedRequestId !== action.meta.requestId) return
        state.selectedStatus = 'failed'
        state.selectedError = action.error.message
      })

      // keep the list in sync right after an edit / delete
      .addCase(editHotel.fulfilled, (state, action) => {
        const updated = action.payload.data
        state.items = state.items.map((h) => (h.id === updated.id ? updated : h))
      })
      .addCase(removeHotel.fulfilled, (state, action) => {
        state.items = state.items.filter((h) => h.id !== action.payload.data.id)
      })
  },
})

export const { clearList, clearSelected } = hotelsSlice.actions
export default hotelsSlice.reducer
