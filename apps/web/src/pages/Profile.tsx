import { useState } from "react";
import { User, Pencil, Save, X, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// ── Design tokens (same family as Home.jsx) ────────────────────────────────
const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

// Tape-tick divider, echoing TapeRule from Home.jsx
function TapeRule({ tone = "wine" }: { tone?: "wine" | "brass" }) {
  const ticks = Array.from({ length: 41 });
  const tickColor = tone === "wine" ? "bg-[#5C1A32]/25" : "bg-[#B8935A]/50";
  const majorColor = tone === "wine" ? "bg-[#5C1A32]/50" : "bg-[#B8935A]/80";
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

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();

  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [gender, setGender] = useState(user?.gender ?? "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const startEditing = () => {
    setUsername(user.username);
    setEmail(user.email);
    setGender(user.gender);
    setPhoneNumber(user.phoneNumber);
    setError("");
    setSaved(false);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setError("");
  };

  const handleSave = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!username || !email || !gender || !phoneNumber) {
      setError("Please fill in all fields.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!/^\d{10}$/.test(phoneNumber)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    setSubmitting(true);
    try {
      await updateProfile({ username, email, gender, phoneNumber });
      setEditing(false);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update profile.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#F6F1E7]">
      {/* ---------------- HERO ---------------- */}
      <section className="w-full px-6 pt-20 pb-14">
        <div className="max-w-xl mx-auto text-center">
          <div className="h-16 w-16 rounded-sm bg-[#1B1512] flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl text-[#F6F1E7]" style={serif}>
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="inline-block text-[11px] font-semibold tracking-[0.25em] text-[#5C1A32] uppercase mb-4">
            Your Account
          </span>
          <h1
            className="text-4xl md:text-5xl text-[#1B1512] font-medium leading-[1.1] mb-3"
            style={serif}
          >
            My Profile
          </h1>
          <p className="text-[#4A413B] text-sm">Your JoJo Flora account details</p>
        </div>
      </section>

      <TapeRule tone="wine" />

      {/* ---------------- ACCOUNT CARD ---------------- */}
      <section className="w-full px-6 py-16">
        <div className="max-w-xl mx-auto bg-[#F6F1E7] border border-[#5C1A32]/15">
          <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-[#5C1A32]/10">
            <div className="flex items-center gap-2.5">
              <User className="h-4 w-4 text-[#5C1A32]" />
              <h2 className="text-[11px] font-semibold tracking-[0.25em] text-[#1B1512] uppercase">
                Account Details
              </h2>
            </div>
            {!editing && (
              <button
                onClick={startEditing}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5C1A32] hover:opacity-70 transition-opacity"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
          </div>

          <div className="px-8 pt-6">
            {saved && !editing && (
              <div className="mb-5 inline-flex items-center gap-1.5 border border-[#5C1A32]/20 bg-[#5C1A32]/5 text-[#5C1A32] text-sm px-3 py-2 rounded-sm">
                <CheckCircle2 className="h-4 w-4" />
                Profile updated
              </div>
            )}

            {error && (
              <div className="mb-5 border border-[#5C1A32]/30 bg-[#5C1A32]/5 text-[#5C1A32] text-sm px-3 py-2 rounded-sm">
                {error}
              </div>
            )}
          </div>

          <div className="px-8 pb-8">
            {editing ? (
              <form onSubmit={(e) => { void handleSave(e); }} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); }}
                    className="w-full rounded-sm border border-[#5C1A32]/20 bg-[#F6F1E7] px-3 py-2.5 text-sm text-[#1B1512] focus:outline-none focus:ring-1 focus:ring-[#5C1A32] focus:border-[#5C1A32]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); }}
                    className="w-full rounded-sm border border-[#5C1A32]/20 bg-[#F6F1E7] px-3 py-2.5 text-sm text-[#1B1512] focus:outline-none focus:ring-1 focus:ring-[#5C1A32] focus:border-[#5C1A32]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase mb-2">
                    Gender
                  </label>
                  <div className="flex gap-2">
                    {["Female", "Male", "Other"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => { setGender(g); }}
                        className={`flex-1 px-3 py-2.5 rounded-sm text-xs font-medium border transition-colors ${
                          gender === g
                            ? "bg-[#1B1512] border-[#1B1512] text-[#F6F1E7]"
                            : "border-[#5C1A32]/20 text-[#4A413B] hover:border-[#5C1A32]"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => { setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10)); }}
                    className="w-full rounded-sm border border-[#5C1A32]/20 bg-[#F6F1E7] px-3 py-2.5 text-sm text-[#1B1512] focus:outline-none focus:ring-1 focus:ring-[#5C1A32] focus:border-[#5C1A32]"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-sm bg-[#1B1512] text-[#F6F1E7] font-medium text-sm py-3 hover:bg-[#5C1A32] transition-colors disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {submitting ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="inline-flex items-center justify-center gap-2 rounded-sm border border-[#5C1A32]/20 text-[#4A413B] font-medium text-sm py-3 px-4 hover:border-[#5C1A32] hover:text-[#5C1A32] transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <dl className="space-y-0">
                <div className="flex items-center justify-between py-3.5 border-b border-[#5C1A32]/10">
                  <dt className="text-sm text-[#4A413B]">Username</dt>
                  <dd className="text-sm font-semibold text-[#1B1512]">{user.username}</dd>
                </div>
                <div className="flex items-center justify-between py-3.5 border-b border-[#5C1A32]/10">
                  <dt className="text-sm text-[#4A413B]">Email</dt>
                  <dd className="text-sm font-semibold text-[#1B1512]">{user.email}</dd>
                </div>
                <div className="flex items-center justify-between py-3.5 border-b border-[#5C1A32]/10">
                  <dt className="text-sm text-[#4A413B]">Gender</dt>
                  <dd className="text-sm font-semibold text-[#1B1512]">{user.gender}</dd>
                </div>
                <div className="flex items-center justify-between py-3.5">
                  <dt className="text-sm text-[#4A413B]">Phone Number</dt>
                  <dd className="text-sm font-semibold text-[#1B1512]">{user.phoneNumber}</dd>
                </div>
              </dl>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}