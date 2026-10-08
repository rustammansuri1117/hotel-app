import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "./Navbar.css";

function Navbar() {
    const navigate = useNavigate();

    // Press Enter in the navbar search box -> show matching hotels on the home page
    const handleKeyDown = (e) => {
        if (e.key !== "Enter") return;
        const value = e.target.value.trim();
        navigate(value ? `/?search=${encodeURIComponent(value)}` : "/");
    };

    return (
        <nav className="navbar">

            <img src={logo} alt="Hotel Logo" />

            <div className="nav-links">
                <a href="/">Home</a>

                <a href="/add-hotel">Add Hotel</a>
                <a href="/update-hotel">Update Hotel</a>
                <a href="/delete-hotel">Delete Hotel</a>
            </div>

            <input
                className="srch"
                type="text"
                placeholder="Search Hotel"
                onKeyDown={handleKeyDown}
            />

        </nav>
    );
}

export default Navbar;
