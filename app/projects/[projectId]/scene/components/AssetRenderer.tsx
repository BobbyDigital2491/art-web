'use client';
import { useRef, useEffect } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { TransformControls } from '@react-three/drei';

interface Transform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

interface AssetRendererProps {
  targetPath: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  transformMode: 'translate' | 'rotate' | 'scale';
  onTransformChange: (transform: Transform) => void;
}


export default function AssetRenderer({
  targetPath,
  position,
  rotation,
  scale,
  transformMode,
}: AssetRendererProps) {
  const texture = useTexture(targetPath);
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...position);
      meshRef.current.rotation.set(...rotation);
      meshRef.current.scale.set(...scale);
    }
  }, [position, rotation, scale]);

  console.log('AssetRenderer: targetPath:', targetPath, 'texture loaded:', !!texture);

  return (
    <TransformControls
      mode={transformMode}
      translationSnap={transformMode === 'translate' ? 0.1 : null}
      rotationSnap={transformMode === 'rotate' ? THREE.MathUtils.degToRad(5) : null}
      scaleSnap={transformMode === 'scale' ? 0.1 : null}
      showX={true}
      showY={true}
      showZ={true}
      
        
      
     
    >
      <mesh ref={meshRef}>
        <planeGeometry args={[2, 2]} />
        <meshStandardMaterial map={texture} />
      </mesh>
    </TransformControls>
  );
}