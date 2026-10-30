import { useState } from 'react';
import { MessageCircle, X, Sparkles, Send, ShieldCheck } from 'lucide-react';

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

const WHATSAPP_NUMBER = '919345816672'; // JoJo Flora Official Concierge

const CONCIERGE_PROMPTS = [
  {
    title: 'Book a Home Fitting',
    message:
      'Hello JoJo Flora! I would like to schedule a Master Tailor home visit in Chennai / Coimbatore / Bengaluru.',
  },
  {
    title: 'Bridal & Couture Blouse Inquiry',
    message:
      'Hello JoJo Flora Atelier! I am looking for custom bridal blouse and hand zardozi embroidery options.',
  },
  {
    title: 'Fabric Swatch & Silk Consultation',
    message:
      'Hello JoJo Flora! Could you assist me with pure silk fabric recommendations from your library?',
  },
  {
    title: 'Check Existing Order Status',
    message: 'Hello JoJo Flora Atelier! I would like an update on my bespoke tailoring order.',
  },
];

export default function WhatsAppConcierge() {
  const [isOpen, setIsOpen] = useState(false);
  const [customText, setCustomText] = useState('');

  const handleSend = (text: string) => {
    const encoded = encodeURIComponent(
      text.trim() || 'Hello JoJo Flora Atelier! I would like to inquire about bespoke tailoring.',
    );
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`,
      '_blank',
      'noopener,noreferrer',
    );
    setIsOpen(false);
    setCustomText('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 print:hidden font-sans">
      {/* Floating Card */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 rounded-lg bg-white border border-[#5C1A32]/15 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-[#5C1A32] text-[#FAF7F2] p-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[#FAF7F2] text-[#5C1A32] flex items-center justify-center font-bold text-xs tracking-wider border border-[#B8935A]">
                  JF
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#5C1A32]" />
              </div>
              <div>
                <h4
                  className="text-sm font-semibold tracking-wide flex items-center gap-1.5"
                  style={serif}
                >
                  JoJo Flora Concierge <Sparkles className="w-3.5 h-3.5 text-[#B8935A]" />
                </h4>
                <p className="text-[11px] text-[#FAF7F2]/80 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#B8935A]" /> Master Stylists Online · Fast
                  Reply
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#FAF7F2]/80 hover:text-[#FAF7F2] p-1 rounded transition-colors"
              aria-label="Close concierge"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 bg-[#FAF7F2]/60 space-y-3">
            <p className="text-xs text-[#4A413B] leading-relaxed">
              Welcome to our bespoke atelier. How may our styling team assist you today?
            </p>

            {/* Quick Prompts */}
            <div className="space-y-1.5">
              {CONCIERGE_PROMPTS.map((prompt) => (
                <button
                  key={prompt.title}
                  onClick={() => handleSend(prompt.message)}
                  className="w-full text-left p-2.5 rounded-md bg-white border border-[#5C1A32]/10 hover:border-[#5C1A32] hover:bg-[#5C1A32]/5 text-[#1B1512] text-xs font-medium transition-all flex items-center justify-between group"
                >
                  <span>{prompt.title}</span>
                  <span className="text-[#B8935A] opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="pt-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(customText);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="flex-1 bg-white border border-[#5C1A32]/20 rounded-md px-3 py-2 text-xs text-[#1B1512] placeholder:text-[#4A413B]/50 focus:outline-none focus:ring-1 focus:ring-[#5C1A32]"
                />
                <button
                  type="submit"
                  className="bg-[#5C1A32] hover:bg-[#431223] text-[#FAF7F2] p-2 rounded-md transition-colors shrink-0"
                  title="Send via WhatsApp"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group relative flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          aria-label="Open WhatsApp Concierge"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
          </span>
          <MessageCircle className="w-5 h-5 text-white" />
          <span className="hidden sm:inline text-xs font-semibold tracking-wider uppercase pr-1">
            Stylist Chat
          </span>
        </button>
      </div>
    </div>
  );
}
