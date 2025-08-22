// App.js
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Feedback from "./pages/Feedback";
import Share from "./pages/Share";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import "./App.css"; // Aggiungiamo un file CSS per lo spinner

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isChangingPage, setIsChangingPage] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        user.getIdToken().then(token => {
          localStorage.setItem("authToken", token);
        });
      } else {
        setIsAuthenticated(false);
        localStorage.removeItem("authToken");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {

    const timeout = setTimeout(() => {
      setIsChangingPage(false);
    }, 800);

    return () => clearTimeout(timeout);
  }, []);

  if (loading) {
    return (
      <div className="spinner-overlay">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <>
      {isChangingPage && (
        <div className="spinner-overlay">
          <div className="spinner"></div>
        </div>
      )}
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/feedback" /> : <Login />}
        />
        <Route
          path="/feedback"
          element={isAuthenticated ? <Feedback /> : <Navigate to="/login" />}
        />
        <Route
          path="/share"
          element={isAuthenticated ? <Share /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/feedback" : "/login"} />} />
      </Routes>
    </>
  );
}

export default App;