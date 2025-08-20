const express = require("express");
const router = express.Router();
const admin = require("../firebaseAdmin");

router.post("/login", async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: "Token mancante" });

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    res.json({ uid: decoded.uid, email: decoded.email });
  } catch (err) {
    res.status(401).json({ error: "Token non valido" });
  }
});

module.exports = router;
