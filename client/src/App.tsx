// src/App.tsx
import React, { useState } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeProvider";
import "./App.css";
import { Navbar } from "./components/common/Navbar";
import {
  Dashboard,
  Login,
  Register,
  ProductInventory,
  ProductForm,
  MasterInventory,
  Purchase,
  Sales,
  Profile,
  Report,
  Restore_Backup,
  Notifications
} from "./pages";
import { Toaster } from "@/components/ui/sonner";
import AppInitializer from "./components/AppInitializer";
import BackupSessionGuard from "./components/BackupSessionGuard";
import SoftwareUpdateBanner from "./components/SoftwareUpdateBanner";


import { useEnterToNextField } from "./hooks/useEnterToNextField";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <AppInitializer/>
        Loading...
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  const [isExpanded, setIsExpanded] = useState(false);
  useEnterToNextField();

  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <BackupSessionGuard />
          <SoftwareUpdateBanner />
          <div className="min-h-screen bg-gray-50 overflow-x-hidden">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Navbar
                      isExpanded={isExpanded}
                      setIsExpanded={setIsExpanded}
                    >
                      <Dashboard />
                    </Navbar>
                  </PrivateRoute>
                }
              />
              <Route
                path="/product-inventory"
                element={
                  <PrivateRoute>
                    <Navbar
                      isExpanded={isExpanded}
                      setIsExpanded={setIsExpanded}
                    >
                      <ProductInventory />
                    </Navbar>
                  </PrivateRoute>
                }
              />
              <Route
                path="/product-inventory/new"
                element={
                  <PrivateRoute>
                    <Navbar
                      isExpanded={isExpanded}
                      setIsExpanded={setIsExpanded}
                    >
                      <ProductForm isEditMode={false} />
                    </Navbar>
                  </PrivateRoute>
                }
              />
              <Route
                path="/product-inventory/:productId"
                element={
                  <PrivateRoute>
                    <Navbar
                      isExpanded={isExpanded}
                      setIsExpanded={setIsExpanded}
                    >
                      <ProductForm isEditMode={true} />
                    </Navbar>
                  </PrivateRoute>
                }
              />
              // In your App.tsx routes, update the product inventory route:
              <Route
                path="/master"
                element={
                  <PrivateRoute>
                    <Navbar
                      isExpanded={isExpanded}
                      setIsExpanded={setIsExpanded}
                    >
                      <MasterInventory />
                    </Navbar>
                  </PrivateRoute>
                }
              />
              <Route
                path="/purchases"
                element={
                  <PrivateRoute>
                    <Navbar
                      isExpanded={isExpanded}
                      setIsExpanded={setIsExpanded}
                    >
                      <Purchase />
                    </Navbar>
                  </PrivateRoute>
                }
              />
              <Route
                path="/sales"
                element={
                  <PrivateRoute>
                    <Navbar
                      isExpanded={isExpanded}
                      setIsExpanded={setIsExpanded}
                    >
                      <Sales />
                    </Navbar>
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Navbar
                      isExpanded={isExpanded}
                      setIsExpanded={setIsExpanded}
                    >
                      <Profile />
                    </Navbar>
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
              <Route
                path="/reports"
                element={
                  <PrivateRoute>
                    <Navbar
                      isExpanded={isExpanded}
                      setIsExpanded={setIsExpanded}
                    >
                      <Report />
                    </Navbar>
                  </PrivateRoute>
                }
              />
              <Route
                path="/backup"
                element={
                  <PrivateRoute>
                    <Navbar
                      isExpanded={isExpanded}
                      setIsExpanded={setIsExpanded}
                    >
                      <Restore_Backup />
                    </Navbar>
                  </PrivateRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <PrivateRoute>
                    <Navbar
                      isExpanded={isExpanded}
                      setIsExpanded={setIsExpanded}
                    >
                      <Notifications />
                    </Navbar>
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </Router>
      </ThemeProvider>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
