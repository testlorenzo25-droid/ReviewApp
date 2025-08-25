// Feedback.js (versione corretta per produzione)
import React, { useState, useEffect, useCallback, useRef } from "react";
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
  limit,
  onSnapshot
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {
  faArrowRightFromBracket,
  faFileLines,
  faCircleQuestion,
  faComment,
  faTrophy
} from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
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
  const [userPhoto, setUserPhoto] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [animateEmojis, setAnimateEmojis] = useState(false);
  const dropdownRef = useRef(null);
  const emojiRefs = useRef([]);

  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribeUser = null;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const nameFromEmail = user.email.split('@')[0];
        setUserName(nameFromEmail);
        setUserId(user.uid);
        setUserPhoto(user.photoURL || "");
        // Listener realtime sulle coin
        unsubscribeUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUserCoins(userData.coins || 0);
            setFeedbackCountThisMonth(userData.feedbackCountThisMonth || 0);
            setLastFeedbackDate(userData.lastFeedbackDate ? userData.lastFeedbackDate.toDate() : null);
          }
        });
        await loadUserData(user.uid);
        await checkLastFeedback(user.uid);
      } else {
        const hasToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
        if (!hasToken) {
          navigate("/login");
        }
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, [navigate]);

  // Aggiungi useEffect per gestire il click outside del dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Aggiungi questo nuovo useEffect per l'animazione iniziale
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateEmojis(true);
    }, 500); // Inizia l'animazione dopo 0.5 secondi dal caricamento

    return () => clearTimeout(timer);
  }, []);

  const canSubmitFeedback = useCallback(() => {
    if (feedbackCountThisMonth >= 3) {
      return false;
    }

    if (lastFeedbackDate) {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return lastFeedbackDate <= oneWeekAgo;
    }

    return true;
  }, [feedbackCountThisMonth, lastFeedbackDate]);

  useEffect(() => {
    if (animateEmojis && canSubmitFeedback()) {
      emojiRefs.current.forEach((emojiEl, index) => {
        if (emojiEl) {
          // Imposta il colore del bordo in base all'emoji
          const emojiColors = [
            "#e53935", // Rosso per 😡
            "#1e88e5", // Blu per 😢
            "#757575", // Grigio per 😐
            "#43a047", // Verde per 😊
            "#e91e63"  // Rosa per 😍
          ];

          // Aggiungi un delay crescente per creare l'effetto onda
          setTimeout(() => {
            emojiEl.classList.add('emoji-wave');
            // Imposta il colore del bordo
            emojiEl.style.borderColor = emojiColors[index];

            // Rimuovi la classe dopo l'animazione per poterla riutilizzare
            setTimeout(() => {
              if (emojiEl) {
                emojiEl.classList.remove('emoji-wave');
                emojiEl.style.borderColor = ''; // Ripristina il colore del bordo
              }
            }, 1200); // Durata dell'animazione
          }, index * 250); // 250ms di delay tra un'emoticon e l'altra
        }
      });
    }
  }, [animateEmojis, canSubmitFeedback]);

  const handleCoinClick = () => {
    navigate('/wheel');
  };

  useEffect(() => {
    let interval;

    if (lastFeedbackDate && !canSubmitFeedback()) {
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

        setTimeRemaining({
          days: days || 0,
          hours: hours || 0,
          minutes: minutes || 0,
          seconds: seconds || 0
        });
      };

      calculateTimeRemaining();
      interval = setInterval(calculateTimeRemaining, 1000);
    } else {
      setTimeRemaining(null);
    }

    return () => clearInterval(interval);
  }, [lastFeedbackDate, canSubmitFeedback]);

  const loadUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserCoins(userData.coins || 0);
      } else {
        await setDoc(doc(db, "users", uid), {
          userName: auth.currentUser.email.split('@')[0],
          coins: 0,
          createdAt: serverTimestamp(),
          lastFeedbackDate: null,
          feedbackCountThisMonth: 0,
          lastResetMonth: new Date().getMonth(),
          lastResetYear: new Date().getFullYear()
        });
        setUserCoins(0);
      }
    } catch (error) {
      console.error("Errore nel caricamento dati utente:", error);
    }
  };

  const checkLastFeedback = async (uid) => {
    try {
      const now = new Date();
      const userDoc = await getDoc(doc(db, "users", uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const lastResetMonth = userData.lastResetMonth;
        const lastResetYear = userData.lastResetYear || now.getFullYear();

        if (lastResetMonth !== now.getMonth() || lastResetYear !== now.getFullYear()) {
          await updateDoc(doc(db, "users", uid), {
            feedbackCountThisMonth: 0,
            lastResetMonth: now.getMonth(),
            lastResetYear: now.getFullYear()
          });
          setFeedbackCountThisMonth(0);
        } else {
          setFeedbackCountThisMonth(userData.feedbackCountThisMonth || 0);
        }

        setLastFeedbackDate(userData.lastFeedbackDate ? userData.lastFeedbackDate.toDate() : null);
      }

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
    { icon: "😡", color: "#e53935", label: "Molto insoddisfatto" },
    { icon: "😢", color: "#1e88e5", label: "Insoddisfatto" },
    { icon: "😐", color: "#757575", label: "Neutro" },
    { icon: "😊", color: "#43a047", label: "Soddisfatto" },
    { icon: "😍", color: "#e91e63", label: "Molto soddisfatto" }
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
      await addDoc(collection(db, "feedbacks"), {
        userId,
        userName,
        rating,
        comment: comment.trim(),
        createdAt: serverTimestamp()
      });

      const newCoins = userCoins + 1;
      const newFeedbackCount = feedbackCountThisMonth + 1;

      await updateDoc(doc(db, "users", userId), {
        coins: newCoins,
        lastFeedbackDate: serverTimestamp(),
        feedbackCountThisMonth: newFeedbackCount
      });

      showNotification('success', `Grazie per il tuo Feedback!`, true);

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
      <div className={`feedback-notification-overlay ${notification.visible ? 'visible' : ''}`}></div>

      {notification.visible && (
        <div className={`feedback-notification ${notification.type} visible`}>
          {/* Aggiungi il pulsante di chiusura */}
          <button
            className="notification-close"
            onClick={hideNotification}
            aria-label="Chiudi notifica"
          >
            &times;
          </button>

          <div className="notification-content">
            <div>Grazie per il tuo Feedback!</div>
            {/* Aggiunta icona coin +1 sotto il testo */}
            <div className="coin-earned-notification">
              <img
                src="https://cdn-icons-png.flaticon.com/512/5219/5219370.png"
                alt="Coin"
                className="notification-coin-icon"
              />
              <span className="coin-plus">+1</span>
            </div>
          </div>
          {notification.withButton && (
            <div className="notification-buttons">
              <button
                className="notification-button confirm"
                onClick={() => {
                  hideNotification();
                  navigate('/wheel');
                }}
              >
                Gira la ruota!
              </button>
            </div>
          )}
        </div>
      )}

      <div className="feedback-topbar">
        <div
          className="coin-display"
          onClick={handleCoinClick}
          style={{ cursor: 'pointer' }}
        >
          <div className="coin-icon">
            <img
              src="https://cdn-icons-png.flaticon.com/512/5219/5219370.png"
              alt="Coin"
              style={{ width: '22px', height: '22px' }}
            />
          </div>
          <span className="coin-count">{userCoins}</span>
        </div>

        <div className="profile-dropdown-container" ref={dropdownRef}>
          <div
            className="profile-picture"
            onClick={() => setShowDropdown(!showDropdown)}
            aria-label="Menu profilo"
          >
            {userPhoto ? (
              <img src={userPhoto} alt="Profilo" className="profile-image-login" />
            ) : (
              <div className="profile-fallback">
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </div>
            )}
            <div className="status-dot"></div>
          </div>

          {showDropdown && (
            <div className="dropdown-menu show">
              <button
                className="dropdown-item"
                onClick={() => navigate("/wheel")}
              >
                <FontAwesomeIcon icon={faTrophy} />
                <span>Gioca</span>
              </button>
              <button
                className="dropdown-item"
                onClick={() => navigate("/feedback")}
              >
                <FontAwesomeIcon icon={faComment} />
                <span>Feedback</span>
              </button>

              <button
                className="dropdown-item"
                onClick={() => navigate("/share")}
              >
                <FontAwesomeIcon icon={faGoogle} />
                <span>Google Review</span>
              </button>

              <div className="dropdown-divider"></div>

              <button className="dropdown-item">
                <FontAwesomeIcon icon={faFileLines} />
                <span>Guide</span>
              </button>

              <button className="dropdown-item">
                <FontAwesomeIcon icon={faCircleQuestion} />
                <span>Help Center</span>
              </button>

              <div className="dropdown-divider"></div>

              <button
                className="dropdown-item"
                onClick={handleLogout}
              >
                <FontAwesomeIcon icon={faArrowRightFromBracket} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
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
              backgroundColor: rating === index + 1 ? "rgba(237, 237, 237, 0.9)" : "rgba(237, 237, 237, 0.7)",
              opacity: canSubmitFeedback() ? 1 : 0.5,
              cursor: canSubmitFeedback() ? "pointer" : "not-allowed"
            }}
            onClick={() => canSubmitFeedback() && setRating(index + 1)}
            disabled={!canSubmitFeedback()}
            aria-label={`Valutazione ${index + 1} stelle: ${emoji.label}`}
            ref={el => emojiRefs.current[index] = el}
          >
            <span
              className="emoji"
              style={{
                filter: rating === index + 1 ? "none" : "grayscale(100%)",
                transform: rating === index + 1 ? "scale(1.1)" : "scale(1)"
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
          aria-label="Commento feedback"
          rows={4}
        />
      </div>

      <div className="feedback-buttons">
        <button
          className="feedback-button-clean"
          onClick={handleSkip}
          disabled={!canSubmitFeedback()}
          aria-label="Cancella feedback"
        >
          Cancella
        </button>
        <button
          className="feedback-button-submit"
          onClick={handleSubmit}
          disabled={isSubmitDisabled() || isSubmitting || !canSubmitFeedback()}
          style={!canSubmitFeedback() ? { fontSize: '14px' } : {}}
          aria-label={getButtonText()}
        >
          {getButtonText()}
        </button>
      </div>
    </div>
  );
}

export default Feedback;