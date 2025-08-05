'use client';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Sidebar from '../../../components/Sidebar';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useTexture } from '@react-three/drei';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { HiX } from 'react-icons/hi';
import { FiMaximize, FiMinimize, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import QRCode from 'qrcode';
import * as THREE from 'three';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Project {
  id: string;
  project_name: string;
  target_path: string;
  media_path?: string;
  project_type: string;
  published: boolean;
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
}

async function validateUrl(url: string, project_type: string): Promise<{ isValid: boolean; error?: string; contentType?: string }> {
  try {
    let response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) {
      response = await fetch(url, { method: 'GET' });
      if (!response.ok) {
        return { isValid: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }
    }
    const contentType = response.headers.get('content-type') || '';
    const expectedTypes = project_type === 'image_target' ? ['image/jpeg', 'image/png'] : ['model/gltf-binary'];
    const urlPath = url.split('?')[0];
    const fileName = urlPath.split('/').pop() || '';
    const extensionMatch = fileName.match(/\.([a-zA-Z0-9]+)$/);
    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : '';
    const expectedExtensions = project_type === 'image_target' ? ['jpg', 'jpeg', 'png'] : ['glb'];

    if (!contentType) {
      return { isValid: false, error: 'No content-type returned' };
    }
    if (!expectedTypes.includes(contentType)) {
      return { isValid: false, error: `Invalid content type: ${contentType}, expected ${expectedTypes.join(' or ')}` };
    }
    if (!extension || !expectedExtensions.includes(extension)) {
      return { isValid: false, error: `Invalid file extension: ${extension || 'none'}, expected ${expectedExtensions.join(' or ')}` };
    }
    return { isValid: true, contentType };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Network error';
    console.error('validateUrl error:', { url, project_type, error: errorMessage });
    return { isValid: false, error: errorMessage };
  }
}

function SceneModel({
  project,
  rotation,
  scale,
  position,
  materialColor,
  ambientIntensity,
  directionalLightPos,
}: {
  project: Project;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  position: THREE.Vector3;
  materialColor: string;
  ambientIntensity: number;
  directionalLightPos: THREE.Vector3;
}) {
  const { target_path, project_type } = project;
  const isImageTarget = project_type === 'image_target';
  const [isValidAsset, setIsValidAsset] = useState<boolean | null>(null);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [gltf, setGltf] = useState<GLTF | null>(null);
  const [isTextureLoading, setIsTextureLoading] = useState(isImageTarget);
  const fallbackUrl = '/assets/fallback.jpg';
  const fallbackModelUrl = '/assets/fallback.glb';

  const textureResult = useTexture(isImageTarget ? (isValidAsset === false ? fallbackUrl : target_path) : fallbackUrl);
  const gltfResult = useGLTF(!isImageTarget ? (isValidAsset === false ? fallbackModelUrl : target_path) : fallbackModelUrl);

  useEffect(() => {
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
  }, [target_path, project_type]);

  useEffect(() => {
    try {
      if (isImageTarget && isValidAsset !== false) {
        if (textureResult instanceof THREE.Texture) {
          setTexture(textureResult);
          setIsTextureLoading(false);
        } else {
          throw new Error('Texture loading failed');
        }
      } else if (!isImageTarget && isValidAsset !== false) {
        setGltf(gltfResult);
        setIsTextureLoading(false);
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
        assetError,
      });
    }
  }, [isImageTarget, isValidAsset, textureResult, gltfResult, target_path, project_type, assetError]);

  useEffect(() => {
    if (!isImageTarget && gltf?.scene) {
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) {
        const scaleFactor = 2 / maxDim;
        scale.set(scaleFactor, scaleFactor, scaleFactor);
      }
    }
  }, [gltf, isImageTarget, scale]);

  if (isImageTarget && isTextureLoading) {
    return <></>;
  }

  return (
    <>
      {isValidAsset === false || assetError || (!texture && isImageTarget) ? (
        <mesh rotation={rotation} scale={scale} position={position}>
          {isImageTarget ? <planeGeometry args={[2, 2]} /> : <boxGeometry args={[1, 1, 1]} />}
          <meshStandardMaterial color={materialColor} />
        </mesh>
      ) : (
        <>
          {isImageTarget && texture ? (
            <mesh rotation={rotation} scale={scale} position={position}>
              <planeGeometry args={[2, 2]} />
              <meshStandardMaterial map={texture} color={materialColor} />
            </mesh>
          ) : !isImageTarget && gltf ? (
            <primitive object={gltf.scene} rotation={rotation} scale={scale} position={position} />
          ) : (
            <mesh rotation={rotation} scale={scale} position={position}>
              {isImageTarget ? <planeGeometry args={[2, 2]} /> : <boxGeometry args={[1, 1, 1]} />}
              <meshStandardMaterial color={materialColor} />
            </mesh>
          )}
          <ambientLight intensity={ambientIntensity} />
          <directionalLight position={directionalLightPos} intensity={1} />
        </>
      )}
    </>
  );
}

export default function SceneEditor() {
  const { projectId } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [rotation, setRotation] = useState(new THREE.Euler(0, 0, 0));
  const [scale, setScale] = useState(new THREE.Vector3(1, 1, 1));
  const [position, setPosition] = useState(new THREE.Vector3(0, 0, 0));
  const [materialColor, setMaterialColor] = useState('#ffffff');
  const [ambientIntensity, setAmbientIntensity] = useState(0.5);
  const [directionalLightPos, setDirectionalLightPos] = useState(new THREE.Vector3(5, 5, 5));
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setError('Authentication failed');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('ar_assets')
          .select('id, project_name, target_path, media_path, project_type, published, rotation, scale, position')
          .eq('id', projectId)
          .eq('user_id', user.id)
          .single();

        if (error) {
          setError('Failed to fetch project: ' + error.message);
          setLoading(false);
          return;
        }

        if (data) {
          if (!data.target_path) {
            setError('Project has no target_path');
            setLoading(false);
            return;
          }

          const storageBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ar-assets/`;
          let cleanedTargetPath = data.target_path;
          if (cleanedTargetPath.startsWith(storageBaseUrl)) {
            cleanedTargetPath = cleanedTargetPath.replace(storageBaseUrl, '');
          } else if (cleanedTargetPath.startsWith('https://')) {
            const match = cleanedTargetPath.match(/ar-assets\/(.+)/);
            if (match) {
              cleanedTargetPath = match[1];
            }
          }

          let publicUrlData: { data: { publicUrl: string } } | null = null;
          let attempts = 0;
          const maxAttempts = 3;
          while (attempts < maxAttempts) {
            const result = supabase.storage.from('ar-assets').getPublicUrl(cleanedTargetPath);
            if (result.data.publicUrl) {
              publicUrlData = result;
              break;
            }
            attempts++;
            console.warn(`Retry ${attempts}/${maxAttempts} for public URL: ${cleanedTargetPath}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          const localFallbackUrl = '/assets/fallback.jpg';
          if (!publicUrlData?.data.publicUrl) {
            console.warn(`Empty public URL for target_path: ${cleanedTargetPath}`);
            setAssetError('Failed to fetch storage URL: Empty public URL');
          }

          const targetPath = publicUrlData?.data.publicUrl || localFallbackUrl;
          console.log('Target path:', targetPath, 'Original target_path:', data.target_path, 'Cleaned target_path:', cleanedTargetPath);

          const { isValid, error: validationError } = await validateUrl(targetPath, data.project_type);
          if (!isValid) {
            console.warn(`Invalid target_path for project ${data.id}: ${targetPath}, error: ${validationError}`);
            setAssetError(validationError || 'Invalid asset URL');
          }

          setProject({
            id: data.id,
            project_name: data.project_name,
            target_path: isValid ? targetPath : localFallbackUrl,
            media_path: data.media_path,
            project_type: data.project_type,
            published: data.published || false,
            rotation: data.rotation || { x: 0, y: 0, z: 0 },
            scale: data.scale || { x: 1, y: 1, z: 1 },
            position: data.position || { x: 0, y: 0, z: 0 },
          });
          setRotation(new THREE.Euler(data.rotation?.x || 0, data.rotation?.y || 0, data.rotation?.z || 0));
          setScale(new THREE.Vector3(data.scale?.x || 1, data.scale?.y || 1, data.scale?.z || 1));
          setPosition(new THREE.Vector3(data.position?.x || 0, data.position?.y || 0, data.position?.z || 0));
        }
      } catch (err: unknown) {
        setError('Unexpected error: ' + (err instanceof Error ? err.message : 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
      if (!document.fullscreenElement && canvasContainerRef.current) {
        canvasContainerRef.current.style.height = '';
      }
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  const toggleFullScreen = () => {
    if (!canvasContainerRef.current) return;
    if (!isFullScreen) {
      canvasContainerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handlePublish = async () => {
    if (!project) return;
    try {
      const { error } = await supabase
        .from('ar_assets')
        .update({ published: true })
        .eq('id', project.id);
      if (error) {
        setError('Failed to publish project: ' + error.message);
        return;
      }

      const arSceneUrl = `${window.location.origin}/ar/${project.id}`;
      const qrCodeDataUrl = await QRCode.toDataURL(arSceneUrl);
      setQrCodeUrl(qrCodeDataUrl);
      setShowPublishModal(true);
      setProject({ ...project, published: true });
      router.push(`/ar/${project.id}`);
    } catch (err: unknown) {
      setError('Unexpected error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleSave = async () => {
    if (!project) return;
    try {
      const { error } = await supabase
        .from('ar_assets')
        .update({
          rotation: { x: rotation.x, y: rotation.y, z: rotation.z },
          scale: { x: scale.x, y: scale.y, z: scale.z },
          position: { x: position.x, y: position.y, z: position.z },
        })
        .eq('id', project.id);
      if (error) {
        setError('Failed to save transformations: ' + error.message);
      } else {
        setError(null);
        alert('Transformations saved successfully!');
      }
    } catch (err: unknown) {
      setError('Unexpected error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleReset = () => {
    setRotation(new THREE.Euler(0, 0, 0));
    setScale(new THREE.Vector3(1, 1, 1));
    setPosition(new THREE.Vector3(0, 0, 0));
    setMaterialColor('#ffffff');
    setAmbientIntensity(0.5);
    setDirectionalLightPos(new THREE.Vector3(5, 5, 5));
  };

  const handleControlChange = (
    type: 'rotation' | 'scale' | 'position' | 'directionalLightPos',
    axis: 'x' | 'y' | 'z' | 'all',
    value: number
  ) => {
    if (type === 'rotation') {
      const newRotation = rotation.clone();
      if (axis === 'x') newRotation.x = value;
      else if (axis === 'y') newRotation.y = value;
      else if (axis === 'z') newRotation.z = value;
      setRotation(newRotation);
    } else if (type === 'scale') {
      setScale(new THREE.Vector3(value, value, value));
    } else if (type === 'position') {
      const newPosition = position.clone();
      if (axis === 'x') newPosition.x = value;
      else if (axis === 'y') newPosition.y = value;
      else if (axis === 'z') newPosition.z = value;
      setPosition(newPosition);
    } else if (type === 'directionalLightPos') {
      const newLightPos = directionalLightPos.clone();
      if (axis === 'x') newLightPos.x = value;
      else if (axis === 'y') newLightPos.y = value;
      else if (axis === 'z') newLightPos.z = value;
      setDirectionalLightPos(newLightPos);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar onToggle={setSidebarCollapsed} />
      <div
        className={`flex-1 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'} p-6 bg-gray-100 transition-all duration-300`}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {project ? `Editing ${project.project_name}` : '3D Editor'}
        </h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {loading ? (
          <div className="flex justify-center items-center h-[500px]">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : project ? (
          <div className={`bg-white rounded-lg shadow-md ${isFullScreen ? 'h-full' : 'max-h-[500px]'} flex-1`}>
            <div
              ref={canvasContainerRef}
              className={`relative w-full h-full ${isFullScreen ? 'fixed inset-0 z-50' : ''}`}
            >
              <div className="absolute top-2 right-2 z-30">
                <button
                  onClick={toggleFullScreen}
                  className="p-1.5 rounded-full bg-gray-800 bg-opacity-70 text-white hover:bg-opacity-90 transition"
                  title={isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen'}
                >
                  {isFullScreen ? <FiMinimize className="h-5 w-5" /> : <FiMaximize className="h-5 w-5" />}
                </button>
              </div>
              {assetError && (
                <p className="text-red-500 text-center absolute top-10 w-full z-30 bg-gray-800 bg-opacity-70 py-1">{`Error: ${assetError}`}</p>
              )}
              <Canvas className="w-full h-full">
                <Suspense fallback={null}>
                  <SceneModel
                    project={project}
                    rotation={rotation}
                    scale={scale}
                    position={position}
                    materialColor={materialColor}
                    ambientIntensity={ambientIntensity}
                    directionalLightPos={directionalLightPos}
                  />
                  <OrbitControls />
                </Suspense>
              </Canvas>
              <div
                className="absolute right-2 top-14 bottom-2 w-72 bg-gray-800 bg-opacity-90 text-white p-3 rounded-lg shadow-lg overflow-y-auto z-20 md:block hidden"
              >
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-200">Rotation</h3>
                    <label className="block text-xs text-gray-400">X</label>
                    <input
                      type="range"
                      min="-3.14"
                      max="3.14"
                      step="0.01"
                      value={rotation.x}
                      onChange={(e) => handleControlChange('rotation', 'x', parseFloat(e.target.value))}
                      className="w-full h-1 bg-gray-600 rounded"
                    />
                    <label className="block text-xs text-gray-400">Y</label>
                    <input
                      type="range"
                      min="-3.14"
                      max="3.14"
                      step="0.01"
                      value={rotation.y}
                      onChange={(e) => handleControlChange('rotation', 'y', parseFloat(e.target.value))}
                      className="w-full h-1 bg-gray-600 rounded"
                    />
                    <label className="block text-xs text-gray-400">Z</label>
                    <input
                      type="range"
                      min="-3.14"
                      max="3.14"
                      step="0.01"
                      value={rotation.z}
                      onChange={(e) => handleControlChange('rotation', 'z', parseFloat(e.target.value))}
                      className="w-full h-1 bg-gray-600 rounded"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-200">Scale</h3>
                    <input
                      type="range"
                      min="0.1"
                      max="5"
                      step="0.1"
                      value={scale.x}
                      onChange={(e) => handleControlChange('scale', 'all', parseFloat(e.target.value))}
                      className="w-full h-1 bg-gray-600 rounded"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-200">Position</h3>
                    <label className="block text-xs text-gray-400">X</label>
                    <input
                      type="range"
                      min="-5"
                      max="5"
                      step="0.1"
                      value={position.x}
                      onChange={(e) => handleControlChange('position', 'x', parseFloat(e.target.value))}
                      className="w-full h-1 bg-gray-600 rounded"
                    />
                    <label className="block text-xs text-gray-400">Y</label>
                    <input
                      type="range"
                      min="-5"
                      max="5"
                      step="0.1"
                      value={position.y}
                      onChange={(e) => handleControlChange('position', 'y', parseFloat(e.target.value))}
                      className="w-full h-1 bg-gray-600 rounded"
                    />
                    <label className="block text-xs text-gray-400">Z</label>
                    <input
                      type="range"
                      min="-5"
                      max="5"
                      step="0.1"
                      value={position.z}
                      onChange={(e) => handleControlChange('position', 'z', parseFloat(e.target.value))}
                      className="w-full h-1 bg-gray-600 rounded"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-200">Material</h3>
                    <label className="block text-xs text-gray-400">Color</label>
                    <input
                      type="color"
                      value={materialColor}
                      onChange={(e) => setMaterialColor(e.target.value)}
                      className="w-full h-6 rounded"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-200">Lighting</h3>
                    <label className="block text-xs text-gray-400">Ambient Intensity</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={ambientIntensity}
                      onChange={(e) => setAmbientIntensity(parseFloat(e.target.value))}
                      className="w-full h-1 bg-gray-600 rounded"
                    />
                    <label className="block text-xs text-gray-400">Directional Light X</label>
                    <input
                      type="range"
                      min="-10"
                      max="10"
                      step="0.1"
                      value={directionalLightPos.x}
                      onChange={(e) => handleControlChange('directionalLightPos', 'x', parseFloat(e.target.value))}
                      className="w-full h-1 bg-gray-600 rounded"
                    />
                    <label className="block text-xs text-gray-400">Directional Light Y</label>
                    <input
                      type="range"
                      min="-10"
                      max="10"
                      step="0.1"
                      value={directionalLightPos.y}
                      onChange={(e) => handleControlChange('directionalLightPos', 'y', parseFloat(e.target.value))}
                      className="w-full h-1 bg-gray-600 rounded"
                    />
                    <label className="block text-xs text-gray-400">Directional Light Z</label>
                    <input
                      type="range"
                      min="-10"
                      max="10"
                      step="0.1"
                      value={directionalLightPos.z}
                      onChange={(e) => handleControlChange('directionalLightPos', 'z', parseFloat(e.target.value))}
                      className="w-full h-1 bg-gray-600 rounded"
                    />
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={handleSave}
                      className="w-full px-3 py-1.5 rounded text-sm bg-green-600 hover:bg-green-700 transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleReset}
                      className="w-full px-3 py-1.5 rounded text-sm bg-red-600 hover:bg-red-700 transition"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handlePublish}
                      disabled={project.published}
                      className={`w-full px-3 py-1.5 rounded text-sm ${
                        project.published ? 'bg-gray-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                      } transition`}
                    >
                      {project.published ? 'Published' : 'Publish'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileControlsOpen(!isMobileControlsOpen)}
                  className="absolute bottom-2 right-2 z-30 p-1.5 rounded-full bg-gray-800 bg-opacity-70 text-white hover:bg-opacity-90 transition"
                >
                  {isMobileControlsOpen ? <FiChevronUp className="h-5 w-5" /> : <FiChevronDown className="h-5 w-5" />}
                </button>
                {isMobileControlsOpen && (
                  <div className="absolute bottom-12 left-2 right-2 bg-gray-800 bg-opacity-90 text-white p-3 rounded-lg shadow-lg overflow-y-auto max-h-[60vh] z-20">
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-200">Rotation</h3>
                        <label className="block text-xs text-gray-400">X</label>
                        <input
                          type="range"
                          min="-3.14"
                          max="3.14"
                          step="0.01"
                          value={rotation.x}
                          onChange={(e) => handleControlChange('rotation', 'x', parseFloat(e.target.value))}
                          className="w-full h-1 bg-gray-600 rounded"
                        />
                        <label className="block text-xs text-gray-400">Y</label>
                        <input
                          type="range"
                          min="-3.14"
                          max="3.14"
                          step="0.01"
                          value={rotation.y}
                          onChange={(e) => handleControlChange('rotation', 'y', parseFloat(e.target.value))}
                          className="w-full h-1 bg-gray-600 rounded"
                        />
                        <label className="block text-xs text-gray-400">Z</label>
                        <input
                          type="range"
                          min="-3.14"
                          max="3.14"
                          step="0.01"
                          value={rotation.z}
                          onChange={(e) => handleControlChange('rotation', 'z', parseFloat(e.target.value))}
                          className="w-full h-1 bg-gray-600 rounded"
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-200">Scale</h3>
                        <input
                          type="range"
                          min="0.1"
                          max="5"
                          step="0.1"
                          value={scale.x}
                          onChange={(e) => handleControlChange('scale', 'all', parseFloat(e.target.value))}
                          className="w-full h-1 bg-gray-600 rounded"
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-200">Position</h3>
                        <label className="block text-xs text-gray-400">X</label>
                        <input
                          type="range"
                          min="-5"
                          max="5"
                          step="0.1"
                          value={position.x}
                          onChange={(e) => handleControlChange('position', 'x', parseFloat(e.target.value))}
                          className="w-full h-1 bg-gray-600 rounded"
                        />
                        <label className="block text-xs text-gray-400">Y</label>
                        <input
                          type="range"
                          min="-5"
                          max="5"
                          step="0.1"
                          value={position.y}
                          onChange={(e) => handleControlChange('position', 'y', parseFloat(e.target.value))}
                          className="w-full h-1 bg-gray-600 rounded"
                        />
                        <label className="block text-xs text-gray-400">Z</label>
                        <input
                          type="range"
                          min="-5"
                          max="5"
                          step="0.1"
                          value={position.z}
                          onChange={(e) => handleControlChange('position', 'z', parseFloat(e.target.value))}
                          className="w-full h-1 bg-gray-600 rounded"
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-200">Material</h3>
                        <label className="block text-xs text-gray-400">Color</label>
                        <input
                          type="color"
                          value={materialColor}
                          onChange={(e) => setMaterialColor(e.target.value)}
                          className="w-full h-6 rounded"
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-200">Lighting</h3>
                        <label className="block text-xs text-gray-400">Ambient Intensity</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={ambientIntensity}
                          onChange={(e) => setAmbientIntensity(parseFloat(e.target.value))}
                          className="w-full h-1 bg-gray-600 rounded"
                        />
                        <label className="block text-xs text-gray-400">Directional Light X</label>
                        <input
                          type="range"
                          min="-10"
                          max="10"
                          step="0.1"
                          value={directionalLightPos.x}
                          onChange={(e) => handleControlChange('directionalLightPos', 'x', parseFloat(e.target.value))}
                          className="w-full h-1 bg-gray-600 rounded"
                        />
                        <label className="block text-xs text-gray-400">Directional Light Y</label>
                        <input
                          type="range"
                          min="-10"
                          max="10"
                          step="0.1"
                          value={directionalLightPos.y}
                          onChange={(e) => handleControlChange('directionalLightPos', 'y', parseFloat(e.target.value))}
                          className="w-full h-1 bg-gray-600 rounded"
                        />
                        <label className="block text-xs text-gray-400">Directional Light Z</label>
                        <input
                          type="range"
                          min="-10"
                          max="10"
                          step="0.1"
                          value={directionalLightPos.z}
                          onChange={(e) => handleControlChange('directionalLightPos', 'z', parseFloat(e.target.value))}
                          className="w-full h-1 bg-gray-600 rounded"
                        />
                      </div>
                      <div className="space-y-2">
                        <button
                          onClick={handleSave}
                          className="w-full px-3 py-1.5 rounded text-sm bg-green-600 hover:bg-green-700 transition"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleReset}
                          className="w-full px-3 py-1.5 rounded text-sm bg-red-600 hover:bg-red-700 transition"
                        >
                          Reset
                        </button>
                        <button
                          onClick={handlePublish}
                          disabled={project.published}
                          className={`w-full px-3 py-1.5 rounded text-sm ${
                            project.published ? 'bg-gray-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                          } transition`}
                        >
                          {project.published ? 'Published' : 'Publish'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">Project not found.</p>
        )}
        {showPublishModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-gray-800 bg-opacity-90 text-white p-6 rounded-lg max-w-lg w-full mx-4 animate-scale-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Project Published</h2>
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="p-2 rounded-full hover:bg-gray-700 transition"
                >
                  <HiX className="h-6 w-6" />
                </button>
              </div>
              <p className="text-gray-300 mb-4">Your project is now live! Share it using the QR code or link below.</p>
              <Image
                src={qrCodeUrl}
                alt="QR Code"
                width={128}
                height={128}
                className="mx-auto mb-4"
              />
              <p className="text-sm text-gray-300">
                AR Scene Link:{' '}
                <a
                  href={`${window.location.origin}/ar/${projectId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:underline"
                >
                  {`${window.location.origin}/ar/${projectId}`}
                </a>
              </p>
              <button
                onClick={() => setShowPublishModal(false)}
                className="mt-4 w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
        <style jsx>{`
          .animate-fade-in {
            animation: fadeIn 0.3s ease-in-out;
          }
          .animate-scale-in {
            animation: scaleIn 0.3s ease-in-out;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .overflow-y-auto::-webkit-scrollbar {
            width: 6px;
          }
          .overflow-y-auto::-webkit-scrollbar-thumb {
            background-color: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
          }
          .overflow-y-auto::-webkit-scrollbar-track {
            background-color: rgba(0, 0, 0, 0.1);
          }
          input[type="range"]::-webkit-slider-thumb {
            background-color: #ffffff;
            border: 1px solid #4a5568;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            cursor: pointer;
            -webkit-appearance: none;
          }
          input[type="range"]::-moz-range-thumb {
            background-color: #ffffff;
            border: 1px solid #4a5568;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            cursor: pointer;
          }
        `}</style>
      </div>
    </div>
  );
}