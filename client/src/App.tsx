import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
// import { Toaster } from "@/components/ui/toaster";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeProvider";
import "./App.css";
import { Navbar } from "./components/common/Navbar";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      {/* Wrap entire app in ThemeProvider */}
      <ThemeProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Navbar>
                      <Dashboard />
                    </Navbar>
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            {/* <Toaster /> */}
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
