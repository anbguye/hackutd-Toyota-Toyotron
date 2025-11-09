"use client";

import { Canvas } from "@react-three/fiber";
import { ARButton, XR } from "@react-three/xr";
import { Environment } from "@react-three/drei";
import { Car3DModel } from "./Car3DModel";

interface ARViewerProps {
  modelUrl?: string;
  vehicleName: string;
  color?: string;
}

export function ARViewer({ modelUrl, vehicleName, color }: ARViewerProps) {

  return (
    <div className="relative h-screen w-full">
      <div className="absolute top-4 left-4 z-10">
        <ARButton
          sessionInit={{
            requiredFeatures: ["hit-test"],
            optionalFeatures: ["dom-overlay"],
            domOverlay: {
              root: document.body,
            },
          }}
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-primary/90"
        >
          Start AR
        </ARButton>
      </div>

      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ width: "100%", height: "100%" }}
      >
        <XR>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <Environment preset="sunset" />
          <Car3DModel modelUrl={modelUrl} color={color} />
        </XR>
      </Canvas>
    </div>
  );
}

