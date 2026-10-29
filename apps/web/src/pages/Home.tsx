import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Star,
  MapPin,
  Users,
  Store,
  Scissors,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import CoutureVideoReel from '../components/CoutureVideoReel';

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };
const serifItalic = { ...serif, fontStyle: 'italic' as const };

function TapeRule({ tone = 'wine' }: { tone?: 'wine' | 'brass' }) {
  const ticks = Array.from({ length: 41 });
  const tickColor = tone === 'wine' ? 'bg-[#5C1A32]/25' : 'bg-[#B8935A]/50';
  const majorColor = tone === 'wine' ? 'bg-[#5C1A32]/50' : 'bg-[#B8935A]/80';
  return (
    <div className="w-full overflow-hidden bg-transparent" aria-hidden="true">
      <div className="max-w-6xl mx-auto px-6 flex items-end justify-between h-5">
        {ticks.map((_, i) => (
          <div
            key={i}
            className={`w-px ${i % 5 === 0 ? `h-4 ${majorColor}` : `h-2 ${tickColor}`}`}
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
      desc: 'Submit your exact numbers online, or book a master tailor to visit your home with fabric swatches.',
    },
    {
      mark: '02',
      title: 'Select Pure Silk & Silhouette',
      desc: 'Browse our curated swatch library of Kanchipuram, Banarasi, and Chanderi weaves, or upload reference sketches.',
    },
    {
      mark: '03',
      title: 'Cut by Master Artisans',
      desc: 'A single dedicated artisan hand-cuts, embroiders with genuine zari, and checks the fall stitch-by-stitch.',
    },
    {
      mark: '04',
      title: 'Delivered & Fitted',
      desc: 'Hand-delivered in our signature couture box with complimentary alteration guarantee within 14 days.',
    },
  ];

  const reviews = [
    {
      name: 'Priya Sundaram',
      city: 'Poes Garden, Chennai',
      rating: 5,
      text: 'The Kasavu blouse fit like second skin on the first wear. The gold embroidery detailing around the neckline received countless compliments at my reception.',
    },
    {
      name: 'Anitha Rajendran',
      city: 'RS Puram, Coimbatore',
      rating: 5,
      text: 'Having a master tailor come home with fabric samples made custom bridal tailoring an effortless luxury. Their zardozi craftsmanship is top tier.',
    },
    {
      name: 'Divya Krishnan',
      city: 'Indiranagar, Bengaluru',
      rating: 5,
      text: 'From the lining to the hand-finished piping, the quality rivals classic couture houses. Tracking the garment through stitching was reassuring.',
    },
  ];

  const stages = [
    { label: 'Order Confirmed', day: 0 },
    { label: 'Master Pattern Cut', day: 1 },
    { label: 'Hand Embroidery', day: 3 },
    { label: 'Stitching & Quality', day: 5 },
    { label: 'Couture Dispatched', day: 7 },
    { label: 'Doorstep Fitting', day: 8 },
  ];
  const TAPE_MAX = 8;

  const franchiseStats = [
    { icon: <Store className="h-5 w-5" />, label: 'Bespoke Lounges', value: '25+' },
    { icon: <MapPin className="h-5 w-5" />, label: 'Tier 1 Cities', value: '12' },
    { icon: <Users className="h-5 w-5" />, label: 'Master Tailors', value: '140+' },
  ];

  return (
    <div className="w-full bg-[#FAF7F2] text-[#1B1512] selection:bg-[#5C1A32] selection:text-[#FAF7F2]">
      {/* ---------------- 1. EDITORIAL COUTURE HERO (100000 Lakhs Luxury Aesthetic) ---------------- */}
      <section
        className="w-full px-6 sm:px-10 lg:px-16 pt-12 pb-20 relative overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(#d3c9ba 0.9px, transparent 0.9px)',
          backgroundSize: '20px 20px',
        }}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* Left Column: Couture Typography & CTAs */}
          <div className="lg:col-span-7 space-y-8 z-10">
            <div className="inline-flex items-center gap-3">
              <span className="w-6 h-px bg-[#5C1A32]" />
              <span className="text-[11px] font-semibold tracking-[0.28em] text-[#5C1A32] uppercase">
                THE BESPOKE ATELIER · EST. CHENNAI
              </span>
            </div>

            <h1
              className="text-[#1B1512] text-5xl sm:text-6xl md:text-7xl lg:text-[76px] xl:text-[84px] font-normal leading-[1.02] tracking-tight"
              style={serif}
            >
              Couture,
              <br />
              <span style={serifItalic} className="text-[#B8935A] font-normal">
                cut for
              </span>
              <br />
              you alone.
            </h1>

            <p className="text-[#544B45] text-base sm:text-lg max-w-lg leading-relaxed font-sans font-light">
              Hand-tailored blouses, lehangas and sarees in the finest Indian silks — stitched to
              your exact measure by master artisans.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/custom-outfit"
                className="group inline-flex items-center gap-3 bg-[#5C1A32] text-[#FAF7F2] text-xs font-semibold tracking-[0.18em] uppercase px-8 py-4.5 shadow-md hover:bg-[#451325] hover:shadow-lg transition-all duration-300"
              >
                Begin Your Design
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/fabrics"
                className="inline-flex items-center text-[#1B1512] text-xs font-semibold tracking-[0.18em] uppercase px-8 py-4.5 border border-[#1B1512]/35 bg-white/40 hover:bg-white hover:border-[#1B1512] transition-all duration-300"
              >
                Explore Fabrics
              </Link>
            </div>

            {/* Metrics Counter Bar */}
            <div className="grid grid-cols-3 gap-6 pt-10 border-t border-[#5C1A32]/15 max-w-lg">
              <div>
                <div className="text-3xl sm:text-4xl font-normal text-[#1B1512]" style={serif}>
                  12k+
                </div>
                <div className="text-[10px] font-semibold tracking-[0.2em] text-[#544B45] uppercase mt-1">
                  Garments Crafted
                </div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-normal text-[#1B1512]" style={serif}>
                  4.9
                </div>
                <div className="text-[10px] font-semibold tracking-[0.2em] text-[#544B45] uppercase mt-1">
                  Client Rating
                </div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-normal text-[#1B1512]" style={serif}>
                  1,200
                </div>
                <div className="text-[10px] font-semibold tracking-[0.2em] text-[#544B45] uppercase mt-1">
                  Fabrics
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Cathedral Arch with Kasavu Edit */}
          <div className="lg:col-span-5 relative flex justify-center lg:justify-end pb-8 lg:pb-0">
            {/* Free Home Fitting Wax Stamp Badge */}
            <div className="absolute -top-4 sm:-top-5 right-2 sm:right-6 z-20 w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-[#B8935A]/70 bg-[#FAF7F2]/95 backdrop-blur-md p-2 flex items-center justify-center shadow-xl transform rotate-[6deg] hover:rotate-0 transition-transform duration-300">
              <div className="w-full h-full rounded-full border border-dashed border-[#B8935A]/70 flex flex-col items-center justify-center text-center p-1">
                <span className="text-[8px] sm:text-[9px] font-semibold tracking-[0.2em] text-[#5C1A32] uppercase leading-tight">
                  FREE
                </span>
                <span className="text-[10px] sm:text-[11px] font-serif italic text-[#B8935A] leading-tight">
                  Home
                </span>
                <span className="text-[8px] sm:text-[9px] font-semibold tracking-[0.2em] text-[#5C1A32] uppercase leading-tight">
                  FITTING
                </span>
              </div>
            </div>

            {/* Cathedral Arch Frame */}
            <div className="relative w-full max-w-[380px] sm:max-w-[430px] aspect-[3/4.4] rounded-t-[220px] sm:rounded-t-[260px] overflow-hidden shadow-[0_28px_60px_-15px_rgba(27,21,18,0.3)] border-2 border-[#5C1A32]/12 bg-[#EDE5D8]">
              <img
                src="/images/hero-model.jpg"
                alt="The Kasavu Edit - Handcrafted bridal saree and bespoke couture"
                className="w-full h-full object-cover object-top hover:scale-[1.03] transition-transform duration-1000 ease-out"
              />
            </div>

            {/* Overlapping Floating Collection Card */}
            <div className="absolute -bottom-6 left-2 sm:-left-4 z-20 bg-white/95 backdrop-blur-md border border-[#5C1A32]/15 p-5 sm:p-6 shadow-[0_20px_45px_-10px_rgba(27,21,18,0.22)] max-w-[280px]">
              <span className="block text-[9px] font-semibold tracking-[0.26em] text-[#5C1A32] uppercase mb-1.5">
                THIS SEASON
              </span>
              <h4 className="text-xl font-normal text-[#1B1512] mb-1 leading-snug" style={serif}>
                The Kasavu Edit
              </h4>
              <p className="text-xs text-[#544B45] leading-relaxed font-light">
                Ivory &amp; gold, hand-woven in Kerala.
              </p>
            </div>
          </div>
        </div>
      </section>

      <TapeRule tone="wine" />

      {/* ---------------- 1.5 CINEMATIC HAUTE COUTURE VIDEO & MOTION REEL ---------------- */}
      <CoutureVideoReel />

      <TapeRule tone="brass" />

      {/* ---------------- 2. ARTISAN CRAFTSMANSHIP SPOTLIGHT ---------------- */}
      <section className="w-full px-6 sm:px-10 lg:px-16 py-24 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Artisan Photo Frame */}
          <div className="lg:col-span-6 relative">
            <div className="relative overflow-hidden shadow-[0_24px_50px_-12px_rgba(27,21,18,0.25)] border border-[#5C1A32]/15 bg-[#1B1512]">
              <img
                src="/images/artisan-embroidery.jpg"
                alt="Master artisan hand-embroidering pure zardozi gold on royal velvet"
                className="w-full h-[460px] sm:h-[520px] object-cover hover:scale-[1.03] transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1B1512]/70 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-6 left-6 right-6 text-[#FAF7F2]">
                <div className="text-[10px] font-semibold tracking-[0.25em] text-[#B8935A] uppercase mb-1">
                  ATELIER WORKSHOP · CHENNAI
                </div>
                <div className="text-lg font-normal" style={serif}>
                  Real metallic zari embroidered onto mulberry velvet
                </div>
              </div>
            </div>
          </div>

          {/* Story & Couture Pillars */}
          <div className="lg:col-span-6 space-y-8">
            <div>
              <span className="text-[11px] font-semibold tracking-[0.28em] text-[#5C1A32] uppercase">
                THE NEEDLE &amp; THE WEAVE
              </span>
              <h2
                className="text-3xl sm:text-4xl md:text-5xl text-[#1B1512] font-normal mt-3 leading-tight"
                style={serif}
              >
                Crafted by human hands, never a production line.
              </h2>
              <p className="text-[#544B45] text-base leading-relaxed mt-4 font-light">
                At JoJo Flora, every piece begins with a hand-drafted pattern specific to your
                posture, shoulder slope, and bust curve. A single master artisan guides your garment
                through cutting, zardozi needlework, and seam pressing.
              </p>
            </div>

            <div className="space-y-5 pt-2">
              <div className="flex items-start gap-4 p-4 bg-white/70 border border-[#5C1A32]/10 shadow-sm">
                <div className="p-2.5 bg-[#5C1A32]/10 text-[#5C1A32] shrink-0 mt-0.5">
                  <Scissors className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-[#1B1512]">
                    42-Point Anatomic Measure
                  </h4>
                  <p className="text-xs text-[#544B45] mt-1 leading-relaxed">
                    Unlike standard S/M/L sizing, our pattern-makers account for back arch, armhole
                    depth, and seam comfort.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white/70 border border-[#5C1A32]/10 shadow-sm">
                <div className="p-2.5 bg-[#B8935A]/15 text-[#B8935A] shrink-0 mt-0.5">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-[#1B1512]">
                    Pure Heirlooms &amp; Zari
                  </h4>
                  <p className="text-xs text-[#544B45] mt-1 leading-relaxed">
                    Sourced directly from heritage weaving clusters across Kanchipuram, Banaras, and
                    Surat with gold-grade luster.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white/70 border border-[#5C1A32]/10 shadow-sm">
                <div className="p-2.5 bg-[#5C1A32]/10 text-[#5C1A32] shrink-0 mt-0.5">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-[#1B1512]">Flawless Fit Guarantee</h4>
                  <p className="text-xs text-[#544B45] mt-1 leading-relaxed">
                    If any detail doesn't align with perfection, our master tailor will alter it at
                    your doorstep at no additional charge.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TapeRule tone="brass" />

      {/* ---------------- 3. FEATURE PANELS: ATELIER & SWATCH LIBRARY ---------------- */}
      <section className="w-full px-6 sm:px-10 lg:px-16 py-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Custom Outfit Atelier Panel */}
          <Link
            to="/custom-outfit"
            className="group relative bg-[#1B1512] p-10 sm:p-14 flex flex-col justify-between text-[#FAF7F2] shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300"
          >
            <div className="space-y-4 relative z-10">
              <span className="text-[11px] font-semibold tracking-[0.25em] text-[#B8935A] uppercase">
                THE ATELIER
              </span>
              <h3 className="text-3xl sm:text-4xl text-[#FAF7F2] font-normal" style={serif}>
                Custom Bespoke Outfit
              </h3>
              <p className="text-[#FAF7F2]/75 text-sm leading-relaxed max-w-md font-light">
                Design your blouse, lehanga, kurti, or festive palazzo from a blank canvas.
                Configure neckline cuts, sleeve silhouettes, and back fastenings in 3D.
              </p>

              <div className="flex flex-wrap gap-2 pt-4">
                {[
                  'Bespoke Blouse',
                  'Bridal Lehanga',
                  'Kurti & Anarkali',
                  'Ready-to-Wear Saree',
                  'Palazzo & Pant',
                  'Silk Overcoat',
                ].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-xs border border-[#B8935A]/40 text-[#B8935A] font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-10 flex items-center justify-between relative z-10 border-t border-white/10 mt-8">
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#B8935A] group-hover:text-white transition-colors">
                Start Customizing
              </span>
              <span className="h-9 w-9 rounded-full border border-[#B8935A]/50 flex items-center justify-center text-[#B8935A] group-hover:bg-[#B8935A] group-hover:text-[#1B1512] transition-all">
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>

          {/* Swatch Library Panel */}
          <Link
            to="/fabrics"
            className="group relative bg-white border border-[#5C1A32]/15 p-10 sm:p-14 flex flex-col justify-between text-[#1B1512] shadow-xl overflow-hidden hover:shadow-2xl hover:border-[#5C1A32]/30 transition-all duration-300"
          >
            <div className="space-y-4 relative z-10">
              <span className="text-[11px] font-semibold tracking-[0.25em] text-[#5C1A32] uppercase">
                THE SWATCH ARCHIVE
              </span>
              <h3 className="text-3xl sm:text-4xl text-[#1B1512] font-normal" style={serif}>
                Pure Silk &amp; Linens
              </h3>
              <p className="text-[#544B45] text-sm leading-relaxed max-w-md font-light">
                Explore over 1,200 curated fabrics spanning Kanchipuram mulberry silks, Banarasi
                brocades, sheer organzas, and breathable Chanderi weaves.
              </p>

              <div className="flex items-center gap-2 pt-4">
                {['#7A1F2B', '#B5822A', '#2C5F8A', '#3D6B8A', '#A8998A', '#5C1A32'].map(
                  (hex, i) => (
                    <span
                      key={i}
                      className="h-7 w-5 rounded-[2px] border border-black/15 shadow-sm transform hover:-translate-y-1 transition-transform"
                      style={{ backgroundColor: hex }}
                    />
                  ),
                )}
                <span className="text-xs text-[#544B45]/80 ml-2 font-medium">1,200+ Swatches</span>
              </div>
            </div>

            <div className="pt-10 flex items-center justify-between relative z-10 border-t border-[#5C1A32]/10 mt-8">
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#5C1A32] group-hover:text-[#1B1512] transition-colors">
                Explore Fabric Library
              </span>
              <span className="h-9 w-9 rounded-full border border-[#5C1A32]/40 flex items-center justify-center text-[#5C1A32] group-hover:bg-[#5C1A32] group-hover:text-[#FAF7F2] transition-all">
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      <TapeRule tone="wine" />

      {/* ---------------- 4. THE COUTURE PROCESS (01 - 04) ---------------- */}
      <section className="w-full px-6 sm:px-10 lg:px-16 py-24 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[11px] font-semibold tracking-[0.28em] text-[#5C1A32] uppercase">
              THE BESPOKE METHOD
            </span>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl text-[#1B1512] font-normal mt-3"
              style={serif}
            >
              From raw silk to bespoke fit
            </h2>
            <div className="w-12 h-px bg-[#B8935A] mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step) => (
              <div
                key={step.mark}
                className="bg-white/80 p-8 border border-[#5C1A32]/10 shadow-sm relative hover:border-[#5C1A32]/30 hover:shadow-md transition-all duration-300"
              >
                <span className="block text-2xl font-normal text-[#B8935A] mb-4" style={serif}>
                  {step.mark}
                </span>
                <div className="h-px w-8 bg-[#5C1A32]/30 mb-4" />
                <h3 className="text-lg font-semibold text-[#1B1512] mb-2">{step.title}</h3>
                <p className="text-xs text-[#544B45] leading-relaxed font-light">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TapeRule tone="wine" />

      {/* ---------------- 5. BESPOKE REVIEWS ---------------- */}
      <section className="w-full px-6 sm:px-10 lg:px-16 py-24 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[11px] font-semibold tracking-[0.28em] text-[#5C1A32] uppercase">
              IN THEIR WORDS
            </span>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl text-[#1B1512] font-normal mt-3"
              style={serif}
            >
              The Client Experience
            </h2>
            <div className="w-12 h-px bg-[#B8935A] mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reviews.map((r) => (
              <div
                key={r.name}
                className="bg-white p-8 sm:p-10 border border-[#5C1A32]/12 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <span
                    className="block text-6xl text-[#B8935A]/60 leading-none mb-2"
                    style={serif}
                  >
                    &ldquo;
                  </span>
                  <p className="text-[#2A211D] text-sm sm:text-[15px] leading-relaxed mb-6 -mt-4 font-light">
                    {r.text}
                  </p>
                </div>
                <div className="pt-6 border-t border-[#5C1A32]/10">
                  <div className="flex gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < r.rating ? 'fill-[#B8935A] text-[#B8935A]' : 'text-[#5C1A32]/20'
                        }`}
                      />
                    ))}
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-[#1B1512]">{r.name}</span>
                    <span className="text-xs text-[#544B45]/70 block mt-0.5">{r.city}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TapeRule tone="brass" />

      {/* ---------------- 6. LITERAL TAILOR'S TAPE TIMELINE ---------------- */}
      <section className="w-full px-6 sm:px-10 lg:px-16 py-24 bg-[#FAF7F2]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-[11px] font-semibold tracking-[0.28em] text-[#5C1A32] uppercase">
              MEASURED IN DAYS, NOT GUESSES
            </span>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl text-[#1B1512] font-normal mt-3"
              style={serif}
            >
              The 8-Day Atelier Timeline
            </h2>
            <div className="w-12 h-px bg-[#B8935A] mx-auto mt-4" />
          </div>

          {/* Desktop Timeline */}
          <div className="hidden md:block relative pt-12 pb-6">
            <svg
              className="absolute left-0 right-0 top-[60px] w-full h-3 overflow-visible"
              aria-hidden="true"
            >
              <defs>
                <marker
                  id="tapeArrowHead"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="4"
                  orient="auto"
                >
                  <path d="M0,0 L8,4 L0,8 Z" fill="#5C1A32" fillOpacity="0.6" />
                </marker>
              </defs>
              <line
                x1="0"
                y1="0.5"
                x2="100%"
                y2="0.5"
                stroke="#5C1A32"
                strokeOpacity="0.25"
                strokeWidth="1.5"
                markerEnd="url(#tapeArrowHead)"
              />
            </svg>

            {Array.from({ length: TAPE_MAX + 1 }).map((_, day) => {
              const hasStage = stages.some((s) => s.day === day);
              return (
                <div
                  key={day}
                  className="absolute top-[54px] flex flex-col items-center"
                  style={{
                    left: `${String((day / TAPE_MAX) * 100)}%`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  {!hasStage && (
                    <span className="absolute -top-[42px] text-[10px] font-medium tracking-wide text-[#544B45]/40 whitespace-nowrap">
                      Refining
                    </span>
                  )}
                  <div className="w-px h-3.5 bg-[#5C1A32]/40" />
                  <span className="mt-1.5 text-[11px] tabular-nums font-semibold text-[#544B45]/60">
                    Day {day}
                  </span>
                </div>
              );
            })}

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
                <div className="text-center mb-2 w-32">
                  <div className="text-xs font-semibold text-[#1B1512] leading-tight">
                    {stage.label}
                  </div>
                </div>
                <div className="h-8 w-px bg-[#B8935A]" />
                <div className="h-3 w-3 rounded-full bg-[#B8935A] ring-4 ring-[#FAF7F2] shadow-sm" />
              </div>
            ))}
          </div>

          {/* Mobile Timeline */}
          <div className="md:hidden space-y-4 pt-4">
            {stages.map((stage) => (
              <div
                key={stage.label}
                className="flex items-center gap-4 bg-white p-4 border border-[#5C1A32]/10"
              >
                <div className="h-3 w-3 rounded-full bg-[#B8935A] shrink-0" />
                <div className="flex-1 flex items-center justify-between">
                  <div className="text-sm font-semibold text-[#1B1512]">{stage.label}</div>
                  <div className="text-xs font-semibold text-[#5C1A32]">Day {stage.day}</div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-[#544B45]/60 mt-20">
            Real-time step updates with tailor contact details are accessible directly in your
            account dashboard.
          </p>
        </div>
      </section>

      {/* ---------------- 7. FRANCHISE PARTNERSHIP (ROYAL OBSIDIAN) ---------------- */}
      <section className="w-full px-6 sm:px-10 lg:px-16 py-20">
        <div className="max-w-7xl mx-auto bg-[#1B1512] text-[#FAF7F2] p-10 sm:p-16 lg:p-20 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row items-start justify-between gap-12">
            <div className="max-w-xl space-y-6">
              <span className="text-[11px] font-semibold tracking-[0.28em] text-[#B8935A] uppercase">
                EXPANSION PARTNERSHIP
              </span>
              <h2
                className="text-3xl sm:text-4xl md:text-5xl font-normal leading-tight"
                style={serif}
              >
                Bring the JoJo Flora atelier experience to your city.
              </h2>
              <p className="text-[#FAF7F2]/75 text-sm sm:text-base leading-relaxed font-light">
                Join South India's fastest-growing luxury bespoke tailoring network. Complete
                pattern CAD systems, master tailor training, and direct mill fabric supplies
                provided.
              </p>
              <div className="pt-2">
                <Link
                  to="/franchise"
                  className="inline-flex items-center gap-3 bg-[#B8935A] text-[#1B1512] font-semibold text-xs tracking-[0.18em] uppercase px-8 py-4 shadow hover:bg-[#c9a66d] transition-all"
                >
                  Apply for Franchise Atelier
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-6 w-full lg:w-auto">
              {franchiseStats.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-4 bg-white/5 border border-white/10 p-5 rounded-none min-w-[200px]"
                >
                  <span className="h-12 w-12 border border-[#B8935A]/50 text-[#B8935A] flex items-center justify-center shrink-0">
                    {s.icon}
                  </span>
                  <div>
                    <div className="text-2xl font-normal" style={serif}>
                      {s.value}
                    </div>
                    <div className="text-xs text-[#FAF7F2]/65 uppercase tracking-wider mt-0.5">
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
