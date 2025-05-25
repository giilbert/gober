import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useStoreSuspense } from "../lib/maf";
import { useRef } from "react";
import * as THREE from "three";

interface OrientationData {
  aX: number;
  aY: number;
  aZ: number;
  oAlpha: number;
  oBeta: number;
  oGamma: number;
}

export const OrientationDisplay: React.FC = () => {
  const store = useStoreSuspense<OrientationData>(
    "rc_car_camera_server::sensors::SensorData"
  );

  return (
    <div className="col-span-1 p-4 space-y-4">
      <p>
        acceleration: {store.data.aX}, {store.data.aY}, {store.data.aZ}
      </p>

      <p>
        orientation: {store.data.oAlpha},{store.data.oBeta},{store.data.oGamma}
      </p>

      <div className="w-full aspect-square">
        <Canvas
          onCreated={(state) => {
            state.gl.setClearColor("#111111");
          }}
        >
          <OrbitControls />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />

          <Renderer />
        </Canvas>
      </div>
    </div>
  );
};

const Renderer: React.FC = () => {
  const store = useStoreSuspense<{
    aX: number;
    aY: number;
    aZ: number;
    oAlpha: number;
    oBeta: number;
    oGamma: number;
  }>("rc_car_camera_server::sensors::SensorData");

  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = THREE.MathUtils.degToRad(store.data.oBeta);
    meshRef.current.rotation.y = THREE.MathUtils.degToRad(store.data.oGamma);
    meshRef.current.rotation.z = THREE.MathUtils.degToRad(store.data.oAlpha);
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1.2, 2, 0.2]} />
      <meshPhongMaterial color="gray" />
    </mesh>
  );
};
