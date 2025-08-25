import React, { useEffect, useState, useRef, useMemo } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
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
import "./Share.css";

function Share() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCoins, setUserCoins] = useState(0);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState("");
  const [userPhoto, setUserPhoto] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    let unsubscribeUser = null;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const nameFromEmail = currentUser.email.split('@')[0];
        setUserName(nameFromEmail);
        setUserPhoto(currentUser.photoURL || "");
        // Listener realtime sulle coin
        unsubscribeUser = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUserCoins(userData.coins || 0);
          }
        });
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

    return () => {
      unsubscribe();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCoinClick = () => {
    navigate('/wheel');
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/google-reviews?placeId=${process.env.REACT_APP_GOOGLE_PLACE_ID}`);

      if (!response.ok) {
        throw new Error(`Errore HTTP! Status: ${response.status}`);
      }

      const data = await response.json();
      setReviews(data.reviews || []);

    } catch (error) {
      console.error("Errore nel caricamento recensioni:", error);
      setError("Impossibile caricare le recensioni");
      setReviews([]);
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
    // Implementare la logica reale di condivisione
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

  const renderedSquares = useMemo(() => {
    if (loading) {
      return [...Array(12)].map((_, i) => (
        <div key={i} className="square loading" aria-label="Caricamento recensione">
          <div className="review-header">
            <img
              src="/profile-picture.png"
              className="profile-image-mini"
              alt="Caricamento"
            />
            <div className="review-author">Caricamento...</div>
          </div>
        </div>
      ));
    }

    if (error) {
      return [...Array(12)].map((_, i) => (
        <div key={i} className="square error" aria-label="Errore caricamento">
          <div className="review-header">
            <img
              src="/profile-picture.png"
              className="profile-image-mini"
              alt="Errore"
            />
            <div className="review-author">Errore</div>
          </div>
        </div>
      ));
    }

    if (reviews.length === 0) {
      return [...Array(12)].map((_, i) => (
        <div key={i} className="square empty" aria-label="Nessuna recensione">
          <div className="review-header">
            <img
              src="/profile-picture.png"
              className="profile-image-mini"
              alt="Nessuna recensione"
            />
            <div className="review-author">Nessuna recensione</div>
          </div>
        </div>
      ));
    }

    return reviews.slice(0, 12).map((review, i) => (
      <div key={i} className="square" aria-label={`Recensione di ${formatName(review.name)}`}>
        <div className="review-header">
          <img
            src="/profile-picture.png"
            className="profile-image-mini"
            alt={formatName(review.name)}
          />
          <div className="review-author">
            {formatName(review.name)}
          </div>
        </div>

        <svg className="quote-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
          <path d="M0,4v12h8c0,4.41-3.586,8-8,8v4c6.617,0,12-5.383,12-12V4H0z" />
          <path d="M20,4v12h8c0,4.41-3.586,8-8,8v4c6.617,0,12-5.383,12-12V4H20z" />
        </svg>

        <div className="review-text">
          {review.text && review.text.length > 100
            ? `${review.text.substring(0, 100)}...`
            : review.text || "Nessun commento"}
        </div>
      </div>
    ));
  }, [loading, error, reviews]);

  const Row = React.memo(({ className, items }) => (
    <div className={`row ${className}`} aria-hidden="true">
      {items}
      {items}
    </div>
  ));

  const memoizedRows = useMemo(() => {
    return (
      <div className="animated-squares">
        <Row className="row-1" items={renderedSquares.slice(0, 6)} />
        <Row className="row-2" items={renderedSquares.slice(6, 12)} />
      </div>
    );
  }, [renderedSquares]);

  return (
    <div className="share-container">
      <div className="share-topbar">
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
            onClick={() => {
              setShowDropdown(!showDropdown);
              setIsDropdownOpen(!isDropdownOpen);
            }}
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

          <div className={`dropdown-menu ${showDropdown ? 'show' : ''}`}>
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
        </div>
      </div>

      {memoizedRows}

      <button
        className="google-share-btn"
        onClick={handleShare}
        aria-label="Condividi su Google"
      >
        <img
          src="https://www.svgrepo.com/show/303108/google-icon-logo.svg"
          alt="Google logo"
          className="google-logo"
        />
        Condividi su Google
      </button>

      <p
        className="skip-text"
        onClick={handleSkip}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => e.key === 'Enter' && handleSkip()}
        aria-label="Salta e vai al feedback"
      >
        Skip
      </p>
    </div>
  );
}

export default Share;