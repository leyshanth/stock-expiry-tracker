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
import { BackToTop } from "@/components/ui/back-to-top"

// Import Quagga dynamically since it's a client-side only library
import dynamic from "next/dynamic"
const QuaggaScanner = dynamic(() => import("@/components/products/barcode-scanner"), {
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
  const [isAddingProduct, setIsAddingProduct] = useState(false)
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
    if (!user) {
      console.error("Cannot add product: No authenticated user")
      return
    }

    // Set loading state
    setIsAddingProduct(true)

    try {
      console.log("Starting product creation process...")
      console.log("Form data:", { ...formData, image: formData.image ? "[File object]" : null })
      
      // Validate form
      if (!formData.barcode || !formData.name) {
        console.error("Validation failed: Missing barcode or name")
        toast({
          title: "Error",
          description: "Barcode and product name are required",
          variant: "destructive",
        })
        setIsAddingProduct(false)
        return
      }

      // Check if barcode already exists
      console.log(`Checking if barcode ${formData.barcode} already exists...`)
      const existingProduct = await databaseService.getProductByBarcode(user.$id, formData.barcode)
      if (existingProduct) {
        console.error(`Barcode ${formData.barcode} already exists for product: ${existingProduct.name}`)
        toast({
          title: "Error",
          description: "A product with this barcode already exists",
          variant: "destructive",
        })
        return
      }
      console.log("Barcode check passed, product is unique")

      let imageId = undefined

      // Upload image if provided
      if (formData.image) {
        console.log("Uploading product image...", formData.image)
        // Verify that the file is valid
        if (!(formData.image instanceof File) || formData.image.size === 0) {
          console.error("Invalid image file:", formData.image)
          toast({
            title: "Image Error",
            description: "The selected image file is invalid. Please try again with a different image.",
            variant: "destructive"
          })
        } else {
          try {
            // Log file details
            console.log("File details:", {
              name: formData.image.name,
              type: formData.image.type,
              size: formData.image.size
            })
            
            imageId = await databaseService.uploadProductImage(formData.image, user.$id)
            console.log("Image uploaded successfully with ID:", imageId)
          } catch (imageError) {
            console.error("Failed to upload image:", imageError)
            toast({
              title: "Image Upload Failed",
              description: "Could not upload the image. Please try again.",
              variant: "destructive"
            })
            // Continue without image if upload fails
          }
        }
      }

      // Create product
      console.log("Creating product in database...")
      const productData = {
        user_id: user.$id,
        barcode: formData.barcode,
        name: formData.name,
        // Ensure price is a valid number and convert to integer if needed
        // The database service will handle the final conversion to integer
        price: parseFloat(formData.price) || 0,
        weight: formData.weight,
        category: formData.category,
        image_id: imageId,
      }
      console.log("Product data being sent to database:", productData)
      
      const newProduct = await databaseService.createProduct(productData)

      // Update state
      setProducts((prev) => [newProduct, ...prev])
      
      // Close dialog and reset form
      setIsAddDialogOpen(false)
      resetForm()
      
      toast({
        title: "✅ Success",
        description: "Product added successfully",
        className: "bg-white border border-green-200 text-green-800",
        variant: "default"
      })
    } catch (error) {
      console.error("Failed to add product:", error)
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      })
    } finally {
      // Reset loading state
      setIsAddingProduct(false)
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
        console.log("Uploading product image for edit...", formData.image)
        // Verify that the file is valid
        if (!(formData.image instanceof File) || formData.image.size === 0) {
          console.error("Invalid image file:", formData.image)
          toast({
            title: "Image Error",
            description: "The selected image file is invalid. Please try again with a different image.",
            variant: "destructive"
          })
        } else {
          // Delete old image if exists
          if (selectedProduct.image_id) {
            try {
              await databaseService.deleteFile(selectedProduct.image_id)
              console.log("Old image deleted successfully")
            } catch (deleteError) {
              console.error("Failed to delete old image:", deleteError)
            }
          }
          
          try {
            // Log file details
            console.log("File details:", {
              name: formData.image.name,
              type: formData.image.type,
              size: formData.image.size
            })
            
            imageId = await databaseService.uploadProductImage(formData.image, user.$id)
            console.log("Image uploaded successfully with ID:", imageId)
          } catch (imageError) {
            console.error("Failed to upload image:", imageError)
            toast({
              title: "Image Upload Failed",
              description: "Could not upload the image. Please try again.",
              variant: "destructive"
            })
          }
        }
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
    <div className="container mx-auto max-w-4xl pb-8">
      <BackToTop />
      {/* New Header with Blue Background */}
      <div className="-mx-4 -mt-4 bg-[#004BFE] text-white p-6 pt-10 pb-16 rounded-b-3xl">
        <h1 className="text-2xl font-bold">Good evening, {user?.name || 'User'}</h1>
        <p className="text-white/80 mt-1">Manage your product inventory</p>
      </div>
      
      {/* Search and Filter Components in a Card */}
      <div className="-mt-10 mx-4 bg-white rounded-xl shadow-md p-4 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search products..."
            className="pl-10 rounded-full border-gray-200 bg-gray-50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="rounded-full border-gray-200"
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
          
          <Button 
            onClick={() => {
              resetForm()
              setIsAddDialogOpen(true)
            }}
            className="rounded-full bg-[#004BFE] hover:bg-[#004BFE]/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>
      
      {filteredProducts.length === 0 ? (
        <div className="flex h-[60vh] flex-col items-center justify-center bg-gray-100 rounded-xl p-8 mx-4">
          <Package className="h-16 w-16 text-[#004BFE]/60" />
          <h2 className="mt-6 text-xl font-semibold">
            {products.length === 0
              ? "No products found"
              : "No products match your search"}
          </h2>
          <p className="mt-3 text-center text-gray-500 max-w-md">
            {products.length === 0
              ? "Start by adding your first product to begin tracking inventory"
              : "Try a different search term or clear your filters"}
          </p>
          {products.length === 0 && (
            <Button 
              onClick={() => {
                resetForm()
                setIsAddDialogOpen(true)
              }}
              className="mt-6 rounded-full bg-[#004BFE] hover:bg-[#004BFE]/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Product
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 px-4">
          {filteredProducts.map((product) => (
            <div key={product.$id} className="product-card bg-[#E8F4F8]">
              <div className="product-image">
                {product.image_id ? (
                  <div className="relative h-full w-full">
                    <img
                      src={'/placeholder-image.svg'}
                      alt={product.name}
                      className="absolute h-full w-full object-cover"
                    />
                    <img
                      src={databaseService.getFilePreview(product.image_id)}
                      alt={product.name}
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
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-3 line-clamp-1">{product.name}</h3>
                
                <div className="space-y-2 text-sm mb-4">
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Price:</span> 
                    <span className="font-medium">{formatCurrency(product.price)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Barcode:</span> 
                    <span className="font-medium">{product.barcode}</span>
                  </p>
                  {product.category && (
                    <p className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span> 
                      <span className="font-medium">{product.category}</span>
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(product)}
                    className="flex-1 py-2 rounded-full bg-muted hover:bg-accent text-foreground font-medium flex items-center justify-center transition-colors"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </button>
                  
                  <button
                    onClick={() => handleDeleteProduct(product.$id!)}
                    className="flex-1 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white font-medium flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
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
                  <Barcode className="mr-1 h-3 w-3" />
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
              <Button 
                type="submit" 
                disabled={isAddingProduct}
                className="rounded-full bg-[#004BFE] hover:bg-[#004BFE]/90"
              >
                {isAddingProduct ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Product"
                )}
              </Button>
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
                  <Barcode className="mr-1 h-3 w-3" />
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
        <DialogContent className="sm:max-w-md p-0">
          <div className="relative">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Scan Barcode</h2>
                <p className="text-sm text-muted-foreground">
                  Position the barcode within the scanner area
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsScannerDialogOpen(false)} 
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {isScannerActive ? (
              <div className="relative h-64 md:h-80">
                <QuaggaScanner 
                  onDetected={handleBarcodeDetected} 
                  onError={handleScannerError}
                  onClose={() => setIsScannerDialogOpen(false)}
                />
              </div>
            ) : (
              <div className="p-4 space-y-4">
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
          </div>
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
        <DialogContent className="sm:max-w-md p-0">
          <div className="relative">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Scan Barcode</h2>
                <p className="text-sm text-muted-foreground">
                  Position the barcode within the scanner area
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsQuickScannerOpen(false)} 
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {isScannerActive ? (
              <div className="relative h-64 md:h-80">
                <QuaggaScanner 
                  onDetected={handleBarcodeDetected} 
                  onError={handleScannerError}
                  onClose={() => setIsQuickScannerOpen(false)}
                />
              </div>
            ) : (
              <div className="p-4 space-y-4">
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
            
            <div className="p-4 flex justify-between border-t">
              <Button variant="outline" onClick={() => setIsQuickScannerOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => {
                  // Simulate a test scan
                  handleBarcodeDetected('123456789012');
                }}
              >
                Test Scan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
