"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { databaseService, ExpiryItem, Product } from "@/lib/appwrite/database-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils/date-utils"
import { exportToCsv } from "@/lib/utils/csv-export"
import { Download, Trash2, RotateCcw, AlertTriangle } from "lucide-react"
import { BackToTop } from "@/components/ui/back-to-top"

export default function DeletedItemsPage() {
  const { user } = useAuth()
  const [deletedItems, setDeletedItems] = useState<(ExpiryItem & { product?: Product })[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchDeletedItems = async () => {
      if (!user) return

      try {
        setLoading(true)
        // Fetch all deleted expiry items
        const items = await databaseService.listExpiryItems(user.$id, true)
        
        // Fetch product details for each expiry item
        const itemsWithProducts = await Promise.all(
          items.map(async (item) => {
            try {
              const product = await databaseService.getProduct(item.product_id)
              return { ...item, product }
            } catch (error) {
              console.error(`Failed to fetch product for expiry item ${item.$id}:`, error)
              return item
            }
          })
        )
        
        // Sort by deletion date (most recent first)
        itemsWithProducts.sort((a, b) => {
          // Use deleted_at for sorting, or fall back to created_at
          const dateA = a.deleted_at ? new Date(a.deleted_at) : (a.created_at ? new Date(a.created_at) : new Date())
          const dateB = b.deleted_at ? new Date(b.deleted_at) : (b.created_at ? new Date(b.created_at) : new Date())
          return dateB.getTime() - dateA.getTime()
        })
        
        setDeletedItems(itemsWithProducts)
      } catch (error) {
        console.error("Failed to fetch deleted items:", error)
        toast({
          title: "Error",
          description: "Failed to load deleted items",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDeletedItems()
  }, [user, toast])

  const handleRestore = async (itemId: string) => {
    if (!user) return

    try {
      await databaseService.restoreExpiryItem(itemId)
      
      // Update the local state
      setDeletedItems((prevItems) => prevItems.filter((item) => item.$id !== itemId))
      
      toast({
        title: "Success",
        description: "Item restored successfully",
      })
    } catch (error) {
      console.error("Failed to restore expiry item:", error)
      toast({
        title: "Error",
        description: "Failed to restore item",
        variant: "destructive",
      })
    }
  }

  const handlePermanentDelete = async (itemId: string) => {
    if (!user) return
    
    if (!confirm("Are you sure you want to permanently delete this item? This action cannot be undone.")) {
      return
    }

    try {
      await databaseService.permanentlyDeleteExpiryItem(itemId)
      
      // Update the local state
      setDeletedItems((prevItems) => prevItems.filter((item) => item.$id !== itemId))
      
      toast({
        title: "Success",
        description: "Item permanently deleted",
      })
    } catch (error) {
      console.error("Failed to permanently delete expiry item:", error)
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      })
    }
  }

  const handleExportCsv = () => {
    if (deletedItems.length === 0) {
      toast({
        title: "No Data",
        description: "There are no deleted items to export",
        variant: "destructive",
      })
      return
    }

    try {
      // Format data for CSV export
      const csvData = deletedItems.map((item) => ({
        Product: item.product?.name || "Unknown Product",
        Barcode: item.barcode,
        Quantity: item.quantity,
        "Expiry Date": formatDate(item.expiry_date),
        Category: item.product?.category || "",
        "Deleted Date": formatDate(item.deleted_at || item.created_at || new Date()),
      }))
      
      // Export to CSV
      exportToCsv(csvData, "deleted-items")
      
      toast({
        title: "Success",
        description: "CSV file downloaded successfully",
      })
    } catch (error) {
      console.error("Failed to export CSV:", error)
      toast({
        title: "Error",
        description: "Failed to export CSV file",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading deleted items...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-8">
      <BackToTop />
      {/* Blue Header with White Text */}
      <div className="bg-[#004BFE] text-white p-4 pt-6 pb-16 rounded-b-3xl">
        <h1 className="text-xl font-bold">Deleted Items</h1>
        <p className="text-white/80 mt-1">View and manage your deleted expiry items</p>
      </div>
      
      <div className="container mx-auto max-w-4xl -mt-10">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center bg-white rounded-xl shadow-md p-4">
          <div></div>
          <Button 
            onClick={handleExportCsv}
            disabled={deletedItems.length === 0}
            className="bg-[#004BFE] hover:bg-[#004BFE]/90 rounded-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Export to CSV
          </Button>
        </div>
      
        {deletedItems.length === 0 ? (
          <div className="flex h-[60vh] flex-col items-center justify-center">
            <AlertTriangle className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">No deleted items found</h2>
            <p className="mt-2 text-center text-muted-foreground">
              Items that you delete will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {deletedItems.map((item) => (
              <Card key={item.$id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    {item.product?.name || "Unknown Product"}
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="flex flex-col justify-between gap-4 sm:flex-row">
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Barcode:</span> {item.barcode}</p>
                      <p><span className="font-medium">Quantity:</span> {item.quantity}</p>
                      <p><span className="font-medium">Expiry Date:</span> {formatDate(item.expiry_date)}</p>
                      {item.product?.category && (
                        <p><span className="font-medium">Category:</span> {item.product.category}</p>
                      )}
                      <p className="text-muted-foreground">
                        <span className="font-medium">Deleted:</span> {formatDate(item.deleted_at || item.created_at || new Date())}
                      </p>
                    </div>
                    
                    <div className="flex gap-2 self-end sm:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(item.$id!)}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Restore
                      </Button>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handlePermanentDelete(item.$id!)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
