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
  faCheckCircle,
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

type RecordingType = "achievement" | "excuse";

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

  const [excuseRecordingState, setExcuseRecordingState] =
    useState<RecordingState>({
      isRecording: false,
      isPaused: false,
      audioBlob: null,
      audioUrl: null,
      duration: 0,
      isPlaying: false,
    });

  const [activeRecordingType, setActiveRecordingType] =
    useState<RecordingType | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [convertToMp3Format, setConvertToMp3Format] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const excuseMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const excuseAudioRef = useRef<HTMLAudioElement | null>(null);
  const excuseChunksRef = useRef<Blob[]>([]);
  const excuseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (excuseTimerRef.current) {
        clearInterval(excuseTimerRef.current);
      }
      if (recordingState.audioUrl) {
        URL.revokeObjectURL(recordingState.audioUrl);
      }
      if (excuseRecordingState.audioUrl) {
        URL.revokeObjectURL(excuseRecordingState.audioUrl);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (excuseAudioRef.current) {
        excuseAudioRef.current.pause();
      }
    };
  }, []);

  // Start recording
  const startRecording = async (type: RecordingType = "achievement") => {
    if (activeRecordingType && activeRecordingType !== type) {
      toast.error(
        "Please finish the current recording before starting a new one"
      );
      return;
    }

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

      if (type === "achievement") {
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];
      } else {
        excuseMediaRecorderRef.current = mediaRecorder;
        excuseChunksRef.current = [];
      }

      const chunks = type === "achievement" ? chunksRef : excuseChunksRef;
      const setState =
        type === "achievement" ? setRecordingState : setExcuseRecordingState;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks.current, {
          type: mediaRecorder.mimeType,
        });
        const audioUrl = URL.createObjectURL(audioBlob);

        setState((prev) => ({
          ...prev,
          audioBlob,
          audioUrl,
          isRecording: false,
          isPaused: false,
        }));

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        setActiveRecordingType(null);
      };

      mediaRecorder.start(100); // Collect data every 100ms

      setState((prev) => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0,
      }));

      setActiveRecordingType(type);

      // Start timer
      const currentTimerRef =
        type === "achievement" ? timerRef : excuseTimerRef;
      currentTimerRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          duration: prev.duration + 1,
        }));
      }, 1000);

      toast.success(
        `${
          type === "achievement" ? "Achievement" : "Problem"
        } recording started!`
      );
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error(
        "Failed to start recording. Please check microphone permissions."
      );
    }
  };

  // Stop recording
  const stopRecording = (type: RecordingType = "achievement") => {
    const mediaRecorder =
      type === "achievement"
        ? mediaRecorderRef.current
        : excuseMediaRecorderRef.current;
    const state =
      type === "achievement" ? recordingState : excuseRecordingState;
    const currentTimerRef = type === "achievement" ? timerRef : excuseTimerRef;

    if (mediaRecorder && state.isRecording) {
      mediaRecorder.stop();

      if (currentTimerRef.current) {
        clearInterval(currentTimerRef.current);
        currentTimerRef.current = null;
      }

      toast.success(
        `${
          type === "achievement" ? "Achievement" : "Problem"
        } recording stopped!`
      );
    }
  };

  // Pause/Resume recording
  const togglePauseRecording = (type: RecordingType = "achievement") => {
    const mediaRecorder =
      type === "achievement"
        ? mediaRecorderRef.current
        : excuseMediaRecorderRef.current;
    const state =
      type === "achievement" ? recordingState : excuseRecordingState;
    const setState =
      type === "achievement" ? setRecordingState : setExcuseRecordingState;
    const currentTimerRef = type === "achievement" ? timerRef : excuseTimerRef;

    if (mediaRecorder) {
      if (state.isPaused) {
        mediaRecorder.resume();
        currentTimerRef.current = setInterval(() => {
          setState((prev) => ({
            ...prev,
            duration: prev.duration + 1,
          }));
        }, 1000);
        toast.success("Recording resumed");
      } else {
        mediaRecorder.pause();
        if (currentTimerRef.current) {
          clearInterval(currentTimerRef.current);
          currentTimerRef.current = null;
        }
        toast.success("Recording paused");
      }

      setState((prev) => ({
        ...prev,
        isPaused: !prev.isPaused,
      }));
    }
  };

  // Play/pause audio preview
  const togglePlayback = (type: RecordingType = "achievement") => {
    const state =
      type === "achievement" ? recordingState : excuseRecordingState;
    const setState =
      type === "achievement" ? setRecordingState : setExcuseRecordingState;
    const currentAudioRef = type === "achievement" ? audioRef : excuseAudioRef;

    if (!state.audioUrl) return;

    if (state.isPlaying) {
      currentAudioRef.current?.pause();
    } else {
      if (currentAudioRef.current) {
        currentAudioRef.current.currentTime = 0;
      } else {
        const audio = new Audio(state.audioUrl);
        currentAudioRef.current = audio;

        audio.onended = () => {
          setState((prev) => ({ ...prev, isPlaying: false }));
        };

        audio.onerror = () => {
          toast.error("Failed to play audio");
          setState((prev) => ({ ...prev, isPlaying: false }));
        };
      }

      currentAudioRef.current?.play();
    }

    setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  // Clear recording
  const clearRecording = (type: RecordingType = "achievement") => {
    const state =
      type === "achievement" ? recordingState : excuseRecordingState;
    const setState =
      type === "achievement" ? setRecordingState : setExcuseRecordingState;
    const currentAudioRef = type === "achievement" ? audioRef : excuseAudioRef;

    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    setState({
      isRecording: false,
      isPaused: false,
      audioBlob: null,
      audioUrl: null,
      duration: 0,
      isPlaying: false,
    });

    toast.success(
      `${type === "achievement" ? "Achievement" : "Problem"} recording cleared`
    );
  };

  // Upload recording
  const uploadRecording = async () => {
    if (
      (!recordingState.audioBlob && !excuseRecordingState.audioBlob) ||
      !user
    ) {
      toast.error("No recordings to upload");
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

      let achievementFileData = null;
      let excuseFileData = null;

      // Process achievement recording if available
      if (recordingState.audioBlob) {
        let finalBlob = recordingState.audioBlob;
        let finalMimeType = recordingState.audioBlob.type;
        let fileExtension = getFileExtension(recordingState.audioBlob.type);

        if (
          convertToMp3Format &&
          !recordingState.audioBlob.type.includes("mp3")
        ) {
          toast.info("Converting achievement recording to MP3...");
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

        const uniqueFileName = `${user.id}/${user.id}-achievement-${timestamp}.${fileExtension}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("audio-recordings")
          .upload(uniqueFileName, finalBlob, {
            contentType: finalMimeType,
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Achievement upload failed: ${uploadError.message}`);
        }

        achievementFileData = {
          file_name: `${user.id}-achievement-${timestamp}.${fileExtension}`,
          file_path: uniqueFileName,
          file_type: finalMimeType,
          duration: recordingState.duration,
        };
      }

      // Process excuse recording if available
      if (excuseRecordingState.audioBlob) {
        let finalBlob = excuseRecordingState.audioBlob;
        let finalMimeType = excuseRecordingState.audioBlob.type;
        let fileExtension = getFileExtension(
          excuseRecordingState.audioBlob.type
        );

        if (
          convertToMp3Format &&
          !excuseRecordingState.audioBlob.type.includes("mp3")
        ) {
          toast.info("Converting excuse recording to MP3...");
          try {
            finalBlob = await convertToMp3(excuseRecordingState.audioBlob);
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

        const uniqueFileName = `${user.id}/${user.id}-excuse-${timestamp}.${fileExtension}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("audio-recordings")
          .upload(uniqueFileName, finalBlob, {
            contentType: finalMimeType,
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Excuse upload failed: ${uploadError.message}`);
        }

        excuseFileData = {
          excuse_recording_file_name: `${user.id}-excuse-${timestamp}.${fileExtension}`,
          excuse_recording_file_path: uniqueFileName,
          excuse_recording_file_type: finalMimeType,
        };
      }

      // Save metadata to database
      const insertData: any = {
        user_uuid: user.id,
        full_name: user.full_name || user.email || "Unknown User",
        email: user.email || "",
        description: null,
        status: "success",
        ...achievementFileData,
        ...excuseFileData,
      };

      const { error: dbError } = await supabase
        .from("recordings")
        .insert(insertData);

      if (dbError) {
        // If database insert fails, try to clean up the uploaded files
        if (achievementFileData) {
          await supabase.storage
            .from("audio-recordings")
            .remove([achievementFileData.file_path]);
        }
        if (excuseFileData) {
          await supabase.storage
            .from("audio-recordings")
            .remove([excuseFileData.excuse_recording_file_path]);
        }

        throw new Error(`Database error: ${dbError.message}`);
      }

      toast.success("Recordings uploaded successfully!");

      // Clear the form and recordings
      if (recordingState.audioBlob) {
        clearRecording("achievement");
      }
      if (excuseRecordingState.audioBlob) {
        clearRecording("excuse");
      }

      // Redirect to recordings page
      router.push("/recordings");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`Failed to upload recordings: ${error.message}`);
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

  // File upload handlers
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const validTypes = ["audio/mp3", "audio/mpeg", "audio/mp4", "video/mp4"];
    const validExtensions = [".mp3", ".mp4", ".m4a", ".mpeg"];

    const isValidType =
      validTypes.includes(file.type) ||
      validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!isValidType) {
      toast.error("Please select an MP3 or MP4 file");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      // 50MB limit
      toast.error("File size must be less than 50MB");
      return;
    }

    setUploadedFile(file);

    // Clear any existing recording
    if (recordingState.audioBlob) {
      clearRecording();
    }

    toast.success(`File "${file.name}" selected successfully`);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const clearUploadedFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("File cleared");
  };

  const uploadFile = async () => {
    if (!uploadedFile || !user) {
      toast.error("No file to upload");
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();

      // Get file extension
      const fileExtension = getFileExtension(uploadedFile.name) || "mp3";
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const uniqueFileName = `${user.id}/${user.id}-x-${timestamp}.${fileExtension}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("audio-recordings")
        .upload(uniqueFileName, uploadedFile, {
          contentType: uploadedFile.type || `audio/${fileExtension}`,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Insert into database using the same schema as recording function
      const { error: dbError } = await supabase.from("recordings").insert({
        user_uuid: user.id,
        full_name: user.full_name || user.email || "Unknown User",
        email: user.email || "",
        file_name: `${user.id}-x-${timestamp}.${fileExtension}`,
        file_path: uniqueFileName,
        file_type: uploadedFile.type || `audio/${fileExtension}`,
        duration: null, // Will be determined during processing
        description: null,
        status: "in_progress", // Set as in_progress for processing
      });

      if (dbError) {
        // If database insert fails, try to clean up the uploaded file
        await supabase.storage
          .from("audio-recordings")
          .remove([uniqueFileName]);

        throw new Error(`Database error: ${dbError.message}`);
      }

      toast.success("File uploaded successfully!");

      // Clear the uploaded file
      clearUploadedFile();

      // Redirect to recordings page
      router.push("/recordings");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`Failed to upload file: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full mx-auto py-12 px-4 md:px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Record Audio</h1>
          <p className="text-muted-foreground">
            Record your target achievements and any problems you faced
          </p>
        </div>

        {/* Achievement Recording Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-medium">
                Required
              </span>
              Achievement Recording
            </CardTitle>
            <CardDescription>
              Record your daily target achievements and progress updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Recording Status */}
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-green-600">
                {formatDuration(recordingState.duration)}
              </div>
              {recordingState.isRecording && (
                <div className="text-sm text-muted-foreground mt-2">
                  {recordingState.isPaused
                    ? "Achievement recording paused"
                    : "Recording achievements..."}
                </div>
              )}
            </div>

            {/* Recording Controls */}
            <div className="flex justify-center space-x-4">
              {!recordingState.isRecording && !recordingState.audioBlob && (
                <Button
                  onClick={() => startRecording("achievement")}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={activeRecordingType === "excuse"}
                >
                  <FontAwesomeIcon
                    icon={faMicrophone}
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  Start Achievement Recording
                </Button>
              )}

              {recordingState.isRecording && (
                <>
                  <Button
                    onClick={() => togglePauseRecording("achievement")}
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
                    onClick={() => stopRecording("achievement")}
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
                  <Button
                    onClick={() => togglePlayback("achievement")}
                    variant="outline"
                    size="lg"
                  >
                    <FontAwesomeIcon
                      icon={recordingState.isPlaying ? faPause : faPlay}
                      width={20}
                      height={20}
                      className="mr-2"
                    />
                    {recordingState.isPlaying ? "Pause" : "Play"}
                  </Button>

                  <Button
                    onClick={() => clearRecording("achievement")}
                    variant="outline"
                    size="lg"
                  >
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

        {/* Problem/Excuse Recording Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-sm font-medium">
                Optional
              </span>
              Problem Recording
            </CardTitle>
            <CardDescription>
              Record any challenges, problems, or reasons that affected your
              target achievements (optional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Recording Status */}
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-orange-600">
                {formatDuration(excuseRecordingState.duration)}
              </div>
              {excuseRecordingState.isRecording && (
                <div className="text-sm text-muted-foreground mt-2">
                  {excuseRecordingState.isPaused
                    ? "Problem recording paused"
                    : "Recording problems..."}
                </div>
              )}
            </div>

            {/* Recording Controls */}
            <div className="flex justify-center space-x-4">
              {!excuseRecordingState.isRecording &&
                !excuseRecordingState.audioBlob && (
                  <Button
                    onClick={() => startRecording("excuse")}
                    size="lg"
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    disabled={activeRecordingType === "achievement"}
                  >
                    <FontAwesomeIcon
                      icon={faMicrophone}
                      width={20}
                      height={20}
                      className="mr-2"
                    />
                    Start Problem Recording
                  </Button>
                )}

              {excuseRecordingState.isRecording && (
                <>
                  <Button
                    onClick={() => togglePauseRecording("excuse")}
                    variant="outline"
                    size="lg"
                  >
                    <FontAwesomeIcon
                      icon={excuseRecordingState.isPaused ? faPlay : faPause}
                      width={20}
                      height={20}
                      className="mr-2"
                    />
                    {excuseRecordingState.isPaused ? "Resume" : "Pause"}
                  </Button>

                  <Button
                    onClick={() => stopRecording("excuse")}
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

              {excuseRecordingState.audioBlob && (
                <>
                  <Button
                    onClick={() => togglePlayback("excuse")}
                    variant="outline"
                    size="lg"
                  >
                    <FontAwesomeIcon
                      icon={excuseRecordingState.isPlaying ? faPause : faPlay}
                      width={20}
                      height={20}
                      className="mr-2"
                    />
                    {excuseRecordingState.isPlaying ? "Pause" : "Play"}
                  </Button>

                  <Button
                    onClick={() => clearRecording("excuse")}
                    variant="outline"
                    size="lg"
                  >
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
        {(recordingState.audioBlob || excuseRecordingState.audioBlob) && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Recordings</CardTitle>
              <CardDescription>
                Upload your recorded audio files for analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Show which recordings are ready */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div
                  className={`p-3 rounded-lg border ${
                    recordingState.audioBlob
                      ? "bg-green-50 border-green-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={
                        recordingState.audioBlob ? faCheckCircle : faSpinner
                      }
                      className={
                        recordingState.audioBlob
                          ? "text-green-600"
                          : "text-gray-400"
                      }
                      width={16}
                      height={16}
                    />
                    <span
                      className={`text-sm font-medium ${
                        recordingState.audioBlob
                          ? "text-green-700"
                          : "text-gray-500"
                      }`}
                    >
                      Achievement Recording
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {recordingState.audioBlob
                      ? `Ready (${formatDuration(recordingState.duration)})`
                      : "Not recorded yet"}
                  </p>
                </div>

                <div
                  className={`p-3 rounded-lg border ${
                    excuseRecordingState.audioBlob
                      ? "bg-orange-50 border-orange-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={
                        excuseRecordingState.audioBlob
                          ? faCheckCircle
                          : faSpinner
                      }
                      className={
                        excuseRecordingState.audioBlob
                          ? "text-orange-600"
                          : "text-gray-400"
                      }
                      width={16}
                      height={16}
                    />
                    <span
                      className={`text-sm font-medium ${
                        excuseRecordingState.audioBlob
                          ? "text-orange-700"
                          : "text-gray-500"
                      }`}
                    >
                      Problem Recording
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {excuseRecordingState.audioBlob
                      ? `Ready (${formatDuration(
                          excuseRecordingState.duration
                        )})`
                      : "Optional - not recorded"}
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={uploadRecording}
                  disabled={isUploading || !recordingState.audioBlob}
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
                      Upload Recordings
                    </>
                  )}
                </Button>
                {!recordingState.audioBlob && (
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Achievement recording is required before uploading
                  </p>
                )}
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
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2 text-green-700">
                  Achievement Recording (Required)
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Share your daily target achievements</li>
                  <li>• Mention specific progress and results</li>
                  <li>• Include quantifiable metrics if possible</li>
                  <li>• Speak clearly and at normal volume</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-orange-700">
                  Problem Recording (Optional)
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Explain any challenges you faced</li>
                  <li>• Mention external factors affecting performance</li>
                  <li>• Describe obstacles or resource constraints</li>
                  <li>• This helps provide context for analysis</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Both recordings are automatically saved
                with your user account and processed for productivity insights.
                The achievement recording is required, while the problem
                recording is optional but recommended for better analysis.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
