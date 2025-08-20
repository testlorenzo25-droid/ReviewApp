// Dashboard.js
import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function Dashboard() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false); // 🔹 nuovo stato

  // Carica recensione utente
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const ref = doc(db, "reviews", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          setRating(data.rating || 0);
          setComment(data.comment || "");
          setSubmitted(true); // 🔹 blocca se già esiste
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const getPlaceholder = () => {
    if (rating > 0 && rating <= 3) {
      return "Ci dispiace! Cosa possiamo migliorare?";
    }
    if (rating >= 4) {
      return "Vuoi raccontarci cosa ti è piaciuto?";
    }
    return "Vuoi lasciare due righe per aiutarci a migliorare?";
  };

  const isDisabled = rating === 0 || (rating <= 3 && comment.trim() === "");

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user || isDisabled) return;

    try {
      await setDoc(doc(db, "reviews", user.uid), {
        rating,
        comment,
        userId: user.uid,
        email: user.email,
        createdAt: new Date(),
      });

      setSubmitted(true); // 🔹 blocca modifiche
      alert("Grazie per il tuo feedback!");
    } catch (err) {
      console.error("Errore salvataggio recensione:", err);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-box">
        {/* Box Azienda */}
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

        {/* Testo */}
        <h2 className="dashboard-title">Com'è stata la tua Esperienza?</h2>
        <p className="dashboard-subtitle">
          Unisciti a chi ha già condiviso la sua esperienza, la tua opinione conta molto!
        </p>

        {/* Stelle */}
        <div className="dashboard-stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`dashboard-star ${(hover || rating) >= star ? "active" : ""}`}
              onClick={() => !submitted && setRating(star)} // 🔹 disabilita se già inviato
              onMouseEnter={() => !submitted && setHover(star)}
              onMouseLeave={() => !submitted && setHover(0)}
              disabled={submitted} // 🔹 disabilita click
            >
              ★
            </button>
          ))}
        </div>

        {/* Commento */}
        <textarea
          className="dashboard-textarea"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={getPlaceholder()}
          aria-label="Inserisci il tuo commento"
          disabled={submitted} // 🔹 disabilita se inviato
        />

        {/* Bottone */}
        <button
          className="dashboard-button"
          onClick={handleSubmit}
          disabled={isDisabled || submitted} // 🔹 disabilitato dopo invio
        >
          {submitted ? "Feedback già inviato" : "Invia"}
        </button>
      </div>
    </div>
  );
}


export default Dashboard;
