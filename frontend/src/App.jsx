import React from "react";
import { BrowserRouter, Routes, Route, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import Navbar from "./Component/Navbar";
import Hero from "./Component/Hero/Hero";
import HotelCard from "./Component/Hotel-Card/HotelCard";
import Form from "./Component/Formpage/Form";
import UpdateHotel from "./Component/UpdateHotel/UpdateHotel";
import DeleteHotel from "./Component/DeleteHotel/DeleteHotel";
import BookingPage from "./Component/Booking/BookingPage";
import BookingConfirmation from "./Component/Booking/BookingConfirmation";
import NotFound from "./Component/NotFound/NotFound";
import Footer from "./Component/Footer/Footer";

// The search filters live in the URL (/?search=...&location=...&maxPrice=...)
// so the navbar search, the hero search and page refreshes all stay in sync.
function Home() {
    const [params, setParams] = useSearchParams();

    const filters = {
        search: params.get("search") || "",
        location: params.get("location") || "",
        maxPrice: params.get("maxPrice") || "",
    };

    const handleSearch = (next) => {
        const query = {};
        Object.entries(next).forEach(([key, value]) => {
            if (value) query[key] = value;
        });
        setParams(query);
    };

    // `key` resets the inputs / page number whenever the filters change
    const filterKey = JSON.stringify(filters);

    return (
        <>
            <Helmet>
                <title>Mayyur Hotel | Find Your Perfect Stay</title>
                <meta
                    name="description"
                    content="Comfortable hotels at the best locations and prices. Search, compare and book your stay online."
                />
                <meta property="og:title" content="Mayyur Hotel | Find Your Perfect Stay" />
                <meta property="og:description" content="Comfortable hotels at the best locations and prices." />
            </Helmet>
            <Hero key={`hero-${filterKey}`} initial={filters} onSearch={handleSearch} />
            <HotelCard key={`cards-${filterKey}`} filters={filters} />
        </>
    );
}

function App() {
    return (
        <BrowserRouter>

            <Navbar />

            <Routes>

                {/* Home */}
                <Route path="/" element={<Home />} />

                {/* Book a hotel (opened from "Book Now") */}
                <Route path="/book/:id" element={<BookingPage />} />

                {/* Booking confirmation */}
                <Route path="/booking/:reference" element={<BookingConfirmation />} />

                {/* Add Hotel */}
                <Route path="/add-hotel" element={<Form />} />

                {/* Update Hotel */}
                <Route path="/update-hotel" element={<UpdateHotel />} />

                {/* Delete Hotel */}
                <Route path="/delete-hotel" element={<DeleteHotel />} />

                {/* Anything else */}
                <Route path="*" element={<NotFound />} />

            </Routes>

            {/* Footer */}
            <Footer />

        </BrowserRouter>
    );
}

export default App;
