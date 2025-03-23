import React from 'react';
import Image from 'next/image';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex flex-col relative overflow-hidden">
      {/* Top blue curved background */}
      <div className="absolute top-0 left-0 right-0 h-[45%] bg-[#004BFE] rounded-b-[50px] z-0">
        {/* Status bar mockup for mobile */}
        <div className="flex justify-between items-center px-5 py-2 text-white text-xs">
          <div>9:41</div>
          <div className="flex space-x-1">
            <div className="w-4 h-3">📶</div>
            <div className="w-4 h-3">📶</div>
            <div className="w-4 h-3">🔋</div>
          </div>
        </div>
      </div>
      
      {/* Right bubble */}
      <div className="absolute top-[40%] right-0 z-0">
        <div className="w-24 h-24 bg-[#004BFE] rounded-full transform translate-x-1/2"></div>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 z-10">
        <div className="w-full max-w-md bg-white rounded-xl p-6 mt-12">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="mt-1 text-gray-600">{subtitle}</p>}
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
}
