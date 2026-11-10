import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  Scissors,
  Home,
  ShieldCheck,
  Check,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';
import { FaInstagram, FaFacebook } from 'react-icons/fa';

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

export default function Footer() {
  const year = new Date().getFullYear();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newsletterEmail && /^\S+@\S+\.\S+$/.test(newsletterEmail)) {
      setSubscribed(true);
      setNewsletterEmail('');
      setTimeout(() => {
        setSubscribed(false);
      }, 4000);
    }
  };

  return (
    <footer className="w-full border-t border-[#5C1A32]/15 bg-[#F6F1E7] dark:bg-[#0E0B09] dark:border-[#5C1A32]/30 text-[#1B1512] dark:text-[#F6F1E7] transition-colors">
      {/* ── 1. ATELIER COUTURE PILLARS / PROMISES ── */}
      <div className="border-b border-[#5C1A32]/10 dark:border-white/5 bg-[#FDFBF7] dark:bg-[#120E0C]">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-full bg-[#5C1A32]/8 dark:bg-[#5C1A32]/20 text-[#5C1A32] dark:text-[#D4B37F] shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1B1512] dark:text-[#F6F1E7]">
                Pure Silk &amp; Handlooms
              </h4>
              <p className="text-[12px] text-[#6B5E54] dark:text-[#A89886] mt-1 leading-relaxed">
                100% authentic natural fibers ethically woven by master weavers across Kanchipuram
                and Banaras.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-full bg-[#5C1A32]/8 dark:bg-[#5C1A32]/20 text-[#5C1A32] dark:text-[#D4B37F] shrink-0">
              <Scissors className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1B1512] dark:text-[#F6F1E7]">
                Master Artisan Cut
              </h4>
              <p className="text-[12px] text-[#6B5E54] dark:text-[#A89886] mt-1 leading-relaxed">
                Every ensemble is individually hand-cut and tailored by a dedicated craftsman to
                your exact numbers.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-full bg-[#5C1A32]/8 dark:bg-[#5C1A32]/20 text-[#5C1A32] dark:text-[#D4B37F] shrink-0">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1B1512] dark:text-[#F6F1E7]">
                Doorstep Master Fitting
              </h4>
              <p className="text-[12px] text-[#6B5E54] dark:text-[#A89886] mt-1 leading-relaxed">
                Complimentary home measurement visits in Chennai, Coimbatore &amp; Bengaluru with
                fabric swatches.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-full bg-[#5C1A32]/8 dark:bg-[#5C1A32]/20 text-[#5C1A32] dark:text-[#D4B37F] shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1B1512] dark:text-[#F6F1E7]">
                14-Day Fit Guarantee
              </h4>
              <p className="text-[12px] text-[#6B5E54] dark:text-[#A89886] mt-1 leading-relaxed">
                Complimentary alterations and door-to-door courier service until your silhouette is
                flawless.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. VIP ATELIER CIRCLE NEWSLETTER ── */}
      <div className="border-b border-[#5C1A32]/10 dark:border-white/5 bg-[#F6F1E7] dark:bg-[#0E0B09]">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl text-center md:text-left">
            <span className="text-[10px] font-semibold tracking-[0.25em] text-[#5C1A32] dark:text-[#D4B37F] uppercase block mb-1">
              HAUTE COUTURE INSIDER
            </span>
            <h3 className="text-xl sm:text-2xl text-[#1B1512] dark:text-[#F6F1E7]" style={serif}>
              Join the Customization Atelier Circle
            </h3>
            <p className="text-xs text-[#6B5E54] dark:text-[#A89886] mt-1 font-light">
              Receive private invitations to rare seasonal handloom drops, trunk shows, and
              artisanal styling notes.
            </p>
          </div>

          <form
            onSubmit={handleSubscribe}
            className="w-full md:w-auto flex flex-col sm:flex-row gap-2 max-w-md"
          >
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => {
                setNewsletterEmail(e.target.value);
              }}
              placeholder="Enter your email address"
              required
              className="px-4 py-2.5 text-xs rounded-sm bg-white dark:bg-[#1A1411] border border-[#5C1A32]/20 dark:border-white/10 text-[#1B1512] dark:text-[#F6F1E7] focus:outline-none focus:ring-1 focus:ring-[#5C1A32] sm:w-72"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#5C1A32] hover:bg-[#431224] text-white text-xs font-semibold tracking-wider uppercase rounded-sm transition-colors shrink-0 shadow-xs"
            >
              {subscribed ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Subscribed</span>
                </>
              ) : (
                <>
                  <span>Join Atelier</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ── 3. MAIN MULTI-COLUMN DIRECTORY ── */}
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
        {/* Brand Column (2 cols on large screens) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <img src="/image.png" alt="Customization Couture" className="h-9 w-9 object-contain" />
            <div>
              <span
                className="text-xl tracking-wide text-[#1B1512] dark:text-[#F6F1E7] block"
                style={serif}
              >
                Customization
              </span>
              <span className="text-[9px] uppercase tracking-[0.3em] text-[#8A7968] dark:text-[#A89886] block">
                Couture Atelier
              </span>
            </div>
          </div>

          <p className="text-xs text-[#544B45] dark:text-[#A89886] leading-relaxed max-w-sm">
            Bespoke Indian couture tailored to perfection. Handcrafted from master handloom weaves,
            tailored to your exact body measurements, and delivered in our signature keepsake boxes.
          </p>

          <div className="pt-2 flex items-center gap-3">
            <a
              href="https://www.instagram.com/jojotailoringstudio?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram Atelier"
              className="h-8 w-8 rounded-full border border-[#5C1A32]/20 dark:border-white/10 flex items-center justify-center text-[#4A413B] dark:text-[#D8D0C5] hover:text-[#5C1A32] dark:hover:text-[#D4B37F] hover:border-[#5C1A32] transition-colors"
            >
              <FaInstagram className="h-4 w-4" />
            </a>
            <a
              href="#"
              aria-label="Facebook Atelier"
              className="h-8 w-8 rounded-full border border-[#5C1A32]/20 dark:border-white/10 flex items-center justify-center text-[#4A413B] dark:text-[#D8D0C5] hover:text-[#5C1A32] dark:hover:text-[#D4B37F] hover:border-[#5C1A32] transition-colors"
            >
              <FaFacebook className="h-4 w-4" />
            </a>
            <a
              href="https://wa.me/919597300773?text=Hello%20Customization%20Atelier,%20I%20would%20like%20assistance%20with%20my%20order."
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp Stylist Concierge"
              className="h-8 w-8 rounded-full border border-[#25D366]/40 flex items-center justify-center text-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>

          <div className="pt-2 text-[11px] text-[#8A7968] dark:text-[#887867] flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            <span>Master Tailors on duty in Gobichettipalaiyam Atelier</span>
          </div>
        </div>

        {/* Collections */}
        <div>
          <h3 className="text-[11px] font-semibold tracking-[0.25em] text-[#1B1512] dark:text-[#F6F1E7] uppercase mb-4">
            Collections
          </h3>
          <ul className="space-y-2.5 text-xs text-[#544B45] dark:text-[#A89886]">
            <li>
              <Link
                to="/fabrics"
                className="hover:text-[#5C1A32] dark:hover:text-[#D4B37F] transition-colors"
              >
                Pure Silk Library
              </Link>
            </li>
            <li>
              <Link
                to="/custom-outfit"
                className="hover:text-[#5C1A32] dark:hover:text-[#D4B37F] transition-colors"
              >
                Bespoke Garments
              </Link>
            </li>
            <li>
              <Link
                to="/style-inspirations"
                className="hover:text-[#5C1A32] dark:hover:text-[#D4B37F] transition-colors"
              >
                Editorial Mood Boards
              </Link>
            </li>
            <li>
              <Link
                to="/compare"
                className="hover:text-[#5C1A32] dark:hover:text-[#D4B37F] transition-colors"
              >
                Fabric Comparison Matrix
              </Link>
            </li>
            <li>
              <Link
                to="/custom-outfit/blouse"
                className="hover:text-[#5C1A32] dark:hover:text-[#D4B37F] transition-colors"
              >
                Designer Blouses
              </Link>
            </li>
          </ul>
        </div>

        {/* Bespoke Services */}
        <div>
          <h3 className="text-[11px] font-semibold tracking-[0.25em] text-[#1B1512] dark:text-[#F6F1E7] uppercase mb-4">
            Services
          </h3>
          <ul className="space-y-2.5 text-xs text-[#544B45] dark:text-[#A89886]">
            <li>
              <Link
                to="/measurements"
                className="hover:text-[#5C1A32] dark:hover:text-[#D4B37F] transition-colors"
              >
                Book Master Home Fitting
              </Link>
            </li>
            <li>
              <Link
                to="/order-tracking"
                className="hover:text-[#5C1A32] dark:hover:text-[#D4B37F] transition-colors"
              >
                Order Tracking &amp; Journey
              </Link>
            </li>
            <li>
              <Link
                to="/corporate-inquiry"
                className="hover:text-[#5C1A32] dark:hover:text-[#D4B37F] transition-colors"
              >
                Corporate &amp; Bulk Orders
              </Link>
            </li>
            <li>
              <Link
                to="/franchise"
                className="hover:text-[#5C1A32] dark:hover:text-[#D4B37F] transition-colors"
              >
                Franchise Opportunities
              </Link>
            </li>
            <li>
              <Link
                to="/addresses"
                className="hover:text-[#5C1A32] dark:hover:text-[#D4B37F] transition-colors"
              >
                Saved Address Book
              </Link>
            </li>
            <li>
              <Link
                to="/profile"
                className="hover:text-[#5C1A32] dark:hover:text-[#D4B37F] transition-colors"
              >
                Patron Rewards Circle
              </Link>
            </li>
          </ul>
        </div>

        {/* Flagship Atelier Contact */}
        <div>
          <h3 className="text-[11px] font-semibold tracking-[0.25em] text-[#1B1512] dark:text-[#F6F1E7] uppercase mb-4">
            Flagship Atelier
          </h3>
          <ul className="space-y-3 text-xs text-[#544B45] dark:text-[#A89886]">
            <li className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-[#B8935A]" />
              <span className="leading-relaxed">
                No 3 Erode main road, near Seethakalyana Mandapam, Gobichettipalaiyam 638476, Tamil
                Nadu.
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="h-3.5 w-3.5 shrink-0 text-[#B8935A]" />
              <a
                href="tel:+919597300773"
                className="hover:text-[#5C1A32] dark:hover:text-[#D4B37F] font-mono"
              >
                +91 95973 00773
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-3.5 w-3.5 shrink-0 text-[#B8935A]" />
              <a
                href="mailto:hello@customization.com"
                className="hover:text-[#5C1A32] dark:hover:text-[#D4B37F]"
              >
                hello@customization.com
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Clock className="h-3.5 w-3.5 shrink-0 text-[#B8935A]" />
              <span>Mon – Sat: 10:00 AM – 8:30 PM</span>
            </li>
          </ul>
        </div>
      </div>

      {/* ── 4. BOTTOM COPYRIGHT & LEGAL BAR ── */}
      <div className="border-t border-[#5C1A32]/10 dark:border-white/5 bg-[#EFE9DC] dark:bg-[#080605]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B5E54] dark:text-[#A89886]">
          <p>© {year} Customization Couture Atelier. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Handcrafted with pride in Tamil Nadu, India</span>
            <span className="h-1 w-1 rounded-full bg-[#B8935A]" />
            <Link
              to="/franchise"
              className="hover:text-[#5C1A32] dark:hover:text-[#D4B37F] transition-colors"
            >
              Partner with Us
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
