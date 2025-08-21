const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const apiRouter = require("./routes/api");
const admin = require("./firebaseAdmin");

const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ====================
// Endpoint login e session
// ====================
app.post("/api/login", async (req, res) => {
  const { idToken } = req.body;
  const expiresIn = 5 * 24 * 60 * 60 * 1000; // 5 giorni

  try {
    // verifica ID token
    await admin.auth().verifyIdToken(idToken);

    // crea session cookie
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });

    res.cookie("session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Usa secure solo in produzione
      maxAge: expiresIn,
      sameSite: "lax" // Cambia da "strict" a "lax" per maggior compatibilità
    });

    res.json({ success: true });
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
});

app.get("/api/me", async (req, res) => {
  const sessionCookie = req.cookies.session || "";
  try {
    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
    res.json({ uid: decodedClaims.uid, email: decodedClaims.email });
  } catch (err) {
    res.status(401).json({ error: "Not authenticated" });
  }
});

// ====================
// Router principale
// ====================
app.use("/api", apiRouter);

module.exports = app;