"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/hooks/use-auth"
import { databaseService, ExpiryItem, Product } from "@/lib/appwrite/database-service"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, PlusCircle, Trash2, Filter, Calendar } from "lucide-react"
import { format, differenceInDays, isToday, isTomorrow } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { BackToTop } from "@/components/ui/back-to-top"

interface ExpiryItemWithProduct extends ExpiryItem {
  product?: Product;
}

type ExpiryFilter = 'all' | 'today' | 'tomorrow' | 'week' | 'expired';

export default function HomePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [greeting, setGreeting] = useState("Good day")
  const [loading, setLoading] = useState(true)
  const [expiryItems, setExpiryItems] = useState<ExpiryItemWithProduct[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeFilter, setActiveFilter] = useState<ExpiryFilter>('all')
  
  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Good morning")
    else if (hour < 18) setGreeting("Good afternoon")
    else setGreeting("Good evening")
    
    // Load expiry items
    const loadExpiryItems = async () => {
      if (user) {
        try {
          // Get expiry items
          const items = await databaseService.listExpiryItems(user.$id, false)
          
          // Get product details for each expiry item
          const itemsWithProducts = await Promise.all(
            items.map(async (item) => {
              try {
                const product = await databaseService.getProduct(item.product_id)
                return { ...item, product }
              } catch (error) {
                return item
              }
            })
          )
          
          setExpiryItems(itemsWithProducts)
        } catch (error) {
          console.error("Error loading expiry items:", error)
        }
      }
      setLoading(false)
    }
    
    loadExpiryItems()
  }, [user])

  // Handle deleting an expiry item
  const handleDeleteItem = async (itemId: string) => {
    if (!user || isDeleting) return
    
    if (confirm("Are you sure you want to delete this item?")) {
      try {
        setIsDeleting(true)
        
        // Mark the item as deleted instead of permanently deleting it
        await databaseService.markExpiryItemAsDeleted(itemId)
        
        // Update the UI by removing the deleted item
        setExpiryItems(prev => prev.filter(item => item.$id !== itemId))
        
        // Show success message
        toast({
          title: "Item Deleted",
          description: "The item has been moved to the deleted items.",
        })
      } catch (error) {
        console.error("Error deleting item:", error)
        toast({
          title: "Delete Failed",
          description: "Could not delete the item. Please try again.",
          variant: "destructive"
        })
      } finally {
        setIsDeleting(false)
      }
    }
  }
  
  // Get expiry status and color
  const getExpiryStatus = (expiryDate: Date) => {
    const today = new Date()
    const daysUntilExpiry = differenceInDays(new Date(expiryDate), today)
    
    if (daysUntilExpiry < 0) {
      return { status: "Expired", color: "expiry-card-red", textColor: "text-red-500" }
    } else if (isToday(new Date(expiryDate))) {
      return { status: "Expiring Today", color: "expiry-card-red", textColor: "text-red-500" }
    } else if (isTomorrow(new Date(expiryDate))) {
      return { status: "Expiring Tomorrow", color: "expiry-card-yellow", textColor: "text-yellow-500" }
    } else if (daysUntilExpiry <= 7) {
      return { status: `Expiring in ${daysUntilExpiry} days`, color: "expiry-card-yellow", textColor: "text-yellow-500" }
    } else {
      return { status: "Good", color: "expiry-card-green", textColor: "text-green-500" }
    }
  }
  
  // Filter expiry items based on selected filter
  const getFilteredExpiryItems = () => {
    const today = new Date()
    
    switch (activeFilter) {
      case 'today':
        return expiryItems.filter(item => isToday(new Date(item.expiry_date)))
      case 'tomorrow':
        return expiryItems.filter(item => isTomorrow(new Date(item.expiry_date)))
      case 'week':
        return expiryItems.filter(item => {
          const daysUntil = differenceInDays(new Date(item.expiry_date), today)
          return daysUntil > 0 && daysUntil <= 7
        })
      case 'expired':
        return expiryItems.filter(item => {
          const daysUntil = differenceInDays(new Date(item.expiry_date), today)
          return daysUntil < 0
        })
      case 'all':
      default:
        return expiryItems
    }
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="container pt-4 pb-8 space-y-10">
      <BackToTop />
      <div className="flex flex-col space-y-3 bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-2xl -mt-2">
        <h1 className="text-xl font-bold text-[#004BFE]">{greeting}, {user?.name || 'User'}, welcome to your Stock & Expiry Tracker dashboard</h1>
      </div>

      {/* Upcoming Expiry Items */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="section-title">
            <Calendar className="h-5 w-5 mr-2 text-primary" />
            Upcoming Expiry Items
          </h2>
          <Button asChild size="sm" className="rounded-full bg-primary hover:bg-primary/90">
            <Link href="/dashboard/expiry">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Item
            </Link>
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2 pb-4 overflow-x-auto whitespace-nowrap">
          <button 
            className={`filter-button ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Items
          </button>
          <button 
            className={`filter-button ${activeFilter === 'today' ? 'active' : ''}`}
            onClick={() => setActiveFilter('today')}
          >
            Expiring Today
          </button>
          <button 
            className={`filter-button ${activeFilter === 'tomorrow' ? 'active' : ''}`}
            onClick={() => setActiveFilter('tomorrow')}
          >
            Expiring Tomorrow
          </button>
          <button 
            className={`filter-button ${activeFilter === 'week' ? 'active' : ''}`}
            onClick={() => setActiveFilter('week')}
          >
            This Week
          </button>
          <button 
            className={`filter-button ${activeFilter === 'expired' ? 'active' : ''}`}
            onClick={() => setActiveFilter('expired')}
          >
            Expired
          </button>
        </div>
        
        {getFilteredExpiryItems().length === 0 ? (
          <div className="bg-muted/50 rounded-xl p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium">No expiry items found</h3>
            <p className="text-muted-foreground mt-2">Start tracking product expiry dates by adding items.</p>
            <Button asChild className="mt-6 rounded-full">
              <Link href="/dashboard/expiry">Add Expiry Item</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {getFilteredExpiryItems().slice(0, 6).map((item) => {
              const { status, color, textColor } = getExpiryStatus(item.expiry_date)
              return (
                <div key={item.$id} className={`dashboard-card ${color} overflow-hidden`}>
                  <div className="relative w-full h-48 overflow-hidden">
                    {item.product?.image_id ? (
                      <div className="relative h-full w-full">
                        <img
                          src={'/placeholder-image.svg'}
                          alt={item.product.name}
                          className="absolute h-full w-full object-cover"
                        />
                        <img
                          src={databaseService.getFilePreview(item.product.image_id)}
                          alt={item.product.name}
                          className="relative h-full w-full object-cover"
                          onError={(e) => {
                            // If image fails to load, hide it and show only the placeholder
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <img
                          src={'/placeholder-image.svg'}
                          alt="No image available"
                          className="h-20 w-20 opacity-50"
                        />
                      </div>
                    )}
                    <div className={`expiry-badge ${textColor} bg-white/90 backdrop-blur-sm`}>
                      {status}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">
                      {item.product?.name || "Unknown Product"}
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                      <div className="text-muted-foreground">Quantity:</div>
                      <div className="font-medium">{item.quantity}</div>
                      <div className="text-muted-foreground">Expiry Date:</div>
                      <div className="font-medium">{format(new Date(item.expiry_date), "MMM d, yyyy")}</div>
                    </div>
                    <button 
                      onClick={() => item.$id ? handleDeleteItem(item.$id) : undefined}
                      className="w-full py-2 px-4 rounded-full bg-red-500 hover:bg-red-600 text-white font-medium flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        
        {getFilteredExpiryItems().length > 6 && (
          <div className="text-center mt-6">
            <Button asChild variant="outline" className="rounded-full px-6">
              <Link href="/dashboard/expiry">View All Expiry Items</Link>
            </Button>
          </div>
        )}
      </div>


    </main>
  )
}
