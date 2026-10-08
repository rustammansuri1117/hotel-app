import React, { useEffect, useState } from "react";
import { fetchLocations } from "../../api/hotels";
import "./Hero.css";

const Hero = ({ initial, onSearch }) => {
    const [search, setSearch] = useState(initial.search);
    const [location, setLocation] = useState(initial.location);
    const [maxPrice, setMaxPrice] = useState(initial.maxPrice);
    const [locations, setLocations] = useState([]);

    // Location options come from the hotels that exist in the database
    useEffect(() => {
        fetchLocations()
            .then((res) => setLocations(res.data))
            .catch(() => setLocations([]));
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch({ search: search.trim(), location, maxPrice });
    };

    const handleClear = () => {
        setSearch("");
        setLocation("");
        setMaxPrice("");
        onSearch({});
    };

    return (
        <div className="hero">

            <h3>Find Your Perfect Stay</h3>

            <p>
                Comfortable hotels at the best locations and prices.
            </p>

            <form className="area" onSubmit={handleSubmit}>
                <input
                    type="text"
                    className="hotel-input"
                    placeholder="Search Hotel Name"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select
                    className="location-select"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                >
                    <option value="">Select Location</option>
                    {locations.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                    ))}
                </select>

                {/* "Up to" price: shows hotels costing this much per night or less */}
                <select
                    className="price-select"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                >
                    <option value="">Select Price</option>
                    <option value="1000">Up to ₹1000</option>
                    <option value="2000">Up to ₹2000</option>
                    <option value="3000">Up to ₹3000</option>
                    <option value="5000">Up to ₹5000</option>
                    <option value="10000">Up to ₹10000</option>
                </select>

                <button type="submit" className="search-btn">
                    Search
                </button>

                <button type="button" className="clear-btn" onClick={handleClear}>
                    Clear
                </button>
            </form>

        </div>
    );
};

export default Hero;
