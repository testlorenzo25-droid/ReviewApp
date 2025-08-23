// Feedback.js (versione corretta)
import React, { useState, useEffect, useCallback } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './Feedback.css';

function Feedback() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userCoins, setUserCoins] = useState(0);
  const [lastFeedbackDate, setLastFeedbackDate] = useState(null);
  const [feedbackCountThisMonth, setFeedbackCountThisMonth] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [notification, setNotification] = useState({
    visible: false,
    type: '',
    message: '',
    withButton: false
  });

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const nameFromEmail = user.email.split('@')[0];
        setUserName(nameFromEmail);
        setUserId(user.uid);

        // Carica i dati dell'utente
        await loadUserData(user.uid);

        // Controlla gli ultimi feedback
        await checkLastFeedback(user.uid);
      } else {
        const hasToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
        if (!hasToken) {
          navigate("/login");
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Funzione canSubmitFeedback con useCallback
  const canSubmitFeedback = useCallback(() => {
    // Se ha già inviato 3 feedback questo mese, non può inviarne altri
    if (feedbackCountThisMonth >= 3) {
      return false;
    }

    // Se ha già inviato un feedback, controlla che sia passata almeno una settimana
    if (lastFeedbackDate) {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return lastFeedbackDate <= oneWeekAgo;
    }

    // Se non ha mai inviato feedback, può inviarlo
    return true;
  }, [feedbackCountThisMonth, lastFeedbackDate]);

  // Effetto per il countdown
  useEffect(() => {
    let interval;

    if (lastFeedbackDate && !canSubmitFeedback()) {
      // Calcola il tempo rimanente
      const calculateTimeRemaining = () => {
        const now = new Date();
        const lastDate = new Date(lastFeedbackDate);
        const nextAvailableDate = new Date(lastDate);
        nextAvailableDate.setDate(lastDate.getDate() + 7);

        const difference = nextAvailableDate - now;

        if (difference <= 0) {
          setTimeRemaining(null);
          return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        // Assicurati che tutti i valori siano numeri validi
        setTimeRemaining({
          days: days || 0,
          hours: hours || 0,
          minutes: minutes || 0,
          seconds: seconds || 0
        });
      };

      // Calcola immediatamente
      calculateTimeRemaining();

      // Aggiorna ogni secondo
      interval = setInterval(calculateTimeRemaining, 1000);
    } else {
      setTimeRemaining(null);
    }

    return () => clearInterval(interval);
  }, [lastFeedbackDate, feedbackCountThisMonth, canSubmitFeedback]);

  // Carica i dati dell'utente dal database
  const loadUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserCoins(userData.coins || 0);
      } else {
        // Crea un nuovo utente se non esiste
        await setDoc(doc(db, "users", uid), {
          userName: auth.currentUser.email.split('@')[0],
          coins: 0,
          createdAt: serverTimestamp(),
          lastFeedbackDate: null,
          feedbackCountThisMonth: 0,
          lastResetMonth: new Date().getMonth() // Mese corrente
        });
        setUserCoins(0);
      }
    } catch (error) {
      console.error("Errore nel caricamento dati utente:", error);
    }
  };

  // Controlla l'ultimo feedback e resetta il conteggio se necessario
  const checkLastFeedback = async (uid) => {
    try {
      const now = new Date();

      // Controlla se è necessario resettare il conteggio mensile
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const lastResetMonth = userData.lastResetMonth;

        if (lastResetMonth !== now.getMonth()) {
          // Reset del conteggio mensile
          await updateDoc(doc(db, "users", uid), {
            feedbackCountThisMonth: 0,
            lastResetMonth: now.getMonth()
          });
          setFeedbackCountThisMonth(0);
        } else {
          setFeedbackCountThisMonth(userData.feedbackCountThisMonth || 0);
        }

        setLastFeedbackDate(userData.lastFeedbackDate ? userData.lastFeedbackDate.toDate() : null);
      }

      // Controlla gli ultimi feedback dell'utente
      const feedbacksQuery = query(
        collection(db, "feedbacks"),
        where("userId", "==", uid),
        orderBy("createdAt", "desc"),
        limit(1)
      );

      const querySnapshot = await getDocs(feedbacksQuery);
      if (!querySnapshot.empty) {
        const lastFeedback = querySnapshot.docs[0].data();
        setLastFeedbackDate(lastFeedback.createdAt.toDate());
      }
    } catch (error) {
      console.error("Errore nel controllo ultimo feedback:", error);
    }
  };

  const emojis = [
    { icon: "😡", color: "#e53935" },  // Arrabbiata
    { icon: "😢", color: "#1e88e5" },  // Triste
    { icon: "😐", color: "#757575" },  // Neutra
    { icon: "😊", color: "#43a047" },  // Sorridente
    { icon: "😍", color: "#e91e63" }   // Occhi a cuoricino
  ];

  const isSubmitDisabled = () => {
    if (!canSubmitFeedback()) return true;
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
    }
  };

  const getPlaceholder = () => {
    if (rating > 0 && rating <= 3) return "Ci dispiace! Cosa possiamo migliorare? (obbligatorio)";
    if (rating >= 4) return "Vuoi raccontarci cosa ti è piaciuto? (opzionale)";
    return "Vuoi lasciare due righe per aiutarci a migliorare?";
  };

  const formatTimeRemaining = () => {
    if (!timeRemaining) return "";

    const { days, hours, minutes, seconds } = timeRemaining;

    // Formatta i secondi per assicurarsi che siano sempre a 2 cifre
    const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;

    if (days > 0) {
      return `${days}g ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${formattedSeconds}s`;
    } else {
      return `${minutes}m ${formattedSeconds}s`;
    }
  };

  const getButtonText = () => {
    if (feedbackCountThisMonth >= 3) {
      return "Limite mensile raggiunto (3/3)";
    }

    if (!canSubmitFeedback() && timeRemaining) {
      return formatTimeRemaining();
    }

    if (isSubmitting) {
      return "Invio...";
    }

    return "Invia Feedback";
  };

  const handleSkip = () => {
    setRating(0);
    setComment("");
  };

  const handleSubmit = async () => {
    if (isSubmitDisabled()) return;
    setIsSubmitting(true);
    try {
      // Aggiungi il feedback
      await addDoc(collection(db, "feedbacks"), {
        userId,
        userName,
        rating,
        comment: comment.trim(),
        createdAt: serverTimestamp()
      });

      // Aggiorna i dati dell'utente
      const now = new Date();
      const newCoins = userCoins + 1;
      const newFeedbackCount = feedbackCountThisMonth + 1;

      await updateDoc(doc(db, "users", userId), {
        coins: newCoins,
        lastFeedbackDate: serverTimestamp(),
        feedbackCountThisMonth: newFeedbackCount
      });

      setUserCoins(newCoins);
      setFeedbackCountThisMonth(newFeedbackCount);
      setLastFeedbackDate(now);

      showNotification('success', `Grazie per il tuo Feedback! Hai ottenuto 1 coin. Totale: ${newCoins} coin`, true);

      setRating(0);
      setComment("");
    } catch (error) {
      console.error("Errore durante il salvataggio:", error);
      showNotification('error', 'Si è verificato un errore. Riprova più tardi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showNotification = (type, message, withButton = false) => {
    setNotification({
      visible: true,
      type,
      message,
      withButton
    });
  };

  const hideNotification = () => {
    setNotification({
      visible: false,
      type: '',
      message: '',
      withButton: false
    });
  };

  return (
    <div className="feedback-container">
      {/* Overlay per la notifica */}
      <div className={`feedback-notification-overlay ${notification.visible ? 'visible' : ''}`}></div>

      {/* Notifica in basso */}
      {notification.visible && (
        <div className={`feedback-notification ${notification.type} visible`}>
          <div className="notification-content">{notification.message}</div>
          <div style={{ marginTop: '10px', fontSize: '16px', color: '#737373' }}>
            Coin totali: {userCoins}
          </div>

          {notification.withButton && (
            <div className="notification-buttons">
              <button
                className="notification-button confirm"
                onClick={() => hideNotification()}
              >
                Gira la ruota!
              </button>
            </div>
          )}
        </div>
      )}

      <div className="feedback-topbar">
        {/* Box Coin a SINISTRA */}
        <div className="coin-display">
          <div className="coin-icon">
            <img 
              src="https://cdn-icons-png.flaticon.com/512/5219/5219370.png" 
              alt="Coin" 
              style={{ width: '22px', height: '22px' }}
            />
          </div>
          <span className="coin-count">{userCoins}</span>
        </div>

        {/* Logout a DESTRA */}
        <button type="button" className="feedback-logout" onClick={handleLogout}>
          <FontAwesomeIcon icon={faArrowRightFromBracket} />
        </button>
      </div>

      <h1 className="feedback-greeting">Ciao {userName}!</h1>
      <h2 className="feedback-title">
        Come è stata la tua esperienza da {process.env.REACT_APP_BUSINESS_NAME}?
      </h2>
      <p className="feedback-subtitle">
        Unisciti a chi ha già condiviso la sua esperienza, la tua opinione conta molto!
      </p>

      <div className="feedback-emojis">
        {emojis.map((emoji, index) => (
          <button
            key={index}
            type="button"
            className={`feedback-emoji ${rating === index + 1 ? "active" : ""}`}
            style={{
              borderColor: rating === index + 1 ? emoji.color : "transparent",
              opacity: canSubmitFeedback() ? 1 : 0.5,
              cursor: canSubmitFeedback() ? "pointer" : "not-allowed"
            }}
            onClick={() => canSubmitFeedback() && setRating(index + 1)}
            disabled={!canSubmitFeedback()}
          >
            <span
              className="emoji"
              style={{
                filter: rating === index + 1 ? "none" : "grayscale(100%)"
              }}
            >
              {emoji.icon}
            </span>
          </button>
        ))}
      </div>

      <div className="feedback-comment-box">
        <textarea
          className="feedback-textarea"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={getPlaceholder()}
          disabled={!canSubmitFeedback()}
        />
      </div>

      <div className="feedback-buttons">
        <button
          className="feedback-button-clean"
          onClick={handleSkip}
          disabled={!canSubmitFeedback()}
        >
          Cancella
        </button>
        <button
          className="feedback-button-submit"
          onClick={handleSubmit}
          disabled={isSubmitDisabled() || isSubmitting || !canSubmitFeedback()}
          style={!canSubmitFeedback() ? { fontSize: '14px' } : {}}
        >
          {getButtonText()}
        </button>
      </div>
    </div>
  );
}

export default Feedback;