// src/App.js
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./pages/Dashboard";
import useAutoLogout from "./hooks/useAutoLogout";


function App() {
  const isAuthenticated = !!localStorage.getItem("authToken");
  const redirectPath = localStorage.getItem("redirectAfterLogin");
  useAutoLogout(); 

  useEffect(() => {
    if (isAuthenticated && redirectPath) {
      localStorage.removeItem("redirectAfterLogin");
      window.location.replace(redirectPath);
    }
  }, [isAuthenticated, redirectPath]);

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
        />
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
