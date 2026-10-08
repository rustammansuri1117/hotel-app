import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useHotels from "../../hooks/useHotels";
import { imageUrl } from "../../api/hotels";
import Pagination from "../Pagination/Pagination";
import "./HotelCard.css";

// 1 page = 4 hotels
const HOTELS_PER_PAGE = 4;

const HotelCard = ({ filters = {} }) => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);

    const { hotels, pagination, loading, error } = useHotels({
        ...filters,
        page: currentPage,
        limit: HOTELS_PER_PAGE,
    });

    if (error) {
        return <p className="status-error">{error}</p>;
    }

    if (loading && hotels.length === 0) {
        return <p className="status-info">Loading hotels...</p>;
    }

    if (!loading && hotels.length === 0) {
        return <p className="status-info">No hotels found.</p>;
    }

    return (
        <>
            <div className="card-container">

                {hotels.map((hotel) => (

                    <div className="hotelcard" key={hotel.id}>

                        <img
                            src={imageUrl(hotel.image)}
                            alt={hotel.title}
                        />

                        <h2>{hotel.title}</h2>

                        <p>{hotel.description}</p>

                        <h3>₹{hotel.price} / night</h3>

                        {/* Book Now Button */}
                        <button
                            className="book-btn"
                            onClick={() => navigate(`/book/${hotel.id}`)}
                        >
                            Book Now
                        </button>

                    </div>

                ))}

            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={setCurrentPage}
                />
            )}
        </>
    );
};

export default HotelCard;
