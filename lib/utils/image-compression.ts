/**
 * Utility functions for image compression
 */

/**
 * Compresses an image file to a target size (in bytes)
 * @param file The original image file
 * @param maxSizeBytes Maximum size in bytes (default: 1MB)
 * @returns Promise resolving to a compressed File object
 */
export async function compressImage(file: File, maxSizeBytes: number = 1024 * 1024): Promise<File> {
  // If file is already smaller than the target size, return it as is
  if (file.size <= maxSizeBytes) {
    console.log('Image already smaller than target size, no compression needed');
    return file;
  }

  // Create a canvas element to resize the image
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        // Calculate the scaling factor based on the original size
        let quality = 0.7; // Initial quality
        let maxWidth = img.width;
        let maxHeight = img.height;
        
        // If image is very large, reduce dimensions first
        const MAX_DIMENSION = 1920; // Max dimension for any side
        if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / img.width, MAX_DIMENSION / img.height);
          maxWidth = img.width * ratio;
          maxHeight = img.height * ratio;
        }
        
        // Create canvas with the new dimensions
        const canvas = document.createElement('canvas');
        canvas.width = maxWidth;
        canvas.height = maxHeight;
        
        // Draw the image on the canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, maxWidth, maxHeight);
        
        // Try to compress with different quality settings if needed
        const compressWithQuality = (currentQuality: number) => {
          // Convert to blob with the current quality
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Could not create blob from canvas'));
                return;
              }
              
              // If still too large and quality can be reduced further, try again
              if (blob.size > maxSizeBytes && currentQuality > 0.2) {
                // Reduce quality and try again
                const newQuality = Math.max(0.2, currentQuality - 0.1);
                console.log(`Image still too large (${(blob.size / 1024 / 1024).toFixed(2)}MB), reducing quality to ${newQuality.toFixed(2)}`);
                compressWithQuality(newQuality);
              } else {
                // Create a new file from the blob
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: file.lastModified
                });
                
                console.log(`Compressed image from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
                resolve(compressedFile);
              }
            },
            file.type,
            currentQuality
          );
        };
        
        // Start compression with initial quality
        compressWithQuality(quality);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file for compression'));
    };
  });
}
