// Feedback.js
import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
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
  const [userId, setUserId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({
    visible: false,
    type: '', // 'success' o 'error'
    message: '',
    withButton: false // Nuovo attributo per notifiche con pulsante
  });

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const nameFromEmail = user.email.split('@')[0];
        setUserName(nameFromEmail);
        setUserId(user.uid);
      } else {
        const hasToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
        if (!hasToken) {
          navigate("/login");
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Funzione per mostrare la notifica (versione aggiornata)
  const showNotification = (type, message, withButton = false) => {
    setNotification({
      visible: true,
      type,
      message,
      withButton
    });
  };

  // Funzione per nascondere manualmente la notifica
  const hideNotification = () => {
    setNotification({
      visible: false,
      type: '',
      message: '',
      withButton: false
    });
  };

  const isSubmitDisabled = () => {
    if (rating === 0) return true;
    if (rating <= 3 && comment.trim() === "") return true;
    return false;
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem("authToken");
      sessionStorage.removeItem("authToken");
      navigate("/login");
    } catch (error) {
      console.error("Errore durante il logout:", error);
      showNotification('error', 'Errore durante il logout. Riprova.');
    }
  };

  const getPlaceholder = () => {
    if (rating > 0 && rating <= 3) return "Ci dispiace! Cosa possiamo migliorare? (obbligatorio)";
    if (rating >= 4) return "Vuoi raccontarci cosa ti è piaciuto? (opzionale)";
    return "Vuoi lasciare due righe per aiutarci a migliorare?";
  };

  const handleSkip = () => {
    setRating(0);
    setComment("");
  };

  const handleSubmit = async () => {
    // Doppio controllo di sicurezza
    if (isSubmitDisabled()) {
      showNotification('error', 'Inserisci un commento per valutazioni basse (1-3 stelle)');
      return;
    }

    setIsSubmitting(true);

    try {
      // Salva il feedback su Firestore
      await addDoc(collection(db, "feedbacks"), {
        userId: userId,
        userName: userName,
        rating: rating,
        comment: comment.trim(),
        createdAt: serverTimestamp()
      });

      showNotification('success', 'Feedback Confermato!', true);

      // Resetta il form
      setRating(0);
      setComment("");
    } catch (error) {
      console.error("Errore durante il salvataggio del feedback:", error);
      showNotification('error', 'Feedback Non inviato, riprovare?', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feedback-container">
      {/* Overlay per la notifica */}
      <div className={`feedback-notification-overlay ${notification.visible ? 'visible' : ''}`}></div>

      {/* Notifica */}
      {notification.visible && (
        <div className={`feedback-notification ${notification.type} visible`}>
          <div className="notification-content">
            {notification.message}
          </div>

          {notification.withButton && (
            <div className="notification-buttons">
              <button
                className="notification-button confirm"
                onClick={() => {
                  // Azione per il pulsante di conferma
                  hideNotification();
                }}
              >
                Gira la ruota!
              </button>
            </div>
          )}
        </div>
      )}

      <div className="feedback-topbar">
        <button type="button" className="feedback-logout" onClick={handleLogout}>
          <FontAwesomeIcon icon={faArrowRightFromBracket} />
        </button>
      </div>

      <h1 className="feedback-greeting">Ciao {userName}!</h1>
      <h2 className="feedback-title">Come è stata la tua Esperienza da {process.env.REACT_APP_BUSINESS_NAME}?</h2>
      <p className="feedback-subtitle">
        Unisciti a chi ha già condiviso la sua esperienza, la tua opinione conta molto!
      </p>

      <div className="feedback-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`feedback-star ${(hover || rating) >= star ? "active" : ""}`}
            onClick={(e) => {
              const el = e.currentTarget;
              el.classList.remove("clicked");
              void el.offsetWidth;
              el.classList.add("clicked");
              setRating(star);
              setTimeout(() => {
                el.classList.remove("clicked");
              }, 400);
            }}
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
        <button
          className="feedback-button-submit"
          onClick={handleSubmit}
          disabled={isSubmitDisabled() || isSubmitting}
        >
          {isSubmitting ? "Invio..." : "Invia Feedback"}
        </button>
      </div>
    </div>
  );
}

export default Feedback;