# Stock & Expiry Tracker PWA - Project Context

## Project Overview
A Progressive Web App (PWA) for tracking product stock and expiry dates, ideal for retail/inventory management. The app allows users to manage products, track expiry dates, and maintain deleted items history.

## Technology Stack

### Frontend
- **Framework**: Next.js (App Router) + React + TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Lucide React Icons
- **Barcode Scanning**: @ericblade/quagga2
- **Date Management**: date-fns
- **PWA Support**: next-pwa (service worker, manifest)

### Backend
- **Appwrite** (self-hosted)

## Pages & Features

### 1. `/login`
- User registration & login using Appwrite Auth
- Store-specific accounts
- Secure authentication flow

### 2. `/home`
- List all expiry items in card-style UI (Laundry app-inspired)
- Expiry date color coding:
  - Red: expires today
  - Yellow: expires in 2-7 days
  - Green: more than 7 days left
- Image zoom feature
- Delete button → moves item to deleted data table

### 3. `/products`
- Add/Edit/Delete products
- Form fields:
  - Barcode (with scanner integration)
  - Item Name
  - Price
  - Weight
  - Category
  - Image Upload
- Data stored in products table linked to logged-in user

### 4. `/expiry`
- Barcode scanning via device camera
- Auto-fill product info if barcode exists:
  - Item name
  - Price
  - Weight
  - Category
  - Image
- Fields for quantity & expiry date
- Save to expiry table with user association
- Prompt user to add product if barcode not found
- Redirection to products page when needed

### 5. `/deleted`
- Table of deleted expiry items:
  - Barcode
  - Item name
  - Quantity
  - Expiry date
  - Deletion date
- CSV export functionality
- User-specific data only

### 6. `/settings/profile`
- Display store-specific profile data (from users table)
- User account management

## PWA Configuration
- manifest.json with:
  - App icon
  - App name
  - Theme colors
- Service worker implementation with next-pwa
- Offline caching strategy
- Responsive, mobile-first design
- Mobile navigation bar at bottom

## Behavioral Requirements
- All data is store/user-specific (filtered by user_id)
- Product images stored in Appwrite bucket
- Offline caching with service worker
- Deleted expiry data tracked and exportable as CSV

## Appwrite Configuration

### 1. Project Setup
- Create a new project in Appwrite Console named "StockExpiryTracker"
- Set up a web platform with the domain of your deployment

### 2. Database Configuration
Create the following collections:

#### Users Collection (Extended from Appwrite Auth)
- Additional attributes:
  - `storeName` (string): Name of the store
  - `address` (string): Store address
  - `phone` (string): Contact number

#### Products Collection
- Attributes:
  - `_id` (auto-generated)
  - `user_id` (string): Reference to user who created the product
  - `barcode` (string): Product barcode
  - `name` (string): Product name
  - `price` (number): Product price
  - `weight` (string): Product weight
  - `category` (string): Product category
  - `image_id` (string): Reference to image in storage bucket
  - `created_at` (datetime): Creation timestamp
  - `updated_at` (datetime): Last update timestamp
- Indexes:
  - Create index on `user_id` for faster queries
  - Create index on `barcode` for faster lookups

#### Expiry Collection
- Attributes:
  - `_id` (auto-generated)
  - `user_id` (string): Reference to user who created the entry
  - `product_id` (string): Reference to product
  - `barcode` (string): Product barcode (duplicated for faster access)
  - `quantity` (number): Number of items
  - `expiry_date` (datetime): Expiry date of the product
  - `created_at` (datetime): Creation timestamp
  - `is_deleted` (boolean): Deletion status flag
  - `deleted_at` (datetime, nullable): Deletion timestamp
- Indexes:
  - Create index on `user_id` for faster queries
  - Create index on `expiry_date` for date-based filtering
  - Create index on `is_deleted` for filtering deleted items

### 3. Storage Configuration
- Create a bucket named "product-images" for storing product images
- Set permissions to allow:
  - Read: Only authenticated users
  - Write: Only authenticated users
- Configure file size limits (recommended: up to 5MB per image)
- Set allowed file extensions (jpg, jpeg, png, webp)

### 4. Authentication Configuration
- Enable Email/Password authentication
- Configure email templates for:
  - Verification emails
  - Password recovery
- Set session duration (recommended: 14 days)
- Configure security settings:
  - Enable email verification
  - Set password requirements (min length, complexity)

### 5. Functions (Optional)
- Create a function for CSV export of deleted items
- Create a function for data cleanup (e.g., permanently delete items after X days)

### 6. Security & Permissions
- Set appropriate collection-level permissions:
  - Products: Create/Read/Update/Delete only by document owner
  - Expiry: Create/Read/Update/Delete only by document owner
- Set appropriate bucket-level permissions:
  - product-images: Read/Write only by authenticated users

### 7. API Keys & Environment Variables
For the Next.js application, you'll need these environment variables:
```
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://your-appwrite-endpoint
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
NEXT_PUBLIC_APPWRITE_PRODUCTS_COLLECTION_ID=your-products-collection-id
NEXT_PUBLIC_APPWRITE_EXPIRY_COLLECTION_ID=your-expiry-collection-id
NEXT_PUBLIC_APPWRITE_BUCKET_ID=your-bucket-id
```

### 8. Appwrite SDK Integration
Install the Appwrite SDK in your Next.js project:
```bash
npm install appwrite
```

Create a service file to initialize the Appwrite SDK and export the necessary services (auth, database, storage).

### 9. Offline Support Strategy
- Implement service worker caching for offline access to previously viewed data
- Use Appwrite's realtime subscriptions for live updates when online
- Implement offline data queue for operations performed while offline
