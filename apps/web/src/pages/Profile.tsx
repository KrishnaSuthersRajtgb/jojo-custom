import { useState } from "react";
import { User, Pencil, Save, X, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

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
    <div className="w-full">
      <section className="w-full px-6 py-14 bg-rose-50/40">
        <div className="max-w-xl mx-auto text-center">
          <div className="h-16 w-16 rounded-full bg-gradient-to-r from-fuchsia-800 to-pink-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-white">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">
            My Profile
          </h1>
          <p className="text-gray-500">Your JoJo account details</p>
        </div>
      </section>

      <section className="w-full px-6 py-10">
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-fuchsia-800" />
              <h2 className="text-xs font-bold tracking-wide text-gray-800">
                ACCOUNT DETAILS
              </h2>
            </div>
            {!editing && (
              <button
                onClick={startEditing}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-fuchsia-800 hover:underline"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
          </div>

          {saved && !editing && (
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2">
              <CheckCircle2 className="h-4 w-4" />
              Profile updated
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">
              {error}
            </div>
          )}

          {editing ? (
            <form onSubmit={(e) => { void handleSave(e); }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold tracking-wide text-gray-800 mb-2">
                  USERNAME
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); }}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-800 focus:border-fuchsia-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold tracking-wide text-gray-800 mb-2">
                  EMAIL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); }}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-800 focus:border-fuchsia-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold tracking-wide text-gray-800 mb-2">
                  GENDER
                </label>
                <div className="flex gap-2">
                  {["Female", "Male", "Other"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => { setGender(g); }}
                      className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                        gender === g
                          ? "bg-fuchsia-800 border-fuchsia-800 text-white"
                          : "border-gray-200 text-gray-600 hover:border-fuchsia-800"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold tracking-wide text-gray-800 mb-2">
                  PHONE NUMBER
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => { setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10)); }}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-800 focus:border-fuchsia-800"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-800 to-pink-600 text-white font-semibold py-3 hover:opacity-95 transition-opacity disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 text-gray-600 font-semibold py-3 px-4 hover:border-fuchsia-800 hover:text-fuchsia-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <dl className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-500">Username</dt>
                <dd className="text-sm font-semibold text-gray-900">{user.username}</dd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-500">Email</dt>
                <dd className="text-sm font-semibold text-gray-900">{user.email}</dd>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-500">Gender</dt>
                <dd className="text-sm font-semibold text-gray-900">{user.gender}</dd>
              </div>
              <div className="flex items-center justify-between py-2">
                <dt className="text-sm text-gray-500">Phone Number</dt>
                <dd className="text-sm font-semibold text-gray-900">{user.phoneNumber}</dd>
              </div>
            </dl>
          )}
        </div>
      </section>
    </div>
  );
}