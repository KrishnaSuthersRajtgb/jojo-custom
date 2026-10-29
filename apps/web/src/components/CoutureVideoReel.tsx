import { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

interface Scene {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  image: string;
  quote: string;
  artisan: string;
}

const SCENES: Scene[] = [
  {
    id: 'artisan',
    tag: 'SCENE 01 · MASTER ATELIER',
    title: 'Pure Gold Zardozi & Zari Craftsmanship',
    subtitle: 'Each stitch is hand-guided by multi-generational artisans in our Chennai workshop.',
    image: '/images/artisan-embroidery.jpg',
    quote: '"A single bespoke bridal blouse commands 48 hours of uninterrupted needlework."',
    artisan: 'Master Artisan K. Raman · 32 Years Crafting for JoJo',
  },
  {
    id: 'kasavu',
    tag: 'SCENE 02 · EDITORIAL COUTURE',
    title: 'The Kasavu & Royal Ruby Weave',
    subtitle: 'Woven with certified pure mulberry silk and authentic gold-tested threads.',
    image: '/images/hero-model.jpg',
    quote: '"Cut for your posture, draping naturally without a single pull or crease."',
    artisan: 'Head Drape Designer Priya S. · Couture Division',
  },
  {
    id: 'swatches',
    tag: 'SCENE 03 · TEXTILE VAULT',
    title: 'Rare Handloom Silks & Brocades',
    subtitle: 'Over 1,200 curated weaves sourced directly from traditional heritage looms.',
    image: '/images/fabric-swatches.jpg',
    quote: '"Feel the authentic weight and fall of pure Kanchipuram and Banarasi textures."',
    artisan: 'Textile Archivist Anand V. · Heritage Selection',
  },
];

export default function CoutureVideoReel() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);

  // Auto-advance scenes when playing
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % SCENES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Ambient synth audio toggle (pure Web Audio API, soothing gentle ambient chord)
  const toggleAudio = () => {
    if (isAudioOn) {
      if (oscRef.current) {
        oscRef.current.stop();
        oscRef.current.disconnect();
        oscRef.current = null;
      }
      setIsAudioOn(false);
    } else {
      try {
        const AudioContextClass = window.AudioContext;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        // Gentle soothing harmonic drone (432Hz ambient chord)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(432, ctx.currentTime); // Concert A natural healing frequency

        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 1.5);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        oscRef.current = osc;
        setIsAudioOn(true);
      } catch {
        setIsAudioOn(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (oscRef.current) {
        try {
          oscRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const scene = SCENES[currentIdx] ?? SCENES[0];
  if (!scene) return null;

  return (
    <section className="relative w-full bg-[#13100E] text-[#FAF7F2] py-20 px-6 sm:px-10 lg:px-16 overflow-hidden">
      {/* Background Ambient Aura */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#5C1A32]/25 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[450px] h-[450px] bg-[#B8935A]/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {/* Editorial Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-[#FAF7F2]/10 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-[#B8935A]" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#B8935A]">
                HAUTE COUTURE MOTION & ATELIER REEL
              </span>
            </div>
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight"
              style={serif}
            >
              The Living Atelier
            </h2>
            <p className="text-xs sm:text-sm text-[#A89F95] font-light mt-1 max-w-lg">
              Witness the timeless artistry of master Indian bespoke tailoring, where centuries of
              royal weaving meet laser-accurate digital measures.
            </p>
          </div>

          {/* Interactive Player Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#B8935A]/40 bg-[#FAF7F2]/5 hover:bg-[#FAF7F2]/15 text-xs text-[#FAF7F2] tracking-wider uppercase transition-all"
            >
              {isPlaying ? (
                <Pause className="h-3.5 w-3.5 text-[#B8935A]" />
              ) : (
                <Play className="h-3.5 w-3.5 text-[#B8935A]" />
              )}
              <span>{isPlaying ? 'Pause Reel' : 'Play Reel'}</span>
            </button>

            <button
              onClick={toggleAudio}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#B8935A]/40 bg-[#FAF7F2]/5 hover:bg-[#FAF7F2]/15 text-xs text-[#FAF7F2] tracking-wider uppercase transition-all"
              title="Toggle Atelier Ambient Sound"
            >
              {isAudioOn ? (
                <Volume2 className="h-3.5 w-3.5 text-[#B8935A]" />
              ) : (
                <VolumeX className="h-3.5 w-3.5 text-[#A89F95]" />
              )}
              <span>{isAudioOn ? 'Sound On' : 'Ambient'}</span>
            </button>

            <div className="flex items-center gap-1 border-l border-[#FAF7F2]/15 pl-3">
              <button
                onClick={() => setCurrentIdx((prev) => (prev - 1 + SCENES.length) % SCENES.length)}
                className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                aria-label="Previous scene"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentIdx((prev) => (prev + 1) % SCENES.length)}
                className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                aria-label="Next scene"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Cinematic Stage Card ───────────────────────────────────────── */}
        <div className="relative w-full rounded-2xl overflow-hidden border border-[#B8935A]/35 bg-[#1B1512] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.85)] grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
          {/* Left Column: Visual Canvas / Reel */}
          <div className="lg:col-span-7 relative overflow-hidden min-h-[380px] lg:min-h-[520px] bg-black">
            {SCENES.map((s, idx) => (
              <div
                key={s.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  idx === currentIdx
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-105 pointer-events-none'
                }`}
              >
                <img
                  src={s.image}
                  alt={s.title}
                  className="w-full h-full object-cover object-center brightness-90 transform transition-transform duration-[6000ms] ease-out hover:scale-105"
                />
                {/* Cinema scope vignette overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#13100E] via-transparent to-black/40" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#1B1512]/90 hidden lg:block" />
              </div>
            ))}

            {/* Live Recording Badge */}
            <div className="absolute top-5 left-5 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#B8935A]/50">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-[9px] uppercase tracking-[0.25em] font-semibold text-[#E8DFC8]">
                CINEMATIC 4K ATELIER FEED
              </span>
            </div>

            {/* Scene Indicators (Progress Bars) */}
            <div className="absolute bottom-6 left-6 right-6 z-20 flex items-center gap-2">
              {SCENES.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentIdx(idx)}
                  className="flex-1 h-1 rounded-full overflow-hidden bg-white/20 transition-all cursor-pointer"
                  aria-label={`Jump to scene ${idx + 1}`}
                >
                  <div
                    className={`h-full bg-[#B8935A] transition-all duration-500 ${
                      idx === currentIdx ? 'w-full' : 'w-0'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Editorial Narration & Interactive Specs */}
          <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between relative z-10 bg-[#1B1512]/95 backdrop-blur-md border-t lg:border-t-0 lg:border-l border-[#B8935A]/25">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2.5">
                <span className="w-6 h-px bg-[#B8935A]" />
                <span className="text-[10px] uppercase tracking-[0.28em] font-semibold text-[#B8935A]">
                  {scene.tag}
                </span>
              </div>

              <h3
                className="text-2xl sm:text-3xl font-normal leading-tight text-[#FAF7F2]"
                style={serif}
              >
                {scene.title}
              </h3>

              <p className="text-sm text-[#C8BFB5] font-light leading-relaxed">{scene.subtitle}</p>

              {/* Master Artisan Quote */}
              <div className="p-4 bg-[#2A231E]/70 border-l-2 border-[#B8935A] rounded-r space-y-2">
                <p className="text-xs italic text-[#E8DFC8] font-serif leading-relaxed">
                  {scene.quote}
                </p>
                <span className="block text-[10px] uppercase tracking-wider text-[#A89F95] font-mono">
                  — {scene.artisan}
                </span>
              </div>
            </div>

            <div className="pt-8 border-t border-[#FAF7F2]/10 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A89F95]">Couture Assurance:</span>
                <span className="text-[#E8DFC8] font-semibold">14-Day Free Doorstep Refitting</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/custom-outfit"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-[#5C1A32] hover:bg-[#451325] text-[#FAF7F2] text-xs font-semibold uppercase tracking-[0.18em] py-3.5 px-6 rounded shadow-lg transition-all group"
                >
                  <span>Design Outfit in This Weave</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/fabrics"
                  className="inline-flex items-center justify-center border border-[#FAF7F2]/30 hover:border-[#FAF7F2] text-[#FAF7F2] text-xs font-semibold uppercase tracking-[0.18em] py-3.5 px-5 rounded transition-colors"
                >
                  Swatches
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
