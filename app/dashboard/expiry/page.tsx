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
    <div className="container mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold">Expiry Tracking</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Scan Barcode</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
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
              className="w-full" 
              onClick={() => setIsScannerActive(true)}
            >
              <Camera className="mr-2 h-4 w-4" />
              Open Camera Scanner
            </Button>
          )}
          
          <div className="relative">
            <form onSubmit={handleManualBarcodeSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={barcodeInputRef}
                  placeholder="Enter barcode manually"
                  className="pl-8"
                  value={scannedBarcode}
                  onChange={(e) => setScannedBarcode(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={!scannedBarcode}>
                Search
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="ml-2 text-sm text-muted-foreground">Loading product information...</p>
            </div>
          </CardContent>
        </Card>
      ) : product ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Product Information</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-start gap-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-md bg-secondary">
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
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">Barcode: {product.barcode}</p>
                  {product.price !== undefined && (
                    <p className="text-sm text-muted-foreground">Price: {formatCurrency(product.price)}</p>
                  )}
                  {product.category && (
                    <p className="text-sm text-muted-foreground">Category: {product.category}</p>
                  )}
                </div>
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
                  required
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
                  required
                />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            
            <Button onClick={handleSaveExpiry}>
              <Check className="mr-2 h-4 w-4" />
              Save Expiry
            </Button>
          </CardFooter>
        </Card>
      ) : scannedBarcode ? (
        <Card>
          <CardContent className="py-6">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500" />
              <h3 className="mt-2 text-lg font-semibold">Product Not Found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                No product found with barcode: {scannedBarcode}
              </p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={() => router.push(`/dashboard/products?barcode=${scannedBarcode}`)}>
                  Add Product
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
