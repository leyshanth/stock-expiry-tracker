"use client"

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { BackToTop } from "@/components/ui/back-to-top"
import { Mail } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"

export default function AboutPage() {
  const { user } = useAuth()
  return (
    <div className="pb-8">
      <BackToTop />
      
      {/* Blue Header with White Text */}
      <div className="bg-[#004BFE] text-white p-4 pt-6 pb-16 rounded-b-3xl">
        <h1 className="text-xl font-bold">About</h1>
        <p className="text-white/80 mt-1">Learn more about Stock Expiry Tracker</p>
      </div>
      
      <div className="container mx-auto max-w-3xl -mt-10">
      
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 p-6 flex flex-col items-center justify-center bg-muted/30">
              <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-primary/20 shadow-xl mb-4 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <span className="text-4xl font-bold text-primary/70">L</span>
              </div>
              <h2 className="text-xl font-bold text-center">Leyshanth</h2>
              <p className="text-muted-foreground text-center mt-1">Developer & Designer</p>
              
              <div className="flex gap-3 mt-4">
                <a 
                  href={`mailto:leyshanth.1177@gmail.com?subject=Stock Expiry Tracker - Contact`} 
                  className="p-2 rounded-full bg-[#004BFE] hover:bg-[#004BFE]/90 text-white transition-colors"
                  title="Email Leyshanth"
                >
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>
            
            <div className="md:w-2/3 p-8">
              <h3 className="text-2xl font-bold mb-4">About the App</h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  My name is Leyshanth, and I design and build this app to provide an easy and efficient solution for tracking product expiry dates, specifically designed for retail stores.
                </p>
                <p>
                  This app not only simplifies expiry management but also helps ensure compliance with industry standards and regulations, making day-to-day operations smoother and more reliable.
                </p>
                <div className="pt-4">
                  <h4 className="text-lg font-semibold text-foreground mb-2">Key Features</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Barcode scanning for quick product identification</li>
                    <li>Expiry date tracking with visual indicators</li>
                    <li>Notifications for soon-to-expire products</li>
                    <li>Product inventory management</li>
                    <li>Modern, user-friendly interface</li>
                  </ul>
                </div>
                <div className="pt-4">
                  <h4 className="text-lg font-semibold text-foreground mb-2">Technologies Used</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-primary/10 rounded-full text-sm">Next.js</span>
                    <span className="px-3 py-1 bg-primary/10 rounded-full text-sm">React</span>
                    <span className="px-3 py-1 bg-primary/10 rounded-full text-sm">TypeScript</span>
                    <span className="px-3 py-1 bg-primary/10 rounded-full text-sm">Tailwind CSS</span>
                    <span className="px-3 py-1 bg-primary/10 rounded-full text-sm">Appwrite</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Stock Expiry Tracker. All rights reserved.</p>
      </div>
      </div>
    </div>
  )
}