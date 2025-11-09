"use client";

import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, PerspectiveCamera } from "@react-three/drei";
import { Car3DModel } from "./Car3DModel";
import { ARViewer } from "./ARViewer";
import { Button } from "@/components/ui/button";
import { Maximize2, RotateCcw, Sparkles } from "lucide-react";

interface ShowroomViewerProps {
  trimId: number;
  vehicleName: string;
  imageUrl?: string | null;
}

export function ShowroomViewer({ trimId, vehicleName, imageUrl }: ShowroomViewerProps) {
  const [selectedColor, setSelectedColor] = useState("#eb0a1e");
  const [showAR, setShowAR] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Use the STL model file from the models folder only for car ID 23568
  const modelUrl = trimId === 23568 
    ? `/models/uploads_files_4925279_2023+Toyota+RAV4+GR-S+[Create+by+Nazh+Design].stl`
    : undefined;

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const resetCamera = () => {
    // This would reset the camera - for now, just reload the page
    window.location.reload();
  };

  if (showAR) {
    return (
      <div className="relative h-screen w-full">
        <ARViewer modelUrl={modelUrl} vehicleName={vehicleName} color={selectedColor} />
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-gradient-to-b from-background to-secondary/10">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <Button
          variant="outline"
          onClick={() => setShowAR(true)}
          className="bg-background/90 backdrop-blur-sm"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          View in AR
        </Button>
        <Button
          variant="outline"
          onClick={toggleFullscreen}
          className="bg-background/90 backdrop-blur-sm"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          onClick={resetCamera}
          className="bg-background/90 backdrop-blur-sm"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="absolute bottom-4 left-4 z-10">
        <div className="rounded-lg bg-background/90 backdrop-blur-sm p-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-2">
            Color
          </p>
          <div className="flex gap-2">
            {["#eb0a1e", "#0f141a", "#ffffff", "#4d555f", "#9a0017"].map((c) => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                className={`h-8 w-8 rounded-full border-2 transition-all ${
                  selectedColor === c ? "border-primary scale-110" : "border-border"
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>
      </div>

      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={10}
        />
        <Environment preset="sunset" />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        <Car3DModel modelUrl={modelUrl} color={selectedColor} />
      </Canvas>
    </div>
  );
}

