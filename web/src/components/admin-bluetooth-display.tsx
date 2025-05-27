import { useEffect, useRef, useState } from "react";
import { useMafClient } from "../lib/maf-context";

type BluetoothStatus =
  | {
      type: "idle";
    }
  | {
      type: "scanning";
    }
  | {
      type: "connected";
    }
  | {
      type: "error";
    };

export const AdminBluetoothDisplay: React.FC = () => {
  const [status, setStatus] = useState<BluetoothStatus>({
    type: "idle",
  });
  const maf = useMafClient();

  const hasRun = useRef(false);
  useEffect(() => {
    async function run() {
      const DEFAULT_SERVICE_UUID = "ccdec9d2-8902-4b73-84f0-c60c17caa35f";

      setStatus({ type: "scanning" });
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [DEFAULT_SERVICE_UUID],
      });

      const gatt = await device.gatt?.connect();
      if (!gatt) throw new Error("cannot find device gatt");

      setStatus({ type: "connected" });

      const service = await gatt.getPrimaryService(DEFAULT_SERVICE_UUID);

      const DRIVE_CHARACTERISTIC_UUID = "f3bbbc56-b817-4dd1-b11a-0964109f4811";
      const STEER_CHARACTERISTIC_UUID = "3d150571-e7da-48cf-bdb0-f2dedededede";

      const driveCharacteristic = await service.getCharacteristic(
        DRIVE_CHARACTERISTIC_UUID
      );
      const steerCharacteristic = await service.getCharacteristic(
        STEER_CHARACTERISTIC_UUID
      );

      const store = maf.store<{
        drive: number;
        steer: number;
      }>("controls");
      store.on("change", (controls) => {
        console.log("new controls", controls);

        driveCharacteristic.writeValue(new Int8Array([controls.drive]));
        steerCharacteristic.writeValue(new Int8Array([controls.steer]));
      });
    }

    if (hasRun.current) return;
    hasRun.current = true;
    run().catch((err) => {
      console.error("error running bluetooth display:", err);
      setStatus({ type: "error" });
    });
  }, []);

  return (
    <div>
      <p>bluetooth status: {status.type}</p>
    </div>
  );
};
