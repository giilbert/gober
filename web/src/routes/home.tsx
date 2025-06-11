import { createRoute } from "@tanstack/react-router";
import { layoutRoute } from "./layout";
import React, { useEffect, useRef, useState } from "react";
import { useMafClient } from "../lib/maf-context";
import { HomeMenu } from "../components/home-menu";
import { tracing } from "../lib/tracing";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { getRtcConfig } from "../lib/rtc-helper";
import { cn } from "../lib/cn";

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
  const videoOneRef = useRef<HTMLVideoElement>(null);
  const videoTwoRef = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [hasVideoTwo, setHasVideoTwo] = useState(false);

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

      const connection = new RTCPeerConnection(await getRtcConfig());

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
        console.log("track event:", event);
        if (!videoOneRef.current) return;
        const firstStream = event.streams[0];
        console.log(firstStream);
        tracing.log("got remote track! id: ", firstStream.id);
        videoOneRef.current.srcObject = firstStream;
        videoOneRef.current.play();
        setHasVideo(true);

        const secondStream = event.streams[1];
        if (secondStream) {
          console.log("got second stream:", secondStream);
          videoTwoRef.current!.srcObject = secondStream;
          videoTwoRef.current!.play();
          setHasVideoTwo(true);
        }
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

      <video ref={videoOneRef} autoPlay playsInline className="h-full w-auto" />
      <video
        ref={videoTwoRef}
        autoPlay
        playsInline
        className={cn("h-full w-auto", hasVideoTwo ? "block" : "hidden")}
      />
    </div>
  );
};

export const homeRoute = createRoute({
  path: "/",
  getParentRoute: () => layoutRoute,
  component: HomePage,
});
