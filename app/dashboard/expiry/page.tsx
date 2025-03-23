"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { databaseService, Product } from "@/lib/appwrite/database-service"
import { useImagePopup } from "@/components/ui/image-popup-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Barcode, Camera, Check, X, AlertTriangle, Plus, Edit, Package } from "lucide-react"
import { format } from "date-fns"
import Image from "next/image"
import { formatCurrency } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

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
  const { openImage } = useImagePopup()
  
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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  
  // Product form state
  const [formData, setFormData] = useState({
    barcode: "",
    name: "",
    price: "",
    weight: "",
    category: "",
    image: null as File | null,
  })
  
  // Reset the product form
  const resetForm = () => {
    setFormData({
      barcode: "",
      name: "",
      price: "",
      weight: "",
      category: "",
      image: null,
    })
  }

  // Handle input change for the add product form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target
    
    if (name === "image" && files && files.length > 0) {
      setFormData(prev => ({ ...prev, image: files[0] }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  // Handle adding a product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsAddingProduct(true)

    try {
      // Validate form
      if (!formData.barcode || !formData.name) {
        toast({
          title: "Error",
          description: "Barcode and product name are required",
          variant: "destructive",
        })
        setIsAddingProduct(false)
        return
      }

      let imageId = undefined

      // Upload image if provided
      if (formData.image) {
        try {
          imageId = await databaseService.uploadProductImage(formData.image, user.$id)
        } catch (imageError) {
          console.error("Failed to upload image:", imageError)
          // Continue without image if upload fails
        }
      }

      // Create product
      const productData = {
        user_id: user.$id,
        barcode: formData.barcode,
        name: formData.name,
        price: formData.price ? parseFloat(formData.price) : 0,
        weight: formData.weight,
        category: formData.category,
        image_id: imageId || "",
      }

      const newProduct = await databaseService.createProduct(productData)

      // Close dialog and update product
      setIsAddDialogOpen(false)
      setProduct(newProduct)
      resetForm()

      toast({
        title: "Product Added",
        description: `${newProduct.name} has been added to your inventory.`,
      })
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
          className: "bg-white border border-blue-200 text-[#004BFE]",
        })
      } else {
        setProduct(null)
        // Show dialog to add product instead of redirecting
        setFormData(prev => ({ ...prev, barcode }))
        setIsAddDialogOpen(true)
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
            <QuaggaScanner 
              onDetected={handleBarcodeDetected} 
              onClose={() => setIsScannerActive(false)} 
            />
          </div>
        ) : product ? (
          <div className="bg-card rounded-xl border border-border shadow-sm p-8">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  {product.image_id ? (
                    <div 
                      className="h-16 w-16 overflow-hidden rounded-lg cursor-pointer"
                      onClick={() => {
                        if (product.image_id) {
                          openImage(databaseService.getFilePreview(product.image_id), product.name);
                        }
                      }}
                    >
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
                  onClick={() => {
                    setFormData(prev => ({ ...prev, barcode: scannedBarcode }))
                    setIsAddDialogOpen(true)
                  }}
                  className="rounded-full bg-[#004BFE] hover:bg-[#004BFE]/90"
                >
                  Add Product
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      
      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddProduct}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleInputChange}
                  placeholder="Enter product barcode"
                  className="rounded-lg"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  className="rounded-lg"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="Enter price"
                  className="rounded-lg"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="weight">Weight/Volume</Label>
                <Input
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder="e.g. 500g, 1L"
                  className="rounded-lg"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="e.g. Dairy, Produce"
                  className="rounded-lg"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="image">Product Image</Label>
                <Input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="rounded-lg"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="rounded-full">
                Cancel
              </Button>
              <Button type="submit" disabled={isAddingProduct} className="rounded-full bg-[#004BFE] hover:bg-[#004BFE]/90">
                {isAddingProduct ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Adding...
                  </>
                ) : (
                  <>Add Product</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
