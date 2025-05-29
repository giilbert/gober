import { createRoute } from "@tanstack/react-router";
import { layoutRoute } from "./layout";
import React, { useEffect, useRef } from "react";
import { useMafClient } from "../lib/maf-context";
import { HomeMenu } from "../components/home-menu";
import { tracing } from "../lib/tracing";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

export const audioContext = new AudioContext();
export let mediaStreamDest: MediaStreamAudioDestinationNode | undefined =
  undefined;

const HomePage = () => {
  useEffect(() => {
    // this is so secure
    if (localStorage.getItem("identity") !== "gilbert")
      throw new Error("identity");
  }, []);

  return (
    <PanelGroup direction="horizontal">
      <Panel defaultSize={40} className="p-4">
        <HomeMenu />
      </Panel>
      <PanelResizeHandle />
      <Panel defaultSize={60}>
        <VideoThing />
      </Panel>
    </PanelGroup>
  );
};

const VideoThing: React.FC = () => {
  const hasRun = useRef(false);
  const maf = useMafClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = React.useState(false);

  useEffect(() => {
    async function runViewer() {
      const response = await maf.rpc<{ Err?: string }>("start_viewer");

      if (response.Err) {
        tracing.error("error starting video:", response.Err);
        return;
      }

      const sdp = (await maf
        .channel("viewer_offer_response")
        .once("message")) as string;

      tracing.log("got viewer sdp:", "`" + sdp.substring(0, 40) + "`...");

      const remoteConfiguration: RTCConfiguration = {
        iceTransportPolicy: "all",
        iceCandidatePoolSize: 2,
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:5349" },
          {
            urls: [
              "turn:eu-0.turn.peerjs.com:3478",
              "turn:us-0.turn.peerjs.com:3478",
            ],
            username: "peerjs",
            credential: "peerjsp",
          },
        ],
      };
      const connection = new RTCPeerConnection(remoteConfiguration);

      await audioContext.resume();

      console.log("new mediaStreamDest");
      mediaStreamDest = audioContext.createMediaStreamDestination();

      connection.addTrack(
        mediaStreamDest.stream.getAudioTracks()[0],
        mediaStreamDest.stream
      );
      console.log(
        "sending audio tracks:",
        mediaStreamDest.stream.getAudioTracks()
      );

      const track = mediaStreamDest.stream.getAudioTracks()[0];
      console.log(
        "audio track enabled:",
        track.enabled,
        "readyState:",
        track.readyState
      );

      console.log(
        "peer connection senders:",
        connection.getSenders().map((s) => s.track?.kind)
      );

      connection.addEventListener("icecandidate", (event) => {
        // console.log("icecandidate", event);
        if (event.candidate)
          maf.rpc("viewer_send_ice_candidate", event.candidate.toJSON());
      });

      // connection.addEventListener("iceconnectionstatechange", () => {
      //   console.log("iceconnectionstatechange", connection.iceConnectionState);
      // });

      connection.addEventListener("track", (event) => {
        if (!videoRef.current) return;
        const stream = event.streams[0];
        tracing.log("got remote track! id: ", stream.id);
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setHasVideo(true);
      });

      maf.channel("ice_candidate").on("message", async (message) => {
        const candidate = message as RTCIceCandidateInit;
        await connection.addIceCandidate(new RTCIceCandidate(candidate));
      });

      await connection.setRemoteDescription({ type: "offer", sdp });
      const answer = await connection.createAnswer({ sdp });

      await connection.setLocalDescription(answer);

      maf.rpc("viewer_answer", answer.sdp);
    }

    if (hasRun.current) return;
    hasRun.current = true;
    runViewer();
  }, [maf]);

  return (
    <div className="w-full h-full bg-neutral-900 relative">
      {!hasVideo && (
        <p className="text-neutral-200 absolute top-1/2 left-1/2 -translate-x-1/2 text-3xl font-bold w-min">
          video not connected
        </p>
      )}
      <video ref={videoRef} autoPlay playsInline className="h-full w-auto" />
    </div>
  );
};

export const homeRoute = createRoute({
  path: "/",
  getParentRoute: () => layoutRoute,
  component: HomePage,
});
