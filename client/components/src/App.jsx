import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import GamesList from "./GamesList";
import GameDetails from "./GameDetails";
import Register from "./Register";
import Login from "./Login";
import ProtectedRoute from "./ProtectedRoute";

const App = () => {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/register">Register</Link>
            </li>
            <li>
              <Link to="/login">Login</Link>
            </li>
          </ul>
        </nav>
        <Routes>
          <Route path="/" element={<GamesList />} />
          <Route path="/games/:id" element={<GameDetails />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/write-review"
            element={
              <ProtectedRoute
                element={<WriteReview />}
                isAuthenticated={isLoggedIn}
              />
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
