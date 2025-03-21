Need to install the following packages:
create-next-app@15.2.3
Ok to proceed? (y)# Stock & Expiry Tracker PWA

A Progressive Web App for tracking product stock and expiry dates, ideal for retail and inventory management.

## Features

- **User Authentication**: Store-specific accounts
- **Product Management**: Add, edit, and delete products with barcode support
- **Expiry Tracking**: Track product expiry dates with visual indicators
- **Barcode Scanning**: Scan products using device camera
- **Offline Support**: Work with your data even when offline
- **Data Export**: Export deleted items history to CSV
- **Mobile-First Design**: Optimized for mobile devices with bottom navigation

## Tech Stack

- **Frontend**: Next.js 14 (App Router) with React and TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui and Lucide React Icons
- **Barcode Scanning**: @ericblade/quagga2
- **Date Management**: date-fns
- **PWA Support**: next-pwa
- **Backend**: Appwrite (self-hosted)

## Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- Self-hosted Appwrite instance or Appwrite Cloud
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd stock-expiry-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Create a `.env.local` file in the root directory with your Appwrite configuration:
   ```
   NEXT_PUBLIC_APPWRITE_ENDPOINT=https://your-appwrite-endpoint
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
   NEXT_PUBLIC_APPWRITE_PRODUCTS_COLLECTION_ID=your-products-collection-id
   NEXT_PUBLIC_APPWRITE_EXPIRY_COLLECTION_ID=your-expiry-collection-id
   NEXT_PUBLIC_APPWRITE_BUCKET_ID=your-bucket-id
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Appwrite Setup

Refer to the [context.md](./context.md) file for detailed Appwrite configuration instructions.

## Deploying to Vercel

1. **Prepare Your Repository**
   - Make sure your code is in a Git repository (GitHub, GitLab, or Bitbucket)
   - Ensure all your changes are committed
   ```bash
   git add .
   git commit -m "Ready for deployment"
   ```

2. **Create a Remote Repository**
   - Create a new repository on GitHub/GitLab/Bitbucket
   - Add the remote repository to your local repository
   ```bash
   git remote add origin https://github.com/yourusername/your-repo-name.git
   git branch -M main
   git push -u origin main
   ```

3. **Deploy to Vercel**
   - Sign up or log in to [Vercel](https://vercel.com)
   - Click "New Project" and import your Git repository
   - Configure the project:
     - Framework Preset: Next.js (should be auto-detected)
     - Build Command: `npm run build` (default)
     - Output Directory: `.next` (default)
     - Install Command: `npm install` (default)
   - Add Environment Variables:
     - Add the same environment variables you used for local development
   - Click "Deploy"

4. **Configure Appwrite for Production**
   - Add your Vercel deployment URL to the allowed domains in your Appwrite project settings
   - Update CORS settings in Appwrite to allow requests from your Vercel domain

5. **Custom Domain (Optional)**
   - In the Vercel dashboard, go to your project settings
   - Navigate to the "Domains" section
   - Add and configure your custom domain

6. **Continuous Deployment**
   - Vercel automatically deploys when you push changes to your repository
   - You can configure branch deployments in the Vercel dashboard

## Project Structure

```
stock-expiry-tracker/
├── app/                      # Next.js App Router
│   ├── (auth)/               # Authentication routes
│   │   ├── login/            # Login page
│   │   └── register/         # Registration page
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── home/             # Home page with expiry items
│   │   ├── products/         # Products management
│   │   ├── expiry/           # Expiry tracking and barcode scanning
│   │   ├── deleted/          # Deleted items history
│   │   └── settings/         # User settings
│   │       └── profile/      # User profile
│   ├── api/                  # API routes
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Landing page
├── components/               # Reusable components
│   ├── ui/                   # shadcn/ui components
│   ├── auth/                 # Authentication components
│   ├── products/             # Product-related components
│   ├── expiry/               # Expiry-related components
│   └── layout/               # Layout components
├── lib/                      # Utility functions
│   ├── appwrite/             # Appwrite client setup
│   ├── utils/                # Helper functions
│   └── hooks/                # Custom React hooks
├── public/                   # Static assets
│   ├── icons/                # App icons for PWA
│   └── manifest.json         # PWA manifest
├── styles/                   # Global styles
├── types/                    # TypeScript type definitions
├── next.config.js            # Next.js configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
├── package.json              # Project dependencies
└── README.md                 # Project documentation
```

## PWA Features

- **Offline Support**: Service workers cache assets and data for offline use
- **Installable**: Can be installed on home screen on mobile devices
- **Responsive**: Adapts to different screen sizes
- **Fast**: Optimized for performance

## License

[MIT](LICENSE)
