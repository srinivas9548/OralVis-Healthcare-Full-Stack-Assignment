import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

import "./index.css";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(true);
    const [showSubmitError, setShowSubmitError] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const jwtToken = Cookies.get("jwtToken");
        const userRole = Cookies.get("userRole");

        if (!jwtToken) {
            navigate("/");
        } else if (jwtToken && userRole) {
            if (userRole === "Technician") {
                navigate("/technician-dashboard");
            } else if (userRole === "Dentist") {
                navigate("/dentist-dashboard");
            }
        }
    }, [navigate]);

    const onSubmitSuccess = (jwtToken, role) => {
        setShowSubmitError(false);
        Cookies.set("jwtToken", jwtToken, { expires: 1 }); // Store or Set the jwtToken in Cookies
        Cookies.set("userRole", role, { expires: 1 });

        if (role === "Technician") {
            navigate("/technician-dashboard");
        } else if (role === "Dentist") {
            navigate("/dentist-dashboard");
        }
    }

    const onSubmitFailure = (errorMsg) => {
        setShowSubmitError(true);
        setErrorMsg(errorMsg);
    }

    const onSubmitForm = async (event) => {
        event.preventDefault();

        const userDetails = { email, password };
        const url = "https://srinivas-oralvis-healthcare-backend-api.onrender.com/login";
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userDetails),
        };

        const response = await fetch(url, options);
        const data = await response.json();
        // console.log(response);
        // console.log(data.user.role);

        if (response.ok) {
            onSubmitSuccess(data.token, data.user.role);
        } else {
            onSubmitFailure(data.error);
        }
    };

    const onChangeEmail = (event) => {
        setEmail(event.target.value);
    };

    const onChangePassword = (event) => {
        setPassword(event.target.value);
    };

    const onChangeShowPassword = () => {
        setShowPassword(prev => !prev);
    }

    return (
        <div className="login-page-container">
            <div className="login-page-responsive">
                <h1 className="login-page-heading">Login Page</h1>
                <form className="form-container" onSubmit={onSubmitForm}>
                    <div className="label-input-container">
                        <label htmlFor="email" className="label-element">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            className="input-element"
                            placeholder="Email"
                            onChange={onChangeEmail}
                            value={email}
                            required
                        />
                    </div>
                    <div className="label-input-container">
                        <label htmlFor="password" className="label-element">
                            PASSWORD
                        </label>
                        <input
                            id="password"
                            type={showPassword ? "password" : "text"}
                            className="input-element"
                            placeholder="Password"
                            onChange={onChangePassword}
                            value={password}
                            required
                        />
                    </div>
                    <div className="label-checkbox-container">
                        <input
                            type="checkbox"
                            id="showPassword"
                            className="checkbox-input"
                            onChange={onChangeShowPassword}
                        />
                        <label htmlFor="showPassword" className="show-password-label">Show Password</label>
                    </div>
                    <button type="submit" className="login-button">
                        Login
                    </button>
                    {showSubmitError && <p className="error-message">*{errorMsg}</p>}
                </form>
            </div>
        </div>
    );
};

export default LoginPage;