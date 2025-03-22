"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/hooks/use-auth"
import { databaseService, ExpiryItem, Product } from "@/lib/appwrite/database-service"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, PlusCircle, Trash2, Filter, Calendar, X } from "lucide-react"
import { format, differenceInDays, isToday, isTomorrow, isWithinInterval } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { BackToTop } from "@/components/ui/back-to-top"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface ExpiryItemWithProduct extends ExpiryItem {
  product?: Product;
}

type ExpiryFilter = 'all' | 'today' | 'tomorrow' | 'week' | 'expired' | 'dateRange';

export default function HomePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [greeting, setGreeting] = useState("Good day")
  const [loading, setLoading] = useState(true)
  const [expiryItems, setExpiryItems] = useState<ExpiryItemWithProduct[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeFilter, setActiveFilter] = useState<ExpiryFilter>('all')
  
  // Date range filter state
  const [showDateRangeDialog, setShowDateRangeDialog] = useState(false)
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"))
  
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
      case 'dateRange':
        return expiryItems.filter(item => {
          const itemDate = new Date(item.expiry_date)
          const rangeStart = new Date(startDate)
          const rangeEnd = new Date(endDate)
          // Set time to end of day for the end date to include the full day
          rangeEnd.setHours(23, 59, 59, 999)
          return isWithinInterval(itemDate, { start: rangeStart, end: rangeEnd })
        })
      case 'all':
      default:
        return expiryItems
    }
  }
  
  // Apply date range filter
  const applyDateRangeFilter = () => {
    setActiveFilter('dateRange')
    setShowDateRangeDialog(false)
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
    <main className="pb-8 space-y-6">
      <BackToTop />
      {/* New Header with Blue Background */}
      <div className="bg-[#004BFE] text-white p-4 pt-6 pb-16 rounded-b-3xl">
        <h1 className="text-xl font-bold">{greeting} {user?.name || 'User'}</h1>
        <p className="text-white/80 mt-1">Welcome to your Date Expiry Tracker App</p>
      </div>

      {/* Filter Tabs - Moved up into a card that overlaps the header */}
      <div className="-mt-10 mx-4 bg-white rounded-xl shadow-md p-2 flex overflow-x-auto space-x-2">
        <button 
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${activeFilter === 'all' ? 'bg-[#004BFE] text-white' : 'bg-gray-100 text-gray-600'}`}
          onClick={() => setActiveFilter('all')}
        >
          All
        </button>
        <button 
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${activeFilter === 'today' ? 'bg-[#004BFE] text-white' : 'bg-gray-100 text-gray-600'}`}
          onClick={() => setActiveFilter('today')}
        >
          Today
        </button>
        <button 
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${activeFilter === 'tomorrow' ? 'bg-[#004BFE] text-white' : 'bg-gray-100 text-gray-600'}`}
          onClick={() => setActiveFilter('tomorrow')}
        >
          Tomorrow
        </button>
        <button 
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${activeFilter === 'week' ? 'bg-[#004BFE] text-white' : 'bg-gray-100 text-gray-600'}`}
          onClick={() => setActiveFilter('week')}
        >
          This Week
        </button>
        <button 
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${activeFilter === 'expired' ? 'bg-[#004BFE] text-white' : 'bg-gray-100 text-gray-600'}`}
          onClick={() => setActiveFilter('expired')}
        >
          Expired
        </button>
        <button 
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex items-center ${activeFilter === 'dateRange' ? 'bg-[#004BFE] text-white' : 'bg-gray-100 text-gray-600'}`}
          onClick={() => setShowDateRangeDialog(true)}
        >
          <Filter className="h-3 w-3 mr-1" />
          Filter
        </button>
      </div>

      {/* Upcoming Expiry Items with Add Button */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Upcoming Expiry Items</h2>
          <Button asChild size="sm" className="rounded-full bg-[#004BFE] hover:bg-[#004BFE]/90">
            <Link href="/dashboard/expiry">
              <span className="mr-1">+</span> Add Expiry Item
            </Link>
          </Button>
        </div>
        
        {getFilteredExpiryItems().length === 0 ? (
          <div className="bg-gray-100 rounded-xl p-8 text-center mt-4">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium">No expiry items found</h3>
            <p className="text-gray-500 mt-2">Start tracking product expiry dates by adding items.</p>
            <Button asChild className="mt-6 rounded-full bg-[#004BFE] hover:bg-[#004BFE]/90">
              <Link href="/dashboard/expiry">Add Expiry Item</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {getFilteredExpiryItems().slice(0, 6).map((item) => {
              const { status, color, textColor } = getExpiryStatus(item.expiry_date)
              return (
                <div key={item.$id} className="bg-[#E8F4F8] rounded-xl overflow-hidden flex mb-4">
                  <div className="relative w-1/3 h-auto overflow-hidden">
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
                      <div className="flex h-full w-full items-center justify-center bg-gray-200">
                        <img
                          src={'/placeholder-image.svg'}
                          alt="No image available"
                          className="h-20 w-20 opacity-50"
                        />
                      </div>
                    )}
                  </div>
                  <div className="p-4 w-2/3">
                    <h3 className="text-lg font-semibold">
                      {item.product?.name || "Item Name"}
                    </h3>
                    <p className="text-gray-500 mt-1">Expiry Date: {format(new Date(item.expiry_date), "dd/MM/yyyy")}</p>
                    <p className="text-gray-500">Qty - {item.quantity}</p>
                    <button 
                      onClick={() => item.$id ? handleDeleteItem(item.$id) : undefined}
                      className="mt-2 py-1 px-3 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-medium flex items-center justify-center transition-colors w-auto inline-flex"
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
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
            <Button asChild variant="outline" className="rounded-full px-6 border-[#004BFE] text-[#004BFE]">
              <Link href="/dashboard/expiry">View All Expiry Items</Link>
            </Button>
          </div>
        )}
      </div>
      
      {/* Date Range Filter Dialog */}
      <Dialog open={showDateRangeDialog} onOpenChange={setShowDateRangeDialog}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Filter by Date Range</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="startDate" className="text-sm font-medium">Start Date</label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="endDate" className="text-sm font-medium">End Date</label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg"
              />
            </div>
          </div>
          
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setShowDateRangeDialog(false)}
              className="rounded-full"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            
            <Button
              onClick={applyDateRangeFilter}
              className="rounded-full bg-[#004BFE] hover:bg-[#004BFE]/90"
            >
              <Filter className="mr-2 h-4 w-4" />
              Apply Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
