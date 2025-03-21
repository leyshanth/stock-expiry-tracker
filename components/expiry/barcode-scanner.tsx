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
  const [scannerStarted, setScannerStarted] = useState(false);

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

  useEffect(() => {
    // Make sure we have a clean state before starting
    const cleanupQuagga = () => {
      try {
        console.log("Cleaning up Quagga before initialization");
        Quagga.offDetected();
        Quagga.offProcessed();
        Quagga.stop();
      } catch (e) {
        // Ignore errors from stopping - it might not be running
        console.log("Quagga wasn't running, continuing with initialization");
      }
    };

    const startScanner = async () => {
      // Check if scannerRef is available and scanner isn't already started
      if (!scannerRef.current || scannerStarted) {
        console.log("Scanner ref not available or scanner already started");
        return;
      }

      try {
        setIsInitializing(true);
        setHasError(false);
        
        // Clean up any existing Quagga instance
        cleanupQuagga();
        
        // Mark scanner as started to prevent multiple initializations
        setScannerStarted(true);

        // Verify scannerRef is still valid before initializing
        if (!scannerRef.current) {
          console.error("Scanner ref lost during initialization");
          throw new Error("Scanner reference is no longer available");
        }

        // Initialize Quagga with optimized settings
        console.log("Initializing Quagga with target:", scannerRef.current);
        await Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: scannerRef.current,
            constraints: {
              width: { min: 320 }, // Reduced minimum size for better compatibility
              height: { min: 240 },
              facingMode: "environment", // Use the rear camera
              aspectRatio: { min: 1, max: 2 }
            },
            area: { // Define scan area for better performance
              top: "25%",    // top offset
              right: "10%",  // right offset
              left: "10%",   // left offset
              bottom: "25%", // bottom offset
            },
          },
          locator: {
            patchSize: "medium",
            halfSample: true,
          },
          frequency: 10, // Increase scanning frequency
          numOfWorkers: 2, // Fixed number of workers for better stability
          decoder: {
            readers: [
              "ean_reader",
              "ean_8_reader",
              "code_128_reader",
              "code_39_reader",
              "code_93_reader",
              "upc_reader",
              "upc_e_reader",
            ],
            // Disable debug settings for better performance
            debug: {
              drawBoundingBox: false,
              showFrequency: false,
              drawScanline: false,
              showPattern: false,
            },
          },
          locate: true,
        });

        // Start Quagga with proper error handling
        try {
          await Quagga.start();
          console.log("Quagga started successfully");
          setIsInitializing(false);
        } catch (startError) {
          console.error("Error starting Quagga after initialization:", startError);
          throw startError; // Re-throw to be caught by the outer try-catch
        }

        // Remove any existing event listeners to prevent duplicates
        Quagga.offDetected();
        
        // Add event listener for barcode detection
        Quagga.onDetected((result: any) => {
          if (result && result.codeResult) {
            const code = result.codeResult.code;
            console.log("Barcode detected:", code);
            
            // Play a beep sound
            try {
              const beep = new Audio("/beep.mp3");
              beep.play().catch(e => console.log("Audio play failed:", e));
            } catch (e) {
              console.log("Audio creation failed:", e);
            }
            
            // Stop scanner and call the callback
            try {
              // Remove event listeners first to prevent memory leaks
              Quagga.offDetected();
              Quagga.offProcessed();
              Quagga.stop();
              setScannerStarted(false);
              console.log("Quagga stopped after detection");
            } catch (e) {
              console.error("Error stopping Quagga:", e);
            }
            
            if (typeof code === 'string') {
              onDetected(code);
            } else if (code) {
              // If code is not a string but is truthy, convert it to string
              onDetected(String(code));
            } else {
              // Handle the case where code is null or undefined
              toast({
                title: "Scan Failed",
                description: "Failed to read barcode. Please try again.",
                variant: "destructive"
              });
            }
          }
        });

        // Add debugging for scanner state
        Quagga.onProcessed((result: any) => {
          const drawingCtx = Quagga.canvas.ctx.overlay;
          const drawingCanvas = Quagga.canvas.dom.overlay;

          if (result) {
            if (result.boxes) {
              drawingCtx.clearRect(
                0,
                0,
                parseInt(drawingCanvas.getAttribute("width") || "0"),
                parseInt(drawingCanvas.getAttribute("height") || "0")
              );
              result.boxes.filter((box: any) => box !== result.box).forEach((box: any) => {
                Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, {
                  color: "green",
                  lineWidth: 2,
                });
              });
            }

            if (result.box) {
              Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, {
                color: "#00F",
                lineWidth: 2,
              });
            }

            if (result.codeResult && result.codeResult.code) {
              Quagga.ImageDebug.drawPath(
                result.line,
                { x: "x", y: "y" },
                drawingCtx,
                { color: "red", lineWidth: 3 }
              );
            }
          }
        });

      } catch (error) {
        console.error("Error starting barcode scanner:", error);
        setHasError(true);
        setIsInitializing(false);
        setScannerStarted(false);
        
        // Clean up any partial initialization
        try {
          Quagga.offDetected();
          Quagga.offProcessed();
          Quagga.stop();
        } catch (e) {
          // Ignore cleanup errors
        }
        
        if (onError) {
          onError(error instanceof Error ? error.message : String(error));
        }
        
        toast({
          title: "Camera Error",
          description: "Failed to access camera. Please check permissions.",
          variant: "destructive"
        });
      }
    };

    // Always start scanner in modal mode
    startScanner();

    // Cleanup function that runs when component unmounts
    return () => {
      try {
        console.log("Cleaning up scanner on unmount...");
        // Remove all event listeners first
        Quagga.offDetected();
        Quagga.offProcessed();
        // Then stop the scanner
        Quagga.stop();
        setScannerStarted(false);
      } catch (error) {
        console.error("Error stopping scanner during cleanup:", error);
      }
    };
  }, [onDetected, onError, toast]);

  const handleManualEntry = () => {
    // First stop the scanner if it's running
    try {
      // Remove event listeners first
      Quagga.offDetected();
      Quagga.offProcessed();
      // Then stop the scanner
      Quagga.stop();
      setScannerStarted(false);
    } catch (e) {
      // Ignore errors from stopping
    }
    
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
