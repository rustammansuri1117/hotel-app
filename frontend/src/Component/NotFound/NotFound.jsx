import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const NotFound = () => (
    <div style={{ maxWidth: 520, margin: "60px auto", padding: 30, background: "white", borderRadius: 15, textAlign: "center" }}>
        <Helmet>
            <title>Page not found | Mayyur Hotel</title>
        </Helmet>
        <h1>404</h1>
        <p>This page does not exist.</p>
        <Link to="/">← Back to Home</Link>
    </div>
);

export default NotFound;
