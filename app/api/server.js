const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const { connectDB } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const { syncUsers } = require("./controllers/authController");

dotenv.config();
connectDB();

const app = express();
app.use(bodyParser.json());

app.use("/api/auth", authRoutes);

syncUsers();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
