// Wheel.js (versione corretta per produzione)
import React, { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {
  faArrowRightFromBracket,
  faFileLines,
  faCircleQuestion,
  faComment
} from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './Wheel.css';

function Wheel() {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState("");
  const [userCoins, setUserCoins] = useState(0);
  const [userId, setUserId] = useState("");
  const [canSpin, setCanSpin] = useState(true);
  const [notification, setNotification] = useState({
    visible: false,
    message: ''
  });
  const [userName, setUserName] = useState("");
  const [userPhoto, setUserPhoto] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const navigate = useNavigate();

  const wheelSections = [
    { text: "Fortuna", color: "#FF6B6B", prize: "10 coin" },
    { text: "Destino", color: "#4ECDC4", prize: "5 coin" },
    { text: "Sorte", color: "#FFD166", prize: "20 coin" },
    { text: "Chance", color: "#06D6A0", prize: "2 coin" },
    { text: "Luck", color: "#118AB2", prize: "15 coin" },
    { text: "Azardo", color: "#073B4C", prize: "8 coin" },
    { text: "Rischio", color: "#9E9E9E", prize: "25 coin" },
    { text: "Vento", color: "#7209B7", prize: "3 coin" }
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
    setResult("");

    const winningSectionIndex = Math.floor(Math.random() * wheelSections.length);
    const degrees = 1800 + (winningSectionIndex * (360 / wheelSections.length)) + Math.floor(Math.random() * (360 / wheelSections.length));

    const wheel = document.querySelector('.wheel');
    wheel.style.transform = `rotate(${degrees}deg)`;
    wheel.style.transition = 'transform 5s cubic-bezier(0.4, 0.2, 0.2, 1)';

    setTimeout(async () => {
      try {
        const newCoins = userCoins - 1;
        setUserCoins(newCoins);

        await updateDoc(doc(db, "users", userId), {
          coins: newCoins
        });

        const prizeText = wheelSections[winningSectionIndex].prize;
        const prizeAmount = parseInt(prizeText);

        const finalCoins = newCoins + prizeAmount;
        setUserCoins(finalCoins);

        await updateDoc(doc(db, "users", userId), {
          coins: finalCoins
        });

        setResult(`Hai vinto ${prizeText}!`);
        setCanSpin(finalCoins >= 1);

        setNotification({
          visible: true,
          message: `Congratulazioni! Hai vinto ${prizeText}`
        });
      } catch (error) {
        console.error("Errore nell'aggiornamento dei coin:", error);
        setResult("Errore nel calcolo del premio");
      } finally {
        setSpinning(false);
      }
    }, 5000);
  };

  const closeNotification = () => {
    setNotification({ visible: false, message: '' });
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
              <img src={userPhoto} alt="Profilo" className="profile-image" />
            ) : (
              <div className="profile-fallback">
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </div>
            )}
            <div className="status-dot"></div>
          </div>

          {showDropdown && (
            <div className="dropdown-menu">
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
        <div className="wheel">
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
        </div>
        <img
          src="https://cdn-icons-png.flaticon.com/512/66/66420.png"
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

      <div className="wheel-result">{result}</div>

      {notification.visible && (
        <>
          <div className="wheel-notification-overlay visible" onClick={closeNotification}></div>
          <div className="wheel-notification visible success">
            <div className="notification-content">
              {notification.message}
            </div>
            <div className="notification-buttons">
              <button className="notification-button confirm" onClick={closeNotification}>
                OK
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Wheel;