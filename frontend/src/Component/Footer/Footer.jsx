import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
    return (
        <footer className="footer">

            <div className="footer-container">

                {/* Brand */}
                <div className="footer-section">
                    <h2>Mayyur Hotel</h2>
                    <p>
                        Comfortable stays, beautiful rooms,
                        and memorable experiences.
                    </p>
                </div>

                {/* Quick Links */}
                <div className="footer-section">
                    <h3>Quick Links</h3>

                    <Link to="/">Home</Link>
                    <Link to="/add-hotel">Add Hotel</Link>
                    <Link to="/update-hotel">Update Hotel</Link>
                    <Link to="/delete-hotel">Delete Hotel</Link>
                </div>

                {/* Contact */}
                <div className="footer-section">
                    <h3>Contact Us</h3>

                    <p>Email: info@mayyurhotel.com</p>
                    <p>Phone: +91 88095 78415</p>
                    <p>India</p>
                </div>

            </div>

            {/* Bottom */}
            <div className="footer-bottom">
                <p>
                    © 2026 Mayyur Hotel. All Rights Reserved.
                </p>
            </div>

        </footer>
    );
};

export default Footer;