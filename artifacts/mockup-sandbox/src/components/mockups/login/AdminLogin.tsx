import { useState } from "react";

export function AdminLogin() {
  const [show, setShow] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#1A1A2E" }}>
      {/* Status bar */}
      <div className="h-12" />

      {/* Top section */}
      <div className="flex flex-col items-center pt-10 pb-6 px-6">
        {/* Shield icon */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "linear-gradient(135deg, #E8927C22, #E8927C44)", border: "1.5px solid #E8927C55" }}
        >
          <svg viewBox="0 0 32 32" className="w-10 h-10" fill="none">
            <path
              d="M16 3L5 7v8c0 6.1 4.7 11.8 11 13 6.3-1.2 11-6.9 11-13V7L16 3z"
              fill="#E8927C"
              opacity="0.2"
            />
            <path
              d="M16 3L5 7v8c0 6.1 4.7 11.8 11 13 6.3-1.2 11-6.9 11-13V7L16 3z"
              stroke="#E8927C"
              strokeWidth="1.8"
              strokeLinejoin="round"
              fill="none"
            />
            <path d="M11.5 16l3 3 6-6" stroke="#E8927C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>Admin Portal</h1>
        <p className="text-sm mt-1" style={{ color: "#9CA3AF" }}>Nurture — restricted access</p>
      </div>

      {/* Form card */}
      <div className="flex-1 px-6">
        <div className="rounded-3xl p-6 space-y-5" style={{ background: "#16213E", border: "1px solid #2D3748" }}>

          {/* Role badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#E8927C15", border: "1px solid #E8927C30" }}>
            <div className="w-2 h-2 rounded-full bg-[#E8927C]" />
            <span className="text-xs font-semibold" style={{ color: "#E8927C" }}>Administrator Access</span>
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#6B7280" }}>Admin Email</label>
            <div className="mt-1.5 flex items-center rounded-2xl overflow-hidden px-3" style={{ background: "#0F3460", border: "1px solid #2D3748" }}>
              <svg viewBox="0 0 20 20" className="w-4 h-4 shrink-0" fill="none" style={{ color: "#6B7280" }}>
                <path d="M2.5 6.5l7.5 5 7.5-5M2.5 5h15a1 1 0 011 1v8a1 1 0 01-1 1h-15a1 1 0 01-1-1V6a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input
                type="email"
                placeholder="admin@nurture.app"
                readOnly
                className="flex-1 px-3 py-3.5 text-sm outline-none placeholder-gray-600"
                style={{ background: "transparent", color: "#E5E7EB" }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#6B7280" }}>Password</label>
            <div className="mt-1.5 flex items-center rounded-2xl overflow-hidden px-3" style={{ background: "#0F3460", border: "1px solid #2D3748" }}>
              <svg viewBox="0 0 20 20" className="w-4 h-4 shrink-0" fill="none" style={{ color: "#6B7280" }}>
                <rect x="4" y="9" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7 9V7a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                type={show ? "text" : "password"}
                placeholder="••••••••••"
                readOnly
                className="flex-1 px-3 py-3.5 text-sm outline-none placeholder-gray-600"
                style={{ background: "transparent", color: "#E5E7EB" }}
              />
              <button onClick={() => setShow(!show)} className="p-1">
                {show ? (
                  <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" style={{ color: "#6B7280" }}>
                    <path d="M3 3l14 14M8.5 8.6A3 3 0 0011.4 11.5M6.1 6.2A8 8 0 002 10s3 5 8 5a8 8 0 002.9-.55M9 4.1A8 8 0 0118 10s-.7 1.4-2 2.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" style={{ color: "#6B7280" }}>
                    <path d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* 2FA hint */}
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: "#E8927C0A", border: "1px dashed #E8927C30" }}>
            <svg viewBox="0 0 20 20" className="w-4 h-4 shrink-0 mt-0.5 text-[#E8927C]" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10 9v4M10 7h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p className="text-[11px] leading-relaxed" style={{ color: "#9CA3AF" }}>
              2-factor authentication code will be sent to your registered device.
            </p>
          </div>

          {/* Sign In button */}
          <button
            className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white"
            style={{ background: "linear-gradient(135deg, #E8927C, #C97B6B)" }}
          >
            Sign In to Dashboard
          </button>

          {/* Forgot */}
          <p className="text-center text-xs" style={{ color: "#6B7280" }}>
            Forgot credentials?{" "}
            <span className="font-semibold" style={{ color: "#E8927C" }}>Contact super admin</span>
          </p>
        </div>

        {/* Back link */}
        <button className="w-full mt-4 py-3 flex items-center justify-center gap-1.5 text-sm" style={{ color: "#6B7280" }}>
          <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
            <path d="M13 16l-5-6 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to user app
        </button>
      </div>

      {/* Audit note */}
      <p className="text-center text-[10px] pb-8 px-6 leading-relaxed" style={{ color: "#374151" }}>
        All admin sessions are logged and audited for compliance.
      </p>
    </div>
  );
}
