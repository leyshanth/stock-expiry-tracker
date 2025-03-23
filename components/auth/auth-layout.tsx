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
      {/* Top blue bubble */}
      <div className="absolute top-0 right-0 z-0">
        <Image 
          src="/design/bubble 01.png" 
          alt="Blue bubble decoration" 
          width={400} 
          height={400}
          priority
        />
      </div>
      
      {/* Bottom left bubble */}
      <div className="absolute bottom-0 left-0 z-0">
        <Image 
          src="/design/bubble 02.png" 
          alt="Blue bubble decoration" 
          width={300} 
          height={300}
        />
      </div>
      
      {/* Small bubble */}
      <div className="absolute top-1/2 right-0 z-0">
        <Image 
          src="/design/bubblle 03.png" 
          alt="Blue bubble decoration" 
          width={150} 
          height={150}
        />
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 z-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
}
