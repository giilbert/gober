import { createRoute } from "@tanstack/react-router";
import { layoutRoute } from "./layout";
import { useMafClient } from "../lib/maf-context";
import { useCallback, useRef, useState } from "react";
import { Button } from "../components/button";
import type { MafClient } from "@maf/client";
import { Face } from "../components/face";
import { AdminBluetoothDisplay } from "../components/admin-bluetooth-display";
import { getRtcConfig } from "../lib/rtc-helper";

const AdminPage: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(false);

  const join = useCallback(async () => {
    setAuthenticated(true);
  }, []);

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center h-screen flex-col gap-2">
        <form
          className="flex gap-2 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            join();
          }}
        >
          <Button>JOIN</Button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <VideoThing />
    </div>
  );
};

type VideoStatus =
  | {
      type: "idle";
    }
  | {
      type: "broadcasting";
    }
  | {
      type: "error";
    };

const VideoThing: React.FC = () => {
  const [status, setStatus] = useState<VideoStatus>({
    type: "idle",
  });
  const maf = useMafClient();
  const [faceEnabled, setFaceEnabled] = useState(false);

  const videoOneRef = useRef<HTMLVideoElement>(null);
  const videoTwoRef = useRef<HTMLVideoElement>(null);
  const startVideoBroadcast = useCallback(
    async (useFrontBack: boolean) => {
      if (!videoOneRef.current || !videoTwoRef.current) return;

      setStatus({ type: "broadcasting" });

      if (useFrontBack) {
        const environmentCamera = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { exact: "environment" },
          },
          audio: false,
        });

        const frontCamera = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { exact: "user" },
          },
          audio: true,
        });

        new Connections(maf, [environmentCamera, frontCamera]);
        videoOneRef.current.srcObject = environmentCamera;
        videoTwoRef.current.srcObject = frontCamera;
      } else {
        const media = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        // TODO: these should be kept separate
        new Connections(maf, [media]);
        videoOneRef.current.srcObject = media;
      }
    },
    [maf]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col w-fit m-2">
        <video
          autoPlay
          playsInline
          muted
          className="w-full h-auto inline-block bg-neutral-700 aspect-video max-w-[60vh]"
          id="video-1"
          ref={videoOneRef}
        ></video>
        <video
          autoPlay
          playsInline
          muted
          className="w-full h-auto inline-block bg-neutral-700 aspect-video max-w-[60vh]"
          id="video-2"
          ref={videoTwoRef}
        ></video>

        {/* <audio ref={audioRef} autoPlay controls /> */}

        {status.type === "idle" && (
          <Button onClick={() => startVideoBroadcast(false)} className="w-full">
            start broadcast (one camera)
          </Button>
        )}

        {status.type === "idle" && (
          <Button onClick={() => startVideoBroadcast(true)} className="w-full">
            start broadcast (two cameras)
          </Button>
        )}

        {status.type === "broadcasting" && (
          <>
            <div className="text-neutral-50 bg-red-600 p-2 flex">
              <span>LIVE</span>
            </div>
          </>
        )}
      </div>

      <AdminBluetoothDisplay />

      {!faceEnabled && (
        <Button
          onClick={() => {
            setFaceEnabled(true);
          }}
          className="m-2"
        >
          :D
        </Button>
      )}

      {faceEnabled && (
        <Face
          removeFace={() => {
            setFaceEnabled(false);
          }}
        />
      )}
    </div>
  );
};

class Connections {
  media: MediaStream[];
  maf: MafClient;
  connections: Map<string, RTCPeerConnection>;

  constructor(maf: MafClient, media: MediaStream[]) {
    this.media = media;
    this.maf = maf;
    this.connections = new Map();

    maf.channel<string>("new_viewer").on("message", async (viewerId) => {
      console.log("new viewer", viewerId, "creating offer...");

      const connection = new RTCPeerConnection(await getRtcConfig());

      connection.addEventListener("icecandidate", (event) => {
        // console.log("got local icecandidate", event.candidate);

        if (event.candidate)
          maf.rpc(
            "admin_send_ice_candidate",
            viewerId,
            event.candidate.toJSON()
          );
      });

      connection.addEventListener("iceconnectionstatechange", () =>
        console.log("iceconnectionstatechange", connection.iceConnectionState)
      );

      connection.addEventListener("track", (event) => {
        const stream = event.streams[0];
        console.log("got remote track! ", stream.getAudioTracks());
        const audioContext = new AudioContext();

        const a = new Audio();
        a.srcObject = stream;
        a.addEventListener("canplaythrough", () => {
          console.log("audio ready to play");
        });
        a.addEventListener("ended", () => {
          console.log("audio ended");
        });
        a.play();

        const audioStream = audioContext.createMediaStreamSource(stream);
        audioStream.connect(audioContext.destination);
      });

      for (const media of this.media) {
        media.getTracks().forEach((track) => {
          console.log("adding track", track);
          connection.addTrack(track, media);
        });
      }

      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      await maf.rpc("viewer_offer_response", viewerId, offer.sdp);

      this.connections.set(viewerId, connection);
    });

    maf.channel("finalize_viewer").on("message", async (message) => {
      console.log("finalize viewer", message);
      const [viewerId, sdp] = message as [string, string];

      const connection = this.connections.get(viewerId);
      if (!connection) throw new Error("no connection for viewer");

      await connection.setRemoteDescription({ type: "answer", sdp });
    });

    maf.channel("ice_candidate").on("message", async (message) => {
      // console.log("got remote ice candidate", message);

      const [viewerId, candidate] = message as [string, RTCIceCandidateInit];

      const connection = this.connections.get(viewerId);
      if (!connection) throw new Error("no connection for viewer");

      await connection.addIceCandidate(new RTCIceCandidate(candidate));
    });
  }
}

export const adminRoute = createRoute({
  path: "/admin",
  getParentRoute: () => layoutRoute,
  component: AdminPage,
});
