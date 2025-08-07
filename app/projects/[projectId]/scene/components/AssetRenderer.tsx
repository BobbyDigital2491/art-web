/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import { useEffect, useState, useRef } from 'react';
import { useTexture } from '@react-three/drei';
import { TransformControls } from '@react-three/drei';
import * as THREE from 'three';

interface Project {
  id: string;
  project_name: string;
  description?: string;
  target_path: string;
  media_path?: string;
  project_type: string;
  published: boolean;
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
  updated_at?: string;
}

interface AxisConstraints {
  translate: { x: boolean; y: boolean; z: boolean };
  rotate: { x: boolean; y: boolean; z: boolean };
  scale: { x: boolean; y: boolean; z: boolean };
}

interface AssetRendererProps {
  asset: Project;
  isSelected: boolean;
  axisConstraints: AxisConstraints;
  onTransform: (e?: THREE.Event) => void;
  transformMode: 'translate' | 'rotate' | 'scale';
}

async function validateUrl(url: string, project_type: string): Promise<{ isValid: boolean; error?: string; contentType?: string }> {
  console.log('validateUrl:', { url, project_type });
  try {
    let response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) {
      response = await fetch(url, { method: 'GET' });
      if (!response.ok) {
        console.error('validateUrl failed:', { url, status: response.status, statusText: response.statusText });
        return { isValid: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }
    }
    const contentType = response.headers.get('content-type') || '';
    const expectedTypes = project_type === 'image_target' ? ['image/jpeg', 'image/png'] : ['model/gltf-binary'];
    const urlPath = new URL(url).pathname;
    const fileName = urlPath.split('/').pop() || '';
    const extensionMatch = fileName.match(/\.([a-zA-Z0-9]+)(\?.*)?$/);
    let extension = extensionMatch ? extensionMatch[1].toLowerCase() : '';
    const expectedExtensions = project_type === 'image_target' ? ['jpg', 'jpeg', 'png'] : ['glb'];

    if (!extension && contentType) {
      if (contentType.includes('image/jpeg')) extension = 'jpeg';
      else if (contentType.includes('image/png')) extension = 'png';
      else if (contentType.includes('model/gltf-binary')) extension = 'glb';
    }

    if (!contentType) {
      console.error('validateUrl failed: No content-type returned', { url });
      return { isValid: false, error: 'No content-type returned' };
    }
    if (!expectedTypes.includes(contentType)) {
      console.error('validateUrl failed: Invalid content type', { url, contentType, expectedTypes });
      return { isValid: false, error: `Invalid content type: ${contentType}, expected ${expectedTypes.join(' or ')}` };
    }
    if (!extension || !expectedExtensions.includes(extension)) {
      console.error('validateUrl failed: Invalid file extension', { url, extension, expectedExtensions });
      return { isValid: false, error: `Invalid file extension: ${extension || 'none'}, expected ${expectedExtensions.join(' or ')}` };
    }
    console.log('validateUrl success:', { url, contentType, extension });
    return { isValid: true, contentType };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Network error';
    console.error('validateUrl error:', { url, project_type, error: errorMessage });
    return { isValid: false, error: errorMessage };
  }
}

export default function AssetRenderer({ asset, isSelected, axisConstraints, onTransform, transformMode }: AssetRendererProps) {
  const { target_path, project_type, rotation, scale, position } = asset;
  const isImageTarget = project_type === 'image_target';
  const fallbackUrl = '/assets/fallback.jpg';
  const [isValidAsset, setIsValidAsset] = useState<boolean | null>(null);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [isTextureLoading, setIsTextureLoading] = useState(isImageTarget);
  const meshRef = useRef<THREE.Mesh>(null);

  const textureResult = useTexture(isImageTarget ? (isValidAsset === false ? fallbackUrl : target_path) : fallbackUrl);

  useEffect(() => {
    console.log('AssetRenderer:', { id: asset.id, project_name: asset.project_name, target_path, project_type, isSelected, isValidAsset, assetError, transformMode });
    let isMounted = true;
    const checkAsset = async () => {
      const { isValid, error, contentType } = await validateUrl(target_path, project_type);
      if (!isMounted) return;
      setIsValidAsset(isValid);
      if (!isValid) {
        setAssetError(error || 'Unknown validation error');
        console.error(`Invalid asset URL: ${target_path}, project_type: ${project_type}, error: ${error}, contentType: ${contentType}`);
      }
    };
    checkAsset();
    return () => {
      isMounted = false;
    };
  }, [target_path, project_type, asset.id, asset.project_name]);

  useEffect(() => {
    try {
      if (isImageTarget && isValidAsset !== false) {
        if (textureResult instanceof THREE.Texture) {
          setTexture(textureResult);
          setIsTextureLoading(false);
        } else {
          throw new Error('Texture loading failed');
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setAssetError(errorMessage);
      setIsTextureLoading(false);
      console.error('Error loading asset:', {
        message: errorMessage,
        stack: err instanceof Error ? err.stack : undefined,
        target_path,
        project_type,
        isValidAsset,
        assetError,
        isSelected,
      });
    }
  }, [isImageTarget, isValidAsset, textureResult, target_path, project_type, assetError, isSelected, transformMode]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(position.x, position.y, position.z || 1);
      meshRef.current.rotation.set(rotation.x, rotation.y, rotation.z);
      meshRef.current.scale.set(scale.x, scale.y, scale.z);
      console.log('AssetRenderer updated mesh:', { position: meshRef.current.position.toArray(), rotation: meshRef.current.rotation.toArray(), scale: meshRef.current.scale.toArray() });
    }
  }, [position, rotation, scale, isValidAsset, transformMode, isSelected]);

  if (isTextureLoading) {
    return null;
  }

  return (
    <group>
      <mesh ref={meshRef}>
        {isValidAsset === false || assetError || !texture ? (
          <>
            <planeGeometry args={[2, 2]} />
            <meshStandardMaterial color="#ffffff" />
          </>
        ) : (
          <>
            <planeGeometry args={[2, 2]} />
            <meshStandardMaterial map={texture} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
          </>
        )}
      </mesh>
      {isSelected && meshRef.current && (
        <TransformControls
          mode={transformMode}
          object={meshRef.current}
          onChange={onTransform}
          enabled={isSelected}
          showX={axisConstraints[transformMode]?.x ?? true}
          showY={axisConstraints[transformMode]?.y ?? true}
          showZ={axisConstraints[transformMode]?.z ?? true}
        />
      )}
    </group>
  );
}