// src/Login.js
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import { auth, provider, signInWithPopup } from "../firebase";
import "./Login.css";

const images = [
  "https://i.ibb.co/BHSVHMX0/template-4.jpg",
  "https://i.ibb.co/8gMrCcPC/template-5.jpg",
  "https://i.ibb.co/qLm07X4H/template-6.jpg",
];

function Login() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState(0);
  const [shouldAutoRotate, setShouldAutoRotate] = useState(true);
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

  // --- Gestione swipe ---
  const handleStart = (e) => {
    setShouldAutoRotate(false);
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setStartX(clientX);
    setOffset(0);
  };

  const handleMove = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const diffX = clientX - startX;
    setOffset(diffX);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = containerRef.current
      ? containerRef.current.offsetWidth * 0.2
      : 60;

    if (Math.abs(offset) > threshold) {
      if (offset > 0) {
        // swipe destra → immagine precedente
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      } else {
        // swipe sinistra → immagine successiva
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }
    }

    setOffset(0);
    setTimeout(() => setShouldAutoRotate(true), 3000);
  };

  return (
    <div className="app-container">
      {/* Contenitore immagini */}
      <div className="image-container">
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
          <div
            className="slides"
            style={{
              transform: `translateX(calc(${-currentIndex * 100}% + ${offset}px))`,
              transition: isDragging ? "none" : "transform 0.5s ease-in-out",
            }}
          >
            {images.map((src, i) => (
              <img key={i} src={src} alt={`slide-${i}`} className="slide" />
            ))}
          </div>
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

      {/* Login */}
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
          <a href="#" className="legal-link">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="legal-link">
            Privacy Policy
          </a>.
        </p>
      </div>
    </div>
  );
}

export default Login;
