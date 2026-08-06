import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AddressProvider } from './context/AddressContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import MeasurementSidebar from './components/MeasurementSidebar';
import Home from './pages/Home';
import Fabrics from './pages/Fabrics';
// import FabricsByTone from "./pages/FabricsByTone";
import FabricDetail from './pages/FabricDetail';
import Address from './pages/Address';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Measurements from './pages/Measurements';
import Profile from './pages/Profile';
import Order from './pages/Order';
import Payment from './pages/Payment';
import OrderTracking from './pages/OrderTracking';
import CustomOutfit from './pages/CustomOutfit';
import ProductStyle from './pages/ProductStyle';
import ProductAccessories from './pages/ProductAccessories';
import ProductSummary from './pages/ProductSummary';
import Franchise from './pages/Franchise';
import Footer from './components/Footer';
import AdminOrders from './pages/admin/AdminOrders';
import AdminDashboard from './pages/admin/AdminDashboard';
import ColorWheel from './components/ColorWheel';

import ScrollToTop from './components/ScrollToTop';
function AppContent() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    void navigate('/login');
  };

  // Navbar expects { name, email, avatarUrl? } — our AuthUser stores "username",
  // so map it here rather than changing Navbar.tsx or AuthContext.tsx.
  const navbarUser = user ? { name: user.username, email: user.email } : null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <ScrollToTop />
      <Navbar
        user={navbarUser}
        onSignIn={() => {
          void navigate('/signup');
        }}
        onLogin={() => {
          void navigate('/login');
        }}
        onLogout={handleLogout}
      />
      {/* pt-16 offsets the now-fixed Navbar (h-16) so content isn't hidden underneath it */}
      <div className="flex-1 flex flex-col lg:flex-row pt-16">
        <main className="flex-1 min-w-0">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/fabrics" element={<Fabrics />} />
            {/* <Route path="/fabrics/:tone" element={<FabricsByTone />} /> */}
            <Route path="/fabrics/:tone/:fabricId" element={<FabricDetail />} />
            <Route path="/addresses" element={<Address />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/order" element={<Order />} />
            <Route path="/order-tracking" element={<OrderTracking />} />
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
            <Route
              path="/payment"
              element={
                <ProtectedRoute>
                  <Payment />
                </ProtectedRoute>
              }
            />
            <Route path="/custom-outfit" element={<CustomOutfit />} />
            <Route path="/custom-outfit/:productId" element={<ProductStyle />} />
            <Route path="/custom-outfit/:productId/accessories" element={<ProductAccessories />} />
            <Route path="/custom-outfit/:productId/summary" element={<ProductSummary />} />
            <Route path="/franchise" element={<Franchise />} />
            <Route
              path="/color-wheel"
              element={
                <ColorWheel
                  onSelect={(hex) => {
                    console.log('Selected color:', hex);
                  }}
                />
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute>
                  <AdminOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <MeasurementSidebar />
      </div>
      <Footer />
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
