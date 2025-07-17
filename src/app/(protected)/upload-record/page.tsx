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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
            Record live audio for productivity tracking
          </p>
        </div>

        {/* File Upload Section */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Upload Audio File</CardTitle>
            <CardDescription>
              Upload MP3 or MP4 files directly from your device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6"> 
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className="text-4xl">📁</div>
                <div>
                  <p className="text-lg font-medium">
                    {isDragOver
                      ? "Drop your file here"
                      : "Drag and drop your audio file"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click below to browse files
                  </p>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="mt-4"
                >
                  <FontAwesomeIcon
                    icon={faUpload}
                    width={16}
                    height={16}
                    className="mr-2"
                  />
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp3,.mp4,.m4a,.mpeg,audio/mp3,audio/mpeg,audio/mp4,video/mp4"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            </div>
 
            {uploadedFile && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB •{" "}
                      {uploadedFile.type || "audio/mp3"}
                    </p>
                  </div>
                  <Button
                    onClick={clearUploadedFile}
                    variant="outline"
                    size="sm"
                  >
                    <FontAwesomeIcon
                      icon={faTrash}
                      width={14}
                      height={14}
                      className="mr-1"
                    />
                    Remove
                  </Button>
                </div>
              </div>
            )}
 
            {uploadedFile && (
              <Button
                onClick={uploadFile}
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
                    Upload File
                  </>
                )}
              </Button>
            )}

            <div className="text-xs text-muted-foreground text-center">
              Supported formats: MP3, MP4 • Maximum size: 50MB
            </div>
          </CardContent>
        </Card> */}

        {/* Divider */}
        {/* <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or record live audio
            </span>
          </div>
        </div> */}

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
                Upload your recorded audio (automatically named with timestamp)
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
            <div className="grid md:grid-cols-2 gap-6">
              {/* <div>
                <h4 className="font-medium mb-2">File Upload</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Upload MP3 or MP4 files directly</li>
                  <li>• Drag and drop files or use the file picker</li>
                  <li>• Maximum file size: 50MB</li>
                  <li>• Files are automatically processed after upload</li>
                </ul>
              </div> */}
              <div>
                <h4 className="font-medium mb-2">Live Recording</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Make sure your microphone is connected</li>
                  <li>• Speak clearly and at a normal volume</li>
                  <li>• You can pause and resume recording</li>
                  <li>• Preview your recording before uploading</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> All recordings are automatically saved
                with your user account and processed for productivity insights.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
