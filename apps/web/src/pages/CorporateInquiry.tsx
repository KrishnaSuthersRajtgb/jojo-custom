import { useState } from 'react';
import {
  Building2,
  User,
  Mail,
  Phone,
  Package,
  MapPin,
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  Layers,
} from 'lucide-react';
import { corporateInquiryApi, type CreateCorporateInquiryPayload } from '../services/api';

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

const GARMENT_OPTIONS = [
  'Corporate Uniforms & Suiting',
  'Executive Blazers & Waistcoats',
  'Festive & Gala Event Wear',
  'Luxury Gifting & Stoles',
  'Bespoke Sarees & Anarkalis',
  'Bridal Entourage & Family Couture Sets',
  'Artisan Handloom Kurtas & Sherwanis',
  'Other Bespoke Requirement',
];

export default function CorporateInquiry() {
  const [formData, setFormData] = useState<CreateCorporateInquiryPayload>({
    organizationName: '',
    contactPerson: '',
    email: '',
    phone: '',
    garmentType: GARMENT_OPTIONS[0] ?? 'Corporate Uniforms & Suiting',
    estimatedQuantity: 25,
    deliveryCity: '',
    targetDate: '',
    specialRequirements: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await corporateInquiryApi.submit(formData);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to submit inquiry. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'estimatedQuantity' ? Number(value) : value,
    }));
  };

  return (
    <div className="min-h-screen bg-[#F6F1E7] text-[#1B1512] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Hero Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5C1A32]/10 border border-[#5C1A32]/20 text-[#5C1A32] text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5 text-[#B8935A]" />
            Atelier Institutional Services
          </div>

          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-normal text-[#1B1512] tracking-tight"
            style={serif}
          >
            Corporate &amp; Bulk Orders
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#4A413B] leading-relaxed">
            Elevate your enterprise with bespoke atelier craftsmanship. From prestige executive
            uniforms and gala gala event wear to customized bridal entourage suites and luxury
            textile gifting, our master tailors engineer distinction at scale.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs font-medium text-[#544B45]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#B8935A]" />
              Artisan Grade Textiles
            </span>
            <span className="flex items-center gap-1.5">
              <Award className="h-4 w-4 text-[#B8935A]" />
              Precision Individual Sizing
            </span>
            <span className="flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-[#B8935A]" />
              Dedicated Atelier Account Director
            </span>
          </div>
        </div>

        {/* Success Confirmation Card */}
        {submitted ? (
          <div className="bg-white border border-[#5C1A32]/20 rounded-2xl p-8 sm:p-12 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-normal text-[#1B1512]" style={serif}>
                Inquiry Received by JoJo Atelier
              </h2>
              <p className="text-sm text-[#4A413B] max-w-lg mx-auto leading-relaxed">
                Thank you for considering JoJo Flora Couture for your corporate requirements. Our
                Senior Atelier Consultant has been assigned to{' '}
                <strong className="text-[#5C1A32]">{formData.organizationName}</strong> and will
                contact <strong className="text-[#1B1512]">{formData.contactPerson}</strong> within
                24 hours to review fabric specifications, sample swatches, and tiered corporate
                pricing.
              </p>
            </div>

            <div className="bg-[#FAF7F2] border border-[#5C1A32]/10 rounded-xl p-5 max-w-md mx-auto text-left text-xs space-y-2 text-[#544B45]">
              <div className="flex justify-between">
                <span className="text-[#8A7968]">Target Garment:</span>
                <span className="font-semibold text-[#1B1512]">{formData.garmentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A7968]">Estimated Quantity:</span>
                <span className="font-semibold text-[#1B1512]">
                  {formData.estimatedQuantity} units
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A7968]">Delivery Destination:</span>
                <span className="font-semibold text-[#1B1512]">{formData.deliveryCity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A7968]">Target Schedule:</span>
                <span className="font-semibold text-[#1B1512]">{formData.targetDate}</span>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    organizationName: '',
                    contactPerson: '',
                    email: '',
                    phone: '',
                    garmentType: GARMENT_OPTIONS[0] ?? 'Corporate Uniforms & Suiting',
                    estimatedQuantity: 25,
                    deliveryCity: '',
                    targetDate: '',
                    specialRequirements: '',
                  });
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#5C1A32] hover:bg-[#451325] text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow-sm transition-all"
              >
                Submit Another Inquiry
              </button>
            </div>
          </div>
        ) : (
          /* Inquiry Form */
          <div className="bg-white border border-[#5C1A32]/15 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-[#5C1A32] text-white px-6 py-6 sm:px-8 sm:py-8 flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-normal text-[#FAF7F2]" style={serif}>
                  Commission an Atelier Brief
                </h2>
                <p className="text-xs text-[#E8DFC8] mt-1">
                  Complete the specifications below. Our master artisans will prepare tailored
                  fabric samples and cost estimates.
                </p>
              </div>
              <Building2 className="h-10 w-10 text-[#B8935A] opacity-80 hidden sm:block" />
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="p-6 sm:p-8 space-y-6">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg p-4">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Organization Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-bold tracking-wider text-[#544B45]">
                    Organization / Company Name <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7968]" />
                    <input
                      type="text"
                      name="organizationName"
                      required
                      placeholder="e.g. Prestige Hotels & Resorts / Apex Tech"
                      value={formData.organizationName}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2.5 bg-[#FAF7F2] border border-[#5C1A32]/20 rounded-lg text-xs sm:text-sm text-[#1B1512] focus:outline-none focus:border-[#5C1A32]"
                    />
                  </div>
                </div>

                {/* Contact Person */}
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-bold tracking-wider text-[#544B45]">
                    Key Contact Person <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7968]" />
                    <input
                      type="text"
                      name="contactPerson"
                      required
                      placeholder="e.g. Ms. Radhika Sharma"
                      value={formData.contactPerson}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2.5 bg-[#FAF7F2] border border-[#5C1A32]/20 rounded-lg text-xs sm:text-sm text-[#1B1512] focus:outline-none focus:border-[#5C1A32]"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-bold tracking-wider text-[#544B45]">
                    Official Email <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7968]" />
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="procurement@organization.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2.5 bg-[#FAF7F2] border border-[#5C1A32]/20 rounded-lg text-xs sm:text-sm text-[#1B1512] focus:outline-none focus:border-[#5C1A32]"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-bold tracking-wider text-[#544B45]">
                    Direct Phone / WhatsApp <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7968]" />
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2.5 bg-[#FAF7F2] border border-[#5C1A32]/20 rounded-lg text-xs sm:text-sm text-[#1B1512] focus:outline-none focus:border-[#5C1A32]"
                    />
                  </div>
                </div>

                {/* Garment Type */}
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-bold tracking-wider text-[#544B45]">
                    Garment Category <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7968]" />
                    <select
                      name="garmentType"
                      value={formData.garmentType}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2.5 bg-[#FAF7F2] border border-[#5C1A32]/20 rounded-lg text-xs sm:text-sm text-[#1B1512] focus:outline-none focus:border-[#5C1A32]"
                    >
                      {GARMENT_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Estimated Quantity */}
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-bold tracking-wider text-[#544B45]">
                    Estimated Quantity (Units) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    name="estimatedQuantity"
                    min="1"
                    required
                    placeholder="e.g. 50"
                    value={formData.estimatedQuantity}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#5C1A32]/20 rounded-lg text-xs sm:text-sm text-[#1B1512] focus:outline-none focus:border-[#5C1A32]"
                  />
                </div>

                {/* Delivery City */}
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-bold tracking-wider text-[#544B45]">
                    Delivery City / State <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7968]" />
                    <input
                      type="text"
                      name="deliveryCity"
                      required
                      placeholder="e.g. Bengaluru, Karnataka"
                      value={formData.deliveryCity}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2.5 bg-[#FAF7F2] border border-[#5C1A32]/20 rounded-lg text-xs sm:text-sm text-[#1B1512] focus:outline-none focus:border-[#5C1A32]"
                    />
                  </div>
                </div>

                {/* Target Date */}
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-bold tracking-wider text-[#544B45]">
                    Target Delivery Date <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7968]" />
                    <input
                      type="date"
                      name="targetDate"
                      required
                      value={formData.targetDate}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2.5 bg-[#FAF7F2] border border-[#5C1A32]/20 rounded-lg text-xs sm:text-sm text-[#1B1512] focus:outline-none focus:border-[#5C1A32]"
                    />
                  </div>
                </div>
              </div>

              {/* Special Requirements */}
              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-bold tracking-wider text-[#544B45]">
                  Special Requirements, Embroideries, or Brand Identity Notes
                </label>
                <textarea
                  name="specialRequirements"
                  rows={4}
                  placeholder="Describe your design specifications, corporate color palette, embroidered logo placements, preferred weaves (e.g. Banarasi silk, Egyptian cotton, wool blends), or packaging preferences..."
                  value={formData.specialRequirements}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#5C1A32]/20 rounded-lg text-xs sm:text-sm text-[#1B1512] focus:outline-none focus:border-[#5C1A32]"
                />
              </div>

              {/* Submission Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#5C1A32]/10">
                <p className="text-[11px] text-[#8A7968]">
                  Strict confidentiality guaranteed. We sign corporate NDAs upon request.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-3 bg-[#5C1A32] hover:bg-[#451325] text-white text-xs font-semibold uppercase tracking-widest rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    'Submitting Brief...'
                  ) : (
                    <>
                      <span>Transmit Corporate Request</span>
                      <ArrowRight className="h-4 w-4 text-[#B8935A]" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
