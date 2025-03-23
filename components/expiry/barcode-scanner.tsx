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
  
  // For multiple scan validation
  const [barcodeHistory, setBarcodeHistory] = useState<{[key: string]: number}>({});
  const [validationCount, setValidationCount] = useState(3); // Number of times the same barcode must be detected

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
          track.enabled = false;
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
          track.enabled = false;
          console.log("Video track stopped from video element");
        });
        videoRef.current.srcObject = null;
      } catch (e) {
        console.error("Error clearing video element source:", e);
      }
    }
    
    // Additional safety: try to stop all video tracks on the page
    try {
      navigator.mediaDevices.getUserMedia({ audio: false, video: true })
        .then(stream => {
          stream.getTracks().forEach(track => {
            track.stop();
            console.log("Additional video track stopped");
          });
        })
        .catch(err => console.log("No additional media streams to clean up"));
    } catch (e) {
      console.log("Error in additional cleanup", e);
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
        // FIX: Adjusted the scanning area to match the green targeting box's position
        await Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: scannerRef.current,
            constraints: {
              width: { min: 1280, ideal: 1920, max: 2560 },
              height: { min: 720, ideal: 1080, max: 1440 },
              facingMode: "environment",
              aspectRatio: { ideal: 1.777778 },
            },
            area: {
              // Reverting to a full-screen scanning approach for better detection
              top: "0%",    // Scan the entire viewfinder
              right: "0%",  // No right margin
              left: "0%",   // No left margin
              bottom: "0%", // Scan the entire viewfinder
            },
            willReadFrequently: true
          },
          locator: {
            patchSize: "large",
            halfSample: true
          },
          debug: false,
          numOfWorkers: 2,
          frequency: 10,
          decoder: {
            readers: ["ean_reader", "ean_8_reader", "code_128_reader", "upc_reader", "upc_e_reader", "code_39_reader"],
            multiple: false,
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
            // Update barcode history counter
            setBarcodeHistory(prev => {
              const newHistory = { ...prev };
              newHistory[code] = (newHistory[code] || 0) + 1;
              
              console.log(`Barcode ${code} scanned ${newHistory[code]}/${validationCount} times`);
              
              // Play a soft beep for progress feedback
              try {
                const softBeep = new Audio("/beep.mp3");
                softBeep.volume = 0.3;
                softBeep.play().catch(() => {});
              } catch (e) {}
              
              // If we've reached the validation threshold
              if (newHistory[code] >= validationCount) {
                // Play a success sound at full volume
                try {
                  const beep = new Audio("/beep.mp3");
                  beep.play().catch(() => {});
                } catch (e) {}
                
                // First, clean up all resources synchronously
                cleanupResources();
                
                // Then call the onDetected callback with the barcode value
                onDetected(code);
              }
              
              return newHistory;
            });
          }
        });
        
        // Simplified processing visualization without red lines
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
          
          // Only highlight successful reads with a subtle indicator
          if (result && result.codeResult && result.codeResult.code) {
            const code = result.codeResult.code;
            const scanCount = barcodeHistory[code] || 0;
            const width = Number(drawingCanvas.getAttribute("width"));
            const height = Number(drawingCanvas.getAttribute("height"));
            
            // Draw a progress indicator at the bottom of the screen
            const progressWidth = (width / validationCount) * scanCount;
            drawingCtx.fillStyle = "rgba(0, 200, 0, 0.5)";
            drawingCtx.fillRect(0, height - 10, progressWidth, 10);
            
            // Add scan count text
            drawingCtx.font = "16px Arial";
            drawingCtx.fillStyle = "rgba(255, 255, 255, 0.8)";
            drawingCtx.fillText(`Scan ${scanCount}/${validationCount}`, 10, height - 20);
          } else if (result && result.box) {
            // Highlight detected barcode area with a subtle box to help with alignment
            // This helps users see when a barcode is being detected but not yet recognized
            drawingCtx.strokeStyle = "rgba(0, 255, 0, 0.3)";
            drawingCtx.lineWidth = 2;
            
            // Draw the detected box
            drawingCtx.beginPath();
            drawingCtx.moveTo(result.box[0][0], result.box[0][1]);
            result.box.forEach((point) => {
              drawingCtx.lineTo(point[0], point[1]);
            });
            drawingCtx.closePath();
            drawingCtx.stroke();
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
  
  // Function removed - no longer needed for production

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md overflow-hidden animate-in fade-in-0 zoom-in-95">
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-[#004BFE]">Scan Barcode</h2>
            <p className="text-sm text-muted-foreground">
              Position the barcode within the green box
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
              {/* Replaced green box with horizontal scanning line */}
              <div className="relative w-full flex flex-col items-center" id="scanner-target-line">
                {/* Red horizontal scanning line */}
                <div className="w-4/5 h-1 bg-red-500 animate-pulse shadow-lg shadow-red-500/50"></div>
                
                {/* Helper text */}
                <div className="mt-3 text-center">
                  <span className="text-xs text-white bg-black/50 px-2 py-1 rounded-full">
                    Align barcode with red line
                  </span>
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
        </div>
      </div>
    </div>
  );
}