// Share.js
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightFromBracket, faStar } from '@fortawesome/free-solid-svg-icons';
import "./Share.css";

function Share() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCoins, setUserCoins] = useState(0);
  // Rimossa la dichiarazione di userId poiché non utilizzata
  // const [userId, setUserId] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Rimossa l'impostazione di userId poiché non utilizzata
        // setUserId(currentUser.uid);
        await loadUserData(currentUser.uid); // Carica i dati utente
        fetchReviews();
      } else {
        const hasToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
        if (!hasToken) {
          navigate("/login");
        } else {
          navigate("/login");
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Funzione per caricare i dati dell'utente
  const loadUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserCoins(userData.coins || 0);
      }
    } catch (error) {
      console.error("Errore nel caricamento dati utente:", error);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/google-reviews?placeId=${process.env.REACT_APP_GOOGLE_PLACE_ID}`);
      const data = await response.json();

      if (response.ok) {
        setReviews(data.reviews);
      } else {
        console.error("Errore nel caricamento recensioni:", data.error);
      }
    } catch (error) {
      console.error("Errore di rete:", error);
    } finally {
      setLoading(false);
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

  const handleShare = () => {
    console.log("Condividi su Google");
  };

  const handleSkip = () => {
    setTimeout(() => {
      navigate("/feedback");
    }, 500);
  };

  const formatName = (fullName) => {
    if (!fullName) return "Anonimo";

    const names = fullName.split(' ');
    if (names.length === 1) return fullName;

    return `${names[0]} ${names[1].charAt(0).toUpperCase()}.`;
  };

  const renderSquares = () => {
    if (loading) {
      return [...Array(12)].map((_, i) => <div key={i} className="square" />);
    }

    return reviews.slice(0, 12).map((review, i) => (
      <div key={i} className="square">
        <div className="review-author">
          {formatName(review.name)}
        </div>
        <div className="review-text">
          {review.text && review.text.length > 100
            ? `${review.text.substring(0, 100)}...`
            : review.text}
        </div>
        <div className="review-rating">
          <FontAwesomeIcon icon={faStar} color="#FDCC0D" size="xs" />
          {review.stars}
        </div>
      </div>
    ));
  };

  const Row = ({ className, items }) => (
    <div className={`row ${className}`}>
      {items}
      {items} {/* duplicato per il loop */}
    </div>
  );

  return (
    <div className="share-container">
      {/* Topbar con moneta e logout */}
      <div className="share-topbar">
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
        <button type="button" className="share-logout" onClick={handleLogout}>
          <FontAwesomeIcon icon={faArrowRightFromBracket} />
        </button>
      </div>

      {/* Due righe animate con quadrati */}
      <div className="animated-squares">
        <Row className="row-1" items={renderSquares().slice(0, 6)} />
        <Row className="row-2" items={renderSquares().slice(6, 12)} />
      </div>

      {/* Bottone Condividi */}
      <button className="google-share-btn" onClick={handleShare}>
        <img
          src="https://www.svgrepo.com/show/303108/google-icon-logo.svg"
          alt="Google logo"
          className="google-logo"
        />
        Condividi su Google
      </button>

      {/* Testo Skip */}
      <p className="skip-text" onClick={handleSkip}>
        Skip
      </p>
    </div>
  );
}

export default Share;