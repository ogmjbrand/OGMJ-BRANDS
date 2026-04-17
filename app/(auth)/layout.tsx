import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#07070A] via-[#0E1116] to-[#07070A]">
      <div className="w-full max-w-md">
        {/* Auth Pages Container */}
        <div className="backdrop-blur-md bg-[#0E1116]/80 border border-[#D4AF37]/10 rounded-2xl p-8 shadow-2xl">
          {children}
        </div>

        {/* Decorative Footer */}
        <div className="mt-8 text-center text-xs text-[#D4AF37]/50">
          <p>© 2026 OGMJ BRANDS — Global AI-Powered Growth</p>
        </div>
      </div>
    </div>
  );
}
