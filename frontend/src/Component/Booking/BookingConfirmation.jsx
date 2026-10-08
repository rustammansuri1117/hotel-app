import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Helmet } from "react-helmet-async";
import { loadBooking } from "../../store/bookingsSlice";
import { formatDate, formatPrice } from "../../utils/dates";
import "./BookingConfirmation.css";

const BookingConfirmation = () => {
    const { reference } = useParams();
    const dispatch = useDispatch();
    const { current: booking, status, error } = useSelector((state) => state.bookings);

    const ref = reference.toUpperCase();
    const isLoaded = booking && booking.reference === ref;

    // Opened right after booking: already in the store. Opened from a saved link: fetch it.
    // Redux thunk -> GET /api/bookings/:reference
    useEffect(() => {
        if (!isLoaded) dispatch(loadBooking(ref));
    }, [dispatch, ref, isLoaded]);

    if (!isLoaded) {
        if (status === "failed") {
            return (
                <div className="confirm-page">
                    <Helmet>
                        <title>Booking not found | Mayyur Hotel</title>
                    </Helmet>
                    <div className="confirm-card">
                        <p className="status-error">{error}</p>
                        <Link className="confirm-btn" to="/">Back to Home</Link>
                    </div>
                </div>
            );
        }
        return <p className="status-info">Loading your booking...</p>;
    }

    const guests = booking.adults + booking.children;

    return (
        <div className="confirm-page">

            <Helmet>
                <title>{`Booking ${booking.reference} confirmed | Mayyur Hotel`}</title>
                <meta name="robots" content="noindex" />
            </Helmet>

            <div className="confirm-card">

                <div className="confirm-tick">✓</div>
                <h1>Booking confirmed!</h1>
                <p className="confirm-sub">Save your booking reference. You will need it at check-in.</p>

                <div className="confirm-ref">{booking.reference}</div>

                <div className="confirm-table">
                    <div><span>Hotel</span><strong>{booking.hotel_title}</strong></div>
                    <div><span>Guest</span><strong>{booking.guest_name}</strong></div>
                    <div><span>Email</span><strong>{booking.email}</strong></div>
                    <div><span>Phone</span><strong>{booking.phone}</strong></div>
                    <div><span>Check-in</span><strong>{formatDate(booking.check_in)}</strong></div>
                    <div><span>Check-out</span><strong>{formatDate(booking.check_out)}</strong></div>
                    <div><span>Nights</span><strong>{booking.nights}</strong></div>
                    <div><span>Rooms</span><strong>{booking.rooms}</strong></div>
                    <div>
                        <span>Guests</span>
                        <strong>
                            {booking.adults} {booking.adults === 1 ? "adult" : "adults"}
                            {booking.children > 0 && `, ${booking.children} ${booking.children === 1 ? "child" : "children"}`}
                            {` (${guests} total)`}
                        </strong>
                    </div>
                    {booking.special_requests && (
                        <div><span>Special requests</span><strong>{booking.special_requests}</strong></div>
                    )}
                    <div className="confirm-total">
                        <span>Total to pay at the hotel</span>
                        <strong>{formatPrice(booking.total_price)}</strong>
                    </div>
                </div>

                <div className="confirm-actions">
                    <button className="confirm-btn" onClick={() => window.print()}>Print</button>
                    <Link className="confirm-btn confirm-btn-light" to="/">Back to Home</Link>
                </div>

            </div>
        </div>
    );
};

export default BookingConfirmation;
