// Wheel.js
import React, { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
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
import './Wheel.css';

function Wheel() {
  const [spinning, setSpinning] = useState(false);
  const [userCoins, setUserCoins] = useState(0);
  const [userId, setUserId] = useState("");
  const [canSpin, setCanSpin] = useState(true);
  const [notification, setNotification] = useState({
    visible: false,
    message: '',
    isWinner: false
  });
  const [userName, setUserName] = useState("");
  const [userPhoto, setUserPhoto] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const wheelRef = useRef(null);

  const navigate = useNavigate();

  const wheelSections = [
    { text: "Fortuna", color: "#FF6B6B", winner: true },
    { text: "Destino", color: "#4ECDC4", winner: false },
    { text: "Sorte", color: "#FFD166", winner: false },
    { text: "Chance", color: "#06D6A0", winner: false },
    { text: "Luck", color: "#118AB2", winner: false },
    { text: "Azardo", color: "#073B4C", winner: false },
    { text: "Rischio", color: "#9E9E9E", winner: false },
    { text: "Vento", color: "#7109B7", winner: false }
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const nameFromEmail = user.email.split('@')[0];
        setUserName(nameFromEmail);
        setUserId(user.uid);
        setUserPhoto(user.photoURL || "");
        await loadUserData(user.uid);
      } else {
        const hasToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
        if (!hasToken) {
          navigate("/login");
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

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

  const loadUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserCoins(userData.coins || 0);
        setCanSpin((userData.coins || 0) >= 1);
      }
    } catch (error) {
      console.error("Errore nel caricamento dati utente:", error);
    }
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

  const spinWheel = () => {
    if (spinning || !canSpin) return;

    setSpinning(true);

    // Calcola un angolo casuale per la sezione vincente
    const winningSectionIndex = Math.floor(Math.random() * wheelSections.length);
    const sectionAngle = 360 / wheelSections.length;
    
    // Aggiunge più rotazioni per un effetto più realistico (da 5 a 7 giri completi)
    const fullRotations = 5 + Math.floor(Math.random() * 3);
    const baseDegrees = fullRotations * 360;
    
    // Calcola l'angolo finale per fermarsi al centro della sezione vincente
    const finalAngle = baseDegrees + (winningSectionIndex * sectionAngle) + (sectionAngle / 2);
    
    // Reset della rotazione prima di iniziare una nuova animazione
    if (wheelRef.current) {
      wheelRef.current.style.transition = 'none';
      wheelRef.current.style.transform = 'rotate(0deg)';
      
      // Forza un reflow per assicurarsi che il reset venga applicato
      void wheelRef.current.offsetWidth;
    }

    // Applica la rotazione
    setTimeout(() => {
      if (wheelRef.current) {
        wheelRef.current.style.transition = 'transform 4s cubic-bezier(0.3, 0.1, 0.1, 1)';
        wheelRef.current.style.transform = `rotate(${finalAngle}deg)`;
      }

      setTimeout(async () => {
        try {
          const newCoins = userCoins - 1;
          setUserCoins(newCoins);

          await updateDoc(doc(db, "users", userId), {
            coins: newCoins
          });

          const isWinner = wheelSections[winningSectionIndex].winner;
          let finalCoins = newCoins;
          let message = "C’eri quasi! Ritenta per vincere!";

          if (isWinner) {
            const prizeAmount = 10; // Aumentato il premio per renderlo più interessante
            finalCoins = newCoins + prizeAmount;
            message = `Congratulazioni! Hai vinto ${prizeAmount} coin!`;

            await updateDoc(doc(db, "users", userId), {
              coins: finalCoins
            });
          }

          setUserCoins(finalCoins);
          setCanSpin(finalCoins >= 1);

          setNotification({
            visible: true,
            message: message,
            isWinner: isWinner
          });
        } catch (error) {
          console.error("Errore nell'aggiornamento dei coin:", error);
        } finally {
          setSpinning(false);
        }
      }, 4000);
    }, 10);
  };

  const closeNotification = () => {
    setNotification({ visible: false, message: '', isWinner: false });
  };

  const handleGetAnotherCoin = () => {
    closeNotification();
    navigate('/share');
  };

  const handleCoinClick = () => {
    navigate('/wheel');
  };

  return (
    <div className="wheel-container">
      <div className="wheel-topbar">
        <div
          className="coin-display"
          onClick={handleCoinClick}
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
              <img src={userPhoto} alt="Profilo" className="profile-image" />
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

      <h1 className="wheel-title">Ruota della Fortuna</h1>
      <p className="wheel-subtitle">Spendi 1 coin per girare la ruota e vincere premi!</p>

      <div className="wheel-wrapper">
        <div className="wheel" ref={wheelRef}>
          {wheelSections.map((section, index) => {
            const rotation = (360 / wheelSections.length) * index;
            return (
              <div
                key={index}
                className="wheel-section"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  backgroundColor: section.color
                }}
              >
                <div className="wheel-section-content">
                  {section.text}
                </div>
              </div>
            );
          })}
          <div className="wheel-center">
            <div className="wheel-center-inner"></div>
          </div>
        </div>
        <img
          src="https://cdn-icons-png.flaticon.com/512/32/32195.png"
          alt="Pointer"
          className="wheel-pointer"
        />
      </div>

      <button
        className="spin-button"
        onClick={spinWheel}
        disabled={spinning || !canSpin}
      >
        {spinning ? "Girando..." : "Gira la ruota (1 coin)"}
      </button>

      {notification.visible && (
        <>
          <div className="wheel-notification-overlay visible" onClick={closeNotification}></div>
          <div className={`wheel-notification visible ${notification.isWinner ? 'success' : 'failure'}`}>
            <button
              className="notification-close"
              onClick={closeNotification}
              aria-label="Chiudi notifica"
            >
              &times;
            </button>

            <div className="notification-content">
              {notification.message}
            </div>
            <div className="notification-buttons">
              <button
                className={`notification-button confirm ${notification.isWinner ? '' : 'failure'}`}
                onClick={notification.isWinner ? closeNotification : handleGetAnotherCoin}
              >
                {notification.isWinner ? 'Continua' : 'Ottieni un\'altra coin'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Wheel;