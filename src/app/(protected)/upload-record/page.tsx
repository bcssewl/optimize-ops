"use client";

import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { createClient } from "@/src/lib/supabase/client";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function RecordPage() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [targets, setTargets] = useState<
    { id: number; target_name: string; target_value: number }[]
  >([]);
  const [recentRecordings, setRecentRecordings] = useState<
    { url: string; name: string; time: string; duration: string }[]
  >([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  useEffect(() => {
    const fetchTargets = async () => {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;
      const { data: targetsData } = await supabase
        .from("targets")
        .select("id, target_name, target_value")
        .eq("user_uuid", user.id);
      setTargets(targetsData || []);
    };
    fetchTargets();
  }, []);

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new window.MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunks.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };
      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      toast.error("Microphone permission denied or not available.");
    }
  };

  // Stop recording
  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  // Upload audio
  const handleUpload = async () => {
    if (!audioBlob) return;
    setUploading(true);
    try {
      // TODO: Replace with your upload logic (e.g., Supabase Storage, API call)
      // Example: await uploadAudio(audioBlob)
      toast.success("Audio uploaded successfully!");
      // Add to recent recordings
      setRecentRecordings((prev) => [
        {
          url: audioUrl!,
          name: `Recording ${prev.length + 1}`,
          time: new Date().toLocaleString(),
          duration: "-", // Optionally calculate duration
        },
        ...prev,
      ]);
      setAudioBlob(null);
      setAudioUrl(null);
    } catch (err) {
      toast.error("Failed to upload audio.");
    } finally {
      setUploading(false);
    }
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto py-8 px-2">
      {/* Left: Voice Recording Card and Recent Recordings */}
      <div className="flex-1">
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex flex-col items-center gap-2">
              <FontAwesomeIcon
                icon={faMicrophone}
                className="text-3xl text-blue-500"
              />
              <CardTitle className="text-2xl font-bold text-center">
                Voice Recording
              </CardTitle>
              <p className="text-muted-foreground text-center">
                Capture your thoughts and feedback with a simple voice recording
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6">
              <Button
                onClick={recording ? stopRecording : startRecording}
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-4 rounded-full shadow"
                disabled={uploading}
              >
                {recording ? (
                  "Stop Recording"
                ) : (
                  <>
                    <FontAwesomeIcon icon={faMicrophone} className="mr-2" />{" "}
                    Start Recording
                  </>
                )}
              </Button>
              {audioUrl && (
                <div className="w-full flex flex-col items-center gap-2 mt-4">
                  <audio
                    controls
                    src={audioUrl}
                    className="w-full rounded border"
                  />
                  <Button
                    onClick={handleUpload}
                    className="bg-green-600 hover:bg-green-700 text-white w-full"
                    disabled={uploading}
                  >
                    {uploading ? "Uploading..." : "Upload Recording"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Recent Recordings section */}
        <Card className="mt-6 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="font-semibold text-lg">Recent Recordings</span>
            <a
              href="#"
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              View All
            </a>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {recentRecordings.length === 0 ? (
                <div className="text-muted-foreground text-sm">
                  No recordings yet.
                </div>
              ) : (
                recentRecordings.map((rec, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-gray-50 rounded p-3"
                  >
                    <span className="w-3 h-3 rounded-full bg-blue-400 inline-block" />
                    <div className="flex-1">
                      <div className="font-medium">{rec.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {rec.time} • {rec.duration}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <audio controls src={rec.url} className="w-24" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Right: Simple Targets Sidebar */}
      <div className="w-full md:w-80 flex-shrink-0">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <span className="font-semibold text-lg">Targets</span>
          </CardHeader>
          <CardContent>
            {targets.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                No targets found.
              </div>
            ) : (
              <ul className="space-y-3">
                {targets.map((target) => (
                  <li
                    key={target.id}
                    className="border rounded p-3 flex flex-col gap-1 bg-gray-50"
                  >
                    <div className="font-medium">{target.target_name}</div>
                    <div className="text-xs text-muted-foreground">
                      Value: {target.target_value}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
