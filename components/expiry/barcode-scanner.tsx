"use client"

import { useEffect, useRef, useState } from "react"
import Quagga from "@ericblade/quagga2"
import { AlertCircle, Camera, RefreshCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void
  onError?: (error: string) => void
  scanRate?: number
  autoStart?: boolean
}

export default function BarcodeScanner({ 
  onDetected, 
  onError, 
  scanRate = 1, 
  autoStart = true 
}: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null)
  const [hasError, setHasError] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const { toast } = useToast()
  
  // Track the last detection time for throttling
  const lastDetectionTime = useRef<number>(0)
  
  const startScanner = async () => {
    if (!scannerRef.current) return
    
    setIsInitializing(true)
    setHasError(false)
    
    try {
      // First check if camera permissions are available
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Stop the stream immediately after checking permissions
        stream.getTracks().forEach(track => track.stop());
      } catch (permissionError) {
        console.error("Camera permission error:", permissionError);
        setHasError(true);
        setIsInitializing(false);
        toast({
          title: "Camera Access Denied",
          description: "Please allow camera access to use the barcode scanner",
          variant: "destructive"
        });
        if (onError) {
          onError("Camera permission denied");
        }
        return;
      }
      
      await Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            facingMode: "environment", // Use the back camera on mobile devices
            width: { min: 320 },
            height: { min: 240 },
            aspectRatio: { min: 1, max: 2 },
          },
        },
        locator: {
          patchSize: "medium",
          halfSample: true,
        },
        numOfWorkers: 2, // Reduced for better performance
        frequency: 10,
        decoder: {
          readers: [
            "ean_reader",
            "ean_8_reader",
            "code_128_reader",
            "code_39_reader",
            "upc_reader",
            "upc_e_reader",
          ],
          multiple: false,
        },
        locate: true,
      })

      Quagga.start()
      setIsInitializing(false)

      // Draw detection result for visual feedback
      Quagga.onProcessed((result) => {
        const drawingCtx = Quagga.canvas.ctx.overlay
        const drawingCanvas = Quagga.canvas.dom.overlay

        if (result) {
          if (result.boxes) {
            drawingCtx.clearRect(
              0,
              0,
              parseInt(drawingCanvas.getAttribute("width") || "0"),
              parseInt(drawingCanvas.getAttribute("height") || "0")
            )
            result.boxes.filter((box) => box !== result.box).forEach((box) => {
              Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, {
                color: "green",
                lineWidth: 2,
              })
            })
          }

          if (result.box) {
            Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, {
              color: "#00F",
              lineWidth: 2,
            })
          }

          if (result.codeResult && result.codeResult.code) {
            Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, {
              color: "red",
              lineWidth: 3,
            })
          }
        }
      })

      // Handle barcode detection with throttling based on scanRate
      Quagga.onDetected((result) => {
        if (result && result.codeResult && result.codeResult.code) {
          // Throttle detections based on scanRate
          const now = Date.now()
          if (now - lastDetectionTime.current > 1000 / scanRate) {
            lastDetectionTime.current = now
            
            // Play a beep sound
            const beep = new Audio("/beep.mp3")
            beep.play().catch((e) => console.log("Audio play failed:", e))
            
            // Call the callback with the detected barcode
            onDetected(result.codeResult.code)
          }
        }
      })
    } catch (error) {
      console.error("Error initializing barcode scanner:", error)
      setHasError(true)
      setIsInitializing(false)
      if (onError) {
        onError(error instanceof Error ? error.message : String(error))
      }
    }
  }

  useEffect(() => {
    if (autoStart) {
      startScanner()
    }

    // Cleanup
    return () => {
      Quagga.stop()
    }
  }, [onDetected, autoStart, scanRate])

  return (
    <div className="relative">
      {isInitializing ? (
        <div className="flex h-[300px] items-center justify-center rounded-lg border bg-muted/20">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Initializing camera...</p>
          </div>
        </div>
      ) : hasError ? (
        <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border bg-destructive/10 p-4">
          <AlertCircle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-center text-sm font-medium text-destructive">Failed to access camera</p>
          <p className="text-center text-xs text-muted-foreground mt-1 mb-4">Please ensure camera permissions are granted</p>
          <Button onClick={startScanner} size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      ) : (
        <>
          <div 
            ref={scannerRef} 
            className="overflow-hidden rounded-lg border"
            style={{ height: "300px" }}
          />
          <div className="absolute inset-0 pointer-events-none">
            <div className="h-full w-full flex items-center justify-center">
              <div className="border-2 border-red-500 w-3/4 h-1/3 rounded-lg"></div>
            </div>
          </div>
          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            <Camera className="h-3 w-3 inline-block mr-1" />
            Scanning...
          </div>
        </>
      )}
    </div>
  )
}
