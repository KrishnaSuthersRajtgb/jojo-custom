import { Link } from "react-router-dom";
import { Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";

// ── Design tokens (matches Home.tsx / Navbar.tsx) ──────────────────────────
//   ink      #1B1512  headings, dark surfaces
//   wine     #5C1A32  primary accent (replaces fuchsia-800 throughout)
//   brass    #B8935A  secondary accent — icons, dot, rules
//   bone     #F6F1E7  footer background
// Display face: Fraunces, for the wordmark only.

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-[#5C1A32]/15 bg-[#F6F1E7]">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <img src="/image.png" alt="JoJo Flora" className="h-8 w-8" />
            <span className="text-lg text-[#1B1512]" style={serif}>
              JoJo Flora
            </span>
          </div>
          <p className="text-sm text-[#4A413B] leading-relaxed">
            Custom-tailored fabrics and outfits, made to your measurements —
            from fabric to finish.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <a
              href="#"
              aria-label="Instagram"
              className="h-8 w-8 rounded-full border border-[#5C1A32]/20 flex items-center justify-center text-[#4A413B] hover:text-[#5C1A32] hover:border-[#5C1A32] transition-colors"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="#"
              aria-label="Facebook"
              className="h-8 w-8 rounded-full border border-[#5C1A32]/20 flex items-center justify-center text-[#4A413B] hover:text-[#5C1A32] hover:border-[#5C1A32] transition-colors"
            >
              <Facebook className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Shop */}
        <div>
          <h3 className="text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase mb-4">
            Shop
          </h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/fabrics" className="text-[#4A413B] hover:text-[#5C1A32] transition-colors">
                Browse Fabrics
              </Link>
            </li>
            <li>
              <Link to="/custom-outfit" className="text-[#4A413B] hover:text-[#5C1A32] transition-colors">
                Customize to JOJO
              </Link>
            </li>
            <li>
              <Link to="/order-tracking" className="text-[#4A413B] hover:text-[#5C1A32] transition-colors">
                My Orders
              </Link>
            </li>
            <li>
              <Link to="/addresses" className="text-[#4A413B] hover:text-[#5C1A32] transition-colors">
                My Addresses
              </Link>
            </li>
          </ul>
        </div>

        {/* Account */}
        <div>
          <h3 className="text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase mb-4">
            Account
          </h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/profile" className="text-[#4A413B] hover:text-[#5C1A32] transition-colors">
                My Profile
              </Link>
            </li>
            <li>
              <Link to="/measurements" className="text-[#4A413B] hover:text-[#5C1A32] transition-colors">
                My Measurements
              </Link>
            </li>
            <li>
              <Link to="/login" className="text-[#4A413B] hover:text-[#5C1A32] transition-colors">
                Login
              </Link>
            </li>
            <li>
              <Link to="/signup" className="text-[#4A413B] hover:text-[#5C1A32] transition-colors">
                Sign Up
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase mb-4">
            Get In Touch
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2 text-[#4A413B]">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-[#B8935A]" />
              Bhavani, Erode District, Tamil Nadu
            </li>
            <li className="flex items-center gap-2 text-[#4A413B]">
              <Phone className="h-4 w-4 shrink-0 text-[#B8935A]" />
              <a href="tel:+910000000000" className="hover:text-[#5C1A32] transition-colors">
                +91 00000 00000
              </a>
            </li>
            <li className="flex items-center gap-2 text-[#4A413B]">
              <Mail className="h-4 w-4 shrink-0 text-[#B8935A]" />
              <a href="mailto:hello@jojoflora.com" className="hover:text-[#5C1A32] transition-colors">
                hello@jojoflora.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#5C1A32]/15">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#4A413B]/60">
            © {year} JoJo Flora. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#B8935A]" />
            <p className="text-xs text-[#4A413B]/60">
              Tailored with care, one stitch at a time.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}