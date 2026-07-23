import { Link } from "react-router-dom";
import {
  ArrowRight,
  Ruler,
  Scissors,
  PackageCheck,
  Truck,
  Star,
  MapPin,
  Users,
  Store,
} from "lucide-react";

export default function Home() {
  const steps = [
    {
      icon: <Ruler className="h-6 w-6" />,
      title: "Share Measurements",
      desc: "Tell us your size or book a home measurement visit.",
    },
    {
      icon: <Scissors className="h-6 w-6" />,
      title: "Pick Fabric & Design",
      desc: "Choose from our fabric library or bring your own idea.",
    },
    {
      icon: <PackageCheck className="h-6 w-6" />,
      title: "Crafted by Artisans",
      desc: "Our tailors stitch your outfit with a quality check at every stage.",
    },
    {
      icon: <Truck className="h-6 w-6" />,
      title: "Delivered to You",
      desc: "Track your order in real time until it reaches your doorstep.",
    },
  ];

  const reviews = [
    {
      name: "Priya S.",
      city: "Chennai",
      rating: 5,
      text: "The blouse fit perfectly on the first try. Fabric quality is genuinely premium.",
    },
    {
      name: "Anitha R.",
      city: "Coimbatore",
      rating: 5,
      text: "Loved how easy it was to customize the kurti. Delivery was faster than I expected.",
    },
    {
      name: "Divya K.",
      city: "Bengaluru",
      rating: 4,
      text: "Great tailoring and support team. Will definitely order again for the festive season.",
    },
  ];

  const stages = [
    { label: "Order Confirmed", day: "Day 0" },
    { label: "Stitching in Progress", day: "Day 1–4" },
    { label: "Quality Check", day: "Day 5" },
    { label: "Shipped", day: "Day 6" },
    { label: "Delivered", day: "Day 7–8" },
  ];

  const franchiseStats = [
    { icon: <Store className="h-5 w-5" />, label: "Outlets", value: "25+" },
    { icon: <MapPin className="h-5 w-5" />, label: "Cities", value: "12" },
    { icon: <Users className="h-5 w-5" />, label: "Happy Partners", value: "40+" },
  ];

  return (
    <div className="w-full">
      {/* ---------------- HERO ---------------- */}
      <section className="w-full px-6 py-20 text-center bg-rose-50/40">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
          Tailored Outfits, Made for You
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto mb-8">
          Premium fabrics, custom fits, and artisan craftsmanship — delivered
          to your door.
        </p>
        <Link
          to="/custom-outfit"
          className="inline-flex items-center gap-2 bg-fuchsia-800 text-white font-semibold text-sm px-6 py-3 rounded-full hover:bg-fuchsia-900 transition-colors"
        >
          Start Customizing
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* ---------------- FEATURE CARDS ---------------- */}
      <section className="w-full px-6 py-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/custom-outfit"
            className="group rounded-3xl bg-gradient-to-br from-fuchsia-800 via-pink-700 to-rose-800 shadow-sm hover:shadow-md transition-shadow p-8 flex flex-col text-white"
          >
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-6">
              <span className="text-2xl">✂️</span>
            </div>
            <h3 className="text-2xl font-serif font-bold mb-2">Custom Outfit</h3>
            <p className="text-white/80 text-sm leading-relaxed mb-6">
              Design a blouse, kurti, or palazzo from scratch. Share your
              measurements and let our artisans craft perfection.
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              {["Blouse", "Kurti", "Pant"].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-white/20 text-xs font-medium"
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

          <Link
            to="/fabrics"
            className="group rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-8 flex flex-col"
          >
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-rose-700 to-purple-800 flex items-center justify-center mb-6">
              <span className="text-2xl">🧵</span>
            </div>
            <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">
              Fabric &amp; Material
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Browse silks, cottons, georgettes and more. Filter by warm,
              cool, or neutral tones.
            </p>
            <div className="flex items-center gap-2 mb-6">
              <span className="h-4 w-4 rounded-full bg-red-900" />
              <span className="h-4 w-4 rounded-full bg-blue-700" />
              <span className="h-4 w-4 rounded-full bg-stone-300" />
              <span className="h-4 w-4 rounded-full bg-indigo-950" />
              <span className="h-4 w-4 rounded-full bg-yellow-500" />
              <span className="text-xs text-gray-400 ml-1">9 fabrics</span>
            </div>
            <span className="mt-auto inline-flex items-center gap-1.5 text-fuchsia-800 font-semibold text-sm group-hover:gap-2.5 transition-all">
              Explore Fabrics
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section className="w-full px-6 py-16 bg-rose-50/40">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-serif font-bold text-gray-900 text-center mb-2">
            How It Works
          </h2>
          <p className="text-gray-500 text-center mb-12">
            From fabric to fit, here's how your outfit comes to life.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-fuchsia-800 to-rose-700 text-white flex items-center justify-center mb-4">
                  {step.icon}
                </div>
                <span className="text-xs font-semibold text-fuchsia-800">
                  STEP {i + 1}
                </span>
                <h3 className="text-base font-semibold text-gray-900 mt-1 mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- REVIEWS ---------------- */}
      <section className="w-full px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-serif font-bold text-gray-900 text-center mb-2">
            What Our Customers Say
          </h2>
          <p className="text-gray-500 text-center mb-12">
            Real reviews from real JoJo Flora customers.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((r) => (
              <div
                key={r.name}
                className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < r.rating
                          ? "fill-yellow-500 text-yellow-500"
                          : "text-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  "{r.text}"
                </p>
                <div className="flex items-center gap-1 text-sm">
                  <span className="font-semibold text-gray-900">{r.name}</span>
                  <span className="text-gray-400">· {r.city}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- DELIVERY PROCESS ---------------- */}
      <section className="w-full px-6 py-16 bg-rose-50/40">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-serif font-bold text-gray-900 text-center mb-2">
            How Delivery Works
          </h2>
          <p className="text-gray-500 text-center mb-12">
            Track every stage, from stitching to your doorstep.
          </p>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 md:gap-2">
            {stages.map((stage, i) => (
              <div
                key={stage.label}
                className="flex-1 flex md:flex-col items-center md:items-center text-center gap-3 relative"
              >
                <div className="h-10 w-10 shrink-0 rounded-full bg-fuchsia-800 text-white flex items-center justify-center font-semibold text-sm">
                  {i + 1}
                </div>
                <div className="md:mt-2">
                  <div className="text-sm font-semibold text-gray-900">
                    {stage.label}
                  </div>
                  <div className="text-xs text-gray-400">{stage.day}</div>
                </div>
                {i < stages.length - 1 && (
                  <div className="hidden md:block absolute top-5 left-[calc(50%+28px)] w-[calc(100%-24px)] h-px bg-gray-200" />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-10">
            Estimated timelines vary by outfit type and city. Live tracking
            available from the Orders page once shipped.
          </p>
        </div>
      </section>

      {/* ---------------- FRANCHISE ---------------- */}
      <section className="w-full px-6 py-16">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-fuchsia-800 via-pink-700 to-rose-800 text-white p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-lg">
            <h2 className="text-3xl font-serif font-bold mb-3">
              Become a JoJo Flora Franchise Partner
            </h2>
            <p className="text-white/80 text-sm leading-relaxed mb-6">
              Bring the JoJo Flora tailoring experience to your city. Low
              investment, full training, and end-to-end business support.
            </p>
            <div className="flex flex-wrap gap-6 mb-8">
              {franchiseStats.map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
                    {s.icon}
                  </span>
                  <div>
                    <div className="font-bold leading-none">{s.value}</div>
                    <div className="text-xs text-white/70">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/franchise"
              className="inline-flex items-center gap-2 bg-white text-fuchsia-800 font-semibold text-sm px-5 py-3 rounded-full hover:bg-white/90 transition-colors"
            >
              Apply for Franchise
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}