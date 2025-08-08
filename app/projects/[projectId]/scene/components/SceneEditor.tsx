/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { TransformControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import HierarchyPanel from './HierarchyPanel';
import { OrbitControls } from './OrbitControls';
import { HiChevronDoubleLeft, HiChevronDoubleRight } from 'react-icons/hi';
import { FaArrowsAlt, FaSync, FaExpand } from 'react-icons/fa';
import { Project } from '../../../../types';

// Interfaces
interface Transform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

interface SceneEditorProps {
  project: Project;
}

interface AssetMeshProps {
  targetPath: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  onTransformChange: (transform: Transform) => void;
}

// Type assertion function for tuples
function toTransformTuple(
  position: THREE.Vector3,
  rotation: THREE.Euler,
  scale: THREE.Vector3
): Transform {
  return {
    position: [position.x, position.y, position.z] as [number, number, number],
    rotation: [rotation.x, rotation.y, rotation.z] as [number, number, number],
    scale: [scale.x, scale.y, scale.z] as [number, number, number],
  };
}

// AssetMesh Component
function AssetMesh({ targetPath, position, rotation, scale, onTransformChange }: AssetMeshProps) {
  const texture = useTexture(targetPath);
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...position);
      meshRef.current.rotation.set(...rotation);
      meshRef.current.scale.set(...scale);
    }
  }, [position, rotation, scale]);

  console.log('AssetMesh: targetPath:', targetPath, 'texture loaded:', !!texture);

  return (
    <mesh
      ref={meshRef}
      onUpdate={() => {
        if (meshRef.current) {
          onTransformChange(toTransformTuple(
            meshRef.current.position,
            meshRef.current.rotation,
            meshRef.current.scale
          ));
        }
      }}
    >
      <planeGeometry args={[2, 2]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

// SceneEditor Component
export default function SceneEditor({ project }: SceneEditorProps) {
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(project);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const [isControlsPanelOpen, setIsControlsPanelOpen] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [transforms, setTransforms] = useState<Transform>({
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  });
  const [history, setHistory] = useState<{ transform: Transform }[]>([{ transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] } }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const transformControlsRef = useRef<{ axis: string | null; setSpace: (space: string) => void; setTranslationSnap: (snap: number | null) => void; setMode: (mode: string) => void; } | null>(null);

  console.log('SceneEditor: project:', JSON.stringify(project, null, 2));
  console.log('SceneEditor: selectedProject:', JSON.stringify(selectedProject, null, 2));
  console.log('SceneEditor: transformMode:', transformMode, 'isControlsPanelOpen:', isControlsPanelOpen);
  console.log('SceneEditor: transforms:', JSON.stringify(transforms, null, 2));

  const handleSelectAsset = (newProject: Project) => {
    setSelectedProject(newProject);
    setTransforms({ position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] });
    setHistory([{ transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] } }]);
    setHistoryIndex(0);
    setError(null);
  };

  const handleTransformChange = (transform: Transform) => {
    setTransforms(transform);
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), { transform }]);
    setHistoryIndex((prev) => prev + 1);
  };

  const handleResetTransforms = () => {
    const resetTransform = { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
    setTransforms(resetTransform);
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), { transform: resetTransform }]);
    setHistoryIndex((prev) => prev + 1);
  };

  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const prevIndex = historyIndex - 1;
    setTransforms(history[prevIndex].transform);
    setHistoryIndex(prevIndex);
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    setTransforms(history[nextIndex].transform);
    setHistoryIndex(nextIndex);
  };

  const handleNumericInput = (type: 'position' | 'rotation' | 'scale', axis: 'x' | 'y' | 'z', value: number) => {
    setTransforms((prev) => {
      const newTransform = { ...prev };
      if (type === 'position') {
        newTransform.position = [...prev.position] as [number, number, number];
        newTransform.position[['x', 'y', 'z'].indexOf(axis)] = value;
      } else if (type === 'rotation') {
        newTransform.rotation = [...prev.rotation] as [number, number, number];
        newTransform.rotation[['x', 'y', 'z'].indexOf(axis)] = THREE.MathUtils.degToRad(value);
      } else {
        newTransform.scale = [...prev.scale] as [number, number, number];
        newTransform.scale[['x', 'y', 'z'].indexOf(axis)] = value;
      }
      setHistory((prevHistory) => [...prevHistory.slice(0, historyIndex + 1), { transform: newTransform }]);
      setHistoryIndex((prev) => prev + 1);
      return newTransform;
    });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case 't':
          setTransformMode('translate');
          break;
        case 'r':
          setTransformMode('rotate');
          break;
        case 's':
          setTransformMode('scale');
          break;
        case 'g':
          setShowGrid(!showGrid);
          break;
        case 'z':
          if (event.ctrlKey || event.metaKey) {
            if (event.shiftKey) handleRedo();
            else handleUndo();
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex]);

  const handleTransformDrag = () => {
    if (transformMode === 'translate' && transformControlsRef.current) {
      const controls = transformControlsRef.current;
      const axis = controls.axis; // 'X', 'Y', 'Z', or null
      if (axis) {
        controls.setSpace('local');
        controls.setTranslationSnap(0.1);
        controls.setMode('translate');
      } else {
        controls.setTranslationSnap(null);
      }
    }
  };

  // Calculate camera position based on selected asset
  const cameraPosition: [number, number, number] = transforms
    ? [transforms.position[0], transforms.position[1], transforms.position[2] + 5]
    : [0, 0, 5];

  return (
    <div className="relative h-screen w-full">
      {/* Hierarchy Panel */}
      <HierarchyPanel
        selectedProject={selectedProject}
        onSelectAsset={handleSelectAsset}
        selectedProjectId={selectedProject?.id || null}
      />

      {/* Transform Mode Controls */}
      <div
        className={`absolute top-4 right-4 bg-white shadow-lg rounded-lg z-10 transition-all duration-300 w-full sm:w-64 max-w-xs ${
          isControlsPanelOpen ? '' : 'w-12'
        }`}
      >
        <button
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200"
          onClick={() => setIsControlsPanelOpen(!isControlsPanelOpen)}
        >
          {isControlsPanelOpen ? (
            <HiChevronDoubleRight className="h-5 w-5 text-gray-600" />
          ) : (
            <HiChevronDoubleLeft className="h-5 w-5 text-gray-600" />
          )}
        </button>
        {isControlsPanelOpen && (
          <div className="p-2">
            <h2 className="text-sm font-semibold text-gray-800 mb-2">Transform</h2>
            <p className="text-xs text-gray-500 mb-2">Hotkeys: T (Move), R (Rotate), S (Scale), G (Grid)</p>
            <div className="flex space-x-1 bg-gray-100 p-1 rounded mb-2">
              <button
                title="Move (T)"
                className={`p-2 rounded ${transformMode === 'translate' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
                onClick={() => setTransformMode('translate')}
              >
                <FaArrowsAlt className="h-4 w-4" />
              </button>
              <button
                title="Rotate (R)"
                className={`p-2 rounded ${transformMode === 'rotate' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
                onClick={() => setTransformMode('rotate')}
              >
                <FaSync className="h-4 w-4" />
              </button>
              <button
                title="Scale (S)"
                className={`p-2 rounded ${transformMode === 'scale' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
                onClick={() => setTransformMode('scale')}
              >
                <FaExpand className="h-4 w-4" />
              </button>
              <button
                title="Toggle Grid (G)"
                className={`p-2 rounded ${showGrid ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'}`}
                onClick={() => setShowGrid(!showGrid)}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4h16v16H4V4zm2 2v12h12V6H6z" />
                </svg>
              </button>
            </div>
            {selectedProject && (
              <div className="space-y-2">
                <div>
                  <h3 className="text-xs font-semibold text-gray-800">Position</h3>
                  <div className="flex space-x-1">
                    <input
                      type="number"
                      step="0.1"
                      value={transforms.position[0]}
                      onChange={(e) => handleNumericInput('position', 'x', parseFloat(e.target.value))}
                      className="w-1/3 p-1 text-xs border rounded"
                      placeholder="X"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={transforms.position[1]}
                      onChange={(e) => handleNumericInput('position', 'y', parseFloat(e.target.value))}
                      className="w-1/3 p-1 text-xs border rounded"
                      placeholder="Y"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={transforms.position[2]}
                      onChange={(e) => handleNumericInput('position', 'z', parseFloat(e.target.value))}
                      className="w-1/3 p-1 text-xs border rounded"
                      placeholder="Z"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-800">Rotation (°)</h3>
                  <div className="flex space-x-1">
                    <input
                      type="number"
                      step="1"
                      value={THREE.MathUtils.radToDeg(transforms.rotation[0])}
                      onChange={(e) => handleNumericInput('rotation', 'x', parseFloat(e.target.value))}
                      className="w-1/3 p-1 text-xs border rounded"
                      placeholder="X"
                    />
                    <input
                      type="number"
                      step="1"
                      value={THREE.MathUtils.radToDeg(transforms.rotation[1])}
                      onChange={(e) => handleNumericInput('rotation', 'y', parseFloat(e.target.value))}
                      className="w-1/3 p-1 text-xs border rounded"
                      placeholder="Y"
                    />
                    <input
                      type="number"
                      step="1"
                      value={THREE.MathUtils.radToDeg(transforms.rotation[2])}
                      onChange={(e) => handleNumericInput('rotation', 'z', parseFloat(e.target.value))}
                      className="w-1/3 p-1 text-xs border rounded"
                      placeholder="Z"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-800">Scale</h3>
                  <div className="flex space-x-1">
                    <input
                      type="number"
                      step="0.1"
                      value={transforms.scale[0]}
                      onChange={(e) => handleNumericInput('scale', 'x', parseFloat(e.target.value))}
                      className="w-1/3 p-1 text-xs border rounded"
                      placeholder="X"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={transforms.scale[1]}
                      onChange={(e) => handleNumericInput('scale', 'y', parseFloat(e.target.value))}
                      className="w-1/3 p-1 text-xs border rounded"
                      placeholder="Y"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={transforms.scale[2]}
                      onChange={(e) => handleNumericInput('scale', 'z', parseFloat(e.target.value))}
                      className="w-1/3 p-1 text-xs border rounded"
                      placeholder="Z"
                    />
                  </div>
                </div>
                <button
                  className="w-full p-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                  onClick={handleResetTransforms}
                >
                  Reset Transforms
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3D Canvas */}
      <Canvas
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        camera={{ position: cameraPosition, fov: 60, near: 0.1, far: 1000 }}
        onCreated={({ scene, gl }) => {
          const gradientTexture = new THREE.TextureLoader().load(
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9PQAI8AN5kGwrigAAAABJRU5ErkJggg=='
          );
          scene.background = gradientTexture;
          gl.setPixelRatio(window.devicePixelRatio);
        }}
      >
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          dampingFactor={0.05}
          enableDamping={true}
          minDistance={1}
          maxDistance={50}
          zoomSpeed={1.2}
          rotateSpeed={0.5}
        />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        {showGrid && <primitive object={new THREE.GridHelper(20, 20, '#4a4a4a', '#4a4a4a')} />}
        {selectedProject && (
          <Suspense key={selectedProject.id} fallback={<mesh><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#cccccc" /></mesh>}>
            <TransformControls
              mode={transformMode}
              ref={transformControlsRef}
              onMouseDown={handleTransformDrag}
              translationSnap={transformMode === 'translate' ? 0.1 : null}
              rotationSnap={transformMode === 'rotate' ? THREE.MathUtils.degToRad(5) : null}
              scaleSnap={transformMode === 'scale' ? 0.1 : null}
              showX={true}
              showY={true}
              showZ={true}
            >
              <AssetMesh
                targetPath={selectedProject.target_path}
                position={transforms.position}
                rotation={transforms.rotation}
                scale={transforms.scale}
                onTransformChange={handleTransformChange}
              />
            </TransformControls>
          </Suspense>
        )}
      </Canvas>
      {error && (
        <div className="absolute top-4 left-4 bg-red-500 text-white p-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
}