import { useEffect, useState } from "react";
import Header from "../Header";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import "./index.css";

const DentistDashboard = () => {
    const [scans, setScans] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const jwtToken = Cookies.get("jwtToken");
        const role = Cookies.get("userRole");

        if (!jwtToken) {
            navigate("/");
        }

        if (role !== "Dentist") {
            navigate("/technician-dashboard");
        }

    }, [navigate]);

    useEffect(() => {
        const fetchScans = async () => {
            try {
                const jwtToken = Cookies.get("jwtToken");

                if (!jwtToken) {
                    setError("Unauthorized! Please log in again.");
                    setLoading(false);
                    return;
                }

                const response = await fetch(
                    "https://srinivas-oralvis-healthcare-backend-api.onrender.com/scans",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${jwtToken}`,
                        },
                    }
                );

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || "Failed to fetch scans");
                }

                const data = await response.json();
                setScans(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchScans();
    }, []);

    // Function to generate PDF report
    const downloadReport = (scan) => {
        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text("Dental Scan Report", 20, 20);

        doc.setFontSize(12);
        doc.text(`Patient Name: ${scan.patientName}`, 20, 40);
        doc.text(`Patient ID: ${scan.patientId}`, 20, 50);
        doc.text(`Scan Type: ${scan.scanType}`, 20, 60);
        doc.text(`Region: ${scan.region}`, 20, 70);
        doc.text(`Upload Date: ${scan.uploadDate}`, 20, 80);

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = scan.imageUrl;

        img.onload = () => {
            doc.addImage(img, "JPEG", 20, 100, 160, 160);
            doc.save(`${scan.patientName}_Report.pdf`);
        };
    };

    return (
        <>
            <Header />
            <div className="scans-container">
                <h2 className="scans-title">Patient Scan Reports</h2>

                {loading ? (
                    <div className="loader-container">
                        <div className="loader"></div>
                    </div>
                ) : (
                    <>
                        {error && <p className="error-text">{error}</p>}
                        <div className="scans-grid">
                            {scans.length > 0 ? (
                                scans.map((scan) => (
                                    <div key={scan.id || scan.patientId} className="scan-card">
                                        <img
                                            src={scan.imageUrl}
                                            alt={`Scan of ${scan.patientName}`}
                                            className="scan-image"
                                        />
                                        <div className="scan-details">
                                            <p><strong>Patient Name:</strong> {scan.patientName}</p>
                                            <p><strong>Patient ID:</strong> {scan.patientId}</p>
                                            <p><strong>Scan Type:</strong> {scan.scanType}</p>
                                            <p><strong>Region:</strong> {scan.region}</p>
                                            <p><strong>Upload Date:</strong> {scan.uploadDate}</p>
                                            <div className="buttons-container">
                                                <a
                                                    href={scan.imageUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="view-button"
                                                >
                                                    View Full Image
                                                </a>
                                                <button
                                                    className="download-button"
                                                    onClick={() => downloadReport(scan)}
                                                >
                                                    Download Report
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                !error && <p>No scans available.</p>
                            )}
                        </div>
                    </>
                )}

            </div >
        </>
    );
};

export default DentistDashboard;
