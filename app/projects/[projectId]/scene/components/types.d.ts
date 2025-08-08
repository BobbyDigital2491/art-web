/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'three/examples/jsm/loaders/GLTFLoader' {
  import * as THREE from 'three';

  export interface GLTF {
    scene: THREE.Group;
    scenes: THREE.Group[];
    animations: THREE.AnimationClip[];
    cameras: THREE.Camera[];
    asset: { [key: string]: any };
    parser: any;
    userData: { [key: string]: any };
  }

  export class GLTFLoader {
    constructor(manager?: THREE.LoadingManager);
    load(
      url: string,
      onLoad: (gltf: GLTF) => void,
      onProgress?: (event: ProgressEvent<EventTarget>) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
    loadAsync(url: string, onProgress?: (event: ProgressEvent<EventTarget>) => void): Promise<GLTF>;
    setCrossOrigin(crossOrigin: string): this;
    setPath(path: string): this;
    setResourcePath(path: string): this;
    setDRACOLoader(dracoLoader: any): this;
    setKTX2Loader(ktx2Loader: any): this;
    setMeshoptDecoder(decoder: any): this;
  }
}

declare module '@react-three/drei' {
  import { Texture } from 'three';

  export const TransformControls: React.ForwardRefExoticComponent<
    React.PropsWithChildren<{
      mode?: 'translate' | 'rotate' | 'scale';
      translationSnap?: number | null;
      rotationSnap?: number | null;
      scaleSnap?: number | null;
      showX?: boolean;
      showY?: boolean;
      showZ?: boolean;
      onMouseDown?: () => void;
    }> & React.RefAttributes<{
      axis: string | null;
      setSpace: (space: string) => void;
      setTranslationSnap: (snap: number | null) => void;
      setMode: (mode: string) => void;
    }>
  >;

  export function useTexture(input: string): Texture;
}