// Feedback.js
import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import './Feedback.css';

function Feedback() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [userName, setUserName] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const nameFromEmail = user.email.split('@')[0];
        setUserName(nameFromEmail);
      } else {
        const hasToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
        if (!hasToken) {
          navigate("/login");
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Funzione di logout
  const handleLogout = async () => {
    try {
      // Disconnette l'utente da Firebase
      await auth.signOut();

      // Rimuove il token di autenticazione
      localStorage.removeItem("authToken");
      sessionStorage.removeItem("authToken");

      // Reindirizza alla pagina di login
      navigate("/login");
    } catch (error) {
      console.error("Errore durante il logout:", error);
      alert("Si è verificato un errore durante il logout. Riprova.");
    }
  };

  const getPlaceholder = () => {
    if (rating > 0 && rating <= 3) return "Ci dispiace! Cosa possiamo migliorare?";
    if (rating >= 4) return "Vuoi raccontarci cosa ti è piaciuto?";
    return "Vuoi lasciare due righe per aiutarci a migliorare?";
  };

  const handleSkip = () => {
    setRating(0);
    setComment("");
    console.log("Form resettato");
  };

  const handleSubmit = () => {
    console.log("Recensione inviata:", { rating, comment });
    alert("Grazie per il tuo feedback!");

    setRating(0);
    setComment("");
  };

  return (
    <div className="feedback-container">
      <div className="feedback-logout" onClick={handleLogout}>
        <FontAwesomeIcon icon={faArrowRightFromBracket} />
      </div>
      <h1 className="feedback-greeting">Ciao {userName}!</h1>
      <h2 className="feedback-title">Com'è stata la tua Esperienza da Pizzulo?</h2>
      <p className="feedback-subtitle">
        Unisciti a chi ha già condiviso la sua esperienza, la tua opinione conta molto!
      </p>

      <div className="feedback-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`feedback-star ${(hover || rating) >= star ? "active" : ""}`}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
          >
            <FontAwesomeIcon icon={faStar} />
          </button>
        ))}
      </div>

      <div className="feedback-comment-box">
        <textarea
          className="feedback-textarea"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={getPlaceholder()}
          aria-label="Inserisci il tuo commento"
        />
      </div>

      <div className="feedback-buttons">
        <button className="feedback-button-skip" onClick={handleSkip}>
          Cancella
        </button>
        <button className="feedback-button-submit" onClick={handleSubmit}>
          Invia Feedback
        </button>
      </div>
    </div>
  );
}

export default Feedback;