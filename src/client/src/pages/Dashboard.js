// Dashboard.js
import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import { auth, db } from "../firebase";
import { doc, setDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [canSubmit, setCanSubmit] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  const navigate = useNavigate();

  // Funzione per verificare l'autenticazione
  const checkAuthentication = () => {
    // Prima controlla Firebase Auth
    if (auth.currentUser) return true;
    
    // Poi controlla localStorage
    if (localStorage.getItem("authToken")) return true;
    
    // Infine controlla sessionStorage (per Safari privato)
    if (sessionStorage.getItem("authToken")) return true;
    
    return false;
  };

  // Controllo stato autenticazione e caricamento recensioni
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthChecked(true);
      
      // Se non c'è utente autenticato in Firebase, controlla i fallback
      if (!user) {
        const hasToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
        if (!hasToken) {
          navigate("/login");
          return;
        }
        // Se c'è un token ma non l'utente Firebase, potresti voler reautenticare
        // o gestire diversamente questo caso
      }

      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const reviewsRef = collection(db, "reviews");
        const q = query(
          reviewsRef,
          where("userId", "==", user.uid),
          where("createdAt", ">=", startOfMonth),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        const count = querySnapshot.size;
        setReviewCount(count);

        if (count >= 3) {
          setCanSubmit(false);
          setSubmitted(true);
        } else {
          setCanSubmit(true);
        }
      } catch (err) {
        console.error("Errore nel caricamento delle recensioni:", err);
        setError("Impossibile caricare le recensioni. Controlla i permessi.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const getPlaceholder = () => {
    if (rating > 0 && rating <= 3) return "Ci dispiace! Cosa possiamo migliorare?";
    if (rating >= 4) return "Vuoi raccontarci cosa ti è piaciuto?";
    return "Vuoi lasciare due righe per aiutarci a migliorare?";
  };

  const isDisabled = rating === 0 || (rating <= 3 && comment.trim() === "") || !canSubmit;

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user || isDisabled) return;

    try {
      const reviewId = `${user.uid}_${Date.now()}`;
      await setDoc(doc(db, "reviews", reviewId), {
        rating,
        comment,
        userId: user.uid,
        email: user.email,
        createdAt: new Date(),
      });

      const newCount = reviewCount + 1;
      setReviewCount(newCount);

      if (newCount >= 3) setCanSubmit(false);

      setSubmitted(true);
      alert("Grazie per il tuo feedback!");
      
      // Reset del form
      setRating(0);
      setComment("");
    } catch (err) {
      console.error("Errore salvataggio recensione:", err);
      setError("Impossibile inviare la recensione. Controlla i permessi.");
    }
  };

  if (!authChecked || loading) {
    return (
      <div className="dashboard-container">
        <p>Caricamento...</p>
      </div>
    );
  }

  // Controllo finale dell'autenticazione prima di renderizzare
  if (!checkAuthentication()) {
    navigate("/login");
    return null;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-box">
        <div className="dashboard-userbox">
          <div className="dashboard-avatar">
            <img
              src="https://i.ibb.co/vvh5DvR6/471601305-122212028768207075-6802164450861774429-n.jpg"
              alt="Avatar utente"
            />
          </div>
          <div className="dashboard-userinfo">
            <p className="dashboard-username">Pizzulo Pizzeria</p>
            <p className="dashboard-welcome">Via Laterza, 1, 70029 Santeramo in Colle</p>
          </div>
        </div>

        <h2 className="dashboard-title">Com'è stata la tua Esperienza?</h2>
        <p className="dashboard-subtitle">
          Unisciti a chi ha già condiviso la sua esperienza, la tua opinione conta molto!
        </p>

        {error && <div className="dashboard-error" style={{color: 'red', marginBottom: '15px'}}>{error}</div>}

        <div className="dashboard-stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`dashboard-star ${(hover || rating) >= star ? "active" : ""}`}
              onClick={() => canSubmit && setRating(star)}
              onMouseEnter={() => canSubmit && setHover(star)}
              onMouseLeave={() => canSubmit && setHover(0)}
              disabled={!canSubmit}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          className="dashboard-textarea"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={getPlaceholder()}
          aria-label="Inserisci il tuo commento"
          disabled={!canSubmit}
        />

        <button className="dashboard-button" onClick={handleSubmit} disabled={isDisabled}>
          {!canSubmit ? "Limite mensile raggiunto" : "Invia"}
        </button>

        {reviewCount > 0 && (
          <p className="dashboard-edit-text">
            Hai inviato già <strong>{reviewCount}</strong> recensioni a quest'attività
          </p>
        )}
        
        {reviewCount >= 3 && (
          <p className="dashboard-limit-message">
            Hai raggiunto il limite massimo di 3 recensioni al mese per questa attività.
          </p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;