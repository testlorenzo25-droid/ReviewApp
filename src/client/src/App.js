import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Feedback from "./pages/Feedback";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div></div>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/feedback" /> : <Login />}
      />
      <Route
        path="/feedback"
        element={isAuthenticated ? <Feedback /> : <Navigate to="/login" />}
      />
      <Route path="*" element={<Navigate to={isAuthenticated ? "/feedback" : "/login"} />} />
    </Routes>
  );
}

export default App;