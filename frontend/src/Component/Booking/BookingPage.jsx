import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Helmet } from "react-helmet-async";
import { imageUrl } from "../../api/hotels";
import { loadHotel, clearSelected } from "../../store/hotelsSlice";
import { createBooking } from "../../store/bookingsSlice";
import { addDays, formatPrice, nightsBetween, todayISO } from "../../utils/dates";
import "./BookingPage.css";

const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

const emptyForm = {
    guestName: "",
    email: "",
    phone: "",
    checkIn: "",
    checkOut: "",
    adults: "1",
    children: "0",
    rooms: "1",
    specialRequests: "",
};

const BookingPage = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { selected: hotel, selectedStatus, selectedError } = useSelector((state) => state.hotels);

    const [values, setValues] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Redux thunk -> GET /api/hotels/:id
    useEffect(() => {
        dispatch(loadHotel(id));
        return () => {
            dispatch(clearSelected());
        };
    }, [dispatch, id]);

    const today = todayISO();
    const nights = nightsBetween(values.checkIn, values.checkOut);
    const rooms = Number(values.rooms);
    const total = hotel ? nights * rooms * hotel.price : 0;

    const handleChange = (e) => {
        const { name, value } = e.target;
        const next = { ...values, [name]: value };

        // check-out must always be after check-in
        if (name === "checkIn" && next.checkOut && next.checkOut <= value) {
            next.checkOut = "";
        }
        setValues(next);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (nights < 1) {
            setError("Check-out must be after check-in");
            return;
        }

        setSubmitting(true);
        try {
            // Redux thunk -> POST /api/bookings ; unwrap() throws if the API returned an error
            const res = await dispatch(
                createBooking({
                    hotelId: Number(id),
                    guestName: values.guestName,
                    email: values.email,
                    phone: values.phone,
                    checkIn: values.checkIn,
                    checkOut: values.checkOut,
                    adults: Number(values.adults),
                    children: Number(values.children),
                    rooms: Number(values.rooms),
                    specialRequests: values.specialRequests,
                })
            ).unwrap();

            navigate(`/booking/${res.data.reference}`);
        } catch (err) {
            setError(err.message || String(err));
            setSubmitting(false);
        }
    };

    if (selectedStatus === "failed") {
        return (
            <div className="booking-page">
                <Helmet>
                    <title>Hotel not found | Mayyur Hotel</title>
                </Helmet>
                <div className="booking-message">
                    <p className="status-error">{selectedError}</p>
                    <Link className="booking-back" to="/">← Back to hotels</Link>
                </div>
            </div>
        );
    }

    if (!hotel || String(hotel.id) !== id) {
        return <p className="status-info">Loading hotel...</p>;
    }

    return (
        <div className="booking-page">

            <Helmet>
                <title>{`Book ${hotel.title} | Mayyur Hotel`}</title>
                <meta
                    name="description"
                    content={`Book ${hotel.title}${hotel.location ? ` in ${hotel.location}` : ""} from ${formatPrice(hotel.price)} per night.`}
                />
            </Helmet>

            <div className="booking-layout">

                {/* ---------- Booking form ---------- */}
                <form className="booking-card booking-form" onSubmit={handleSubmit}>

                    <h1>Book your stay</h1>
                    <p className="booking-sub">Fill in the details below to confirm your booking.</p>

                    {error && <div className="status-error">{error}</div>}

                    <h2>Guest details</h2>

                    <div className="booking-group">
                        <label htmlFor="guestName">Full name</label>
                        <input
                            id="guestName"
                            type="text"
                            name="guestName"
                            placeholder="As on your ID"
                            value={values.guestName}
                            onChange={handleChange}
                            minLength={2}
                            maxLength={100}
                            required
                        />
                    </div>

                    <div className="booking-row">
                        <div className="booking-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={values.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="booking-group">
                            <label htmlFor="phone">Phone</label>
                            <input
                                id="phone"
                                type="tel"
                                name="phone"
                                placeholder="+91 98765 43210"
                                value={values.phone}
                                onChange={handleChange}
                                pattern="\+?[0-9 \-]{10,18}"
                                title="10 to 15 digits, for example +91 98765 43210"
                                required
                            />
                        </div>
                    </div>

                    <h2>Stay details</h2>

                    <div className="booking-row">
                        <div className="booking-group">
                            <label htmlFor="checkIn">Check-in</label>
                            <input
                                id="checkIn"
                                type="date"
                                name="checkIn"
                                min={today}
                                value={values.checkIn}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="booking-group">
                            <label htmlFor="checkOut">Check-out</label>
                            <input
                                id="checkOut"
                                type="date"
                                name="checkOut"
                                min={values.checkIn ? addDays(values.checkIn, 1) : addDays(today, 1)}
                                value={values.checkOut}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="booking-row booking-row-3">
                        <div className="booking-group">
                            <label htmlFor="adults">Adults</label>
                            <select id="adults" name="adults" value={values.adults} onChange={handleChange}>
                                {range(1, 10).map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>

                        <div className="booking-group">
                            <label htmlFor="children">Children</label>
                            <select id="children" name="children" value={values.children} onChange={handleChange}>
                                {range(0, 10).map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>

                        <div className="booking-group">
                            <label htmlFor="rooms">Rooms</label>
                            <select id="rooms" name="rooms" value={values.rooms} onChange={handleChange}>
                                {range(1, 5).map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="booking-group">
                        <label htmlFor="specialRequests">Special requests (optional)</label>
                        <textarea
                            id="specialRequests"
                            name="specialRequests"
                            placeholder="Late check-in, extra bed, ground floor..."
                            maxLength={500}
                            value={values.specialRequests}
                            onChange={handleChange}
                        />
                    </div>

                    <button type="submit" className="booking-submit" disabled={submitting}>
                        {submitting ? "Confirming..." : "Confirm Booking"}
                    </button>

                    <p className="booking-note">No payment needed now. You pay at the hotel.</p>

                </form>

                {/* ---------- Summary ---------- */}
                <aside className="booking-card booking-summary">

                    <img src={imageUrl(hotel.image)} alt={hotel.title} />

                    <h2>{hotel.title}</h2>
                    {hotel.location && <p className="booking-location">📍 {hotel.location}</p>}
                    {hotel.description && <p className="booking-desc">{hotel.description}</p>}

                    <div className="booking-price-box">
                        <div className="booking-line">
                            <span>Price per night</span>
                            <span>{formatPrice(hotel.price)}</span>
                        </div>

                        {nights > 0 ? (
                            <>
                                <div className="booking-line">
                                    <span>{nights} {nights === 1 ? "night" : "nights"} × {rooms} {rooms === 1 ? "room" : "rooms"}</span>
                                    <span>{formatPrice(hotel.price * nights * rooms)}</span>
                                </div>
                                <div className="booking-line booking-total">
                                    <span>Total</span>
                                    <span>{formatPrice(total)}</span>
                                </div>
                            </>
                        ) : (
                            <p className="booking-hint">Select your dates to see the total price.</p>
                        )}
                    </div>

                    <Link className="booking-back" to="/">← Back to hotels</Link>

                </aside>

            </div>
        </div>
    );
};

export default BookingPage;
