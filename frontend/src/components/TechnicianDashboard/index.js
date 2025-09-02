import { useEffect, useState } from "react";
import Header from "../Header";
import Cookies from 'js-cookie';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from "react-router-dom";
import "./index.css";

const TechnicianDashboard = () => {
    const [patientName, setPatientName] = useState("");
    const [scanType, setScanType] = useState("");
    const [region, setRegion] = useState("");
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const jwtToken = Cookies.get("jwtToken");
        const role = Cookies.get("userRole");

        if (!jwtToken) {
            navigate("/");
        }

        if (role !== "Technician") {
            navigate("/dentist-dashboard")
        }

    }, [navigate]);

    const onChangeFile = (e) => {
        setFile(e.target.files[0]);
    };

    const onSubmitForm = async (e) => {
        e.preventDefault();

        const jwtToken = Cookies.get("jwtToken");

        if (!patientName || !scanType || !region || !file) {
            setMessage("Please fill all fields and select a file.");
            return;
        }

        if (!jwtToken) {
            setMessage("Unauthorized! Please log in again.");
            return;
        }

        const formData = new FormData();
        formData.append("patientName", patientName);
        formData.append("patientId", uuidv4());
        formData.append("scanType", scanType);
        formData.append("region", region);
        formData.append("image", file);

        // console.log(file)

        try {
            const response = await fetch("https://srinivas-oralvis-healthcare-backend-api.onrender.com/upload", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${jwtToken}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(`Upload successful: ${data.message}`);
                // Reset form
                setPatientName("");
                setScanType("");
                setRegion("");
                setFile(null);
            } else {
                setMessage(`Upload failed: ${data.error}`);
            }
        } catch (err) {
            console.error(err);
            setMessage("Upload failed. Please try again.");
        }
    };

    return (
        <>
            <Header />
            <div className="upload-page-container">
                <h2>Patient Scan Report Form</h2>
                <form className="upload-form" onSubmit={onSubmitForm} encType="multipart/form-data">
                    <label>Patient Name:</label>
                    <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} required />

                    <label>Scan Type:</label>
                    <select value={scanType} onChange={(e) => setScanType(e.target.value)} required>
                        <option value="">-- Select --</option>
                        <option value="RGB">RGB</option>
                        <option value="MRI">MRI</option>
                        <option value="CT">CT</option>
                        <option value="X-ray">X-ray</option>
                    </select>

                    <label>Region:</label>
                    <select value={region} onChange={(e) => setRegion(e.target.value)} required>
                        <option value="">-- Select --</option>
                        <option value="Head">Head</option>
                        <option value="Chest">Chest</option>
                        <option value="Abdomen">Abdomen</option>
                        <option value="Upper Arch">Upper Arch</option>
                        <option value="Lower Arch">Lower Arch</option>
                        <option value="Frontal">Frontal</option>
                    </select>

                    <label>Upload Image:</label>
                    <input type="file" accept=".jpg, .jpeg, .png" onChange={onChangeFile} required />

                    <button type="submit">Upload</button>
                </form>

                {message &&
                    <p
                        className={`upload-message ${message.includes("Upload successful")
                            ? "success-message"
                            : message.includes("Upload failed")
                                ? "error-message"
                                : ""
                            }`}>
                        {message}
                    </p>}
            </div>
        </>
    );
};

export default TechnicianDashboard;
