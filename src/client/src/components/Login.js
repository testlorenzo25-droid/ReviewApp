// src/Login.js
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import { auth, provider, signInWithPopup, signInWithRedirect, getRedirectResult } from "../firebase";
import "./Login.css";

const images = [
  "https://media.tarkett-image.com/large/TH_25094225_25187225_001.jpg",
  "https://www.sirvisual.it/Attachment/100/7408_34780_52%20Principale.jpg",
  "https://media.tarkett-image.com/large/TH_25094225_25187225_001.jpg",
];

function Login() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState(0);
  const [shouldAutoRotate, setShouldAutoRotate] = useState(true);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  // Cambio immagine ogni 3 secondi (solo se shouldAutoRotate è true)
  useEffect(() => {
    if (!shouldAutoRotate) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [shouldAutoRotate]);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();

      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("authToken", token);
        localStorage.setItem("redirectAfterLogin", "/dashboard");
        navigate("/dashboard");
      } else {
      console.error("Login fallito:", data.error);
    }
  } catch (err) {
    console.error("Errore login:", err);
  }
};


// Gestione eventi per lo swipe - Versione migliorata
const handleStart = (e) => {
  setShouldAutoRotate(false);
  setIsDragging(true);
  // Supporto per touch e mouse events
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  setStartX(clientX);
  setOffset(0);
};

const handleMove = (e) => {
  if (!isDragging) return;

  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const diffX = clientX - startX;

  // Limita lo spostamento per un'esperienza più naturale
  const maxOffset = containerRef.current ? containerRef.current.offsetWidth * 0.5 : 200;
  const limitedOffset = Math.max(Math.min(diffX, maxOffset), -maxOffset);

  setOffset(limitedOffset);
};

const handleEnd = () => {
  if (!isDragging) return;
  setIsDragging(false);

  // Soglia per determinare se considerare il movimento come swipe
  const threshold = containerRef.current ? containerRef.current.offsetWidth * 0.2 : 60;

  if (Math.abs(offset) > threshold) {
    if (offset > 0) {
      // Swipe a destra - immagine precedente
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    } else {
      // Swipe a sinistra - immagine successiva
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }
  }

  setOffset(0);
  // Riattiva il cambio automatico dopo 3 secondi dall'ultimo swipe
  setTimeout(() => setShouldAutoRotate(true), 3000);
};

// Calcola lo stile di transizione per l'immagine
const getImageStyle = () => {
  return {
    width: "100%",
    maxHeight: "55vh",
    borderRadius: "24px",
    aspectRatio: "8/9",
    objectFit: "cover",
    transform: `translateX(${offset}px)`,
    transition: isDragging ? "none" : "transform 0.3s ease",
  };
};

return (
  <div className="app-container">
    {/* Contenitore immagine e indicatori */}
    <div className="image-container">
      {/* Contenitore immagini con supporto per swipe */}
      <div
        ref={containerRef}
        className="swipe-container"
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      >
        <img
          src={images[currentIndex]}
          alt="login visual"
          style={getImageStyle()}
          ref={imageRef}
        />
      </div>

      {/* Indicatori */}
      <div className="indicators">
        {images.map((_, index) => (
          <span
            key={index}
            className={`indicator ${currentIndex === index ? "active" : ""}`}
          />
        ))}
      </div>
    </div>

    {/* Contenitore per bottone + testo legale */}
    <div className="login-container">
      <button className="google-login-btn" onClick={handleLogin}>
        <img
          src="https://www.svgrepo.com/show/303108/google-icon-logo.svg"
          alt="Google logo"
          className="google-logo"
        />
        Continua con Google
      </button>

      <p className="legal-text">
        By clicking continue, you agree to our{" "}
        <a href="#" className="legal-link">Terms of Service</a> and{" "}
        <a href="#" className="legal-link">Privacy Policy</a>.
      </p>
    </div>
  </div>
);
}

export default Login;