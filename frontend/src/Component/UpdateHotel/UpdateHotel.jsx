import React, { useState } from "react";
import useHotels from "../../hooks/useHotels";
import { useDispatch } from "react-redux";
import { Helmet } from "react-helmet-async";
import { imageUrl } from "../../api/hotels";
import { editHotel } from "../../store/hotelsSlice";
import Pagination from "../Pagination/Pagination";
import "./UpdateHotel.css";

const HOTELS_PER_PAGE = 6;

const UpdateHotel = () => {
    const dispatch = useDispatch();
    const [page, setPage] = useState(1);
    const { hotels, pagination, loading, error, reload } = useHotels({
        page,
        limit: HOTELS_PER_PAGE,
    });

    const [selectedHotel, setSelectedHotel] = useState(null);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        latitude: "",
        longitude: "",
        location: "",
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null); // { type, text }

    const handleUpdateClick = (hotel) => {
        setSelectedHotel(hotel);
        setMessage(null);

        setFormData({
            title: hotel.title,
            description: hotel.description ?? "",
            price: hotel.price,
            latitude: hotel.latitude ?? "",
            longitude: hotel.longitude ?? "",
            location: hotel.location ?? "",
        });

        setImageFile(null);
        setImagePreview(imageUrl(hotel.image));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];

        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!selectedHotel) return;

        // multipart/form-data: text fields + (optional) new image
        const body = new FormData();
        Object.entries(formData).forEach(([key, value]) => body.append(key, value));
        if (imageFile) body.append("image", imageFile);

        setSaving(true);
        setMessage(null);

        try {
            const res = await dispatch(editHotel({ id: selectedHotel.id, formData: body })).unwrap() // Redux thunk -> PUT /api/hotels/:id;
            setSelectedHotel(null);
            setMessage({ type: "success", text: res.message });
            reload();
        } catch (err) {
            setMessage({ type: "error", text: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setSelectedHotel(null);
        setMessage(null);
    };

    return (
        <div className="update-hotel-container">

            <Helmet>
                <title>Update Hotel | Mayyur Hotel</title>
            </Helmet>

            <h1>Update Hotel</h1>

            {message && (
                <div className={message.type === "success" ? "status-success" : "status-error"}>
                    {message.text}
                </div>
            )}

            {!selectedHotel ? (
                <>
                    {error && <p className="status-error">{error}</p>}

                    {loading && hotels.length === 0 && !error && (
                        <p className="status-info">Loading hotels...</p>
                    )}

                    {!loading && !error && hotels.length === 0 && (
                        <p className="status-info">No hotels available.</p>
                    )}

                    <div className="hotel-list">

                        {hotels.map((hotel) => (
                            <div className="update-hotel-card" key={hotel.id}>

                                <img
                                    src={imageUrl(hotel.image)}
                                    alt={hotel.title}
                                />

                                <div className="hotel-info">

                                    <h2>{hotel.title}</h2>

                                    <p>{hotel.description}</p>

                                    <h3>₹{hotel.price} / night</h3>

                                    <button
                                        onClick={() =>
                                            handleUpdateClick(hotel)
                                        }
                                    >
                                        Update
                                    </button>

                                </div>

                            </div>
                        ))}

                    </div>

                    {pagination && pagination.totalPages > 1 && (
                        <Pagination
                            currentPage={pagination.page}
                            totalPages={pagination.totalPages}
                            onPageChange={setPage}
                        />
                    )}
                </>
            ) : (
                <form
                    className="update-form"
                    onSubmit={handleSave}
                >

                    <h2>Edit {selectedHotel.title}</h2>

                    <div className="image-section">

                        {imagePreview && (
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="image-preview"
                            />
                        )}

                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={handleImageChange}
                        />

                    </div>

                    <label>Hotel Name</label>

                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />

                    <label>Description</label>

                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                    />

                    <label>Price</label>

                    <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        min="0"
                        required
                    />

                    <label>Location</label>

                    <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                    />

                    <label>Latitude</label>

                    <input
                        type="number"
                        step="any"
                        name="latitude"
                        value={formData.latitude}
                        onChange={handleChange}
                    />

                    <label>Longitude</label>

                    <input
                        type="number"
                        step="any"
                        name="longitude"
                        value={formData.longitude}
                        onChange={handleChange}
                    />

                    <div className="form-buttons">

                        <button type="submit" disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </button>

                        <button
                            type="button"
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>

                    </div>

                </form>
            )}

        </div>
    );
};

export default UpdateHotel;
