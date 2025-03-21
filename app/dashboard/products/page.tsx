"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useAuth } from "@/lib/hooks/use-auth"
import { databaseService, Product } from "@/lib/appwrite/database-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/utils"
import { Plus, Edit, Trash2, Search, Package, AlertTriangle, Camera, X, Barcode, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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

export default function ProductsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isScannerActive, setIsScannerActive] = useState(false)
  const [isScannerDialogOpen, setIsScannerDialogOpen] = useState(false)
  const [isQuickScannerOpen, setIsQuickScannerOpen] = useState(false)
  const [scannerMode, setScannerMode] = useState<'add' | 'edit' | 'search'>('search')
  const [scannerError, setScannerError] = useState<string | null>(null)
  const [isSearchingBarcode, setIsSearchingBarcode] = useState(false)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    barcode: "",
    name: "",
    price: "",
    weight: "",
    category: "",
    image: null as File | null,
  })

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return

      try {
        setLoading(true)
        const fetchedProducts = await databaseService.listProducts(user.$id)
        setProducts(fetchedProducts)
      } catch (error) {
        console.error("Failed to fetch products:", error)
        toast({
          title: "Error",
          description: "Failed to load products",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [user, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target

    if (type === "file") {
      const fileInput = e.target as HTMLInputElement
      const file = fileInput.files?.[0] || null
      setFormData((prev) => ({ ...prev, image: file }))
    } else if (name === "price") {
      // Allow only numbers and decimal point
      const regex = /^[0-9]*\.?[0-9]*$/
      if (value === "" || regex.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }))
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      // Validate form
      if (!formData.barcode || !formData.name) {
        toast({
          title: "Error",
          description: "Barcode and product name are required",
          variant: "destructive",
        })
        return
      }

      // Check if barcode already exists
      const existingProduct = await databaseService.getProductByBarcode(user.$id, formData.barcode)
      if (existingProduct) {
        toast({
          title: "Error",
          description: "A product with this barcode already exists",
          variant: "destructive",
        })
        return
      }

      let imageId = undefined

      // Upload image if provided
      if (formData.image) {
        imageId = await databaseService.uploadProductImage(formData.image, user.$id)
      }

      // Create product
      const newProduct = await databaseService.createProduct({
        user_id: user.$id,
        barcode: formData.barcode,
        name: formData.name,
        price: parseFloat(formData.price) || 0,
        weight: formData.weight,
        category: formData.category,
        image_id: imageId,
      })

      // Update state
      setProducts((prev) => [newProduct, ...prev])
      
      // Close dialog and reset form
      setIsAddDialogOpen(false)
      resetForm()
      
      toast({
        title: "Success",
        description: "Product added successfully",
      })
    } catch (error) {
      console.error("Failed to add product:", error)
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      })
    }
  }

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedProduct) return

    try {
      // Validate form
      if (!formData.barcode || !formData.name) {
        toast({
          title: "Error",
          description: "Barcode and product name are required",
          variant: "destructive",
        })
        return
      }

      // Check if barcode already exists and belongs to a different product
      if (formData.barcode !== selectedProduct.barcode) {
        const existingProduct = await databaseService.getProductByBarcode(user.$id, formData.barcode)
        if (existingProduct && existingProduct.$id !== selectedProduct.$id) {
          toast({
            title: "Error",
            description: "A product with this barcode already exists",
            variant: "destructive",
          })
          return
        }
      }

      let imageId = selectedProduct.image_id

      // Upload new image if provided
      if (formData.image) {
        // Delete old image if exists
        if (selectedProduct.image_id) {
          await databaseService.deleteFile(selectedProduct.image_id)
        }
        
        // Upload new image
        imageId = await databaseService.uploadProductImage(formData.image, user.$id)
      }

      // Update product
      const updatedProduct = await databaseService.updateProduct(selectedProduct.$id!, {
        barcode: formData.barcode,
        name: formData.name,
        price: parseFloat(formData.price) || 0,
        weight: formData.weight,
        category: formData.category,
        image_id: imageId,
      })

      // Update state
      setProducts((prev) => 
        prev.map((p) => (p.$id === updatedProduct.$id ? updatedProduct : p))
      )
      
      // Close dialog and reset form
      setIsEditDialogOpen(false)
      setSelectedProduct(null)
      resetForm()
      
      toast({
        title: "Success",
        description: "Product updated successfully",
      })
    } catch (error) {
      console.error("Failed to update product:", error)
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      })
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!user) return

    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return
    }

    try {
      const productToDelete = products.find(p => p.$id === productId)
      
      // Delete product
      await databaseService.deleteProduct(productId)
      
      // Delete image if exists
      if (productToDelete?.image_id) {
        await databaseService.deleteFile(productToDelete.image_id)
      }
      
      // Update state
      setProducts((prev) => prev.filter((p) => p.$id !== productId))
      
      toast({
        title: "Success",
        description: "Product deleted successfully",
      })
    } catch (error) {
      console.error("Failed to delete product:", error)
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      })
    }
  }

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product)
    setFormData({
      barcode: product.barcode,
      name: product.name,
      price: product.price.toString(),
      weight: product.weight,
      category: product.category,
      image: null,
    })
    setIsEditDialogOpen(true)
  }
  
  // Handle barcode detection
  const handleBarcodeDetected = async (barcode: string) => {
    setIsScannerActive(false)
    
    // Handle barcode based on the current scanner mode
    if (scannerMode === 'search') {
      // Search for product with this barcode
      if (!user) return
      
      try {
        setIsSearchingBarcode(true)
        const product = await databaseService.getProductByBarcode(user.$id, barcode)
        
        if (product) {
          // Set search query to the barcode to filter the products list
          setSearchQuery(barcode)
          
          toast({
            title: "Product Found",
            description: `Found: ${product.name}`,
          })
        } else {
          toast({
            title: "Product Not Found",
            description: `No product with barcode ${barcode} found`,
            variant: "destructive",
          })
          
          // Ask if user wants to add this product
          if (confirm("Would you like to add a new product with this barcode?")) {
            resetForm()
            setFormData(prev => ({ ...prev, barcode }))
            setIsAddDialogOpen(true)
          }
        }
      } catch (error) {
        console.error("Error searching for product by barcode:", error)
        toast({
          title: "Error",
          description: "Failed to search for product",
          variant: "destructive",
        })
      } finally {
        setIsSearchingBarcode(false)
        setIsQuickScannerOpen(false)
      }
    } else {
      // For add or edit modes, just update the form
      setFormData(prev => ({ ...prev, barcode }))
      toast({
        title: "Barcode Detected",
        description: `Barcode: ${barcode}`,
      })
      setIsScannerDialogOpen(false)
    }
  }
  
  // Handle scanner error
  const handleScannerError = (error: string) => {
    setScannerError(error)
    toast({
      title: "Scanner Error",
      description: error,
      variant: "destructive",
    })
  }

  // Filter products based on search query
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode.includes(searchQuery) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold">Products</h1>
        
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => {
                    setScannerMode('search')
                    setIsQuickScannerOpen(true)
                    setIsScannerActive(true)
                    setScannerError(null)
                  }}
                  disabled={isSearchingBarcode}
                >
                  {isSearchingBarcode ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Barcode className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Scan barcode to find product</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button onClick={() => {
            resetForm()
            setIsAddDialogOpen(true)
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>
      
      {filteredProducts.length === 0 ? (
        <div className="flex h-[60vh] flex-col items-center justify-center">
          <Package className="h-16 w-16 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">
            {products.length === 0
              ? "No products found"
              : "No products match your search"}
          </h2>
          <p className="mt-2 text-center text-muted-foreground">
            {products.length === 0
              ? "Start by adding your first product"
              : "Try a different search term"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card key={product.$id} className="overflow-hidden">
              {product.image_id && (
                <div className="h-48 w-full overflow-hidden">
                  <Image
                    src={databaseService.getFilePreview(product.image_id)}
                    alt={product.name}
                    width={400}
                    height={300}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="line-clamp-1">{product.name}</CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Barcode:</span> {product.barcode}</p>
                  <p><span className="font-medium">Price:</span> {formatCurrency(product.price)}</p>
                  {product.weight && (
                    <p><span className="font-medium">Weight:</span> {product.weight}</p>
                  )}
                  {product.category && (
                    <p><span className="font-medium">Category:</span> {product.category}</p>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditClick(product)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteProduct(product.$id!)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Enter the product details below.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="add-barcode">Barcode *</Label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2 text-xs"
                  onClick={() => {
                    setScannerMode('add')
                    setScannerError(null)
                    setIsScannerActive(true)
                    setIsScannerDialogOpen(true)
                  }}
                >
                  <Camera className="mr-1 h-3 w-3" />
                  Scan
                </Button>
              </div>
              <Input
                id="add-barcode"
                name="barcode"
                value={formData.barcode}
                onChange={handleInputChange}
                placeholder="Enter product barcode"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="add-name">Product Name *</Label>
              <Input
                id="add-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter product name"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-price">Price</Label>
                <Input
                  id="add-price"
                  name="price"
                  type="text"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="add-weight">Weight</Label>
                <Input
                  id="add-weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder="e.g., 500g"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="add-category">Category</Label>
              <Input
                id="add-category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="e.g., Dairy, Bakery"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="add-image">Product Image</Label>
              <Input
                id="add-image"
                name="image"
                type="file"
                accept="image/*"
                onChange={handleInputChange}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Product</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the product details below.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEditProduct} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-barcode">Barcode *</Label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2 text-xs"
                  onClick={() => {
                    setScannerMode('edit')
                    setScannerError(null)
                    setIsScannerActive(true)
                    setIsScannerDialogOpen(true)
                  }}
                >
                  <Camera className="mr-1 h-3 w-3" />
                  Scan
                </Button>
              </div>
              <Input
                id="edit-barcode"
                name="barcode"
                value={formData.barcode}
                onChange={handleInputChange}
                placeholder="Enter product barcode"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-name">Product Name *</Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter product name"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price</Label>
                <Input
                  id="edit-price"
                  name="price"
                  type="text"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-weight">Weight</Label>
                <Input
                  id="edit-weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder="e.g., 500g"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Input
                id="edit-category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="e.g., Dairy, Bakery"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-image">Product Image</Label>
              {selectedProduct?.image_id && (
                <div className="mb-2 flex items-center">
                  <div className="h-12 w-12 overflow-hidden rounded">
                    <Image
                      src={databaseService.getFilePreview(selectedProduct.image_id)}
                      alt={selectedProduct.name}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="ml-2 text-xs text-muted-foreground">
                    Current image (upload a new one to replace)
                  </span>
                </div>
              )}
              <Input
                id="edit-image"
                name="image"
                type="file"
                accept="image/*"
                onChange={handleInputChange}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Product</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Barcode Scanner Dialog for Add/Edit */}
      <Dialog open={isScannerDialogOpen} onOpenChange={(open) => {
        setIsScannerDialogOpen(open)
        if (!open) setIsScannerActive(false)
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Product Barcode</DialogTitle>
            <DialogDescription>
              Position the barcode within the scanner area.
            </DialogDescription>
          </DialogHeader>
          
          {isScannerActive ? (
            <div className="relative">
              <QuaggaScanner 
                onDetected={handleBarcodeDetected} 
                onError={handleScannerError} 
              />
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
            <div className="space-y-4">
              {scannerError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <p>{scannerError}</p>
                </div>
              )}
              <Button 
                className="w-full" 
                onClick={() => {
                  setIsScannerActive(true)
                  setScannerError(null)
                }}
              >
                <Camera className="mr-2 h-4 w-4" />
                Start Scanner
              </Button>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScannerDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Barcode Scanner Dialog */}
      <Dialog open={isQuickScannerOpen} onOpenChange={(open) => {
        setIsQuickScannerOpen(open)
        if (!open) {
          setIsScannerActive(false)
          setScannerError(null)
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan to Find Product</DialogTitle>
            <DialogDescription>
              Scan a barcode to quickly find or add a product.
            </DialogDescription>
          </DialogHeader>
          
          {isScannerActive ? (
            <div className="relative">
              <QuaggaScanner 
                onDetected={handleBarcodeDetected} 
                onError={handleScannerError} 
              />
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
            <div className="space-y-4">
              {scannerError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <p>{scannerError}</p>
                </div>
              )}
              <Button 
                className="w-full" 
                onClick={() => {
                  setIsScannerActive(true)
                  setScannerError(null)
                }}
                disabled={isSearchingBarcode}
              >
                {isSearchingBarcode ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    Start Scanner
                  </>
                )}
              </Button>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuickScannerOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
