"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { databaseService, Product } from "@/lib/appwrite/database-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Barcode, Camera, Check, X, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import Image from "next/image"
import { formatCurrency } from "@/lib/utils"

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
        toast({
          title: "Product Not Found",
          description: "Would you like to add this product?",
          action: (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                router.push(`/dashboard/products?barcode=${barcode}`)
              }}
            >
              Add Product
            </Button>
          ),
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
    <div className="container mx-auto max-w-md py-8">
      <div className="mb-8 bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-2xl">
        <h1 className="text-2xl font-bold">Expiry Tracking</h1>
        <p className="text-muted-foreground mt-2">Add and manage product expiry dates</p>
      </div>
      
      <div className="mb-8 bg-card rounded-xl border border-border shadow-sm p-6">
        <h2 className="section-title mb-4">
          <Barcode className="h-5 w-5 mr-2 text-primary" />
          Scan Barcode
        </h2>
        
        <div className="space-y-4">
          {isScannerActive ? (
            <div className="relative">
              <QuaggaScanner onDetected={handleBarcodeDetected} />
              <Button
                variant="outline"
                size="sm"
                className="absolute bottom-2 right-2"
                onClick={() => setIsScannerActive(false)}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          ) : (
            <Button 
              className="w-full rounded-full bg-primary hover:bg-primary/90" 
              onClick={() => setIsScannerActive(true)}
            >
              <Camera className="mr-2 h-4 w-4" />
              Open Camera Scanner
            </Button>
          )}
          
          <div className="relative">
            <form onSubmit={handleManualBarcodeSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={barcodeInputRef}
                  placeholder="Enter barcode manually"
                  className="pl-10 rounded-full"
                  value={scannedBarcode}
                  onChange={(e) => setScannedBarcode(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={!scannedBarcode} className="rounded-full">
                Search
              </Button>
            </form>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="ml-3 text-muted-foreground">Loading product information...</p>
          </div>
        </div>
      ) : product ? (
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h2 className="section-title mb-6">
            <Check className="h-5 w-5 mr-2 text-primary" />
            Product Information
          </h2>
          
          <div className="space-y-6">
            <div className="rounded-xl bg-muted/50 p-5">
              <div className="flex items-start gap-5">
                <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-secondary">
                  {product.image_id ? (
                    <div className="relative h-full w-full">
                      {/* Placeholder as background for better UX */}
                      <img
                        src="/placeholder-image.svg"
                        alt="Placeholder"
                        className="absolute h-full w-full object-cover"
                      />
                      <img
                        src={databaseService.getFilePreview(product.image_id)}
                        alt={product.name}
                        className="absolute h-full w-full object-cover"
                        onError={(e) => {
                          // Hide the errored image to show placeholder
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <img
                      src="/placeholder-image.svg"
                      alt="No image available"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  <div className="mt-2 space-y-1">
                    <p className="flex justify-between">
                      <span className="text-muted-foreground">Barcode:</span>
                      <span className="font-medium">{product.barcode}</span>
                    </p>
                    {product.price !== undefined && (
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-medium">{formatCurrency(product.price)}</span>
                      </p>
                    )}
                    {product.weight && (
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Weight:</span>
                        <span className="font-medium">{product.weight}</span>
                      </p>
                    )}
                    {product.category && (
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Category:</span>
                        <span className="font-medium">{product.category}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Product image in larger view */}
              {product.image_id && (
                <div className="mt-4 flex justify-center">
                  <div className="relative h-48 w-full max-w-xs overflow-hidden rounded-lg bg-secondary">
                    <img
                      src="/placeholder-image.svg"
                      alt="Placeholder"
                      className="absolute h-full w-full object-contain"
                    />
                    <img
                      src={databaseService.getFilePreview(product.image_id)}
                      alt={product.name}
                      className="absolute h-full w-full object-contain"
                      onError={(e) => {
                        // Hide the errored image to show placeholder
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="quantity" className="text-sm font-medium flex items-center">
                  <span className="mr-1">Quantity</span>
                  <span className="text-red-500">*</span>
                </label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="rounded-lg"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="expiryDate" className="text-sm font-medium flex items-center">
                  <span className="mr-1">Expiry Date</span>
                  <span className="text-red-500">*</span>
                </label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="rounded-lg"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={handleCancel} className="rounded-full">
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            
            <Button onClick={handleSaveExpiry} className="rounded-full bg-primary hover:bg-primary/90">
              <Check className="mr-2 h-4 w-4" />
              Save Expiry
            </Button>
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
                onClick={() => router.push(`/dashboard/products?barcode=${scannedBarcode}`)}
                className="rounded-full bg-primary hover:bg-primary/90"
              >
                Add Product
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
