'use client';
import { useState } from 'react';
import * as THREE from 'three';

interface ControlsPanelProps {
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  position: THREE.Vector3;
  ambientIntensity: number;
  directionalLightPos: THREE.Vector3;
  axisConstraints: {
    translate: { x: boolean; y: boolean; z: boolean };
    rotate: { x: boolean; y: boolean; z: boolean };
    scale: { x: boolean; y: boolean; z: boolean };
  };
  onControlChange: (
    type: 'rotation' | 'scale' | 'position' | 'directionalLightPos',
    axis: 'x' | 'y' | 'z',
    value: number,
    uniformScale?: boolean
  ) => void;
  onAxisConstraintChange: (type: 'translate' | 'rotate' | 'scale', axis: 'x' | 'y' | 'z') => void;
  onSave: () => void;
  onReset: () => void;
  onDelete: () => void;
  onPublish: () => void;
  setAmbientIntensity: (value: number) => void;
  project: { published: boolean };
  isMobileControlsOpen: boolean;
  setIsMobileControlsOpen: (open: boolean) => void;
  isFullScreen: boolean;
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
}

export default function ControlsPanel({
  rotation,
  scale,
  position,
  ambientIntensity,
  directionalLightPos,
  axisConstraints,
  onControlChange,
  onAxisConstraintChange,
  onSave,
  onReset,
  onDelete,
  onPublish,
  setAmbientIntensity,
  project,
  isMobileControlsOpen,
  setIsMobileControlsOpen,
  isFullScreen,
  isMinimized,
  setIsMinimized,
}: ControlsPanelProps) {
  const [uniformScale, setUniformScale] = useState(true);

  return (
    <div className={`absolute ${isFullScreen ? 'top-0 right-0' : 'top-0 right-0'} z-40 bg-gray-800 bg-opacity-70 p-4 rounded-lg text-white ${isMinimized ? 'h-10' : 'h-auto'}`}>
      <button onClick={() => setIsMinimized(!isMinimized)} className="mb-2">
        {isMinimized ? 'Expand' : 'Minimize'}
      </button>
      {!isMinimized && (
        <>
          <div>
            <h3>Transform Controls</h3>
            <div>
              <label>Rotation</label>
              <div>
                <label>X</label>
                <input
                  type="checkbox"
                  checked={axisConstraints.rotate.x}
                  onChange={() => onAxisConstraintChange('rotate', 'x')}
                  className="h-4 w-4 text-indigo-600"
                />
                <input
                  type="number"
                  value={isNaN(rotation.x) ? 0 : rotation.x}
                  onChange={(e) => onControlChange('rotation', 'x', parseFloat(e.target.value) || 0)}
                  className="ml-2 w-20 bg-gray-700 text-white"
                />
              </div>
              <div>
                <label>Y</label>
                <input
                  type="checkbox"
                  checked={axisConstraints.rotate.y}
                  onChange={() => onAxisConstraintChange('rotate', 'y')}
                  className="h-4 w-4 text-indigo-600"
                />
                <input
                  type="number"
                  value={isNaN(rotation.y) ? 0 : rotation.y}
                  onChange={(e) => onControlChange('rotation', 'y', parseFloat(e.target.value) || 0)}
                  className="ml-2 w-20 bg-gray-700 text-white"
                />
              </div>
              <div>
                <label>Z</label>
                <input
                  type="checkbox"
                  checked={axisConstraints.rotate.z}
                  onChange={() => onAxisConstraintChange('rotate', 'z')}
                  className="h-4 w-4 text-indigo-600"
                />
                <input
                  type="number"
                  value={isNaN(rotation.z) ? 0 : rotation.z}
                  onChange={(e) => onControlChange('rotation', 'z', parseFloat(e.target.value) || 0)}
                  className="ml-2 w-20 bg-gray-700 text-white"
                />
              </div>
            </div>
            <div>
              <label>Scale</label>
              <div>
                <label>Uniform</label>
                <input
                  type="checkbox"
                  checked={uniformScale}
                  onChange={() => setUniformScale(!uniformScale)}
                  className="h-4 w-4 text-indigo-600"
                />
              </div>
              <div>
                <label>X</label>
                <input
                  type="checkbox"
                  checked={axisConstraints.scale.x}
                  onChange={() => onAxisConstraintChange('scale', 'x')}
                  className="h-4 w-4 text-indigo-600"
                />
                <input
                  type="number"
                  value={isNaN(scale.x) ? 1 : scale.x}
                  onChange={(e) => onControlChange('scale', 'x', parseFloat(e.target.value) || 1, uniformScale)}
                  className="ml-2 w-20 bg-gray-700 text-white"
                />
              </div>
              <div>
                <label>Y</label>
                <input
                  type="checkbox"
                  checked={axisConstraints.scale.y}
                  onChange={() => onAxisConstraintChange('scale', 'y')}
                  className="h-4 w-4 text-indigo-600"
                />
                <input
                  type="number"
                  value={isNaN(scale.y) ? 1 : scale.y}
                  onChange={(e) => onControlChange('scale', 'y', parseFloat(e.target.value) || 1, uniformScale)}
                  className="ml-2 w-20 bg-gray-700 text-white"
                />
              </div>
              <div>
                <label>Z</label>
                <input
                  type="checkbox"
                  checked={axisConstraints.scale.z}
                  onChange={() => onAxisConstraintChange('scale', 'z')}
                  className="h-4 w-4 text-indigo-600"
                />
                <input
                  type="number"
                  value={isNaN(scale.z) ? 1 : scale.z}
                  onChange={(e) => onControlChange('scale', 'z', parseFloat(e.target.value) || 1, uniformScale)}
                  className="ml-2 w-20 bg-gray-700 text-white"
                />
              </div>
            </div>
            <div>
              <label>Position</label>
              <div>
                <label>X</label>
                <input
                  type="checkbox"
                  checked={axisConstraints.translate.x}
                  onChange={() => onAxisConstraintChange('translate', 'x')}
                  className="h-4 w-4 text-indigo-600"
                />
                <input
                  type="number"
                  value={isNaN(position.x) ? 0 : position.x}
                  onChange={(e) => onControlChange('position', 'x', parseFloat(e.target.value) || 0)}
                  className="ml-2 w-20 bg-gray-700 text-white"
                />
              </div>
              <div>
                <label>Y</label>
                <input
                  type="checkbox"
                  checked={axisConstraints.translate.y}
                  onChange={() => onAxisConstraintChange('translate', 'y')}
                  className="h-4 w-4 text-indigo-600"
                />
                <input
                  type="number"
                  value={isNaN(position.y) ? 0 : position.y}
                  onChange={(e) => onControlChange('position', 'y', parseFloat(e.target.value) || 0)}
                  className="ml-2 w-20 bg-gray-700 text-white"
                />
              </div>
              <div>
                <label>Z</label>
                <input
                  type="checkbox"
                  checked={axisConstraints.translate.z}
                  onChange={() => onAxisConstraintChange('translate', 'z')}
                  className="h-4 w-4 text-indigo-600"
                />
                <input
                  type="number"
                  value={isNaN(position.z) ? 1 : position.z}
                  onChange={(e) => onControlChange('position', 'z', parseFloat(e.target.value) || 1)}
                  className="ml-2 w-20 bg-gray-700 text-white"
                />
              </div>
            </div>
            <div>
              <label>Ambient Light Intensity</label>
              <input
                type="number"
                value={isNaN(ambientIntensity) ? 0.5 : ambientIntensity}
                onChange={(e) => setAmbientIntensity(parseFloat(e.target.value) || 0.5)}
                className="w-20 bg-gray-700 text-white"
              />
            </div>
            <div>
              <label>Directional Light Position</label>
              <div>
                <label>X</label>
                <input
                  type="number"
                  value={isNaN(directionalLightPos.x) ? 5 : directionalLightPos.x}
                  onChange={(e) => onControlChange('directionalLightPos', 'x', parseFloat(e.target.value) || 5)}
                  className="ml-2 w-20 bg-gray-700 text-white"
                />
              </div>
              <div>
                <label>Y</label>
                <input
                  type="number"
                  value={isNaN(directionalLightPos.y) ? 5 : directionalLightPos.y}
                  onChange={(e) => onControlChange('directionalLightPos', 'y', parseFloat(e.target.value) || 5)}
                  className="ml-2 w-20 bg-gray-700 text-white"
                />
              </div>
              <div>
                <label>Z</label>
                <input
                  type="number"
                  value={isNaN(directionalLightPos.z) ? 5 : directionalLightPos.z}
                  onChange={(e) => onControlChange('directionalLightPos', 'z', parseFloat(e.target.value) || 5)}
                  className="ml-2 w-20 bg-gray-700 text-white"
                />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <button onClick={onSave} className="mr-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
              Save
            </button>
            <button onClick={onReset} className="mr-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded">
              Reset
            </button>
            <button onClick={onDelete} className="mr-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
              Delete
            </button>
            {!project.published && (
              <button onClick={onPublish} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
                Publish
              </button>
            )}
          </div>
        </>
      )}
      <button
        onClick={() => setIsMobileControlsOpen(!isMobileControlsOpen)}
        className="mt-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded md:hidden"
      >
        {isMobileControlsOpen ? 'Close Controls' : 'Open Controls'}
      </button>
    </div>
  );
}