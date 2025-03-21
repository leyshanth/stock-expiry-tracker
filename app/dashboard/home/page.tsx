"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/hooks/use-auth"
import { databaseService, ExpiryItem, Product } from "@/lib/appwrite/database-service"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, PlusCircle, Trash2 } from "lucide-react"
import { format, differenceInDays } from "date-fns"
import { useToast } from "@/components/ui/use-toast"

interface ExpiryItemWithProduct extends ExpiryItem {
  product?: Product;
}

export default function HomePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [greeting, setGreeting] = useState("Good day")
  const [loading, setLoading] = useState(true)
  const [expiryItems, setExpiryItems] = useState<ExpiryItemWithProduct[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  
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
    } else if (daysUntilExpiry <= 7) {
      return { status: "Expiring Soon", color: "expiry-card-yellow", textColor: "text-yellow-500" }
    } else {
      return { status: "Good", color: "expiry-card-green", textColor: "text-green-500" }
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
    <main className="container py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">{greeting}, {user?.name || 'User'}</h1>
        <p className="text-muted-foreground">
          Welcome to your Stock & Expiry Tracker dashboard.
        </p>
      </div>

      {/* Upcoming Expiry Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Upcoming Expiry Items</h2>
          <Button asChild size="sm">
            <Link href="/dashboard/expiry">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Item
            </Link>
          </Button>
        </div>
        
        {expiryItems.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
              <h3 className="text-lg font-medium">No expiry items found</h3>
              <p className="text-muted-foreground mt-2">Start tracking product expiry dates by adding items.</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/expiry">Add Expiry Item</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {expiryItems.slice(0, 6).map((item) => {
              const { status, color, textColor } = getExpiryStatus(item.expiry_date)
              return (
                <Card key={item.$id} className={`expiry-card ${color}`}>
                  <CardHeader className="pb-2">
                    <Badge className={`${textColor} bg-transparent`}>{status}</Badge>
                    <CardTitle className="text-lg mt-2">
                      {item.product?.name || "Unknown Product"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Quantity:</div>
                      <div>{item.quantity}</div>
                      <div className="text-muted-foreground">Expiry Date:</div>
                      <div>{format(new Date(item.expiry_date), "MMM d, yyyy")}</div>
                      <div className="text-muted-foreground">Barcode:</div>
                      <div className="truncate">{item.barcode}</div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/dashboard/expiry?id=${item.$id || ''}`}>View Details</Link>
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => item.$id ? handleDeleteItem(item.$id) : undefined}
                      className="px-3"
                    >
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
        
        {expiryItems.length > 6 && (
          <div className="text-center mt-4">
            <Button asChild variant="outline">
              <Link href="/dashboard/expiry">View All Expiry Items</Link>
            </Button>
          </div>
        )}
      </div>


    </main>
  )
}
