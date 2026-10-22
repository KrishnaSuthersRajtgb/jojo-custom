import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Store,
  MapPin,
  Users,
  Wallet,
  ShieldCheck,
  GraduationCap,
  Boxes,
  CheckCircle2,
} from 'lucide-react';
import { franchiseApi } from '../services';

// ── Design tokens (matches Home.tsx / Navbar.tsx / FabricDetail.tsx) ───────
//   ink      #1B1512  headings, dark panel background
//   wine     #5C1A32  primary accent
//   brass    #B8935A  secondary accent — pins, rules, numerals
//   bone     #F6F1E7  page background
// Display face: Fraunces. Body face: Inter.

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };
const serifItalic = { ...serif, fontStyle: 'italic' as const };

// Same literal tailor's-tape divider used on Home — kept local since it
// isn't exported from Home.tsx.
function TapeRule({ tone = 'wine' }: { tone?: 'wine' | 'brass' }) {
  const ticks = Array.from({ length: 41 });
  const tickColor = tone === 'wine' ? 'bg-[#5C1A32]/25' : 'bg-[#B8935A]/50';
  const majorColor = tone === 'wine' ? 'bg-[#5C1A32]/50' : 'bg-[#B8935A]/80';
  return (
    <div className="w-full overflow-hidden" aria-hidden="true">
      <div className="max-w-5xl mx-auto px-6 flex items-end justify-between h-4">
        {ticks.map((_, i) => (
          <div
            key={i}
            className={`w-px ${i % 5 === 0 ? `h-3.5 ${majorColor}` : `h-1.5 ${tickColor}`}`}
          />
        ))}
      </div>
    </div>
  );
}

interface FranchiseFormState {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  investment: string;
  message: string;
}

const EMPTY_FORM: FranchiseFormState = {
  fullName: '',
  phone: '',
  email: '',
  city: '',
  investment: '',
  message: '',
};

const INVESTMENT_BANDS = ['₹5L – ₹10L', '₹10L – ₹25L', '₹25L – ₹50L', '₹50L+'];

type FormErrors = Partial<Record<keyof FranchiseFormState, string | undefined>>;
export default function Franchise() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FranchiseFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const franchiseStats = [
    { icon: <Store className="h-5 w-5" />, label: 'Outlets', value: '25+' },
    { icon: <MapPin className="h-5 w-5" />, label: 'Cities', value: '12' },
    { icon: <Users className="h-5 w-5" />, label: 'Happy Partners', value: '40+' },
  ];

  const benefits = [
    {
      icon: <Wallet className="h-5 w-5" />,
      title: 'Low Entry Investment',
      desc: 'Structured investment tiers designed to fit first-time franchise partners.',
    },
    {
      icon: <GraduationCap className="h-5 w-5" />,
      title: 'Full Training',
      desc: 'Onboarding covers tailoring standards, fabric handling, and store operations.',
    },
    {
      icon: <Boxes className="h-5 w-5" />,
      title: 'Supply Chain Support',
      desc: 'Direct access to our mill partners and swatch library from day one.',
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: 'Brand & Marketing',
      desc: 'Launch support, signage, and ongoing marketing playbooks included.',
    },
  ];

  const steps = [
    {
      mark: '01',
      title: 'Apply Online',
      desc: 'Share your city, budget, and a little about yourself below.',
    },
    {
      mark: '02',
      title: 'Discovery Call',
      desc: 'Our partnerships team walks you through fit, terms, and next steps.',
    },
    {
      mark: '03',
      title: 'Site & Setup',
      desc: 'We help you scout, design, and fit out your outlet.',
    },
    {
      mark: '04',
      title: 'Launch',
      desc: 'Trained staff, stocked shelves, and a marketing push on opening day.',
    },
  ];

  const handleChange =
    (field: keyof FranchiseFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const handleInvestmentSelect = (band: string) => {
    setForm((prev) => ({ ...prev, investment: band }));
    setErrors((prev) => ({ ...prev, investment: undefined }));
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};

    if (!form.fullName.trim()) next.fullName = 'Please enter your full name.';

    if (!form.phone.trim()) {
      next.phone = 'Please enter a phone number.';
    } else if (!/^\+?\d{10,13}$/.test(form.phone.replace(/[\s-]/g, ''))) {
      next.phone = 'Enter a valid phone number.';
    }

    if (!form.email.trim()) {
      next.email = 'Please enter an email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Enter a valid email address.';
    }

    if (!form.city.trim()) next.city = 'Please enter your city.';
    if (!form.investment) next.investment = 'Select an investment range.';

    return next;
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      await franchiseApi.submit(form);
    } catch (err) {
      console.error('Franchise submission error:', err);
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="w-full bg-[#F6F1E7] pt-16 min-h-[70vh] flex items-center">
        <section className="w-full px-6 py-16">
          <div className="max-w-md mx-auto text-center bg-white border border-[#5C1A32]/12 rounded-sm shadow-sm p-10">
            <div className="h-14 w-14 rounded-full bg-[#5C1A32]/10 text-[#5C1A32] flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="text-2xl text-[#1B1512] mb-2" style={serif}>
              Application received
            </h1>
            <p className="text-sm text-[#4A413B] mb-8 leading-relaxed">
              Thank you, {form.fullName.split(' ')[0] || 'there'}. Our partnerships team will reach
              out to <span className="font-semibold text-[#1B1512]">{form.phone}</span> within 2
              business days.
            </p>
            <button
              onClick={() => {
                void navigate('/');
              }}
              className="inline-flex items-center gap-2 bg-[#1B1512] text-[#F6F1E7] font-medium text-sm px-6 py-3 rounded-sm hover:bg-[#5C1A32] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    // pt-16 clears the fixed h-16 Navbar (z-[60])
    <div className="w-full bg-[#F6F1E7] pt-16">
      {/* ---------------- HERO ---------------- */}
      <section className="w-full px-6 pt-16 pb-14">
        <div className="max-w-4xl mx-auto text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-[#4A413B] hover:text-[#5C1A32] transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <span className="inline-block text-[11px] font-semibold tracking-[0.25em] text-[#5C1A32] uppercase mb-6">
            Partnership · Franchise
          </span>
          <h1
            className="text-[#1B1512] text-4xl md:text-5xl font-medium leading-[1.1] mb-6"
            style={serif}
          >
            Bring JoJo Flora
            <br />
            <span style={serifItalic} className="text-[#5C1A32]">
              to your city.
            </span>
          </h1>
          <p className="text-[#4A413B] text-base max-w-md mx-auto leading-relaxed">
            Low investment, full training, and end-to-end business support for the right partner in
            the right city.
          </p>
        </div>
      </section>

      <TapeRule tone="wine" />

      {/* ---------------- STATS STRIP ---------------- */}
      <section className="w-full px-6 py-14">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-8 sm:gap-14">
          {franchiseStats.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-sm border border-[#5C1A32]/25 text-[#5C1A32] flex items-center justify-center">
                {s.icon}
              </span>
              <div>
                <div className="font-semibold leading-none text-[#1B1512]" style={serif}>
                  {s.value}
                </div>
                <div className="text-xs text-[#4A413B]/60 mt-1">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <TapeRule tone="wine" />

      {/* ---------------- WHY PARTNER ---------------- */}
      <section className="w-full px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[11px] font-semibold tracking-[0.25em] text-[#5C1A32] uppercase">
              Why Partner With Us
            </span>
            <h2 className="text-3xl md:text-4xl text-[#1B1512] mt-3" style={serif}>
              Everything you need to launch
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#5C1A32]/15">
            {benefits.map((b) => (
              <div key={b.title} className="bg-[#F6F1E7] p-8">
                <span className="h-10 w-10 rounded-sm border border-[#5C1A32]/25 text-[#5C1A32] flex items-center justify-center mb-4">
                  {b.icon}
                </span>
                <h3 className="text-base font-semibold text-[#1B1512] mb-1.5">{b.title}</h3>
                <p className="text-sm text-[#4A413B] leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TapeRule tone="wine" />

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section className="w-full px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[11px] font-semibold tracking-[0.25em] text-[#5C1A32] uppercase">
              The Process
            </span>
            <h2 className="text-3xl md:text-4xl text-[#1B1512] mt-3" style={serif}>
              From application to opening day
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12">
            {steps.map((step) => (
              <div key={step.mark}>
                <span className="block text-[#B8935A] text-sm font-semibold mb-3" style={serif}>
                  {step.mark}
                </span>
                <div className="h-px w-8 bg-[#5C1A32]/30 mb-4" />
                <h3 className="text-base font-semibold text-[#1B1512] mb-1.5">{step.title}</h3>
                <p className="text-sm text-[#4A413B] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TapeRule tone="wine" />

      {/* ---------------- APPLICATION FORM ---------------- */}
      <section className="w-full px-6 py-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[11px] font-semibold tracking-[0.25em] text-[#5C1A32] uppercase">
              Apply Now
            </span>
            <h2 className="text-3xl md:text-4xl text-[#1B1512] mt-3" style={serif}>
              Tell us about you
            </h2>
          </div>

          <form
            onSubmit={(e) => {
              void handleSubmit(e);
            }}
            noValidate
            className="bg-white border border-[#5C1A32]/12 rounded-sm shadow-sm p-6 sm:p-10 space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-[11px] font-semibold tracking-[0.15em] text-[#1B1512] uppercase mb-2"
                >
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={handleChange('fullName')}
                  placeholder="Priya Subramaniam"
                  className={`w-full rounded-sm border px-3 py-2.5 text-sm text-[#1B1512] bg-[#F6F1E7] focus:outline-none focus:ring-1 transition-colors ${
                    errors.fullName
                      ? 'border-red-600 focus:ring-red-600'
                      : 'border-[#5C1A32]/20 focus:ring-[#5C1A32] focus:border-[#5C1A32]'
                  }`}
                />
                {errors.fullName && (
                  <p className="text-xs text-red-600 mt-1.5">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-[11px] font-semibold tracking-[0.15em] text-[#1B1512] uppercase mb-2"
                >
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={handleChange('phone')}
                  placeholder="+91 98765 43210"
                  className={`w-full rounded-sm border px-3 py-2.5 text-sm text-[#1B1512] bg-[#F6F1E7] focus:outline-none focus:ring-1 transition-colors ${
                    errors.phone
                      ? 'border-red-600 focus:ring-red-600'
                      : 'border-[#5C1A32]/20 focus:ring-[#5C1A32] focus:border-[#5C1A32]'
                  }`}
                />
                {errors.phone && <p className="text-xs text-red-600 mt-1.5">{errors.phone}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-[11px] font-semibold tracking-[0.15em] text-[#1B1512] uppercase mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  placeholder="priya@example.com"
                  className={`w-full rounded-sm border px-3 py-2.5 text-sm text-[#1B1512] bg-[#F6F1E7] focus:outline-none focus:ring-1 transition-colors ${
                    errors.email
                      ? 'border-red-600 focus:ring-red-600'
                      : 'border-[#5C1A32]/20 focus:ring-[#5C1A32] focus:border-[#5C1A32]'
                  }`}
                />
                {errors.email && <p className="text-xs text-red-600 mt-1.5">{errors.email}</p>}
              </div>

              <div>
                <label
                  htmlFor="city"
                  className="block text-[11px] font-semibold tracking-[0.15em] text-[#1B1512] uppercase mb-2"
                >
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  value={form.city}
                  onChange={handleChange('city')}
                  placeholder="Chennai"
                  className={`w-full rounded-sm border px-3 py-2.5 text-sm text-[#1B1512] bg-[#F6F1E7] focus:outline-none focus:ring-1 transition-colors ${
                    errors.city
                      ? 'border-red-600 focus:ring-red-600'
                      : 'border-[#5C1A32]/20 focus:ring-[#5C1A32] focus:border-[#5C1A32]'
                  }`}
                />
                {errors.city && <p className="text-xs text-red-600 mt-1.5">{errors.city}</p>}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-[0.15em] text-[#1B1512] uppercase mb-2">
                Investment Range
              </label>
              <div className="flex flex-wrap gap-2">
                {INVESTMENT_BANDS.map((band) => (
                  <button
                    key={band}
                    type="button"
                    onClick={() => {
                      handleInvestmentSelect(band);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      form.investment === band
                        ? 'bg-[#5C1A32] border-[#5C1A32] text-[#F6F1E7]'
                        : 'border-[#5C1A32]/20 text-[#4A413B] hover:border-[#5C1A32]'
                    }`}
                  >
                    {band}
                  </button>
                ))}
              </div>
              {errors.investment && (
                <p className="text-xs text-red-600 mt-2">{errors.investment}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-[11px] font-semibold tracking-[0.15em] text-[#1B1512] uppercase mb-2"
              >
                Tell us more{' '}
                <span className="text-[#4A413B]/50 normal-case tracking-normal font-normal">
                  (optional)
                </span>
              </label>
              <textarea
                id="message"
                rows={4}
                value={form.message}
                onChange={handleChange('message')}
                placeholder="Retail experience, preferred location, timeline..."
                className="w-full rounded-sm border border-[#5C1A32]/20 px-3 py-2.5 text-sm text-[#1B1512] bg-[#F6F1E7] focus:outline-none focus:ring-1 focus:ring-[#5C1A32] focus:border-[#5C1A32] transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#1B1512] text-[#F6F1E7] font-semibold text-sm py-3.5 rounded-sm hover:bg-[#5C1A32] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>

            <p className="text-xs text-[#4A413B]/50 text-center">
              By applying, you agree to be contacted by our partnerships team regarding this
              opportunity.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
