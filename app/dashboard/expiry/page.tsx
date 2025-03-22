"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { databaseService, Product } from "@/lib/appwrite/database-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Barcode, Camera, Check, X, AlertTriangle, Plus } from "lucide-react"
import { format } from "date-fns"
import Image from "next/image"
import { formatCurrency } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Import Quagga dynamically since it's a client-side only library
import dynamic from "next/dynamic"
const QuaggaScanner = dynamic(() => import("@/components/expiry/barcode-scanner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">Loading scanner...</p>
      </div>
    </div>
  ),
})

// Add Product Dialog component
function AddProductDialog({
  open,
  onOpenChange,
  barcode,
  onProductAdded,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  barcode: string
  onProductAdded: (product: Product) => void
}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [newProductName, setNewProductName] = useState("")
  const [newProductPrice, setNewProductPrice] = useState("")
  const [isAddingProduct, setIsAddingProduct] = useState(false)

  // Handle adding a new product
  const handleAddProduct = async () => {
    if (!user || !barcode || !newProductName) return
    
    try {
      setIsAddingProduct(true)
      
      // Create new product
      const newProduct = await databaseService.createProduct({
        user_id: user.$id,
        barcode,
        name: newProductName,
        price: newProductPrice ? parseFloat(newProductPrice) : 0,
        category: "",
        weight: "",
        image_id: "",
      })
      
      if (newProduct) {
        toast({
          title: "Product Added",
          description: `${newProductName} has been added successfully.`,
        })
        
        // Close dialog and set the new product
        onOpenChange(false)
        onProductAdded(newProduct)
        
        // Reset form
        setNewProductName("")
        setNewProductPrice("")
      }
    } catch (error) {
      console.error("Failed to add product:", error)
      toast({
        title: "Error",
        description: "Failed to add the product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingProduct(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            This product doesn't exist in your inventory. Please add it first.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="newBarcode" className="text-sm font-medium">
              Barcode
            </label>
            <Input
              id="newBarcode"
              value={barcode}
              disabled
              className="rounded-lg"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="newProductName" className="text-sm font-medium flex items-center">
              <span className="mr-1">Product Name</span>
              <span className="text-red-500">*</span>
            </label>
            <Input
              id="newProductName"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              className="rounded-lg"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="newProductPrice" className="text-sm font-medium">
              Price
            </label>
            <Input
              id="newProductPrice"
              type="number"
              min="0"
              step="0.01"
              value={newProductPrice}
              onChange={(e) => setNewProductPrice(e.target.value)}
              className="rounded-lg"
              placeholder="0.00"
            />
          </div>
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              setNewProductName("")
              setNewProductPrice("")
            }}
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleAddProduct}
            disabled={!newProductName || isAddingProduct}
            className="bg-[#004BFE]"
          >
            {isAddingProduct ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                Adding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ExpiryPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  // Scanner state
  const [isScannerActive, setIsScannerActive] = useState(false)
  const [scannedBarcode, setScannedBarcode] = useState("")
  
  // Product state
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Form state
  const [quantity, setQuantity] = useState("1")
  const [expiryDate, setExpiryDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  
  // Add product dialog state
  const [showAddProductDialog, setShowAddProductDialog] = useState(false)
  
  // Handle product added from dialog
  const handleProductAdded = (newProduct: Product) => {
    setProduct(newProduct)
    toast({
      title: "Success",
      description: `${newProduct.name} has been added to your inventory.`,
    })
  }

  // Handle barcode detection
  const handleBarcodeDetected = async (barcode: string) => {
    setIsScannerActive(false)
    setScannedBarcode(barcode)
    await fetchProductByBarcode(barcode)
  }

  // Fetch product by barcode
  const fetchProductByBarcode = async (barcode: string) => {
    if (!user) return
    
    try {
      setIsLoading(true)
      const fetchedProduct = await databaseService.getProductByBarcode(user.$id, barcode)
      
      if (fetchedProduct) {
        setProduct(fetchedProduct)
        toast({
          title: "Product Found",
          description: `Found: ${fetchedProduct.name}`,
        })
      } else {
        setProduct(null)
        // Show dialog to add product instead of redirecting
        setShowAddProductDialog(true)
        setScannedBarcode(barcode)
        toast({
          title: "Product Not Found",
          description: "Please add this product first",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Failed to fetch product:", error)
      toast({
        title: "Error",
        description: "Failed to fetch product information",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle manual barcode input
  const handleManualBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (scannedBarcode) {
      fetchProductByBarcode(scannedBarcode)
    }
  }

  // Handle saving expiry data
  const handleSaveExpiry = async () => {
    if (!user || !product) return
    
    try {
      setIsLoading(true)
      
      // Validate input
      if (!quantity || parseInt(quantity) <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid quantity",
          variant: "destructive",
        })
        return
      }
      
      if (!expiryDate) {
        toast({
          title: "Error",
          description: "Please select an expiry date",
          variant: "destructive",
        })
        return
      }
      
      // Create expiry item
      await databaseService.createExpiryItem({
        user_id: user.$id,
        product_id: product.$id!,
        barcode: product.barcode,
        quantity: parseInt(quantity),
        expiry_date: new Date(expiryDate),
      })
      
      // Reset form
      setScannedBarcode("")
      setProduct(null)
      setQuantity("1")
      setExpiryDate(format(new Date(), "yyyy-MM-dd"))
      
      // Show success message
      toast({
        title: "Success",
        description: "Expiry information saved successfully",
      })
      
      // Focus barcode input for next scan
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus()
      }
    } catch (error) {
      console.error("Failed to save expiry information:", error)
      toast({
        title: "Error",
        description: "Failed to save expiry information",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle cancel
  const handleCancel = () => {
    setScannedBarcode("")
    setProduct(null)
    setQuantity("1")
    setExpiryDate(format(new Date(), "yyyy-MM-dd"))
    
    // Focus barcode input
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }

  // Focus barcode input on initial load
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }, [])
  
  return (
    <div className="pb-8">
      <div className="flex flex-col space-y-6">
        <div className="pt-4 pb-8 -mt-2">
          <h2 className="text-xl font-semibold text-[#004BFE]">Add Expiry Information</h2>
          <p className="text-muted-foreground">Scan a product barcode to add expiry information</p>
        </div>
        
        {!isScannerActive && !product ? (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <form onSubmit={handleManualBarcodeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="barcode" className="text-sm font-medium">
                    Barcode
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      id="barcode"
                      ref={barcodeInputRef}
                      value={scannedBarcode}
                      onChange={(e) => setScannedBarcode(e.target.value)}
                      className="flex-1 rounded-lg"
                      placeholder="Enter barcode"
                    />
                    <Button 
                      type="submit" 
                      className="rounded-full bg-[#004BFE] hover:bg-[#004BFE]/90"
                      disabled={!scannedBarcode || isLoading}
                    >
                      {isLoading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Barcode className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </form>
              
              <div className="mt-6">
                <Button
                  onClick={() => setIsScannerActive(true)}
                  className="w-full rounded-lg bg-[#004BFE] hover:bg-[#004BFE]/90"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Scan Barcode
                </Button>
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed p-8">
                <div className="text-center">
                  <Barcode className="mx-auto h-8 w-8 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No Product Selected</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Scan a barcode or enter it manually to get started
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : isScannerActive ? (
          <div className="space-y-4">
            <QuaggaScanner onDetected={handleBarcodeDetected} />
            <Button 
              variant="outline" 
              onClick={() => setIsScannerActive(false)}
              className="w-full rounded-lg"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel Scanning
            </Button>
          </div>
        ) : product ? (
          <div className="bg-card rounded-xl border border-border shadow-sm p-8">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  {product.image_id ? (
                    <div className="h-16 w-16 overflow-hidden rounded-lg">
                      <img
                        src={databaseService.getFilePreview(product.image_id)}
                        alt={product.name}
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                      <Barcode className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Barcode: {product.barcode}
                    </p>
                    {product.price > 0 && (
                      <p className="text-sm font-medium">
                        {formatCurrency(product.price)}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="quantity" className="text-sm font-medium">
                      Quantity
                    </label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="expiryDate" className="text-sm font-medium">
                      Expiry Date
                    </label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col justify-end space-y-4">
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  className="rounded-full"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                
                <Button onClick={handleSaveExpiry} className="rounded-full bg-[#004BFE] hover:bg-[#004BFE]/90">
                  <Check className="mr-2 h-4 w-4" />
                  Save Expiry
                </Button>
              </div>
            </div>
          </div>
        ) : scannedBarcode ? (
          <div className="bg-card rounded-xl border border-border shadow-sm p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertTriangle className="h-14 w-14 text-yellow-500" />
              <h3 className="mt-4 text-lg font-semibold">Product Not Found</h3>
              <p className="mt-2 text-muted-foreground max-w-xs mx-auto">
                No product found with barcode: {scannedBarcode}
              </p>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={handleCancel} className="rounded-full">
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button 
                  onClick={() => setShowAddProductDialog(true)}
                  className="rounded-full bg-[#004BFE] hover:bg-[#004BFE]/90"
                >
                  Add Product
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      
      {/* Use the AddProductDialog component */}
      <AddProductDialog
        open={showAddProductDialog}
        onOpenChange={setShowAddProductDialog}
        barcode={scannedBarcode}
        onProductAdded={handleProductAdded}
      />
    </div>
  )
}
