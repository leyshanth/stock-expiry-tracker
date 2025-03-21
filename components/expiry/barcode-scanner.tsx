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
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [onClose]);

  // Initialize scanner when component mounts
  useEffect(() => {
    let mounted = true;
    let quaggaInstance: any = null;
    
    const initializeScanner = async () => {
      if (!scannerRef.current) return;
      
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
        
        // Initialize with more specific configuration
        await Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: scannerRef.current,
            constraints: {
              width: { min: 320, ideal: 640, max: 1280 },
              height: { min: 240, ideal: 480, max: 720 },
              facingMode: "environment"
            },
            area: { // Define scan area for better performance
              top: "25%",    // top offset
              right: "10%",  // right offset
              left: "10%",   // left offset
              bottom: "25%", // bottom offset
            }
          },
          locator: {
            patchSize: "medium",
            halfSample: true
          },
          numOfWorkers: 2,
          decoder: {
            readers: ["ean_reader", "ean_8_reader", "code_128_reader", "upc_reader", "upc_e_reader"]
          },
          locate: true
        });
        
        // Store reference to current instance
        quaggaInstance = Quagga;
        
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
            
            // Stop Quagga after successful scan
            try {
              Quagga.offDetected();
              Quagga.offProcessed();
              Quagga.stop();
              console.log("Quagga stopped after successful scan");
            } catch (stopError) {
              console.error("Error stopping Quagga after scan:", stopError);
            }
            
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
    
    // Cleanup function
    return () => {
      mounted = false;
      try {
        if (quaggaInstance) {
          quaggaInstance.offDetected();
          quaggaInstance.stop();
        }
      } catch (e) {
        console.error("Error during cleanup:", e);
      }
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
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {isInitializing ? (
          <div className="flex h-64 md:h-80 items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Initializing camera...</p>
              <p className="mt-1 text-xs text-muted-foreground">Please allow camera access when prompted</p>
            </div>
          </div>
        ) : hasError ? (
          <div className="flex h-64 md:h-80 flex-col items-center justify-center p-4">
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <p className="text-center text-sm font-medium text-destructive">Failed to access camera</p>
            <p className="text-center text-xs text-muted-foreground mt-1 mb-4">Please check your permissions or try manual entry</p>
            <Button onClick={handleManualEntry}>
              Enter Barcode Manually
            </Button>
          </div>
        ) : (
          <div 
            ref={scannerRef} 
            className="w-full h-64 md:h-80 relative overflow-hidden"
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-4/5 h-1/3 border-2 border-red-500 border-dashed rounded-lg"></div>
            </div>
          </div>
        )}
        
        <div className="p-4 flex justify-between">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button onClick={handleManualEntry} className={cn("ml-auto", onClose ? "" : "w-full")}>
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
