const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { ApifyClient } = require('apify-client');
const express = require("express");
const router = express.Router();
const admin = require("../firebaseAdmin");
const axios = require('axios');

let cachedReviews = [];
const CACHE_DURATION = 24 * 60 * 60 * 1000;
let lastCacheTime = 0;

const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

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

// Funzione per ottenere le recensioni
async function fetchReviews(placeId) {
  try {
    const input = {
      language: "it",
      maxReviews: 20,
      personalData: true,
      placeIds: [placeId],
      reviewsSort: "highestRanking",
    };

    const run = await client.actor("Xb8osYTtOjlsgI6k9").call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    return items;
  } catch (err) {
    console.error("Errore durante il fetch delle recensioni Apify:", err);
    throw err;
  }
}

router.get("/refresh-reviews", async (req, res) => {
  const placeId = req.query.placeId || process.env.GOOGLE_PLACE_ID;

  if (!placeId) {
    return res.status(400).json({ error: "Place ID mancante" });
  }

  try {
    cachedReviews = await fetchReviews(placeId);
    lastCacheTime = Date.now();
    res.json({ success: true, message: "Recensioni aggiornate", count: cachedReviews.length });
  } catch (err) {
    res.status(500).json({ error: "Errore durante l'aggiornamento delle recensioni" });
  }
});

router.get("/google-reviews", async (req, res) => {
  const placeId = req.query.placeId || process.env.GOOGLE_PLACE_ID;
  const forceRefresh = req.query.forceRefresh;

  if (!placeId) {
    return res.status(400).json({ error: "Place ID mancante. Assicurati di aver impostato GOOGLE_PLACE_ID nel file .env" });
  }

  const shouldRefresh = forceRefresh === 'true' || (Date.now() - lastCacheTime) > CACHE_DURATION || cachedReviews.length === 0;

  try {
    if (shouldRefresh) {
      cachedReviews = await fetchReviews(placeId);
      lastCacheTime = Date.now();
    }

    res.json({ reviews: cachedReviews, cached: !shouldRefresh, cacheTime: lastCacheTime });
  } catch (err) {
    if (cachedReviews.length > 0) {
      console.warn("Errore nel fetch delle recensioni, uso cache esistente:", err.message);
      res.json({ reviews: cachedReviews, cached: true, cacheTime: lastCacheTime, error: "Usando cache a causa di errore" });
    } else {
      console.error("Errore durante il fetch delle recensioni Apify:", err);
      res.status(500).json({ error: "Errore interno del server" });
    }
  }
});

async function initializeReviews() {
  const defaultPlaceId = process.env.GOOGLE_PLACE_ID;
  
  if (!defaultPlaceId) {
    console.error("GOOGLE_PLACE_ID non trovato nelle variabili d'ambiente");
    return;
  }
  
  try {
    console.log("Inizializzazione recensioni all'avvio del server...");
    cachedReviews = await fetchReviews(defaultPlaceId);
    lastCacheTime = Date.now();
    console.log(`Caricate ${cachedReviews.length} recensioni nella cache`);
  } catch (err) {
    console.error("Errore durante l'inizializzazione delle recensioni:", err);
  }
}

setTimeout(initializeReviews, 5000);

module.exports = router;