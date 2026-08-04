import { Link } from 'react-router-dom';
import { ArrowRight, Star, MapPin, Users, Store } from 'lucide-react';

// ── Design tokens ─────────────────────────────────────────────────────────
// A bespoke-tailoring identity built around the one instrument every
// custom-fit garment starts with: the measuring tape. Ink, aged brass, and
// bone — a fabric swatch card, not a SaaS gradient.
//   ink      #1B1512  headings on light, dark panel background
//   wine     #5C1A32  primary accent (replaces the old fuchsia-800)
//   brass    #B8935A  secondary accent — pins, rules, numerals
//   bone     #F6F1E7  page background
//   dustrose #C98CA0  soft tag fills
//
// Display face: Fraunces (an editorial serif with real personality).
// Body face: Inter. Add this to index.html once for the full effect —
// the stack below still reads fine on system serif/sans as a fallback.
//   <link rel="preconnect" href="https://fonts.googleapis.com">
//   <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };
const serifItalic = { ...serif, fontStyle: 'italic' as const };

// A literal tailor's tape — used as a section divider and, later, as the
// timeline itself. Ties every break in the page back to the one object
// that defines bespoke tailoring: the measure.
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

export default function Home() {
  const steps = [
    {
      mark: '01',
      title: 'Share Your Measure',
      desc: 'Send your sizes, or book a tailor to visit and take them by hand.',
    },
    {
      mark: '02',
      title: 'Choose Cloth & Cut',
      desc: 'Select from the swatch library, or bring a reference of your own.',
    },
    {
      mark: '03',
      title: 'Cut by Our Artisans',
      desc: 'Each piece is stitched and checked by hand at every stage.',
    },
    {
      mark: '04',
      title: 'Delivered, Fitted',
      desc: 'Follow the order from needle to doorstep in real time.',
    },
  ];

  const reviews = [
    {
      name: 'Priya S.',
      city: 'Chennai',
      rating: 5,
      text: 'The blouse fit perfectly on the first try. Fabric quality is genuinely premium.',
    },
    {
      name: 'Anitha R.',
      city: 'Coimbatore',
      rating: 5,
      text: 'Loved how easy it was to customize the kurti. Delivery was faster than I expected.',
    },
    {
      name: 'Divya K.',
      city: 'Bengaluru',
      rating: 4,
      text: 'Great tailoring and support team. Will definitely order again for the festive season.',
    },
  ];

  // Day-position on an 8-day tape. "day" is where each stage's marker sits.
  const stages = [
    { label: 'Order Confirmed', day: 0 },
    { label: 'Stitching in Progress', day: 1 },
    { label: 'Quality Check', day: 5 },
    { label: 'Shipped', day: 6 },
    { label: 'Delivered', day: 8 },
  ];
  const TAPE_MAX = 8;

  const franchiseStats = [
    { icon: <Store className="h-5 w-5" />, label: 'Outlets', value: '25+' },
    { icon: <MapPin className="h-5 w-5" />, label: 'Cities', value: '12' },
    { icon: <Users className="h-5 w-5" />, label: 'Happy Partners', value: '40+' },
  ];

  return (
    <div className="w-full bg-[#F6F1E7]">
      {/* ---------------- HERO ---------------- */}
      <section className="w-full px-6 pt-20 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block text-[11px] font-semibold tracking-[0.25em] text-[#5C1A32] uppercase mb-6">
            Bespoke Tailoring · Cut to Your Measure
          </span>
          <h1
            className="text-[#1B1512] text-5xl md:text-6xl font-medium leading-[1.08] mb-6"
            style={serif}
          >
            Every stitch,
            <br />
            <span style={serifItalic} className="text-[#5C1A32]">
              measured for you.
            </span>
          </h1>
          <p className="text-[#4A413B] text-base max-w-md mx-auto mb-10 leading-relaxed">
            Fine fabrics, precise fits, and hand-finished craftsmanship — carried from our tailor's
            bench to your door.
          </p>
          <Link
            to="/custom-outfit"
            className="inline-flex items-center gap-2 bg-[#1B1512] text-[#F6F1E7] font-medium text-sm px-7 py-3.5 rounded-sm hover:bg-[#5C1A32] transition-colors"
          >
            Begin Your Fitting
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <TapeRule tone="wine" />

      {/* ---------------- FEATURE PANELS ---------------- */}
      <section className="w-full px-6 py-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-px bg-[#5C1A32]/15">
          <Link
            to="/custom-outfit"
            className="group bg-[#1B1512] p-10 md:p-12 flex flex-col text-[#F6F1E7]"
          >
            <span className="text-[11px] font-semibold tracking-[0.25em] text-[#B8935A] uppercase mb-6">
              The Atelier
            </span>
            <h3 className="text-3xl mb-3" style={serif}>
              Custom Outfit
            </h3>
            <p className="text-[#F6F1E7]/70 text-sm leading-relaxed mb-8">
              Design a blouse, kurti, or palazzo from a blank page. Share your measurements and let
              our artisans craft the fit.
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {['Blouse', 'Kurti', 'Pant'].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full border border-[#B8935A]/40 text-[#B8935A] text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
            <span className="mt-auto inline-flex items-center gap-1.5 font-semibold text-sm group-hover:gap-2.5 transition-all">
              Start Customizing
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>

          <Link to="/fabrics" className="group bg-[#F6F1E7] p-10 md:p-12 flex flex-col">
            <span className="text-[11px] font-semibold tracking-[0.25em] text-[#5C1A32] uppercase mb-6">
              The Swatch Library
            </span>
            <h3 className="text-3xl text-[#1B1512] mb-3" style={serif}>
              Fabric &amp; Material
            </h3>
            <p className="text-[#4A413B] text-sm leading-relaxed mb-8">
              Browse silks, cottons, and georgettes drawn from our own mill partners. Filter by
              warm, cool, or neutral tone.
            </p>
            <div className="flex items-center gap-1.5 mb-8">
              {['bg-red-900', 'bg-blue-700', 'bg-stone-300', 'bg-indigo-950', 'bg-yellow-600'].map(
                (c, i) => (
                  <span
                    key={i}
                    className={`h-6 w-4 rounded-[2px] border border-black/10 shadow-sm ${c}`}
                    style={{ transform: `rotate(${String(i % 2 === 0 ? -4 : 4)}deg)` }}
                  />
                ),
              )}
              <span className="text-xs text-[#4A413B]/60 ml-2">9 fabrics</span>
            </div>
            <span className="mt-auto inline-flex items-center gap-1.5 text-[#5C1A32] font-semibold text-sm group-hover:gap-2.5 transition-all">
              Explore Fabrics
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
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
              From cloth to fit
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12">
            {steps.map((step) => (
              <div key={step.mark} className="relative pl-0">
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

      {/* ---------------- REVIEWS ---------------- */}
      <section className="w-full px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[11px] font-semibold tracking-[0.25em] text-[#5C1A32] uppercase">
              In Their Words
            </span>
            <h2 className="text-3xl md:text-4xl text-[#1B1512] mt-3" style={serif}>
              What our customers say
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reviews.map((r) => (
              <div key={r.name} className="text-left">
                <span className="block text-5xl text-[#B8935A] leading-none mb-2" style={serif}>
                  &ldquo;
                </span>
                <p className="text-[#2A211D] text-[15px] leading-relaxed mb-5 -mt-4">{r.text}</p>
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < r.rating ? 'fill-[#B8935A] text-[#B8935A]' : 'text-[#5C1A32]/15'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-[#1B1512]">{r.name}</span>
                  <span className="text-[#4A413B]/60"> · {r.city}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TapeRule tone="wine" />

      {/* ---------------- DELIVERY TIMELINE (the tape, made literal) ------- */}
      <section className="w-full px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[11px] font-semibold tracking-[0.25em] text-[#5C1A32] uppercase">
              Measured in Days, Not Guesses
            </span>
            <h2 className="text-3xl md:text-4xl text-[#1B1512] mt-3" style={serif}>
              How delivery works
            </h2>
          </div>

          {/* Desktop: stages pinned along an actual tape, at their day mark */}
          <div className="hidden md:block relative pt-10 pb-2">
            <div className="absolute left-0 right-0 top-[52px] h-px bg-[#5C1A32]/25" />
            {Array.from({ length: TAPE_MAX + 1 }).map((_, day) => (
              <div
                key={day}
                className="absolute top-[46px] flex flex-col items-center"
                style={{
                  left: `${String((day / TAPE_MAX) * 100)}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="w-px h-3 bg-[#5C1A32]/40" />
                <span className="mt-1 text-[10px] tabular-nums text-[#4A413B]/50">{day}</span>
              </div>
            ))}
            {stages.map((stage) => (
              <div
                key={stage.label}
                className="absolute flex flex-col items-center"
                style={{
                  left: `${String((stage.day / TAPE_MAX) * 100)}%`,
                  top: 0,
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="text-center mb-2 w-28">
                  <div className="text-xs font-semibold text-[#1B1512] leading-tight">
                    {stage.label}
                  </div>
                </div>
                <div className="h-8 w-px bg-[#B8935A]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#B8935A] ring-4 ring-[#F6F1E7]" />
              </div>
            ))}
          </div>

          {/* Mobile: simple vertical list */}
          <div className="md:hidden space-y-6">
            {stages.map((stage) => (
              <div key={stage.label} className="flex items-center gap-4">
                <div className="h-2.5 w-2.5 rounded-full bg-[#B8935A] shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-[#1B1512]">{stage.label}</div>
                  <div className="text-xs text-[#4A413B]/60">Day {stage.day}</div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-[#4A413B]/50 mt-14">
            Estimated timelines vary by outfit type and city. Live tracking available from the
            Orders page once shipped.
          </p>
        </div>
      </section>

      {/* ---------------- FRANCHISE ---------------- */}
      <section className="w-full px-6 py-20">
        <div className="max-w-5xl mx-auto bg-[#1B1512] text-[#F6F1E7] p-10 md:p-16 flex flex-col md:flex-row items-start justify-between gap-10">
          <div className="max-w-lg">
            <span className="text-[11px] font-semibold tracking-[0.25em] text-[#B8935A] uppercase">
              Partnership
            </span>
            <h2 className="text-3xl md:text-4xl mt-3 mb-4" style={serif}>
              Bring JoJo Flora to your city
            </h2>
            <p className="text-[#F6F1E7]/70 text-sm leading-relaxed mb-8">
              Low investment, full training, and end-to-end business support for the right partner
              in the right city.
            </p>
            <Link
              to="/franchise"
              className="inline-flex items-center gap-2 bg-[#B8935A] text-[#1B1512] font-semibold text-sm px-6 py-3 rounded-sm hover:bg-[#c9a66d] transition-colors"
            >
              Apply for Franchise
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-8 md:gap-10 md:pt-2">
            {franchiseStats.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-sm border border-[#B8935A]/40 text-[#B8935A] flex items-center justify-center">
                  {s.icon}
                </span>
                <div>
                  <div className="font-semibold leading-none" style={serif}>
                    {s.value}
                  </div>
                  <div className="text-xs text-[#F6F1E7]/60 mt-1">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
