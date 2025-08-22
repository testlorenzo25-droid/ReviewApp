// src/Login.js
import React, { useState } from "react";
import { auth, provider, signInWithPopup } from "../firebase";
import "./Login.css";

function Login() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState(false);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    
    setIsLoggingIn(true);
    setLoginError(false);
    
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
        try {
          localStorage.setItem("authToken", token);
          localStorage.setItem("redirectAfterLogin", "/feedback");
        } catch (e) {
          console.warn("LocalStorage non disponibile, usando sessionStorage");
          sessionStorage.setItem("authToken", token);
          sessionStorage.setItem("redirectAfterLogin", "/feedback");
        }
        
        window.location.href = "/feedback";
      } else {
        console.error("Login fallito:", data.error);
        setLoginError(true);
      }
    } catch (err) {
      console.error("Errore login:", err);
      setLoginError(true);
    } finally {
      setIsLoggingIn(false);
      
      // Resetta l'errore dopo 3 secondi
      if (loginError) {
        setTimeout(() => {
          setLoginError(false);
        }, 3000);
      }
    }
  };

  // genera rettangoli
  const renderSet = (count = 6) =>
    [...Array(count)].map((_, i) => <div key={i} className="rectangle" />);

  const Row = ({ className }) => (
    <div className={`row ${className}`}>
      {renderSet(6)}
      {renderSet(6)} {/* duplicato per il loop */}
    </div>
  );

  return (
    <div className="app-container">
      {/* Tre righe animate */}
      <div className="animated-rows">
        <Row className="row-1" />
        <Row className="row-2" />
        <Row className="row-3" />
      </div>

      {/* Testi + login */}
      <div className="login-section">
        <h2 className="text-grey">Reviù</h2>
        <h2 className="text-dark">Meet Reviù</h2>
        <h2 className="text-grey">
          Your voice, their <br /> growth, your reward.
        </h2>

        <button 
          className="google-login-btn" 
          onClick={handleLogin}
          disabled={isLoggingIn}
          style={loginError ? {backgroundColor: '#ffebee', color: '#c62828'} : {}}
        >
          <img
            src="https://www.svgrepo.com/show/303108/google-icon-logo.svg"
            alt="Google logo"
            className="google-logo"
            />
          {isLoggingIn ? "Accesso in corso..." : 
           loginError ? "Errore nel login. Riprova!" : "Continua con Google"}
        </button>

        <p className="legal-text">
          By clicking continue, you agree to our{" "}
          <a href="/terms" className="legal-link">Terms of Service</a> and{" "}
          <a href="/privacy" className="legal-link">Privacy Policy</a>.
        </p>
      </div>

      {/* Box fisso con immagine profilo */}
      <div className="fixed-box">
        <div className="profile-picture">
          <img
            src="/profile-picture.png"
            alt="Profile"
            className="profile-image"
            onError={(e) => {
              // Fallback se l'immagine non viene caricata
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="profile-fallback" style={{ display: 'none' }}>
            RL
          </div>
          <div className="status-dot"></div>
        </div>
        <div className="profile-info">
          <div className="profile-name">Hey tu,</div>
          <div className="profile-comment">Dovresti lasciare una Recensione!</div>
        </div>
      </div>
    </div>
  );
}

export default Login;