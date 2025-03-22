"use client";

import React, { useRef, useEffect, useState } from 'react';
import Quagga from '@ericblade/quagga2';
import { Button } from "@/components/ui/button";
import { AlertCircle, Camera, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose?: () => void;
  onError?: (error: string) => void;
}

export default function BarcodeScanner({ 
  onDetected, 
  onClose,
  onError
}: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const { toast } = useToast();

  // Clean up all resources - centralized function
  const cleanupResources = () => {
    console.log("Cleaning up all resources");
    
    // Remove Quagga event listeners
    try {
      Quagga.offDetected();
      Quagga.offProcessed();
    } catch (e) {
      console.log("Error removing Quagga event listeners:", e);
    }
    
    // Stop Quagga
    try {
      Quagga.stop();
      console.log("Quagga stopped successfully");
    } catch (e) {
      console.error("Error stopping Quagga:", e);
    }
    
    // Stop camera streams
    if (cameraStream) {
      try {
        cameraStream.getTracks().forEach(track => {
          track.stop();
          console.log("Camera track stopped:", track.kind);
        });
        setCameraStream(null);
      } catch (e) {
        console.error("Error stopping camera tracks:", e);
      }
    }
    
    // Extra safety: clear video element source
    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const videoStream = videoRef.current.srcObject as MediaStream;
        videoStream.getTracks().forEach(track => {
          track.stop();
          console.log("Video track stopped from video element");
        });
        videoRef.current.srcObject = null;
      } catch (e) {
        console.error("Error clearing video element source:", e);
      }
    }
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        handleClose();
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [onClose]);
  
  // Function to properly clean up resources and close the scanner
  const handleClose = () => {
    cleanupResources();
    
    if (onClose) {
      onClose();
    }
  };

  // Initialize scanner when component mounts
  useEffect(() => {
    let mounted = true;
    
    // First try to get camera access directly with multiple fallback options
    const getCamera = async () => {
      // Try different camera configurations in sequence
      const cameraConfigs = [
        { facingMode: { exact: "environment" } }, // Try rear camera first with exact constraint
        { facingMode: "environment" },            // Try rear camera with preference
        { facingMode: "user" },                   // Try front camera as last resort
        {}                                        // Try any camera
      ];
      
      for (const config of cameraConfigs) {
        try {
          console.log("Requesting camera access with config:", config);
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              ...config,
              width: { min: 320, ideal: 640, max: 1280 },
              height: { min: 240, ideal: 480, max: 720 }
            },
            audio: false
          });
          
          if (mounted) {
            setCameraStream(stream);
            console.log("Camera access granted with config:", config);
            
            // If we have a video element, attach the stream
            if (videoRef.current) {
              // Make sure video is visible and has proper z-index
              videoRef.current.style.display = 'block';
              videoRef.current.style.zIndex = '5';
              videoRef.current.srcObject = stream;
              
              console.log('Setting video element source and making visible');
              
              // Ensure video plays after metadata is loaded
              videoRef.current.onloadedmetadata = () => {
                if (videoRef.current) {
                  console.log('Video metadata loaded, attempting to play');
                  videoRef.current.play()
                    .then(() => {
                      console.log('Video playback started successfully');
                      // Set initializing to false only after video is playing
                      setIsInitializing(false);
                    })
                    .catch(e => {
                      console.error("Error playing video:", e);
                      setHasError(true);
                      setIsInitializing(false);
                    });
                }
              };
            }
            return true; // Successfully got camera access
          } else {
            // Clean up if component unmounted
            stream.getTracks().forEach(track => track.stop());
            return false;
          }
        } catch (error) {
          console.error(`Camera access failed with config ${JSON.stringify(config)}:`, error);
          // Continue to next config
        }
      }
      
      console.error("All camera access attempts failed");
      return false;
    };
    
    // Get camera access first
    getCamera();
    
    const initializeScanner = async () => {
      if (!scannerRef.current) {
        console.error("Scanner ref not available");
        return;
      }
      
      try {
        // Don't stop Quagga before initialization - this can cause issues
        // Just make sure we remove any event listeners
        try {
          Quagga.offDetected();
          Quagga.offProcessed();
        } catch (e) {
          // Ignore - might not be running
        }
        
        setIsInitializing(true);
        setHasError(false);
        
        console.log("Initializing Quagga with target:", scannerRef.current);
        
        // Initialize with optimized configuration for faster barcode detection
        await Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: scannerRef.current,
            constraints: {
              width: { min: 1280, ideal: 1920, max: 2560 }, // Higher resolution for better detection
              height: { min: 720, ideal: 1080, max: 1440 },
              facingMode: "environment", // Allow fallback to front camera if needed
              aspectRatio: { ideal: 1.777778 }, // 16:9 aspect ratio
            },
            area: { // Define smaller scan area for better performance
              top: "30%",    // top offset
              right: "20%",  // right offset
              left: "20%",   // left offset
              bottom: "30%", // bottom offset
            },
            willReadFrequently: true
          },
          locator: {
            patchSize: "large", // Use larger patches for better detection
            halfSample: true
          },
          numOfWorkers: 2,
          decoder: {
            readers: ["ean_reader", "ean_8_reader", "code_128_reader", "upc_reader", "upc_e_reader"],
            multiple: false, // Only detect one barcode at a time
          },
          locate: true
        });
        
        // Start scanner
        await Quagga.start();
        console.log("Scanner started successfully");
        
        if (mounted) {
          setIsInitializing(false);
        }
        
        // Remove any existing event listeners first
        Quagga.offDetected();
        Quagga.offProcessed();
        
        // Set up barcode detection handler
        Quagga.onDetected((result) => {
          if (!result || !result.codeResult) return;
          
          const code = result.codeResult.code;
          console.log("Barcode detected:", code);
          
          if (typeof code === 'string' && code.length > 0) {
            // Play a success sound
            try {
              const beep = new Audio("/beep.mp3");
              beep.play().catch(() => {});
            } catch (e) {}
            
            // First, clean up all resources synchronously
            cleanupResources();
            
            // Then call the onDetected callback with the barcode value
            onDetected(code);
          }
        });
        
        // Add processing visualization for better feedback
        Quagga.onProcessed((result) => {
          const drawingCtx = Quagga.canvas.ctx.overlay;
          const drawingCanvas = Quagga.canvas.dom.overlay;
          
          if (!drawingCtx || !drawingCanvas) return;

          // Clear the canvas
          drawingCtx.clearRect(
            0, 
            0, 
            Number(drawingCanvas.getAttribute("width")), 
            Number(drawingCanvas.getAttribute("height"))
          );

          if (result) {
            // Draw boxes for potential barcodes
            if (result.boxes) {
              result.boxes
                .filter((box: any) => box !== result.box)
                .forEach((box: any) => {
                  Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, { 
                    color: "green", 
                    lineWidth: 2 
                  });
                });
            }

            // Highlight the main detected box
            if (result.box) {
              Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, { 
                color: "blue", 
                lineWidth: 2 
              });
            }

            // Draw the scan line for successful reads
            if (result.codeResult && result.codeResult.code) {
              Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, { 
                color: "red", 
                lineWidth: 3 
              });
            }
          }
        });
      } catch (error) {
        console.error("Scanner initialization error:", error);
        if (mounted) {
          setHasError(true);
          setIsInitializing(false);
        }
        
        // Check for specific permission errors
        let errorMessage = "Failed to access camera. Please check permissions.";
        if (error instanceof Error) {
          if (error.name === "NotAllowedError" || error.message.includes("Permission denied")) {
            errorMessage = "Camera access denied. Please allow camera permissions in your browser settings.";
          } else if (error.name === "NotFoundError" || error.message.includes("Requested device not found")) {
            errorMessage = "No camera found. Please ensure your device has a working camera.";
          } else if (error.name === "NotReadableError" || error.message.includes("Could not start video source")) {
            errorMessage = "Camera is in use by another application. Please close other applications using the camera.";
          } else if (error.name === "OverconstrainedError") {
            errorMessage = "Camera doesn't meet the required constraints. Try using a different camera.";
          } else if (error.name === "AbortError") {
            errorMessage = "Camera initialization was aborted. Please try again.";
          }
        }
        
        if (onError) {
          onError(error instanceof Error ? error.message : String(error));
        }
        
        toast({
          title: "Camera Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
    };
    
    // Start scanner
    initializeScanner();
    
    // Cleanup function for when component unmounts
    return () => {
      mounted = false;
      cleanupResources();
    };
  }, [onDetected, onError, toast]);

  const handleManualEntry = () => {
    const barcode = prompt("Enter barcode manually:");
    if (barcode && barcode.trim() !== "") {
      onDetected(barcode.trim());
    }
  };
  
  // For testing - simulate a barcode scan
  const simulateScan = () => {
    const testBarcodes = ["5901234123457", "0123456789012", "1234567890128"];
    const randomBarcode = testBarcodes[Math.floor(Math.random() * testBarcodes.length)];
    onDetected(randomBarcode);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md overflow-hidden animate-in fade-in-0 zoom-in-95">
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Scan Barcode</h2>
            <p className="text-sm text-muted-foreground">
              Position the barcode within the scanner area
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Direct video element as fallback */}
        <div className="w-full h-64 md:h-80 relative overflow-hidden">
          <video 
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay 
            playsInline 
            muted
            style={{ 
              display: 'block', 
              zIndex: 5,
              visibility: !hasError && !isInitializing ? 'visible' : 'hidden'
            }}
          ></video>
          
          {/* Loading state overlay */}
          <div 
            className="absolute inset-0 flex h-64 md:h-80 items-center justify-center" 
            style={{ 
              zIndex: 10,
              display: isInitializing ? 'flex' : 'none'
            }}
          >
            <div className="text-center bg-background/80 p-4 rounded-lg">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Initializing camera...</p>
              <p className="mt-1 text-xs text-muted-foreground">Please allow camera access when prompted</p>
            </div>
          </div>
          
          {/* Error state overlay */}
          <div 
            className="absolute inset-0 flex h-64 md:h-80 flex-col items-center justify-center p-4" 
            style={{ 
              zIndex: 10,
              display: hasError ? 'flex' : 'none'
            }}
          >
            <div className="bg-background/80 p-4 rounded-lg text-center">
              <AlertCircle className="h-8 w-8 text-destructive mb-2 mx-auto" />
              <p className="text-center text-sm font-medium text-destructive">Failed to access camera</p>
              <p className="text-center text-xs text-muted-foreground mt-1 mb-4">Please check your permissions or try manual entry</p>
              <Button onClick={handleManualEntry}>
                Enter Barcode Manually
              </Button>
            </div>
          </div>
          
          {/* Scanner area - always present but with varying visibility */}
          <div 
            ref={scannerRef} 
            className="absolute inset-0 w-full h-64 md:h-80 overflow-hidden"
            style={{ 
              zIndex: 8,
              visibility: !isInitializing && !hasError ? 'visible' : 'hidden'
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-3/5 h-1/4 border-2 border-red-500 border-dashed rounded-lg">
                {/* Add crosshair for better targeting */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1/2 h-0.5 bg-red-500"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-0.5 h-1/2 bg-red-500"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 flex justify-between">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleManualEntry} className="ml-auto">
            Enter Manually
          </Button>
          <Button onClick={simulateScan} variant="secondary" className="ml-2">
            Test Scan
          </Button>
        </div>
      </div>
    </div>
  );
}