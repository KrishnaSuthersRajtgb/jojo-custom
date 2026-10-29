import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, MapPin, User, Ruler, Package, ShoppingBag, Menu, X } from 'lucide-react';
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
          {/* My Orders Icon */}
          <button
            onClick={() => {
              void navigate('/order-tracking');
            }}
            title="My Orders"
            className="p-2 text-[#1B1512]/75 hover:text-[#5C1A32] transition-colors"
          >
            <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
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
    </header>
  );
}
