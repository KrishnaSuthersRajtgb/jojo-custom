import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, MapPin, User, Ruler, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

// ── Design tokens (matches Home.tsx) ───────────────────────────────────────
//   ink      #1B1512  primary text / dark surfaces
//   wine     #5C1A32  primary accent
//   brass    #B8935A  secondary accent
//   bone     #F6F1E7  page / nav background
// Display face: Fraunces, for the wordmark only — body chrome stays Inter/
// system sans so the nav still reads fast and functional.

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

  return (
    // z-[60] — must stay above MeasurementSidebar's fixed toggle button
    // and mobile overlay/backdrop (which use up to z-50), otherwise the
    // sidebar's content bleeds through this nav's dropdown menu.
    <nav className="fixed top-0 left-0 right-0 z-[60] w-full h-16 px-6 flex items-center justify-between border-b border-[#5C1A32]/15 bg-[#F6F1E7]">
      {/* Left: Logo + Name */}
      <button
        onClick={() => { void navigate("/"); }}
        className="flex items-center gap-2"
      >
        <img src="/image.png" alt="JoJo Flora" className="h-8 w-8" />
        <span className="text-lg text-[#1B1512]" style={serif}>
          JoJo Flora
        </span>
      </button>

      {/* Right: Nav links + Auth area */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { void navigate("/addresses"); }}
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-[#4A413B] hover:text-[#5C1A32] px-2 py-1 transition-colors"
        >
          <MapPin className="h-4 w-4" />
          Addresses
        </button>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-[#5C1A32]/5 transition-colors">
                <Avatar className="h-8 w-8 ring-1 ring-[#B8935A]/40">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback className="bg-[#1B1512] text-[#F6F1E7]">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-[#1B1512]">{user.name}</span>
              </button>
            </DropdownMenuTrigger>
            {/* z-[70] — explicit boost so this always paints above the
                measurement sidebar's fixed/overlay elements regardless
                of DOM order. */}
            <DropdownMenuContent
              align="end"
              className="w-48 z-[70] bg-[#F6F1E7] border-[#5C1A32]/15"
            >
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium text-[#1B1512]">{user.name}</span>
                  <span className="text-xs text-[#4A413B]/70">{user.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#5C1A32]/15" />
              <DropdownMenuItem
                onClick={() => { void navigate("/profile"); }}
                className="text-[#2A211D] focus:bg-[#5C1A32]/10 focus:text-[#1B1512]"
              >
                <User className="mr-2 h-4 w-4 text-[#B8935A]" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { void navigate("/measurements"); }}
                className="text-[#2A211D] focus:bg-[#5C1A32]/10 focus:text-[#1B1512]"
              >
                <Ruler className="mr-2 h-4 w-4 text-[#B8935A]" />
                My Measurements
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { void navigate("/addresses"); }}
                className="text-[#2A211D] focus:bg-[#5C1A32]/10 focus:text-[#1B1512]"
              >
                <MapPin className="mr-2 h-4 w-4 text-[#B8935A]" />
                My Addresses
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { void navigate("/order-tracking"); }}
                className="text-[#2A211D] focus:bg-[#5C1A32]/10 focus:text-[#1B1512]"
              >
                <Package className="mr-2 h-4 w-4 text-[#B8935A]" />
                My Orders
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#5C1A32]/15" />
              <DropdownMenuItem
                onClick={onLogout}
                className="text-[#5C1A32] focus:bg-[#5C1A32]/10 focus:text-[#5C1A32]"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Button
              variant="ghost"
              onClick={onSignIn}
              className="text-[#1B1512] hover:bg-[#5C1A32]/5 hover:text-[#5C1A32]"
            >
              Sign In
            </Button>
            <Button
              onClick={onLogin}
              className="bg-[#1B1512] text-[#F6F1E7] hover:bg-[#5C1A32] rounded-sm"
            >
              Login
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}