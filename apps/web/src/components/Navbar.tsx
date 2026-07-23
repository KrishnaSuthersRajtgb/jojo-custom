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
import { LogOut, MapPin, User, Ruler } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
    <nav className="w-full h-16 px-6 flex items-center justify-between border-b bg-white">
      {/* Left: Logo + Name */}
      <button
        onClick={() => { void navigate("/"); }}
        className="flex items-center gap-2"
      >
        <img src="/logo.svg" alt="JoJo Flora" className="h-8 w-8" />
        <span className="text-lg font-semibold text-gray-900">JoJo Flora</span>
      </button>

      {/* Right: Nav links + Auth area */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { void navigate("/addresses"); }}
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 px-2 py-1"
        >
          <MapPin className="h-4 w-4" />
          Addresses
        </button>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-gray-100 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-800">{user.name}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-xs text-gray-500">{user.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { void navigate("/profile"); }}>
                <User className="mr-2 h-4 w-4" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { void navigate("/measurements"); }}>
                <Ruler className="mr-2 h-4 w-4" />
                My Measurements
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { void navigate("/addresses"); }}>
                <MapPin className="mr-2 h-4 w-4" />
                My Addresses
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Button variant="ghost" onClick={onSignIn}>
              Sign In
            </Button>
            <Button onClick={onLogin}>Login</Button>
          </>
        )}
      </div>
    </nav>
  );
}