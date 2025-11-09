"use client";

import { useRef, Suspense, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import * as THREE from "three";

interface Car3DModelProps {
  modelUrl?: string;
  color?: string;
}

function Model({ modelUrl, color = "#eb0a1e" }: Car3DModelProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [stlGeometry, setStlGeometry] = useState<THREE.BufferGeometry | null>(null);

  // Try to load GLTF/GLB model first
  let gltfModel = null;
  if (modelUrl && (modelUrl.endsWith(".gltf") || modelUrl.endsWith(".glb"))) {
    try {
      gltfModel = useGLTF(modelUrl);
    } catch (error) {
      console.warn("Failed to load GLTF model:", error);
    }
  }

  // Load STL model
  useEffect(() => {
    if (modelUrl && modelUrl.endsWith(".stl")) {
      const loader = new STLLoader();
      loader.load(
        modelUrl,
        (geometry) => {
          geometry.computeVertexNormals();
          setStlGeometry(geometry);
        },
        undefined,
        (error) => {
          console.warn("Failed to load STL model:", error);
        }
      );
    }
  }, [modelUrl]);

  // Subtle rotation animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  // If we have a loaded GLTF model, render it
  if (gltfModel) {
    return (
      <group ref={meshRef}>
        <primitive object={gltfModel.scene} />
      </group>
    );
  }

  // If we have a loaded STL model, render it
  if (stlGeometry) {
    return (
      <group ref={meshRef}>
        <mesh geometry={stlGeometry} position={[0, 0, 0]}>
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    );
  }

  // Fallback: Simple procedural car model
  return (
    <group ref={meshRef}>
      {/* Car body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 1, 4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Windshield */}
      <mesh position={[0, 0.3, 0.5]}>
        <boxGeometry args={[1.8, 0.3, 0.5]} />
        <meshStandardMaterial color="#87CEEB" opacity={0.7} transparent />
      </mesh>
      {/* Wheels */}
      {[
        [-1.2, -0.6, 1.2],
        [1.2, -0.6, 1.2],
        [-1.2, -0.6, -1.2],
        [1.2, -0.6, -1.2],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ))}
    </group>
  );
}

export function Car3DModel({ modelUrl, color }: Car3DModelProps) {
  return (
    <Suspense fallback={null}>
      <Model modelUrl={modelUrl} color={color} />
    </Suspense>
  );
}

