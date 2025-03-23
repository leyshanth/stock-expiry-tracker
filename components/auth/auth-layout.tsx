import React from 'react';
import Image from 'next/image';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Top curved shape */}
      <div className="relative h-72 bg-[#004BFE] rounded-bl-[40%]">
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-4xl font-bold text-white text-center">
            Stock & Expiry
            <br />
            Tracker
          </h1>
        </div>
      </div>

      {/* Bottom right curved shape */}
      <div className="absolute right-0 top-1/2 w-24 h-32 bg-[#004BFE] rounded-tl-full" />

      {/* Light blue decorative shape */}
      <div className="absolute left-0 bottom-0 w-64 h-64 bg-blue-100 rounded-tr-full opacity-50" />

      {/* Login content */}
      <div className="flex-1 px-8 pt-12 z-10">
        <h2 className="text-5xl font-bold mb-2">{title}</h2>
        {subtitle && <p className="text-gray-700 mb-8">{subtitle}</p>}
        
        {children}
      </div>

      {/* Bottom indicator */}
      <div className="flex justify-center pb-6">
        <div className="w-12 h-1 bg-black rounded-full"></div>
      </div>
    </div>
  );
}
