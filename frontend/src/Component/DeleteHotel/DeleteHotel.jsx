import React, { useState } from "react";
import useHotels from "../../hooks/useHotels";
import { useDispatch } from "react-redux";
import { Helmet } from "react-helmet-async";
import { imageUrl } from "../../api/hotels";
import { removeHotel } from "../../store/hotelsSlice";
import Pagination from "../Pagination/Pagination";
import "./DeleteHotel.css";

const HOTELS_PER_PAGE = 6;

const DeleteHotel = () => {
    const dispatch = useDispatch();
    const [page, setPage] = useState(1);
    const { hotels, pagination, loading, error, reload } = useHotels({
        page,
        limit: HOTELS_PER_PAGE,
    });

    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [message, setMessage] = useState("");
    const [deleteError, setDeleteError] = useState("");

    const handleDeleteClick = (id) => {
        setDeleteId(id);
    };

    const handleConfirmDelete = async () => {
        setDeleting(true);
        setDeleteError("");

        try {
            const res = await dispatch(removeHotel(deleteId)).unwrap() // Redux thunk -> DELETE /api/hotels/:id;

            setDeleteId(null);
            setMessage(res.message);

            setTimeout(() => {
                setMessage("");
            }, 2500);

            // If that was the last hotel on this page, step back one page
            if (hotels.length === 1 && page > 1) {
                setPage(page - 1);
            } else {
                reload();
            }
        } catch (err) {
            setDeleteId(null);
            setDeleteError(err.message);
        } finally {
            setDeleting(false);
        }
    };

    const handleCancel = () => {
        setDeleteId(null);
    };

    return (
        <div className="delete-hotel-container">

            <Helmet>
                <title>Delete Hotel | Mayyur Hotel</title>
            </Helmet>

            <h1>Delete Hotel</h1>

            {message && (
                <div className="delete-success">
                    {message}
                </div>
            )}

            {(error || deleteError) && (
                <p className="status-error">{error || deleteError}</p>
            )}

            <div className="delete-hotel-list">

                {loading && hotels.length === 0 && !error ? (
                    <p className="status-info">Loading hotels...</p>
                ) : !loading && !error && hotels.length === 0 ? (
                    <div className="no-hotels">
                        <h2>No Hotels Available</h2>
                        <p>There are no hotels to delete.</p>
                    </div>
                ) : (
                    hotels.map((hotel) => (
                        <div
                            className="delete-hotel-card"
                            key={hotel.id}
                        >
                            <img
                                src={imageUrl(hotel.image)}
                                alt={hotel.title}
                            />

                            <div className="delete-hotel-info">

                                <h2>{hotel.title}</h2>

                                <p>{hotel.description}</p>

                                <h3>
                                    ₹{hotel.price} / night
                                </h3>

                                <button
                                    className="delete-button"
                                    onClick={() =>
                                        handleDeleteClick(hotel.id)
                                    }
                                >
                                    Delete Hotel
                                </button>

                            </div>
                        </div>
                    ))
                )}

            </div>

            {pagination && pagination.totalPages > 1 && (
                <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={setPage}
                />
            )}

            {/* Confirmation Popup */}

            {deleteId !== null && (
                <div className="delete-overlay">

                    <div className="delete-popup">

                        <h2>Delete Hotel?</h2>

                        <p>
                            Are you sure you want to delete this hotel?
                        </p>

                        <div className="popup-buttons">

                            <button
                                className="cancel-button"
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>

                            <button
                                className="confirm-delete-button"
                                onClick={handleConfirmDelete}
                                disabled={deleting}
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
};

export default DeleteHotel;
