import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ruler, Save, CheckCircle2, Calendar, MapPin, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAddresses } from '../context/AddressContext';
import { measurementApi } from '../services';
import { MEASUREMENTS_UPDATED_EVENT } from '../components/MeasurementSidebar';
import BodyTypeSelector from '../components/BodyTypeSelector';

// ── Design tokens (matches Home.tsx / Navbar.tsx / Footer.tsx / FabricDetail.tsx / Order.tsx / Payment.tsx / OrderTracking.tsx / CustomOutfit.tsx / ProductStyle.tsx / ProductAccessories.tsx / ProductSummary.tsx / Address.tsx)
//   ink      #1B1512  headings, primary text
//   wine     #5C1A32  primary accent (replaces fuchsia-800 / pink-600)
//   brass    #B8935A  secondary accent
//   bone     #F6F1E7  page background
// Display face: Fraunces, for the page title.

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

type MeasurementValues = Record<string, string>;

interface FieldDef {
  key: string;
  label: string;
}

const BLOUSE_FIELDS: FieldDef[] = [
  { key: 'height', label: 'Height' },
  { key: 'upperChest', label: 'Upper Chest' },
  { key: 'centerChest', label: 'Center Chest' },
  { key: 'waistRound', label: 'Waist Round' },
  { key: 'sleeveLength', label: 'Sleeve Length' },
  { key: 'sleeveRound', label: 'Sleeve Round' },
  { key: 'midHand', label: 'Mid Hand' },
  { key: 'armRound', label: 'Arm Round' },
  { key: 'frontNeck', label: 'Front Neck' },
  { key: 'backNeck', label: 'Back Neck' },
  { key: 'fullShoulder', label: 'Full Shoulder' },
  { key: 'shoulderWidth', label: 'Shoulder Width' },
  { key: 'centerDot', label: 'Center Dot' },
];

const CHUDI_FIELDS: FieldDef[] = [
  { key: 'height', label: 'Height' },
  { key: 'chest', label: 'Chest' },
  { key: 'waistHeight', label: 'Waist Height' },
  { key: 'waistRound', label: 'Waist Round' },
  { key: 'sleeveLength', label: 'Sleeve Length' },
  { key: 'sleeveRound', label: 'Sleeve Round' },
  { key: 'midHand', label: 'Mid Hand' },
  { key: 'armRound', label: 'Arm Round' },
  { key: 'frontNeck', label: 'Front Neck' },
  { key: 'backNeck', label: 'Back Neck' },
  { key: 'fullShoulder', label: 'Full Shoulder' },
  { key: 'shoulderWidth', label: 'Shoulder Width' },
  { key: 'seatLoose', label: 'Seat Loose' },
  { key: 'slitOpenFTop', label: 'Slit Open f Top' },
];

const PANT_FIELDS: FieldDef[] = [
  { key: 'height', label: 'Height' },
  { key: 'hipRound', label: 'Hip Round' },
  { key: 'seatRound', label: 'Seat Round' },
  { key: 'kneeRound', label: 'Knee Round' },
  { key: 'thighRound', label: 'Thigh Round' },
  { key: 'legRound', label: 'Leg Round' },
  { key: 'croch', label: 'Croch' },
];

const SECTIONS: { title: string; storageSuffix: string; fields: FieldDef[] }[] = [
  { title: 'Blouse', storageSuffix: 'blouse', fields: BLOUSE_FIELDS },
  { title: 'Chudi', storageSuffix: 'chudi', fields: CHUDI_FIELDS },
  { title: 'Pant', storageSuffix: 'pant', fields: PANT_FIELDS },
];

function emptyValues(fields: FieldDef[]): MeasurementValues {
  return Object.fromEntries(fields.map((f) => [f.key, '']));
}

export default function MeasurementPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const storageKey = `jojo_measurements_${user?.username ?? 'guest'}`;

  const [values, setValues] = useState<Record<string, MeasurementValues>>(() => ({
    blouse: emptyValues(BLOUSE_FIELDS),
    chudi: emptyValues(CHUDI_FIELDS),
    pant: emptyValues(PANT_FIELDS),
  }));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      setValues(JSON.parse(raw) as Record<string, MeasurementValues>);
    }

    if (user) {
      measurementApi
        .get()
        .then((res) => {
          if (
            Object.keys(res.data.blouse).length > 0 ||
            Object.keys(res.data.chudi).length > 0 ||
            Object.keys(res.data.pant).length > 0
          ) {
            setValues({
              blouse: { ...emptyValues(BLOUSE_FIELDS), ...res.data.blouse },
              chudi: { ...emptyValues(CHUDI_FIELDS), ...res.data.chudi },
              pant: { ...emptyValues(PANT_FIELDS), ...res.data.pant },
            });
            localStorage.setItem(
              storageKey,
              JSON.stringify({
                blouse: res.data.blouse,
                chudi: res.data.chudi,
                pant: res.data.pant,
              }),
            );
          }
        })
        .catch(() => {
          // Keep local values on failure
        });
    }
  }, [storageKey, user]);

  const handleChange = (section: string, fieldKey: string, val: string) => {
    if (val !== '' && !/^\d*\.?\d*$/.test(val)) return;
    setValues((prev) => ({
      ...prev,
      [section]: { ...prev[section], [fieldKey]: val },
    }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(storageKey, JSON.stringify(values));
    if (user) {
      measurementApi
        .save({
          blouse: values['blouse'] ?? {},
          chudi: values['chudi'] ?? {},
          pant: values['pant'] ?? {},
        })
        .catch(() => {
          // Keep saved locally on error
        });
    }
    setSaved(true);
    // Let the persistent sidebar (mounted in App.tsx) know it should re-read localStorage.
    window.dispatchEvent(new Event(MEASUREMENTS_UPDATED_EVENT));
    // Brief pause so the "Saved" confirmation is visible before leaving the page.
    setTimeout(() => {
      void navigate('/');
    }, 800);
  };

  const { addresses } = useAddresses();
  const [activeTab, setActiveTab] = useState<'home-visit' | 'self-measure'>('home-visit');

  // Home Visit Booking State
  const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [visitCity, setVisitCity] = useState<'Chennai' | 'Coimbatore' | 'Bengaluru'>('Chennai');
  const [visitDate, setVisitDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0] ?? '';
  });
  const [visitSlot, setVisitSlot] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [visitAddressId, setVisitAddressId] = useState<string>(defaultAddr?.id ?? '');
  const [visitPhone, setVisitPhone] = useState(defaultAddr?.phone ?? '');
  const [visitNotes, setVisitNotes] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState<{
    id: string;
    city: string;
    date: string;
    slot: string;
    address: string;
  } | null>(null);

  const selectedAddress = addresses.find((a) => a.id === visitAddressId) ?? defaultAddr;

  const handleBookVisit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const slotLabels: Record<string, string> = {
      morning: 'Morning (10:00 AM – 1:00 PM)',
      afternoon: 'Afternoon (2:00 PM – 5:00 PM)',
      evening: 'Evening (5:00 PM – 8:00 PM)',
    };
    const addrText = selectedAddress
      ? `${selectedAddress.line1}, ${selectedAddress.city} - ${selectedAddress.pincode}`
      : 'Address specified by phone';

    const booking = {
      id: `JF-FIT-${Math.floor(1000 + Math.random() * 9000)}`,
      city: visitCity,
      date: visitDate,
      slot: slotLabels[visitSlot] || visitSlot,
      address: addrText,
    };

    localStorage.setItem(
      `jojo_fitting_booking_${user?.username ?? 'guest'}`,
      JSON.stringify(booking),
    );
    setBookingConfirmed(booking);
  };

  return (
    <div className="w-full min-h-screen bg-[#FAF7F2] py-8">
      <section className="w-full px-6 pt-10 pb-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Ruler className="h-6 w-6 text-[#5C1A32]" />
            <h1 className="text-3xl sm:text-4xl text-[#1B1512]" style={serif}>
              Bespoke Fitting & Measurements
            </h1>
          </div>
          <p className="text-[#4A413B] text-sm sm:text-base">
            Book a complimentary master tailor visit to your home or enter your self-measurement
            figures.
          </p>

          {/* Mode Switcher Tabs */}
          <div className="mt-8 flex border-b border-[#5C1A32]/15">
            <button
              type="button"
              onClick={() => setActiveTab('home-visit')}
              className={`pb-3 px-6 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-colors relative ${
                activeTab === 'home-visit'
                  ? 'text-[#5C1A32]'
                  : 'text-[#1B1512]/60 hover:text-[#1B1512]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#B8935A]" />
                Book Home Fitting Visit
                <span className="hidden sm:inline-block text-[10px] bg-[#5C1A32]/10 text-[#5C1A32] px-2 py-0.5 rounded-full font-bold">
                  Complimentary
                </span>
              </span>
              {activeTab === 'home-visit' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5C1A32]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('self-measure')}
              className={`pb-3 px-6 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-colors relative ${
                activeTab === 'self-measure'
                  ? 'text-[#5C1A32]'
                  : 'text-[#1B1512]/60 hover:text-[#1B1512]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-[#B8935A]" />
                Self-Measure Tape Entry
              </span>
              {activeTab === 'self-measure' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5C1A32]" />
              )}
            </button>
          </div>
        </div>
      </section>

      <section className="w-full px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* TAB 1: HOME VISIT BOOKING */}
          {activeTab === 'home-visit' && (
            <div>
              {bookingConfirmed ? (
                <div className="max-w-2xl mx-auto bg-white rounded-sm border border-[#5C1A32]/20 p-8 shadow-md text-center animate-in fade-in duration-300">
                  <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  </div>
                  <span className="text-[11px] font-semibold tracking-[0.2em] text-[#B8935A] uppercase block mb-1">
                    Booking Confirmed
                  </span>
                  <h2 className="text-2xl text-[#1B1512] mb-3" style={serif}>
                    Master Tailor Appointment Scheduled
                  </h2>
                  <p className="text-sm text-[#4A413B] max-w-md mx-auto mb-6">
                    Our Senior Atelier Tailor will visit you with pure silk swatches and couture
                    measurement kit.
                  </p>

                  <div className="bg-[#FAF7F2] rounded-sm p-5 text-left space-y-3 mb-6 text-sm border border-[#5C1A32]/10">
                    <div className="flex justify-between border-b border-[#5C1A32]/10 pb-2">
                      <span className="text-[#4A413B]/70 font-medium">Appointment ID:</span>
                      <span className="font-bold text-[#5C1A32] font-mono">
                        {bookingConfirmed.id}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-[#5C1A32]/10 pb-2">
                      <span className="text-[#4A413B]/70 font-medium">City:</span>
                      <span className="font-semibold text-[#1B1512]">{bookingConfirmed.city}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#5C1A32]/10 pb-2">
                      <span className="text-[#4A413B]/70 font-medium">Scheduled Date:</span>
                      <span className="font-semibold text-[#1B1512]">{bookingConfirmed.date}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#5C1A32]/10 pb-2">
                      <span className="text-[#4A413B]/70 font-medium">Time Window:</span>
                      <span className="font-semibold text-[#1B1512]">{bookingConfirmed.slot}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#4A413B]/70 font-medium">Location:</span>
                      <span className="font-medium text-[#1B1512] max-w-[260px] text-right truncate">
                        {bookingConfirmed.address}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      type="button"
                      onClick={() => setBookingConfirmed(null)}
                      className="px-6 py-2.5 bg-white border border-[#5C1A32]/30 text-[#1B1512] text-xs font-semibold uppercase tracking-wider rounded-sm hover:bg-[#FAF7F2]"
                    >
                      Book Another Fitting
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/custom-outfit')}
                      className="px-6 py-2.5 bg-[#5C1A32] text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider rounded-sm hover:bg-[#431223]"
                    >
                      Continue Customizing Outfit
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Column: Form */}
                  <form
                    onSubmit={handleBookVisit}
                    className="lg:col-span-7 bg-white rounded-sm border border-[#5C1A32]/12 shadow-sm p-6 sm:p-8 space-y-6"
                  >
                    <div>
                      <label className="text-[11px] font-semibold tracking-[0.15em] text-[#1B1512] uppercase mb-2 block">
                        1. Select Service City
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {(['Chennai', 'Coimbatore', 'Bengaluru'] as const).map((city) => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => setVisitCity(city)}
                            className={`p-3 text-center rounded-sm border text-xs font-semibold transition-all ${
                              visitCity === city
                                ? 'bg-[#5C1A32] border-[#5C1A32] text-[#FAF7F2] shadow-sm'
                                : 'border-[#5C1A32]/20 bg-white text-[#1B1512] hover:border-[#5C1A32]'
                            }`}
                          >
                            <MapPin className="h-4 w-4 mx-auto mb-1 text-[#B8935A]" />
                            {city}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-semibold tracking-[0.15em] text-[#1B1512] uppercase mb-2 block">
                          2. Preferred Date
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            required
                            min={new Date().toISOString().split('T')[0]}
                            value={visitDate}
                            onChange={(e) => setVisitDate(e.target.value)}
                            className="w-full rounded-sm border border-[#5C1A32]/20 bg-white text-[#1B1512] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5C1A32]/40"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold tracking-[0.15em] text-[#1B1512] uppercase mb-2 block">
                          3. Preferred Time Slot
                        </label>
                        <select
                          value={visitSlot}
                          onChange={(e) =>
                            setVisitSlot(e.target.value as 'morning' | 'afternoon' | 'evening')
                          }
                          className="w-full rounded-sm border border-[#5C1A32]/20 bg-white text-[#1B1512] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5C1A32]/40"
                        >
                          <option value="morning">Morning (10:00 AM – 1:00 PM)</option>
                          <option value="afternoon">Afternoon (2:00 PM – 5:00 PM)</option>
                          <option value="evening">Evening (5:00 PM – 8:00 PM)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[11px] font-semibold tracking-[0.15em] text-[#1B1512] uppercase block">
                          4. Visit Address
                        </label>
                        <button
                          type="button"
                          onClick={() => navigate('/addresses')}
                          className="text-[11px] text-[#5C1A32] font-semibold hover:underline"
                        >
                          + Manage Addresses
                        </button>
                      </div>
                      {addresses.length > 0 ? (
                        <div className="space-y-2">
                          {addresses.map((addr) => (
                            <label
                              key={addr.id}
                              className={`flex items-start gap-3 p-3 rounded-sm border cursor-pointer text-xs transition-colors ${
                                visitAddressId === addr.id || (!visitAddressId && addr.isDefault)
                                  ? 'border-[#5C1A32] bg-[#5C1A32]/5'
                                  : 'border-[#5C1A32]/15 hover:border-[#5C1A32]/40'
                              }`}
                            >
                              <input
                                type="radio"
                                name="visitAddress"
                                checked={
                                  visitAddressId === addr.id || (!visitAddressId && addr.isDefault)
                                }
                                onChange={() => {
                                  setVisitAddressId(addr.id);
                                  setVisitPhone(addr.phone);
                                }}
                                className="mt-0.5 text-[#5C1A32] focus:ring-[#5C1A32]"
                              />
                              <div>
                                <span className="font-semibold text-[#1B1512] block">
                                  {addr.fullName} · {addr.type.toUpperCase()}
                                </span>
                                <span className="text-[#4A413B] leading-relaxed">
                                  {addr.line1}, {addr.city}, {addr.state} - {addr.pincode}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 rounded-sm border border-dashed border-[#5C1A32]/30 text-center text-xs text-[#4A413B]">
                          No saved addresses found.
                          <button
                            type="button"
                            onClick={() => navigate('/addresses')}
                            className="block mx-auto mt-2 text-[#5C1A32] font-semibold hover:underline"
                          >
                            Add Delivery/Fitting Address
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold tracking-[0.15em] text-[#1B1512] uppercase mb-1.5 block">
                        Contact Phone
                      </label>
                      <div className="relative flex">
                        <span className="inline-flex items-center px-2.5 rounded-l-sm border border-r-0 border-[#5C1A32]/20 bg-[#FAF7F2] text-[#1B1512] text-xs font-semibold">
                          +91
                        </span>
                        <input
                          required
                          type="tel"
                          maxLength={10}
                          placeholder="9345816672"
                          value={visitPhone}
                          onChange={(e) =>
                            setVisitPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                          }
                          className="w-full rounded-r-sm rounded-l-none border border-[#5C1A32]/20 bg-white text-[#1B1512] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5C1A32]/40"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold tracking-[0.15em] text-[#1B1512] uppercase mb-1.5 block">
                        Special Instructions for the Tailor (Optional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Please bring bridal silk swatches, wedding on 24th December..."
                        value={visitNotes}
                        onChange={(e) => setVisitNotes(e.target.value)}
                        className="w-full rounded-sm border border-[#5C1A32]/20 bg-white text-[#1B1512] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5C1A32]/40"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-[#1B1512] hover:bg-[#5C1A32] text-[#FAF7F2] text-xs uppercase tracking-[0.2em] font-semibold rounded-sm transition-all duration-300 shadow-sm flex items-center justify-center gap-2"
                    >
                      <Sparkles className="h-4 w-4 text-[#B8935A]" />
                      Confirm Master Tailor Home Visit
                    </button>
                  </form>

                  {/* Right Column: Privilege Card */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-[#5C1A32] text-[#FAF7F2] p-6 rounded-sm shadow-md">
                      <span className="text-[10px] tracking-[0.25em] text-[#B8935A] uppercase font-bold block mb-1">
                        Atelier Experience
                      </span>
                      <h3 className="text-xl font-normal mb-3" style={serif}>
                        The JoJo Flora Doorstep Fitting
                      </h3>
                      <p className="text-xs text-[#FAF7F2]/80 leading-relaxed mb-6">
                        Experience bespoke luxury without traveling. Our senior master artisan
                        visits your residence equipped with:
                      </p>
                      <ul className="space-y-3 text-xs text-[#FAF7F2]/90">
                        <li className="flex items-start gap-2.5">
                          <CheckCircle2 className="h-4 w-4 text-[#B8935A] shrink-0 mt-0.5" />
                          <span>40+ Curated pure silk, zari & organza fabric swatches</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <CheckCircle2 className="h-4 w-4 text-[#B8935A] shrink-0 mt-0.5" />
                          <span>
                            Over 30 precise anatomical measurements for bridal/couture drape
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <CheckCircle2 className="h-4 w-4 text-[#B8935A] shrink-0 mt-0.5" />
                          <span>Personal silhouette and neckline style consultation</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <CheckCircle2 className="h-4 w-4 text-[#B8935A] shrink-0 mt-0.5" />
                          <span>100% complimentary in Chennai, Coimbatore, and Bengaluru</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-white p-5 rounded-sm border border-[#5C1A32]/12 text-xs text-[#4A413B] space-y-2">
                      <div className="flex items-center gap-2 font-semibold text-[#1B1512]">
                        <ShieldCheck className="h-4 w-4 text-[#B8935A]" />
                        <span>Safety & Hygiene Certified</span>
                      </div>
                      <p className="leading-relaxed">
                        All master artisans follow strict sanitization protocols and carry verified
                        atelier ID credentials.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SELF-MEASURE TAPE ENTRY */}
          {activeTab === 'self-measure' && (
            <div>
              <BodyTypeSelector />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {SECTIONS.map((section) => (
                  <div
                    key={section.storageSuffix}
                    className="bg-white rounded-sm border border-[#5C1A32]/12 shadow-sm overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-[#5C1A32]/10">
                      <h2 className="text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase">
                        {section.title}
                      </h2>
                    </div>
                    <div className="p-4 space-y-3">
                      {section.fields.map((field, idx) => (
                        <div key={field.key} className="flex items-center gap-3">
                          <span className="w-5 text-xs font-semibold text-[#B8935A]">
                            {idx + 1}
                          </span>
                          <label className="flex-1 text-sm text-[#2A211D]">{field.label}</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={values[section.storageSuffix]?.[field.key] ?? ''}
                              onChange={(e) => {
                                handleChange(section.storageSuffix, field.key, e.target.value);
                              }}
                              className="w-16 rounded-sm border border-[#5C1A32]/20 px-2 py-1.5 text-sm text-[#1B1512] text-center focus:outline-none focus:ring-2 focus:ring-[#5C1A32]/40 focus:border-[#5C1A32]"
                              placeholder="0.0"
                            />
                            <span className="text-xs text-[#4A413B]/60">in</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 mt-8">
                <button
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 rounded-sm bg-[#1B1512] text-[#F6F1E7] font-semibold py-3 px-6 hover:bg-[#5C1A32] transition-colors"
                >
                  <Save className="h-4 w-4" />
                  Save Measurements
                </button>
                {saved && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Saved
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
