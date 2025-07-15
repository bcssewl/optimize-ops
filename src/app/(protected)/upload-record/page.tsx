"use client";

import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { useAuth } from "@/src/context/AuthContext";
import { convertToMp3, getFileExtension } from "@/src/lib/audio-utils";
import { createClient } from "@/src/lib/supabase/client";
import {
  faMicrophone,
  faPause,
  faPlay,
  faSpinner,
  faStop,
  faTrash,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  duration: number;
  isPlaying: boolean;
}

export default function UploadRecordPage() {
  const { user } = useAuth();
  const router = useRouter();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    audioBlob: null,
    audioUrl: null,
    duration: 0,
    isPlaying: false,
  });

  const [isUploading, setIsUploading] = useState(false);
  const [convertToMp3Format, setConvertToMp3Format] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recordingState.audioUrl) {
        URL.revokeObjectURL(recordingState.audioUrl);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/wav",
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType,
        });
        const audioUrl = URL.createObjectURL(audioBlob);

        setRecordingState((prev) => ({
          ...prev,
          audioBlob,
          audioUrl,
          isRecording: false,
          isPaused: false,
        }));

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100); // Collect data every 100ms

      setRecordingState((prev) => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0,
      }));

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingState((prev) => ({
          ...prev,
          duration: prev.duration + 1,
        }));
      }, 1000);

      toast.success("Recording started!");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error(
        "Failed to start recording. Please check microphone permissions."
      );
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop();

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      toast.success("Recording stopped!");
    }
  };

  // Pause/Resume recording
  const togglePauseRecording = () => {
    if (mediaRecorderRef.current) {
      if (recordingState.isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = setInterval(() => {
          setRecordingState((prev) => ({
            ...prev,
            duration: prev.duration + 1,
          }));
        }, 1000);
        toast.success("Recording resumed");
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        toast.success("Recording paused");
      }

      setRecordingState((prev) => ({
        ...prev,
        isPaused: !prev.isPaused,
      }));
    }
  };

  // Play/pause audio preview
  const togglePlayback = () => {
    if (!recordingState.audioUrl) return;

    if (recordingState.isPlaying) {
      audioRef.current?.pause();
    } else {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      } else {
        const audio = new Audio(recordingState.audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          setRecordingState((prev) => ({ ...prev, isPlaying: false }));
        };

        audio.onerror = () => {
          toast.error("Failed to play audio");
          setRecordingState((prev) => ({ ...prev, isPlaying: false }));
        };
      }

      audioRef.current?.play();
    }

    setRecordingState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  // Clear recording
  const clearRecording = () => {
    if (recordingState.audioUrl) {
      URL.revokeObjectURL(recordingState.audioUrl);
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setRecordingState({
      isRecording: false,
      isPaused: false,
      audioBlob: null,
      audioUrl: null,
      duration: 0,
      isPlaying: false,
    });

    toast.success("Recording cleared");
  };

  // Upload recording
  const uploadRecording = async () => {
    if (!recordingState.audioBlob || !user) {
      toast.error("No recording to upload");
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();

      // Convert to MP3 if requested
      let finalBlob = recordingState.audioBlob;
      let finalMimeType = recordingState.audioBlob.type;
      let fileExtension = getFileExtension(recordingState.audioBlob.type);

      if (
        convertToMp3Format &&
        !recordingState.audioBlob.type.includes("mp3")
      ) {
        toast.info("Converting to MP3...");
        try {
          finalBlob = await convertToMp3(recordingState.audioBlob);
          finalMimeType = "audio/mp3";
          fileExtension = "mp3";
        } catch (conversionError) {
          console.warn(
            "MP3 conversion failed, using original format:",
            conversionError
          );
          toast.warning("MP3 conversion failed, uploading as WebM");
        }
      }

      // Generate unique file name using user_uuid-timestamp format
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const uniqueFileName = `${user.id}/${user.id}-x-${timestamp}.${fileExtension}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("audio-recordings")
        .upload(uniqueFileName, finalBlob, {
          contentType: finalMimeType,
          upsert: false,
        });

      if (uploadError) {
        console.log("Upload error:", uploadError);
        throw new Error(`*** Upload failed: ${uploadError.message}`);
      }

      // Save metadata to database
      const { error: dbError } = await supabase.from("recordings").insert({
        user_uuid: user.id,
        file_name: `${user.id}-x-${timestamp}.${fileExtension}`,
        file_path: uniqueFileName,
        file_type: finalMimeType,
        duration: recordingState.duration,
        description: null,
        status: "success",
      });

      if (dbError) {
        // If database insert fails, try to clean up the uploaded file
        await supabase.storage
          .from("audio-recordings")
          .remove([uniqueFileName]);

        throw new Error(`Database error: ${dbError.message}`);
      }

      toast.success("Recording uploaded successfully!");

      // Clear the form and recording
      clearRecording();

      // Redirect to recordings page
      router.push("/recordings");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`Failed to upload recording: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Format duration for display
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full mx-auto py-12 px-4 md:px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Record Audio</h1>
          <p className="text-muted-foreground">
            Record and upload voice recordings for productivity tracking
          </p>
        </div>

        {/* Recording Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Voice Recording</CardTitle>
            <CardDescription>
              Click the microphone to start recording your voice
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Recording Status */}
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-primary">
                {formatDuration(recordingState.duration)}
              </div>
              {recordingState.isRecording && (
                <div className="text-sm text-muted-foreground mt-2">
                  {recordingState.isPaused
                    ? "Recording paused"
                    : "Recording in progress..."}
                </div>
              )}
            </div>

            {/* Recording Controls */}
            <div className="flex justify-center space-x-4">
              {!recordingState.isRecording && !recordingState.audioBlob && (
                <Button
                  onClick={startRecording}
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <FontAwesomeIcon
                    icon={faMicrophone}
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  Start Recording
                </Button>
              )}

              {recordingState.isRecording && (
                <>
                  <Button
                    onClick={togglePauseRecording}
                    variant="outline"
                    size="lg"
                  >
                    <FontAwesomeIcon
                      icon={recordingState.isPaused ? faPlay : faPause}
                      width={20}
                      height={20}
                      className="mr-2"
                    />
                    {recordingState.isPaused ? "Resume" : "Pause"}
                  </Button>

                  <Button
                    onClick={stopRecording}
                    variant="destructive"
                    size="lg"
                  >
                    <FontAwesomeIcon
                      icon={faStop}
                      width={20}
                      height={20}
                      className="mr-2"
                    />
                    Stop Recording
                  </Button>
                </>
              )}

              {recordingState.audioBlob && (
                <>
                  <Button onClick={togglePlayback} variant="outline" size="lg">
                    <FontAwesomeIcon
                      icon={recordingState.isPlaying ? faPause : faPlay}
                      width={20}
                      height={20}
                      className="mr-2"
                    />
                    {recordingState.isPlaying ? "Pause" : "Play"}
                  </Button>

                  <Button onClick={clearRecording} variant="outline" size="lg">
                    <FontAwesomeIcon
                      icon={faTrash}
                      width={20}
                      height={20}
                      className="mr-2"
                    />
                    Clear
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upload Form */}
        {recordingState.audioBlob && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Recording</CardTitle>
              <CardDescription>
                Upload your recording (automatically named with timestamp)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="pt-4">
                <Button
                  onClick={uploadRecording}
                  disabled={isUploading}
                  size="lg"
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <FontAwesomeIcon
                        icon={faSpinner}
                        width={20}
                        height={20}
                        className="mr-2 animate-spin"
                      />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon
                        icon={faUpload}
                        width={20}
                        height={20}
                        className="mr-2"
                      />
                      Upload Recording
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                • Make sure your microphone is connected and permissions are
                granted
              </li>
              <li>• Speak clearly and at a normal volume for best quality</li>
              <li>• You can pause and resume recording as needed</li>
              <li>• Preview your recording before uploading</li>
              <li>
                • Files are automatically named with your user ID and timestamp
              </li>
              <li>
                • Recordings are automatically saved with your user account
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
