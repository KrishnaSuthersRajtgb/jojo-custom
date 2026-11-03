import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Pencil,
  Save,
  X,
  CheckCircle2,
  Heart,
  Trash2,
  Gift,
  Copy,
  Check,
  Share2,
  Ruler,
  Package,
  MapPin,
  Sparkles,
  ShieldCheck,
  MessageCircle,
  ChevronRight,
} from 'lucide-react';
import SEOMeta from '../components/SEOMeta';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { referralService, type ReferralStats } from '../services';

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { wishlist, removeFromWishlist } = useWishlist();

  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [gender, setGender] = useState(user?.gender ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? '');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    referralService
      .getStats()
      .then((data) => {
        setReferralStats(data);
      })
      .catch(() => {
        if (user) {
          setReferralStats({
            referralCode:
              user.referralCode || `JOJO-${user.username.slice(0, 4).toUpperCase()}-1001`,
            referralCount: user.referralCount || 0,
            loyaltyCredits: user.loyaltyCredits || 0,
            referredBy: user.referredBy || null,
          });
        }
      });
  }, [user]);

  if (!user) return null;

  const startEditing = () => {
    setUsername(user.username);
    setEmail(user.email);
    setGender(user.gender);
    setPhoneNumber(user.phoneNumber);
    setError('');
    setSaved(false);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setError('');
  };

  const handleSave = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!username || !email || !gender || !phoneNumber) {
      setError('Please fill in all fields.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!/^\d{10}$/.test(phoneNumber)) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setSubmitting(true);
    try {
      await updateProfile({ username, email, gender, phoneNumber });
      setEditing(false);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const referralCode =
    referralStats?.referralCode ||
    user.referralCode ||
    `JOJO-${user.username.slice(0, 4).toUpperCase()}-1001`;
  const loyaltyCredits = referralStats?.loyaltyCredits ?? user.loyaltyCredits ?? 0;
  const referralCount = referralStats?.referralCount ?? user.referralCount ?? 0;

  const shareText = encodeURIComponent(
    `Experience bespoke Indian couture with JoJo Flora! Use my patron code *${referralCode}* to receive ₹200 off your first bespoke outfit: ${window.location.origin}/signup`,
  );

  return (
    <div className="w-full bg-[#FAF7F2] dark:bg-[#0E0B09] min-h-[calc(100vh-7rem)] py-10 sm:py-14 px-4 sm:px-6 lg:px-8 transition-colors">
      <SEOMeta
        title="My Profile | JoJo Flora Couture"
        description="Manage your bespoke atelier profile, contact details, loyalty rewards, and custom fitting preferences."
      />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* ── TOP HEADER / EDITORIAL BANNER ── */}
        <div className="relative overflow-hidden rounded-sm bg-gradient-to-r from-[#1B1512] via-[#2A1E24] to-[#5C1A32] text-white p-6 sm:p-10 shadow-sm border border-[#5C1A32]/30">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 pointer-events-none opacity-10">
            <span className="text-[180px] font-serif leading-none select-none">J</span>
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="h-18 w-18 sm:h-20 sm:w-20 rounded-full border-2 border-[#B8935A] bg-[#1B1512]/60 shadow-md flex items-center justify-center shrink-0">
                <span className="text-3xl sm:text-4xl text-[#B8935A]" style={serif}>
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[10px] tracking-[0.28em] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-[#B8935A]/20 text-[#D4B37F] border border-[#B8935A]/30">
                    {user.role === 'admin' ? 'Atelier Master Admin' : 'Couture Patron'}
                  </span>
                  <span className="text-xs text-[#F6F1E7]/60">
                    Client #{user.username.slice(0, 6).toUpperCase()}
                  </span>
                </div>
                <h1
                  className="text-2xl sm:text-3xl lg:text-4xl text-[#F6F1E7] font-normal mt-1.5"
                  style={serif}
                >
                  {user.username}
                </h1>
                <p className="text-xs text-[#F6F1E7]/70 mt-0.5 font-light">
                  {user.email} &bull; +91 {user.phoneNumber}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <Link
                to="/order-tracking"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm bg-white/10 hover:bg-white/20 text-[#F6F1E7] text-xs font-semibold tracking-wider uppercase border border-white/15 transition-all"
              >
                <Package className="h-3.5 w-3.5 text-[#B8935A]" />
                Track Orders
              </Link>
              <Link
                to="/measurements"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm bg-[#B8935A] hover:bg-[#A37E47] text-[#1B1512] text-xs font-semibold tracking-wider uppercase transition-all shadow-sm"
              >
                <Ruler className="h-3.5 w-3.5" />
                My Measurements
              </Link>
            </div>
          </div>
        </div>

        {/* ── 2-COLUMN ASYMMETRIC GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ════════ LEFT COLUMN: CLIENT DOSSIER & REWARDS (4 COLS) ════════ */}
          <div className="lg:col-span-4 space-y-6">
            {/* Patron Membership & Rewards Summary */}
            <div className="bg-white dark:bg-[#15100D] border border-[#5C1A32]/15 dark:border-[#5C1A32]/30 rounded-sm p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#5C1A32]/10 dark:border-[#5C1A32]/20 mb-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#B8935A]" />
                  <h2 className="text-[11px] font-semibold tracking-[0.25em] text-[#1B1512] dark:text-[#F6F1E7] uppercase">
                    Patron Circle
                  </h2>
                </div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                  Active
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 mb-6">
                <div className="bg-[#FAF7F2] dark:bg-[#1B1512] border border-[#5C1A32]/10 dark:border-white/5 p-3 rounded-sm text-center">
                  <span className="text-[9px] font-semibold tracking-wider text-[#8A7968] dark:text-[#A89886] uppercase block truncate">
                    Credits
                  </span>
                  <span
                    className="text-lg font-normal text-[#5C1A32] dark:text-[#D4B37F] mt-1 block font-mono"
                    style={serif}
                  >
                    ₹{loyaltyCredits}
                  </span>
                  <span className="text-[8px] text-emerald-700 dark:text-emerald-400 font-medium">
                    Ready
                  </span>
                </div>

                <div className="bg-[#FAF7F2] dark:bg-[#1B1512] border border-[#5C1A32]/10 dark:border-white/5 p-3 rounded-sm text-center">
                  <span className="text-[9px] font-semibold tracking-wider text-[#8A7968] dark:text-[#A89886] uppercase block truncate">
                    Invited
                  </span>
                  <span
                    className="text-lg font-normal text-[#1B1512] dark:text-[#F6F1E7] mt-1 block font-mono"
                    style={serif}
                  >
                    {referralCount}
                  </span>
                  <span className="text-[8px] text-[#8A7968] dark:text-[#A89886]">Patrons</span>
                </div>

                <div className="bg-[#FAF7F2] dark:bg-[#1B1512] border border-[#5C1A32]/10 dark:border-white/5 p-3 rounded-sm text-center">
                  <span className="text-[9px] font-semibold tracking-wider text-[#8A7968] dark:text-[#A89886] uppercase block truncate">
                    Wishlist
                  </span>
                  <span
                    className="text-lg font-normal text-[#1B1512] dark:text-[#F6F1E7] mt-1 block font-mono"
                    style={serif}
                  >
                    {wishlist.length}
                  </span>
                  <span className="text-[8px] text-[#8A7968] dark:text-[#A89886]">Saved</span>
                </div>
              </div>

              {/* Exclusive Referral Code */}
              <div className="rounded-sm border border-[#B8935A]/30 bg-[#FAF7F2] dark:bg-[#1A1411] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold tracking-widest text-[#1B1512] dark:text-[#F6F1E7] uppercase flex items-center gap-1.5">
                    <Gift className="h-3 w-3 text-[#B8935A]" />
                    Referral Code
                  </label>
                  <span className="text-[10px] text-[#5C1A32] dark:text-[#D4B37F] font-semibold">
                    Earn ₹200 Each
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white dark:bg-[#15100D] border border-[#5C1A32]/20 dark:border-white/10 px-3 py-2 rounded-sm font-mono text-xs font-bold tracking-wider text-[#5C1A32] dark:text-[#D4B37F] select-all truncate">
                    {referralCode}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (referralCode) {
                        void navigator.clipboard.writeText(referralCode);
                        setCopiedCode(true);
                        setTimeout(() => {
                          setCopiedCode(false);
                        }, 2500);
                      }
                    }}
                    className="px-3 py-2 bg-[#1B1512] dark:bg-[#2A1E24] hover:bg-[#5C1A32] text-white text-[11px] font-semibold rounded-sm transition-colors inline-flex items-center gap-1 shrink-0"
                    title="Copy Referral Code"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 text-[#B8935A]" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <a
                  href={`https://wa.me/?text=${shareText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-[11px] font-semibold rounded-sm transition-colors shadow-xs"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Invite Friends via WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Quick Atelier Navigation Hub */}
            <div className="bg-white dark:bg-[#15100D] border border-[#5C1A32]/15 dark:border-[#5C1A32]/30 rounded-sm p-5 shadow-xs">
              <h3 className="text-[11px] font-semibold tracking-[0.25em] text-[#1B1512] dark:text-[#F6F1E7] uppercase mb-3">
                Atelier Services
              </h3>
              <div className="divide-y divide-[#5C1A32]/10 dark:divide-white/5 text-xs">
                <Link
                  to="/addresses"
                  className="flex items-center justify-between py-2.5 text-[#4A413B] dark:text-[#D8D0C5] hover:text-[#5C1A32] dark:hover:text-[#D4B37F] transition-colors group"
                >
                  <span className="flex items-center gap-2.5">
                    <MapPin className="h-3.5 w-3.5 text-[#B8935A]" />
                    Saved Delivery Addresses
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#8A7968] group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  to="/measurements"
                  className="flex items-center justify-between py-2.5 text-[#4A413B] dark:text-[#D8D0C5] hover:text-[#5C1A32] dark:hover:text-[#D4B37F] transition-colors group"
                >
                  <span className="flex items-center gap-2.5">
                    <Ruler className="h-3.5 w-3.5 text-[#B8935A]" />
                    Master Tailor Measurement Dossier
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#8A7968] group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  to="/style-inspirations"
                  className="flex items-center justify-between py-2.5 text-[#4A413B] dark:text-[#D8D0C5] hover:text-[#5C1A32] dark:hover:text-[#D4B37F] transition-colors group"
                >
                  <span className="flex items-center gap-2.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#B8935A]" />
                    Style Inspirations &amp; Mood Boards
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#8A7968] group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  to="/corporate-inquiry"
                  className="flex items-center justify-between py-2.5 text-[#4A413B] dark:text-[#D8D0C5] hover:text-[#5C1A32] dark:hover:text-[#D4B37F] transition-colors group"
                >
                  <span className="flex items-center gap-2.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#B8935A]" />
                    Corporate &amp; Bulk Orders
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#8A7968] group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Master Stylist Support Card */}
            <div className="bg-gradient-to-br from-[#FAF7F2] to-[#F1ECE1] dark:from-[#1A1411] dark:to-[#120E0C] border border-[#B8935A]/30 p-5 rounded-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#5C1A32] text-[#B8935A] rounded-full shrink-0">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#1B1512] dark:text-[#F6F1E7]">
                    Need Bespoke Fitting Advice?
                  </h4>
                  <p className="text-[11px] text-[#544B45] dark:text-[#A89886] mt-0.5 leading-relaxed">
                    Our master tailor in Chennai is available to consult on fabric drape, embroidery
                    &amp; necklines.
                  </p>
                  <a
                    href="https://wa.me/919597300773?text=Hello%20JoJo%20Flora%20Atelier,%20I%20would%20like%20guidance%20on%20my%20bespoke%20fit."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C1A32] dark:text-[#D4B37F] hover:underline mt-2.5"
                  >
                    Chat with Concierge &rarr;
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* ════════ RIGHT COLUMN: ACCOUNT SPECS & WISHLIST GRID (8 COLS) ════════ */}
          <div className="lg:col-span-8 space-y-8">
            {/* 1. Account Details Card */}
            <div className="bg-white dark:bg-[#15100D] border border-[#5C1A32]/15 dark:border-[#5C1A32]/30 rounded-sm shadow-xs">
              <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-[#5C1A32]/10 dark:border-[#5C1A32]/20">
                <div className="flex items-center gap-2.5">
                  <User className="h-4 w-4 text-[#5C1A32] dark:text-[#D4B37F]" />
                  <h2 className="text-[11px] font-semibold tracking-[0.25em] text-[#1B1512] dark:text-[#F6F1E7] uppercase">
                    Client Specifications
                  </h2>
                </div>
                {!editing && (
                  <button
                    onClick={startEditing}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-[#5C1A32] dark:text-[#D4B37F] hover:opacity-75 transition-opacity px-3 py-1.5 border border-[#5C1A32]/20 dark:border-[#B8935A]/30 rounded-sm"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit Profile
                  </button>
                )}
              </div>

              <div className="p-6 sm:p-8">
                {saved && !editing && (
                  <div className="mb-6 inline-flex items-center gap-2 border border-emerald-600/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs px-3.5 py-2 rounded-sm w-full">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Your client specifications have been updated successfully.</span>
                  </div>
                )}

                {error && (
                  <div className="mb-6 border border-red-500/30 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-xs px-3.5 py-2 rounded-sm">
                    {error}
                  </div>
                )}

                {editing ? (
                  <form
                    onSubmit={(e) => {
                      void handleSave(e);
                    }}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-semibold tracking-[0.2em] text-[#1B1512] dark:text-[#F6F1E7] uppercase mb-1.5">
                          Full Name / Username
                        </label>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => {
                            setUsername(e.target.value);
                          }}
                          className="w-full rounded-sm border border-[#5C1A32]/20 dark:border-white/10 bg-[#FAF7F2] dark:bg-[#1B1512] px-3.5 py-2.5 text-xs text-[#1B1512] dark:text-[#F6F1E7] focus:outline-none focus:ring-1 focus:ring-[#5C1A32]"
                          placeholder="Your Name"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold tracking-[0.2em] text-[#1B1512] dark:text-[#F6F1E7] uppercase mb-1.5">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                          }}
                          className="w-full rounded-sm border border-[#5C1A32]/20 dark:border-white/10 bg-[#FAF7F2] dark:bg-[#1B1512] px-3.5 py-2.5 text-xs text-[#1B1512] dark:text-[#F6F1E7] focus:outline-none focus:ring-1 focus:ring-[#5C1A32]"
                          placeholder="your.email@example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold tracking-[0.2em] text-[#1B1512] dark:text-[#F6F1E7] uppercase mb-1.5">
                          Gender Preference
                        </label>
                        <div className="flex gap-2">
                          {['Female', 'Male', 'Other'].map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => {
                                setGender(g);
                              }}
                              className={`flex-1 px-3 py-2 rounded-sm text-xs font-medium border transition-colors ${
                                gender === g
                                  ? 'bg-[#1B1512] dark:bg-[#5C1A32] border-[#1B1512] dark:border-[#5C1A32] text-[#F6F1E7]'
                                  : 'border-[#5C1A32]/20 dark:border-white/10 text-[#4A413B] dark:text-[#D8D0C5] hover:border-[#5C1A32]'
                              }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold tracking-[0.2em] text-[#1B1512] dark:text-[#F6F1E7] uppercase mb-1.5">
                          Phone Number (10 Digits)
                        </label>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => {
                            setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
                          }}
                          className="w-full rounded-sm border border-[#5C1A32]/20 dark:border-white/10 bg-[#FAF7F2] dark:bg-[#1B1512] px-3.5 py-2.5 text-xs text-[#1B1512] dark:text-[#F6F1E7] focus:outline-none focus:ring-1 focus:ring-[#5C1A32]"
                          placeholder="9876543210"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-3">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#5C1A32] hover:bg-[#431224] text-white font-semibold text-xs py-2.5 px-6 transition-colors disabled:opacity-60 uppercase tracking-wider"
                      >
                        <Save className="h-3.5 w-3.5" />
                        {submitting ? 'Saving...' : 'Save Profile'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-[#5C1A32]/20 dark:border-white/10 text-[#4A413B] dark:text-[#D8D0C5] font-semibold text-xs py-2.5 px-5 hover:border-[#5C1A32] transition-colors uppercase tracking-wider"
                      >
                        <X className="h-3.5 w-3.5" />
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
                    <div className="border-b sm:border-b-0 pb-3 sm:pb-0 border-[#5C1A32]/10 dark:border-white/5">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8A7968] dark:text-[#A89886] block">
                        Full Name
                      </span>
                      <span className="text-sm font-semibold text-[#1B1512] dark:text-[#F6F1E7] mt-1 block">
                        {user.username}
                      </span>
                    </div>

                    <div className="border-b sm:border-b-0 pb-3 sm:pb-0 border-[#5C1A32]/10 dark:border-white/5">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8A7968] dark:text-[#A89886] block">
                        Email Address
                      </span>
                      <span className="text-sm font-semibold text-[#1B1512] dark:text-[#F6F1E7] mt-1 block">
                        {user.email}
                      </span>
                    </div>

                    <div className="border-b sm:border-b-0 pb-3 sm:pb-0 border-[#5C1A32]/10 dark:border-white/5">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8A7968] dark:text-[#A89886] block">
                        Gender Silhouette
                      </span>
                      <span className="text-sm font-semibold text-[#1B1512] dark:text-[#F6F1E7] mt-1 block">
                        {user.gender}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8A7968] dark:text-[#A89886] block">
                        Contact Phone
                      </span>
                      <span className="text-sm font-semibold text-[#1B1512] dark:text-[#F6F1E7] mt-1 block">
                        +91 {user.phoneNumber}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. My Wishlist Section */}
            <div className="bg-white dark:bg-[#15100D] border border-[#5C1A32]/15 dark:border-[#5C1A32]/30 rounded-sm p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#5C1A32]/10 dark:border-[#5C1A32]/20 mb-6">
                <div className="flex items-center gap-2.5">
                  <Heart className="h-4 w-4 text-[#5C1A32] fill-[#5C1A32] dark:text-[#D4B37F] dark:fill-[#D4B37F]" />
                  <h2 className="text-[11px] font-semibold tracking-[0.25em] text-[#1B1512] dark:text-[#F6F1E7] uppercase">
                    Couture Fabric Wishlist ({wishlist.length})
                  </h2>
                </div>
                <Link
                  to="/fabrics"
                  className="text-xs text-[#5C1A32] dark:text-[#D4B37F] hover:underline font-semibold"
                >
                  Browse Swatch Library &rarr;
                </Link>
              </div>

              {wishlist.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[#5C1A32]/20 dark:border-white/10 rounded-sm bg-[#FAF7F2]/50 dark:bg-[#1B1512]/30">
                  <Heart className="h-8 w-8 text-[#5C1A32]/30 dark:text-[#B8935A]/30 mx-auto mb-2" />
                  <p className="text-sm font-medium text-[#1B1512] dark:text-[#F6F1E7]">
                    No swatches saved yet
                  </p>
                  <p className="text-xs text-[#4A413B]/70 dark:text-[#A89886] mt-1 mb-4 max-w-sm mx-auto">
                    Explore our Kanchipuram silks, Banarasi weaves, and mulmul linens to bookmark
                    your favorites.
                  </p>
                  <Link
                    to="/fabrics"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#5C1A32] text-white text-xs font-semibold rounded-sm hover:bg-[#431224] transition-colors uppercase tracking-wider"
                  >
                    Discover Fabrics
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {wishlist.map((item) => (
                    <div
                      key={item.fabricId}
                      className="group relative bg-[#FAF7F2] dark:bg-[#1B1512] border border-[#5C1A32]/15 dark:border-white/5 rounded-sm p-4 flex flex-col justify-between hover:border-[#5C1A32] dark:hover:border-[#B8935A] transition-all shadow-xs"
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          className="w-14 h-14 rounded-sm shrink-0 border border-black/10 shadow-xs relative overflow-hidden"
                          style={{ backgroundColor: item.hex }}
                        >
                          <span className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/fabrics/${item.tone}/${item.fabricId}`}
                            className="text-xs font-bold text-[#1B1512] dark:text-[#F6F1E7] hover:text-[#5C1A32] dark:hover:text-[#D4B37F] truncate block"
                          >
                            {item.fabricName}
                          </Link>
                          <p className="text-[10px] text-[#4A413B] dark:text-[#A89886] uppercase tracking-wider mt-0.5">
                            {item.tone} Palette
                          </p>
                          <p className="text-xs font-semibold text-[#5C1A32] dark:text-[#D4B37F] mt-1 font-mono">
                            ₹{item.pricePerMeter}
                            <span className="text-[10px] font-normal text-[#8A7968]"> / meter</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#5C1A32]/10 dark:border-white/5 text-xs">
                        <Link
                          to={`/fabrics/${item.tone}/${item.fabricId}`}
                          className="text-[11px] font-semibold text-[#5C1A32] dark:text-[#D4B37F] hover:underline"
                        >
                          Customize &rarr;
                        </Link>
                        <button
                          type="button"
                          onClick={() => void removeFromWishlist(item.fabricId)}
                          className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 dark:text-red-400 transition-colors"
                          title="Remove from wishlist"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
