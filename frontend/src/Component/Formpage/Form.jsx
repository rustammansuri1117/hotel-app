import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Helmet } from 'react-helmet-async'
import { addHotel } from '../../store/hotelsSlice'
import './Form.css'

const emptyForm = {
  hotelName: '',
  description: '',
  price: '',
  latitude: '',
  longitude: '',
  location: '',
}

const Form = () => {

  const dispatch = useDispatch()

  const [values, setValues] = useState(emptyForm)
  const [image, setImage] = useState(null)
  const [fileKey, setFileKey] = useState(0) // changing this clears the file input
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'success' | 'error', text }

  const handleChange = (e) => {
    const { name, value } = e.target
    setValues({ ...values, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)

    // multipart/form-data so the image file can be uploaded with the text fields
    const formData = new FormData()
    formData.append('title', values.hotelName)
    formData.append('description', values.description)
    formData.append('price', values.price)
    formData.append('latitude', values.latitude)
    formData.append('longitude', values.longitude)
    formData.append('location', values.location)
    if (image) formData.append('image', image)

    try {
      const res = await dispatch(addHotel(formData)).unwrap() // Redux thunk -> POST /api/hotels
      setMessage({ type: 'success', text: res.message })
      setValues(emptyForm)
      setImage(null)
      setFileKey((k) => k + 1)
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="form-page">

      <Helmet>
        <title>Add Hotel | Mayyur Hotel</title>
        <meta name="description" content="Add a new hotel with its price, location and photo." />
      </Helmet>

      <div className="form-card">

        <h1>Add Hotel</h1>
        <p>Enter the details of your hotel</p>

        {message && (
          <div className={message.type === 'success' ? 'status-success' : 'status-error'}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Hotel Name</label>
            <input
              type="text"
              name="hotelName"
              placeholder="Enter hotel name"
              value={values.hotelName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              placeholder="Enter hotel description"
              value={values.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">

            <div className="form-group">
              <label>Price</label>
              <input
                type="number"
                name="price"
                min="0"
                placeholder="Enter price"
                value={values.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                placeholder="City, e.g. Chennai"
                value={values.location}
                onChange={handleChange}
              />
            </div>

          </div>

          <div className="form-row">

            <div className="form-group">
              <label>Latitude</label>
              <input
                type="number"
                step="any"
                name="latitude"
                placeholder="Enter latitude"
                value={values.latitude}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Longitude</label>
              <input
                type="number"
                step="any"
                name="longitude"
                placeholder="Enter longitude"
                value={values.longitude}
                onChange={handleChange}
              />
            </div>

          </div>

          <div className="form-group">
            <label>Hotel Image</label>
            <input
              key={fileKey}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => setImage(e.target.files[0] || null)}
            />
          </div>

          <button type="submit" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add Hotel'}
          </button>

        </form>

      </div>

    </div>
  )
}

export default Form
