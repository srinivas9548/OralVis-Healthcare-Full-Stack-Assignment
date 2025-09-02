import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import './index.css';

const Header = () => {
    const navigate = useNavigate();

    const role = Cookies.get("userRole");

    const onClickLogout = () => {
        Cookies.remove("jwtToken");
        Cookies.remove("userRole");
        navigate("/");
    }

    return (
        <nav className="nav-header">
            <div className="nav-content">
                <h1 className="header-logo">
                    {role === "Technician" ? "Technician Dashboard" : role === "Dentist" ? "Dentist Dashboard" : "Dashboard"}
                </h1>
                <button type="button" className="logout-button" onClick={onClickLogout}>Logout</button>
            </div>
        </nav>
    )
}

export default Header