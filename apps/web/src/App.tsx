import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AddressProvider } from "./context/AddressContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Fabrics from "./pages/Fabrics";
// import FabricsByTone from "./pages/FabricsByTone";
import FabricDetail from "./pages/FabricDetail";
import Address from "./pages/Address";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Measurements from "./pages/Measurements";
import Profile from "./pages/Profile";
import Order from "./pages/Order";
import Payment from "./pages/Payment";

function AppContent() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
  logout();
  void navigate("/login");
};

  // Navbar expects { name, email, avatarUrl? } — our AuthUser stores "username",
  // so map it here rather than changing Navbar.tsx or AuthContext.tsx.
  const navbarUser = user ? { name: user.username, email: user.email } : null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar
  user={navbarUser}
  onSignIn={() => { void navigate("/signup"); }}
  onLogin={() => { void navigate("/login"); }}
  onLogout={handleLogout}
/>
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/fabrics" element={<Fabrics />} />
          {/* <Route path="/fabrics/:tone" element={<FabricsByTone />} /> */}
          <Route path="/fabrics/:tone/:fabricId" element={<FabricDetail />} />
          <Route path="/addresses" element={<Address />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/order" element={<Order />} />
          <Route
            path="/measurements"
            element={
              <ProtectedRoute>
                <Measurements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/payment" element={<Payment />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AddressProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AddressProvider>
    </AuthProvider>
  );
}

export default App;