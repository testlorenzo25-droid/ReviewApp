// App.js (versione corretta per produzione)
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom"; 
import Login from "./pages/Login";
import Feedback from "./pages/Feedback";
import Share from "./pages/Share";
import Wheel from './pages/Wheel';
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isChangingPage, setIsChangingPage] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        user.getIdToken().then(token => {
          try {
            localStorage.setItem("authToken", token);
          } catch (e) {
            sessionStorage.setItem("authToken", token);
          }
        }).catch(error => {
          console.error("Errore nel recupero del token:", error);
        });
      } else {
        setIsAuthenticated(false);
        try {
          localStorage.removeItem("authToken");
        } catch (e) {
          sessionStorage.removeItem("authToken");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setIsChangingPage(true);
    const timer = setTimeout(() => {
      setIsChangingPage(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [location]);

  if (loading) {
    return (
      <div className="spinner-overlay" role="status" aria-label="Caricamento">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <>
      {isChangingPage && (
        <div className="spinner-overlay" role="status" aria-label="Cambio pagina">
          <div className="spinner"></div>
        </div>
      )}
      
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/feedback" replace /> : <Login />}
        />
        <Route
          path="/feedback"
          element={isAuthenticated ? <Feedback /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/share"
          element={isAuthenticated ? <Share /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/wheel"
          element={isAuthenticated ? <Wheel /> : <Navigate to="/login" replace />}
        />
        <Route 
          path="*" 
          element={<Navigate to={isAuthenticated ? "/feedback" : "/login"} replace />} 
        />
      </Routes>
    </>
  );
}

export default App;