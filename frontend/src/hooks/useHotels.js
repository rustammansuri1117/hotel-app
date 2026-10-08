import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { loadHotels, clearList } from '../store/hotelsSlice'
import { toQueryString } from '../api/hotels'

/**
 * Loads one page of hotels into the Redux store and returns it.
 * `params` = { search, location, maxPrice, page, limit, ... }
 * Re-fetches when the params change, or when reload() is called.
 */
export default function useHotels(params) {
  const dispatch = useDispatch()
  const { items, pagination, status, error } = useSelector((state) => state.hotels)

  const queryString = toQueryString(params)

  const reload = useCallback(() => {
    dispatch(loadHotels(queryString))
  }, [dispatch, queryString])

  useEffect(() => {
    dispatch(loadHotels(queryString))
  }, [dispatch, queryString])

  // leaving the page: empty the list so the next page doesn't flash old hotels
  useEffect(() => () => {
    dispatch(clearList())
  }, [dispatch])

  return {
    hotels: items,
    pagination,
    error,
    loading: status === 'loading' || status === 'idle',
    reload,
  }
}
