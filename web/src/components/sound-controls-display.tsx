import { useCallback, useRef, useState } from "react";
import { MenuItem } from "./home-menu";
import { Button } from "./button";
import { audioContext, mediaStreamDest } from "../routes/home";
import { Input } from "./input";

export const SoundControlsDisplay: React.FC = () => {
  const [text, setText] = useState("");

  const createTtsAudioFile = useCallback(async (message: string) => {
    const response = await fetch("http://127.0.0.1:5000/speak", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      console.error("Failed to create TTS audio file");
      return;
    }

    const audioBlob = await response.blob();
    const audio = new Audio(URL.createObjectURL(audioBlob));

    await audioContext.resume();

    if (!mediaStreamDest) {
      throw new Error("MediaStream destination not initialized");
    }

    // const userMedia = await navigator.mediaDevices.getUserMedia({
    //   audio: true,
    //   video: false,
    // });
    // const userMediaStream = audioContext.createMediaStreamSource(userMedia);
    // userMediaStream.connect(mediaStreamDest);

    const source = audioContext.createMediaElementSource(audio);
    // source.connect(mediaStreamDest);
    // source.connect(audioContext.destination);

    // const analyzer = audioContext.createAnalyser();
    // source.connect(analyzer);
    // source.connect(audioContext.destination);
    source.connect(mediaStreamDest);

    // const dataArray = new Uint8Array(analyzer.fftSize);

    // function checkAudio() {
    //   analyzer.getByteTimeDomainData(dataArray);
    //   const max = Math.max(...dataArray);
    //   const min = Math.min(...dataArray);
    //   // If max and min are not both ~128, there is audio activity
    //   if (max !== 128 || min !== 128) {
    //     console.log("Audio data detected!", { min, max });
    //   } else {
    //     console.log("No audio data (silent)");
    //   }
    //   requestAnimationFrame(checkAudio);
    // }

    // checkAudio();

    audio.addEventListener("ended", () => {
      source.disconnect();
      URL.revokeObjectURL(audio.src);
    });

    audio.oncanplaythrough = () => {
      console.log("tts audio ready to play");
      audio.play();
    };

    audio.load();
  }, []);

  return (
    <MenuItem name="sound" className="h-full">
      <div className="flex flex-col gap-1">
        <textarea
          className="border h-18 resize-none outline-none focus:ring-1 ring-purple-400 p-2"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
          }}
          placeholder="enter text to speak"
        ></textarea>
        <Button
          onClick={async () => {
            await createTtsAudioFile(text);
            setText("");
          }}
        >
          speak
        </Button>

        <hr className="my-4" />

        <AudioClipsDisplay />
      </div>
    </MenuItem>
  );
};

const AudioClipsDisplay: React.FC = () => {
  const [_selectedAudio, setSelectedAudio] = useState<File | null>(null);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  const updateAudio = useCallback(async (newAudio: File) => {
    if (!audioRef.current) return;
    if (!mediaStreamDest) {
      throw new Error("MediaStream destination not initialized");
    }

    setSelectedAudio(newAudio);

    const audio = audioRef.current;

    const url = URL.createObjectURL(newAudio);
    audio.src = url;

    await audioContext.resume();
    const source = audioContext.createMediaElementSource(audio);
    source.connect(mediaStreamDest);
    source.connect(audioContext.destination);

    audio.addEventListener("ended", () => {
      URL.revokeObjectURL(url);
    });

    audio.play();
  }, []);

  return (
    <>
      <audio controls ref={audioRef}></audio>

      <ul className="list-disc list-inside">
        {audioFiles.map((file) => (
          <li
            key={file.name}
            className="hover:underline"
            onClick={() => {
              updateAudio(file);
            }}
          >
            {file.name}
          </li>
        ))}
      </ul>

      <hr className="my-4" />

      <label id="files">upload audio files</label>
      <Input
        type="file"
        accept="audio/*"
        id="files"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          setAudioFiles(files);
          e.target.files = null;
        }}
      />
    </>
  );
};
