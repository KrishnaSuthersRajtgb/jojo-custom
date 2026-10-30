import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LogOut,
  MapPin,
  User,
  Ruler,
  Package,
  ShoppingBag,
  Menu,
  X,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

interface AuthUser {
  name: string;
  email: string;
  avatarUrl?: string;
}

interface NavbarProps {
  user?: AuthUser | null;
  onSignIn?: () => void;
  onLogin?: () => void;
  onLogout?: () => void;
}

export default function Navbar({ user, onSignIn, onLogin, onLogout }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [recentOrders, setRecentOrders] = useState<
    Array<{
      orderId?: string;
      product?: string;
      totalAmount?: number;
      status?: string;
      createdAt?: string;
    }>
  >([]);

  useEffect(() => {
    const updateOrders = () => {
      const ordersKey = user?.name ? `jojo_orders_${user.name}` : 'jojo_orders_guest';
      const raw = localStorage.getItem(ordersKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Array<{
            orderId?: string;
            product?: string;
            totalAmount?: number;
            status?: string;
            createdAt?: string;
          }>;
          if (Array.isArray(parsed)) {
            setRecentOrders(parsed.slice(0, 3));
          }
        } catch {
          setRecentOrders([]);
        }
      } else {
        setRecentOrders([]);
      }
    };
    updateOrders();
    window.addEventListener('storage', updateOrders);
    return () => window.removeEventListener('storage', updateOrders);
  }, [user]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-[60] w-full select-none">
      {/* ── 1. Top Announcement Bar ────────────────────────────────────────── */}
      <div className="w-full bg-[#13100E] text-[#E8DFC8] py-2 px-4 text-center border-b border-[#2A231E]">
        <p className="text-[10px] md:text-[11px] uppercase tracking-[0.26em] font-medium font-sans">
          Complimentary Home Measurement in Chennai · Coimbatore · Bengaluru
        </p>
      </div>

      {/* ── 2. Haute-Couture Main Navigation ─────────────────────────────── */}
      <nav className="w-full h-20 px-6 md:px-12 flex items-center justify-between border-b border-[#E7DFCE]/70 bg-[#FAF7F2]/95 backdrop-blur-md transition-all">
        {/* Left Links */}
        <div className="hidden lg:flex items-center gap-8">
          <button
            onClick={() => {
              void navigate('/custom-outfit');
            }}
            className={`text-[11px] tracking-[0.22em] uppercase font-medium transition-colors ${
              isActive('/custom-outfit')
                ? 'text-[#5C1A32] font-semibold'
                : 'text-[#1B1512]/80 hover:text-[#5C1A32]'
            }`}
          >
            Bespoke
          </button>
          <button
            onClick={() => {
              void navigate('/fabrics');
            }}
            className={`text-[11px] tracking-[0.22em] uppercase font-medium transition-colors ${
              isActive('/fabrics')
                ? 'text-[#5C1A32] font-semibold'
                : 'text-[#1B1512]/80 hover:text-[#5C1A32]'
            }`}
          >
            Fabric Library
          </button>
          <button
            onClick={() => {
              void navigate('/franchise');
            }}
            className={`text-[11px] tracking-[0.22em] uppercase font-medium transition-colors ${
              isActive('/franchise')
                ? 'text-[#5C1A32] font-semibold'
                : 'text-[#1B1512]/80 hover:text-[#5C1A32]'
            }`}
          >
            Franchise
          </button>
        </div>

        {/* Center: Iconic Roman Serif Brand Logo */}
        <button
          onClick={() => {
            void navigate('/');
          }}
          className="flex flex-col items-center justify-center text-center group cursor-pointer"
        >
          <span
            className="text-2xl md:text-3xl text-[#1B1512] font-normal tracking-[0.28em] transition-transform duration-300 group-hover:scale-[1.02]"
            style={serif}
          >
            JOJO
          </span>
          <span className="text-[8px] md:text-[9px] tracking-[0.42em] uppercase text-[#B8935A] font-medium -mt-0.5">
            Flora · Couture
          </span>
        </button>

        {/* Right Actions */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* Couture Bag & Orders Trigger */}
          <button
            onClick={() => setCartDrawerOpen(true)}
            title="Couture Bag & Orders"
            className="p-2 text-[#1B1512]/75 hover:text-[#5C1A32] transition-colors relative"
            aria-label="Open Couture Bag"
          >
            <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
            {recentOrders.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#5C1A32] text-[#FAF7F2] text-[10px] font-bold flex items-center justify-center">
                {recentOrders.length}
              </span>
            )}
          </button>

          {/* User Account / Profile */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1 rounded-full hover:bg-[#5C1A32]/5 transition-colors">
                  <Avatar className="h-7 w-7 ring-1 ring-[#B8935A]/50">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback className="bg-[#1B1512] text-[#FAF7F2] text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-52 z-[70] bg-[#FAF7F2] border-[#E7DFCE] shadow-xl p-1.5"
              >
                <DropdownMenuLabel>
                  <div className="flex flex-col px-1 py-0.5">
                    <span className="font-semibold text-sm text-[#1B1512]">{user.name}</span>
                    <span className="text-xs text-[#6B6158] truncate">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#E7DFCE]" />
                <DropdownMenuItem
                  onClick={() => {
                    void navigate('/profile');
                  }}
                  className="cursor-pointer text-xs uppercase tracking-wider text-[#1B1512] hover:bg-[#5C1A32]/10"
                >
                  <User className="mr-2 h-3.5 w-3.5 text-[#B8935A]" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    void navigate('/measurements');
                  }}
                  className="cursor-pointer text-xs uppercase tracking-wider text-[#1B1512] hover:bg-[#5C1A32]/10"
                >
                  <Ruler className="mr-2 h-3.5 w-3.5 text-[#B8935A]" />
                  Measurements
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    void navigate('/addresses');
                  }}
                  className="cursor-pointer text-xs uppercase tracking-wider text-[#1B1512] hover:bg-[#5C1A32]/10"
                >
                  <MapPin className="mr-2 h-3.5 w-3.5 text-[#B8935A]" />
                  Addresses
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    void navigate('/order-tracking');
                  }}
                  className="cursor-pointer text-xs uppercase tracking-wider text-[#1B1512] hover:bg-[#5C1A32]/10"
                >
                  <Package className="mr-2 h-3.5 w-3.5 text-[#B8935A]" />
                  Orders
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#E7DFCE]" />
                <DropdownMenuItem
                  onClick={onLogout}
                  className="cursor-pointer text-xs uppercase tracking-wider text-[#5C1A32] hover:bg-[#5C1A32]/10"
                >
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              onClick={onLogin}
              title="Sign In"
              className="p-2 text-[#1B1512]/75 hover:text-[#5C1A32] transition-colors"
            >
              <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
          )}

          {/* Book A Fitting CTA Button */}
          <button
            onClick={() => {
              void navigate('/measurements');
            }}
            className="hidden sm:inline-flex items-center justify-center border border-[#1B1512]/35 text-[#1B1512] hover:bg-[#5C1A32] hover:text-[#FAF7F2] hover:border-[#5C1A32] text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-medium px-5 py-2.5 rounded-none transition-all duration-300 shadow-sm"
          >
            Book A Fitting
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-[#1B1512] hover:text-[#5C1A32]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FAF7F2] border-b border-[#E7DFCE] px-6 py-6 space-y-4 shadow-xl">
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              void navigate('/custom-outfit');
            }}
            className="block w-full text-left text-xs uppercase tracking-[0.2em] font-medium py-2 text-[#1B1512] hover:text-[#5C1A32]"
          >
            Bespoke Atelier
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              void navigate('/fabrics');
            }}
            className="block w-full text-left text-xs uppercase tracking-[0.2em] font-medium py-2 text-[#1B1512] hover:text-[#5C1A32]"
          >
            Fabric Library
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              void navigate('/franchise');
            }}
            className="block w-full text-left text-xs uppercase tracking-[0.2em] font-medium py-2 text-[#1B1512] hover:text-[#5C1A32]"
          >
            Franchise
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              void navigate('/measurements');
            }}
            className="block w-full text-left text-xs uppercase tracking-[0.2em] font-medium py-2 text-[#1B1512] hover:text-[#5C1A32]"
          >
            Book A Fitting
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              void navigate('/order-tracking');
            }}
            className="block w-full text-left text-xs uppercase tracking-[0.2em] font-medium py-2 text-[#1B1512] hover:text-[#5C1A32]"
          >
            My Orders
          </button>
          {!user && (
            <div className="pt-4 border-t border-[#E7DFCE] flex gap-4">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogin?.();
                }}
                className="text-xs uppercase tracking-[0.18em] font-semibold text-[#1B1512] hover:text-[#5C1A32]"
              >
                Sign In
              </button>
              <span className="text-[#B8935A]">·</span>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignIn?.();
                }}
                className="text-xs uppercase tracking-[0.18em] font-semibold text-[#5C1A32] hover:underline"
              >
                Register
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 3. Couture Bag & Atelier Slide-out Drawer ─────────────────────── */}
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setCartDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-md bg-[#FAF7F2] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 border-l border-[#5C1A32]/15">
            {/* Drawer Header */}
            <div className="p-6 border-b border-[#5C1A32]/10 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="h-5 w-5 text-[#5C1A32]" />
                <h3 className="text-lg text-[#1B1512] font-semibold tracking-wide" style={serif}>
                  JoJo Flora Atelier Bag
                </h3>
              </div>
              <button
                onClick={() => setCartDrawerOpen(false)}
                className="p-1.5 text-[#1B1512]/60 hover:text-[#1B1512] rounded-full hover:bg-[#FAF7F2]"
                aria-label="Close bag drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Quick Shortcuts */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold tracking-[0.2em] text-[#B8935A] uppercase block">
                  Atelier Services
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => {
                      setCartDrawerOpen(false);
                      void navigate('/custom-outfit');
                    }}
                    className="p-3 text-left rounded-sm bg-white border border-[#5C1A32]/12 hover:border-[#5C1A32] hover:bg-[#5C1A32]/5 transition-all text-xs font-semibold text-[#1B1512]"
                  >
                    <Sparkles className="h-4 w-4 text-[#B8935A] mb-1.5" />
                    Bespoke Atelier
                    <span className="block text-[10px] font-normal text-[#4A413B]/70">
                      Design blouse, lehenga
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setCartDrawerOpen(false);
                      void navigate('/fabrics');
                    }}
                    className="p-3 text-left rounded-sm bg-white border border-[#5C1A32]/12 hover:border-[#5C1A32] hover:bg-[#5C1A32]/5 transition-all text-xs font-semibold text-[#1B1512]"
                  >
                    <Package className="h-4 w-4 text-[#B8935A] mb-1.5" />
                    Fabric Library
                    <span className="block text-[10px] font-normal text-[#4A413B]/70">
                      Pure silk & weaves
                    </span>
                  </button>
                </div>
              </div>

              {/* Recent / Active Orders */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-[#B8935A] uppercase">
                    Your Atelier Orders
                  </span>
                  {recentOrders.length > 0 && (
                    <button
                      onClick={() => {
                        setCartDrawerOpen(false);
                        void navigate('/order-tracking');
                      }}
                      className="text-[11px] font-semibold text-[#5C1A32] hover:underline flex items-center gap-1"
                    >
                      View All ({recentOrders.length}) <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {recentOrders.length > 0 ? (
                  <div className="space-y-2.5">
                    {recentOrders.map((ord, idx) => (
                      <div
                        key={ord.orderId ?? idx}
                        className="p-3.5 bg-white rounded-sm border border-[#5C1A32]/10 shadow-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#1B1512]">
                            {ord.product || 'Custom Bespoke Outfit'}
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#5C1A32]/10 text-[#5C1A32] px-2 py-0.5 rounded-full">
                            {ord.status || 'In Atelier'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-[#4A413B]">
                          <span className="font-mono text-[11px] text-[#4A413B]/70">
                            #{ord.orderId || `ORD-${idx + 1}`}
                          </span>
                          {ord.totalAmount !== undefined && (
                            <span className="font-semibold text-[#1B1512]">
                              ₹{ord.totalAmount.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white rounded-sm border border-dashed border-[#5C1A32]/20 space-y-3">
                    <ShoppingBag className="h-8 w-8 text-[#5C1A32]/30 mx-auto" />
                    <p className="text-xs text-[#4A413B] font-medium">
                      No active couture orders yet
                    </p>
                    <button
                      onClick={() => {
                        setCartDrawerOpen(false);
                        void navigate('/custom-outfit');
                      }}
                      className="inline-block text-[11px] uppercase tracking-wider font-semibold text-[#5C1A32] hover:underline"
                    >
                      + Start Custom Outfit
                    </button>
                  </div>
                )}
              </div>

              {/* Doorstep Fitting Banner */}
              <div className="bg-[#5C1A32] text-[#FAF7F2] p-4 rounded-sm space-y-2">
                <span className="text-[9px] font-bold tracking-[0.25em] text-[#B8935A] uppercase block">
                  Home Fitting
                </span>
                <p className="text-xs leading-relaxed text-[#FAF7F2]/90">
                  Prefer a master tailor to visit your home with fabric swatches?
                </p>
                <button
                  onClick={() => {
                    setCartDrawerOpen(false);
                    void navigate('/measurements');
                  }}
                  className="w-full py-2 bg-[#FAF7F2] text-[#1B1512] hover:bg-white text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors mt-2"
                >
                  Book Fitting Visit
                </button>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-5 border-t border-[#5C1A32]/10 bg-white">
              <button
                onClick={() => {
                  setCartDrawerOpen(false);
                  void navigate('/order-tracking');
                }}
                className="w-full py-3 bg-[#1B1512] hover:bg-[#5C1A32] text-[#FAF7F2] text-xs uppercase tracking-[0.2em] font-semibold rounded-sm transition-colors flex items-center justify-center gap-2"
              >
                Track Live Garment Progress <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
