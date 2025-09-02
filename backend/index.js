const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const dotenv = require("dotenv");
dotenv.config();

const upload = require("./middleware/multer");
const { uploadToCloudinary } = require("./utils/cloudinary");

const moment = require("moment-timezone");

const app = express();
app.use(express.json());
app.use(cors());

const dbPath = path.join(__dirname, "oralvis.db");
const port = process.env.PORT || 3000;

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (error) => {
    if (error) {
        console.log("Error opening database:", error.message);
        process.exit(1); // Stop server if DB fails
    } else {
        console.log("Connected to the oralvis.db database.");
    }

    // Create Users table
    db.run(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT CHECK(role IN ('Technician','Dentist')) NOT NULL
        )`,
        (err) => {
            if (err) console.log("Error creating users table:", err.message);
        }
    );

    // Create Scans table
    db.run(
        `CREATE TABLE IF NOT EXISTS scans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          patientName TEXT NOT NULL,
          patientId TEXT,
          scanType TEXT,
          region TEXT,
          imageUrl TEXT NOT NULL,
          uploadDate TEXT DEFAULT (datetime('now'))
        )`,
        (err) => {
            if (err) console.log("Error creating scans table:", err.message);
        }
    );

    app.listen(port, () => {
        console.log(`Server is Running at http://localhost:${port}`);
    })
});

// JWT Authentication Middleware
const authenticateToken = (request, response, next) => {
    const authHeader = request.headers["authorization"];

    if (!authHeader) {
        return response.status(401).json({ error: "User not logged in" });
    }

    const jwtToken = authHeader.split(" ")[1];

    jwt.verify(jwtToken, process.env.JWT_SECRET, async (error, user) => {
        if (error) {
            response.status(403).send("Invalid Access Token");
        } else {
            request.dbUser = user;
            next();
        }
    });
};

// Register User
app.post("/register", async (request, response) => {
    try {
        const { email, password, role } = request.body;

        if (!email || !password || !role) {
            response.status(400).json({ error: "Email, password, and role are required" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
            `INSERT INTO users (email, password, role) VALUES (?, ?, ?)`,
            [email, hashedPassword, role],
            function (err) {
                if (err) {
                    if (err.message.includes("UNIQUE constraint failed")) {
                        response.status(400).json({ error: "Email already exists" });
                    }
                    response.status(500).json({ error: "Error creating user" });
                } else {
                    response.json({ message: "User created successfully", userId: this.lastID });
                }
            }
        );
    } catch (e) {
        console.error(e.message);
        response.status(500).send("Internal Server Error");
    }
});

// Login User
app.post("/login", async (request, response) => {
    const { email, password } = request.body;

    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, dbUser) => {
        if (err) {
            response.status(500).json({ error: "Database Error" })
        } else if (!dbUser) {
            response.status(400).json({ error: "Invalid email" })
        } else {
            const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
            if (isPasswordMatched) {
                const payload = { id: dbUser.id, role: dbUser.role };
                const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });
                return response.json({
                    token: token,
                    user: {
                        id: dbUser.id,
                        role: dbUser.role
                    }
                });
            } else {
                response.status(400).json({ error: "Email and password didn't match" })
            }
        }
    })
});

// Post scans (Technician only)
app.post("/upload", authenticateToken, upload.single("image"), async (request, response) => {
    try {
        // Role check
        if (request.dbUser.role !== "Technician") {
            return response.status(403).json({ error: "Access denied. Only Technician can upload scans." });
        }

        const { patientName, patientId, scanType, region } = request.body;

        // console.log(request.body);
        // console.log(request.file);

        if (!patientName) {
            return response.status(400).json({ error: "Patient name is required" });
        }

        if (!request.file) {
            return response.status(400).json({ error: "Image file is required" });
        }

        // Upload to Cloudinary
        let result;
        try {
            result = await uploadToCloudinary(request.file.path);
        } catch (cloudError) {
            console.error("Cloudinary Upload Error:", cloudError.message);
            return response.status(502).json({ error: "Failed to upload image to Cloudinary" });
        }

        const imageUrl = result.secure_url;

        // Generate India Time
        const uploadDate = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

        // Insert into DB
        const sql = `
            INSERT INTO scans (patientName, patientId, scanType, region, imageUrl, uploadDate)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.run(sql, [patientName, patientId, scanType, region, imageUrl, uploadDate], function (err) {
            if (err) {
                console.error("DB Insert Error:", err.message);
                return response.status(500).json({ error: "Failed to save scan record in database" });
            }

            response.status(201).json({
                message: "Patient Data Uploaded Successfully",
                id: this.lastID,
                patientName,
                patientId,
                scanType,
                region,
                imageUrl,
                uploadDate
            });
        });

    } catch (error) {
        console.error("Unexpected Server Error: ", error.message);
        response.status(500).json({ error: "Internal Server Error" });
    }
});

// Get all scans view (Dentist only)
app.get("/scans", authenticateToken, (request, response) => {
    try {
        // Role check
        if (request.dbUser.role !== "Dentist") {
            return response.status(403).json({ error: "Access denied. Only Dentist can view scans." });
        }

        const sql = `SELECT * FROM scans ORDER BY uploadDate DESC`;

        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error("DB Fetch Error:", err.message);
                return response.status(500).json({ error: "Failed to fetch scans from database" });
            }

            response.json(rows);
        });
    } catch (error) {
        console.error("Unexpected Server Error:", error.message);
        response.status(500).json({ error: "Internal Server Error" });
    }
});

//Initial API
app.get("/", async (request, response) => {
    try {
        response.send("Welcome!, This is a Oralvis Healthcare Assignment Backend domain you can access with endpoints.");
    } catch (e) {
        console.error(e.message);
        response.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = app;