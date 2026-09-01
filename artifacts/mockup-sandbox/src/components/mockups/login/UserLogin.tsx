export function UserLogin() {
  return (
    <div className="min-h-screen bg-[#FAF7F4] flex flex-col">
      {/* Status bar area */}
      <div className="h-12 bg-[#FAF7F4]" />

      {/* Top decorative wave */}
      <div className="relative">
        <svg viewBox="0 0 390 180" className="w-full" style={{ marginTop: -1 }}>
          <defs>
            <linearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#E8927C" />
              <stop offset="100%" stopColor="#C97B6B" />
            </linearGradient>
          </defs>
          <ellipse cx="195" cy="0" rx="260" ry="150" fill="url(#waveGrad)" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: 16 }}>
          {/* Logo / icon */}
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-2">
            <svg viewBox="0 0 32 32" className="w-9 h-9" fill="none">
              <circle cx="16" cy="12" r="6" fill="white" opacity="0.9" />
              <path d="M8 26c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.9" />
              {/* bump */}
              <ellipse cx="21" cy="20" rx="4" ry="5" fill="white" opacity="0.7" />
            </svg>
          </div>
          <h1 className="text-white text-2xl font-bold" style={{ fontFamily: "Georgia, serif", letterSpacing: 0.5 }}>Nurture</h1>
          <p className="text-white/80 text-xs mt-0.5">Your pregnancy companion</p>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col px-6 -mt-6 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl p-6 space-y-5">
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-800" style={{ fontFamily: "Georgia, serif" }}>Welcome back</h2>
            <p className="text-sm text-gray-500 mt-0.5">Sign in to continue your journey</p>
          </div>

          {/* Phone field */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mobile Number</label>
            <div className="flex items-center mt-1.5 border border-gray-200 rounded-2xl overflow-hidden bg-gray-50">
              <span className="px-3 py-3 text-sm font-medium text-gray-700 border-r border-gray-200 bg-white">+91</span>
              <input
                type="tel"
                placeholder="98765 43210"
                className="flex-1 px-3 py-3 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
                readOnly
              />
            </div>
          </div>

          {/* OTP row */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">OTP</label>
            <div className="flex gap-2 mt-1.5">
              {["·", "·", "·", "·"].map((_, i) => (
                <div key={i} className="flex-1 h-12 rounded-xl border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
                  {i === 0 && <span className="w-2 h-2 rounded-full bg-[#E8927C]" />}
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-400">OTP sent to your number</span>
              <button className="text-xs font-semibold text-[#E8927C]">Resend</button>
            </div>
          </div>

          {/* CTA */}
          <button className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm" style={{ background: "linear-gradient(135deg, #E8927C, #C97B6B)" }}>
            Verify & Sign In
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Google */}
          <button className="w-full py-3 rounded-2xl border border-gray-200 flex items-center justify-center gap-2.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
            <svg viewBox="0 0 24 24" className="w-4 h-4">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>

        {/* New user link */}
        <p className="text-center text-sm text-gray-500 mt-5">
          New here?{" "}
          <span className="font-semibold text-[#E8927C]">Create your profile</span>
        </p>

        {/* Privacy note */}
        <p className="text-center text-[10px] text-gray-400 mt-3 px-4 leading-relaxed">
          Your data stays private on your device. We never share personal health information.
        </p>
      </div>

      {/* Bottom safe area */}
      <div className="h-8" />
    </div>
  );
}
