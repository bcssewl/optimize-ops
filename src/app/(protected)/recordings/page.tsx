"use client";

import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { useAuth } from "@/src/context/AuthContext";
import { createClient } from "@/src/lib/supabase/client";
import {
  faDownload,
  faEye,
  faMicrophone,
  faPause,
  faPlay,
  faSearch,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Recording {
  id: number;
  user_uuid: string;
  file_name: string;
  file_path: string;
  file_type: string;
  duration: number | null;
  description: string | null;
  transcript: string | null;
  analysis: any;
  status: "in_progress" | "failed" | "success";
  created_at: string;
}

interface User {
  id: number;
  uuid: string;
  email: string;
  role?: string;
}

export default function RecordingsPage() {
  const { user } = useAuth();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingRecording, setPlayingRecording] = useState<number | null>(null);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check if user can view all recordings (admin/manager)
  const canViewAllRecordings =
    user?.role === "admin" || user?.role === "manager";

  useEffect(() => {
    fetchRecordings();
    if (canViewAllRecordings) {
      fetchUsers();
    }
  }, [user, canViewAllRecordings]);

  const fetchRecordings = async () => {
    if (!user) return;

    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("recordings")
      .select("*")
      .order("created_at", { ascending: false });

    // If not admin/manager, only show own recordings
    if (!canViewAllRecordings) {
      query = query.eq("user_uuid", user.id);
    }

    const { data: recordingsData, error } = await query;

    if (error) {
      toast.error("Failed to fetch recordings");
    } else {
      setRecordings(recordingsData || []);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    const supabase = createClient();
    const { data: usersData } = await supabase
      .from("users")
      .select("id, uuid, email, role");
    setUsers(usersData || []);
  };

  // Get user email by UUID
  const getUserEmail = (userUuid: string) => {
    const foundUser = users.find((u) => u.uuid === userUuid);
    return foundUser?.email || "Unknown User";
  };

  // Delete recording
  const handleDelete = async (recording: Recording) => {
    if (!confirm("Are you sure you want to delete this recording?")) return;

    try {
      const supabase = createClient();

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("audio-recordings")
        .remove([recording.file_path]);

      if (storageError) {
        console.warn("Storage deletion error:", storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from("recordings")
        .delete()
        .eq("id", recording.id);

      if (dbError) {
        throw dbError;
      }

      toast.success("Recording deleted successfully!");
      await fetchRecordings();
    } catch (error: any) {
      toast.error(`Failed to delete recording: ${error.message}`);
    }
  };

  // Play/pause recording
  const togglePlayback = async (recording: Recording) => {
    if (playingRecording === recording.id) {
      audioRef.current?.pause();
      setPlayingRecording(null);
    } else {
      try {
        const supabase = createClient();
        const { data: urlData } = await supabase.storage
          .from("audio-recordings")
          .createSignedUrl(recording.file_path, 3600);

        if (urlData?.signedUrl) {
          if (audioRef.current) {
            audioRef.current.pause();
          }

          const audio = new Audio(urlData.signedUrl);
          audioRef.current = audio;

          audio.onended = () => setPlayingRecording(null);
          audio.onerror = () => {
            toast.error("Failed to load audio");
            setPlayingRecording(null);
          };

          await audio.play();
          setPlayingRecording(recording.id);
        }
      } catch (error) {
        toast.error("Failed to play recording");
      }
    }
  };

  // Download recording
  const downloadRecording = async (recording: Recording) => {
    try {
      const supabase = createClient();
      const { data: urlData } = await supabase.storage
        .from("audio-recordings")
        .createSignedUrl(recording.file_path, 3600);

      if (urlData?.signedUrl) {
        const link = document.createElement("a");
        link.href = urlData.signedUrl;
        link.download = recording.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      toast.error("Failed to download recording");
    }
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Format status badge
  const getStatusBadge = (status: Recording["status"]) => {
    const colors = {
      in_progress: "bg-yellow-100 text-yellow-800",
      success: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  // Filter recordings
  const filteredRecordings = recordings.filter((recording) => {
    const matchesSearch =
      recording.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recording.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getUserEmail(recording.user_uuid)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || recording.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full mx-auto py-12 px-4 md:px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">
              {canViewAllRecordings ? "All Recordings" : "My Recordings"}
            </h1>
            <p className="text-muted-foreground">
              {canViewAllRecordings
                ? "Manage and review all user recordings"
                : "View and manage your voice recordings"}
            </p>
          </div>
          {/* Show New Recording button for users who can record */}
          {(user?.role === "supervisor" || user?.role === "staff") && (
            <Link href="/upload-record">
              <Button
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <FontAwesomeIcon
                  icon={faMicrophone}
                  width={20}
                  height={20}
                  className="mr-2"
                />
                New Recording
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="absolute left-3 top-3 text-gray-400"
                    width={16}
                    height={16}
                  />
                  <Input
                    id="search"
                    placeholder="Search by filename, description, or user..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="all">All Status</option>
                  <option value="in_progress">In Progress</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recordings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recordings ({filteredRecordings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <span className="text-muted-foreground">
                  Loading recordings...
                </span>
              </div>
            ) : filteredRecordings.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== "all"
                    ? "No recordings match your filters."
                    : "No recordings found."}
                </p>
                {!searchTerm &&
                  statusFilter === "all" &&
                  (user?.role === "supervisor" || user?.role === "staff") && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Get started by creating your first recording
                      </p>
                      <Link href="/upload-record">
                        <Button className="bg-red-600 hover:bg-red-700 text-white">
                          <FontAwesomeIcon
                            icon={faMicrophone}
                            width={16}
                            height={16}
                            className="mr-2"
                          />
                          Start Recording
                        </Button>
                      </Link>
                    </div>
                  )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      {canViewAllRecordings && <TableHead>User</TableHead>}
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecordings.map((recording) => (
                      <TableRow key={recording.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {recording.file_name}
                            </div>
                            {recording.description && (
                              <div className="text-sm text-muted-foreground">
                                {recording.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        {canViewAllRecordings && (
                          <TableCell>
                            <div className="text-sm">
                              {getUserEmail(recording.user_uuid)}
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          {recording.duration
                            ? formatDuration(recording.duration)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(recording.status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(
                              recording.created_at
                            ).toLocaleDateString()}
                            <br />
                            <span className="text-muted-foreground">
                              {new Date(
                                recording.created_at
                              ).toLocaleTimeString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => togglePlayback(recording)}
                              title="Play/Pause"
                            >
                              <FontAwesomeIcon
                                icon={
                                  playingRecording === recording.id
                                    ? faPause
                                    : faPlay
                                }
                                width={14}
                                height={14}
                              />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadRecording(recording)}
                              title="Download"
                            >
                              <FontAwesomeIcon
                                icon={faDownload}
                                width={14}
                                height={14}
                              />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRecording(recording)}
                              title="View Details"
                            >
                              <FontAwesomeIcon
                                icon={faEye}
                                width={14}
                                height={14}
                              />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(recording)}
                              title="Delete"
                            >
                              <FontAwesomeIcon
                                icon={faTrash}
                                width={14}
                                height={14}
                              />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recording Details Modal */}
        {selectedRecording && (
          <Dialog
            open={!!selectedRecording}
            onOpenChange={() => setSelectedRecording(null)}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Recording Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>File Name</Label>
                  <p className="text-sm">{selectedRecording.file_name}</p>
                </div>

                {canViewAllRecordings && (
                  <div>
                    <Label>User</Label>
                    <p className="text-sm">
                      {getUserEmail(selectedRecording.user_uuid)}
                    </p>
                  </div>
                )}

                <div>
                  <Label>Description</Label>
                  <p className="text-sm">
                    {selectedRecording.description || "No description provided"}
                  </p>
                </div>

                <div>
                  <Label>Duration</Label>
                  <p className="text-sm">
                    {selectedRecording.duration
                      ? formatDuration(selectedRecording.duration)
                      : "Unknown"}
                  </p>
                </div>

                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedRecording.status)}
                  </div>
                </div>

                <div>
                  <Label>Created</Label>
                  <p className="text-sm">
                    {new Date(selectedRecording.created_at).toLocaleString()}
                  </p>
                </div>

                {selectedRecording.transcript && (
                  <div>
                    <Label>Transcript</Label>
                    <p className="text-sm bg-gray-50 p-3 rounded">
                      {selectedRecording.transcript}
                    </p>
                  </div>
                )}

                {selectedRecording.analysis && (
                  <div>
                    <Label>Analysis</Label>
                    <pre className="text-sm bg-gray-50 p-3 rounded overflow-auto">
                      {JSON.stringify(selectedRecording.analysis, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
