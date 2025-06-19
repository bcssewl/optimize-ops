"use client";

import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  faCloudUploadAlt,
  faMicrophone,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRef, useState } from "react";
import { toast } from "sonner";

export default function RecordPage() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

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
      {/* Left: Voice Recording Card */}
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
              <div className="w-full border-2 border-dashed rounded-lg p-6 flex flex-col items-center gap-2 bg-gray-50">
                <FontAwesomeIcon
                  icon={faCloudUploadAlt}
                  className="text-3xl text-gray-400 mb-2"
                />
                <span className="font-medium">
                  Or upload an existing recording
                </span>
                <label className="text-blue-600 cursor-pointer underline mt-2">
                  Choose File
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>
              </div>
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
        {/* Recent Recordings section placeholder */}
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
              {/* Example items, replace with real data */}
              <div className="flex items-center gap-3 bg-gray-50 rounded p-3">
                <span className="w-3 h-3 rounded-full bg-blue-400 inline-block" />
                <div className="flex-1">
                  <div className="font-medium">Warehouse 1 - Daily Check</div>
                  <div className="text-xs text-muted-foreground">
                    Today, 2:30 PM • 2:15
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" className="text-gray-400">
                    <i className="fas fa-download" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-gray-400">
                    <i className="fas fa-trash" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-green-50 rounded p-3">
                <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
                <div className="flex-1">
                  <div className="font-medium">Sales Team Feedback</div>
                  <div className="text-xs text-muted-foreground">
                    Yesterday, 4:45 PM • 1:52
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" className="text-gray-400">
                    <i className="fas fa-download" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-gray-400">
                    <i className="fas fa-trash" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-purple-50 rounded p-3">
                <span className="w-3 h-3 rounded-full bg-purple-400 inline-block" />
                <div className="flex-1">
                  <div className="font-medium">Project Review Notes</div>
                  <div className="text-xs text-muted-foreground">
                    2 days ago, 11:20 AM • 3:42
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" className="text-gray-400">
                    <i className="fas fa-download" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-gray-400">
                    <i className="fas fa-trash" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Right: Targets Sidebar placeholder */}
      <div className="w-full md:w-80 flex-shrink-0">
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <span className="font-semibold text-lg">Targets</span>
            <Button size="icon" variant="ghost" className="text-blue-600">
              <span className="text-2xl leading-none">+</span>
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Example target cards, replace with real data */}
            <div className="rounded-lg border p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Monthly Sales</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  On Track
                </span>
              </div>
              <div className="text-xs text-muted-foreground">Target</div>
              <div className="font-bold text-lg">$50,000</div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-green-500 rounded-full"
                  style={{ width: "75%" }}
                />
              </div>
              <div className="text-xs text-muted-foreground">75% complete</div>
            </div>
            <div className="rounded-lg border p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Customer Satisfaction</span>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                  Behind
                </span>
              </div>
              <div className="text-xs text-muted-foreground">Target</div>
              <div className="font-bold text-lg">95%</div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-yellow-400 rounded-full"
                  style={{ width: "60%" }}
                />
              </div>
              <div className="text-xs text-muted-foreground">60% complete</div>
            </div>
            <div className="rounded-lg border p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Team Training Hours</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  Exceeded
                </span>
              </div>
              <div className="text-xs text-muted-foreground">Target</div>
              <div className="font-bold text-lg">40 hrs</div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-blue-500 rounded-full"
                  style={{ width: "120%" }}
                />
              </div>
              <div className="text-xs text-muted-foreground">120% complete</div>
            </div>
            <div className="rounded-lg border p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Quality Score</span>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                  Critical
                </span>
              </div>
              <div className="text-xs text-muted-foreground">Target</div>
              <div className="font-bold text-lg">4.5/5</div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-red-500 rounded-full"
                  style={{ width: "30%" }}
                />
              </div>
              <div className="text-xs text-muted-foreground">30% complete</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
