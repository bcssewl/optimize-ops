"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

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

interface Recording {
  id: number;
  user_uuid: string;
  file_name: string;
  file_path: string;
  file_type: string;
  excuse_recording_file_name: string;
  excuse_recording_file_path: string;
  excuse_recording_file_type: string;
  duration: number | null;
  description: string | null;
  transcript: string | null;
  analysis: any;
  final_analysis?: {
    analysis: any[];
    expected_working_hour: number;
    actual_production_hour: number;
  };
  excuse_recording_analysis?: {
    note: string;
    reason: string[];
    total_working_hour: number;
  };
  status: "in_progress" | "failed" | "success";
  created_at: string;
  recordingType?: string;
  displayId?: string;
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
  const [playingDisplayId, setPlayingDisplayId] = useState<string | null>(null);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 10;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const canViewAllRecordings =
    user?.role === "admin" || user?.role === "manager";

  useEffect(() => {
    fetchRecordings();
    if (canViewAllRecordings) fetchUsers();
  }, [user, canViewAllRecordings]);

  async function fetchRecordings() {
    if (!user) return;
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("recordings")
      .select("*")
      .order("created_at", { ascending: false });
    if (!canViewAllRecordings) query = query.eq("user_uuid", user.id);
    const { data, error } = await query;
    if (error) toast.error("Failed to fetch recordings");
    else setRecordings(data || []);
    setLoading(false);
  }

  async function fetchUsers() {
    const supabase = createClient();
    const { data } = await supabase
      .from("users")
      .select("id, uuid, email, role");
    setUsers(data || []);
  }

  const getUserEmail = (userUuid: string) =>
    users.find((u) => u.uuid === userUuid)?.email || "Unknown User";

  async function handleDelete(recording: Recording) {
    if (!confirm("Are you sure you want to delete this recording?")) return;
    try {
      const supabase = createClient();
      const { error: storageError } = await supabase.storage
        .from("audio-recordings")
        .remove([recording.file_path]);
      if (storageError) console.warn("Storage deletion error:", storageError);
      const { error: dbError } = await supabase
        .from("recordings")
        .delete()
        .eq("id", recording.id);
      if (dbError) throw dbError;
      toast.success("Recording deleted successfully!");
      await fetchRecordings();
    } catch (err: any) {
      toast.error(`Failed to delete recording: ${err.message}`);
    }
  }

  async function togglePlayback(recording: Recording) {
    if (playingDisplayId === recording.displayId) {
      audioRef.current?.pause();
      setPlayingDisplayId(null);
      return;
    }
    try {
      const supabase = createClient();
      const filePath =
        recording.recordingType === "excuse"
          ? recording.excuse_recording_file_path
          : recording.file_path;
      if (!filePath) {
        toast.error("No file path available for this recording.");
        return;
      }
      const { data } = await supabase.storage
        .from("audio-recordings")
        .createSignedUrl(filePath, 3600);
      if (data?.signedUrl) {
        if (audioRef.current) audioRef.current.pause();
        const audio = new Audio(data.signedUrl);
        audioRef.current = audio;
        audio.onended = () => setPlayingDisplayId(null);
        audio.onerror = () => {
          toast.error("Failed to load audio");
          setPlayingDisplayId(null);
        };
        await audio.play();
        setPlayingDisplayId(recording.displayId || null);
      }
    } catch (err) {
      toast.error("Failed to play recording");
    }
  }

  async function downloadRecording(recording: Recording) {
    try {
      const supabase = createClient();
      const isExcuse = recording.recordingType === "excuse";
      const filePath = isExcuse
        ? recording.excuse_recording_file_path
        : recording.file_path;
      const fileName = isExcuse
        ? recording.excuse_recording_file_name
        : recording.file_name;
      if (!filePath) {
        toast.error("No file path available for this recording.");
        return;
      }
      const { data } = await supabase.storage
        .from("audio-recordings")
        .createSignedUrl(filePath, 3600);
      if (data?.signedUrl) {
        const link = document.createElement("a");
        link.href = data.signedUrl;
        link.download = fileName || "recording.mp4";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      toast.error("Failed to download recording");
    }
  }

  const expandedRecordings = recordings.flatMap((rec) => {
    const rows: Recording[] = [] as any;
    if (rec.final_analysis) {
      rows.push({
        ...rec,
        recordingType: "achievement",
        displayId: `${rec.id}-achievement`,
        file_name: rec.file_name || "recording.mp4",
        file_path: rec.file_path || "",
        file_type: rec.file_type || "audio/mp4",
      });
    }
    if (rec.excuse_recording_analysis) {
      rows.push({
        ...rec,
        recordingType: "excuse",
        displayId: `${rec.id}-excuse`,
        file_name: rec.excuse_recording_file_name || "recording.mp4",
        file_path: rec.excuse_recording_file_path || "",
        file_type: rec.excuse_recording_file_type || "audio/mp4",
      });
    }
    if (!rec.final_analysis && !rec.excuse_recording_analysis) {
      rows.push({
        ...rec,
        recordingType: rec.analysis ? "legacy" : "processing",
        displayId: `${rec.id}-${rec.analysis ? "legacy" : "processing"}`,
      });
    }
    return rows;
  });

  const filteredRecordings = expandedRecordings.filter((r) => {
    const matchesSearch =
      (r.file_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      getUserEmail(r.user_uuid)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesType = typeFilter === "all" || r.recordingType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const groupedMap = useMemo(() => {
    const map = new Map<number, Recording[]>();
    for (const rec of filteredRecordings) {
      if (!map.has(rec.id)) map.set(rec.id, []);
      map.get(rec.id)!.push(rec);
    }
    return map;
  }, [filteredRecordings]);

  const groupedEntries = useMemo(
    () => Array.from(groupedMap.entries()),
    [groupedMap]
  );
  const totalPages = Math.max(1, Math.ceil(groupedEntries.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const pagedEntries = useMemo(
    () =>
      groupedEntries.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
      ),
    [groupedEntries, currentPage]
  );

  const pageWindow = useMemo(() => {
    const maxButtons = 5;
    const half = Math.floor(maxButtons / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "achievement":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Achievement
          </span>
        );
      case "excuse":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            Excuse
          </span>
        );
      case "legacy":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Legacy
          </span>
        );
      case "processing":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Processing
          </span>
        );
      default:
        return null;
    }
  };

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
                Record Audio
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
              <div>
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="all">All Types</option>
                  <option value="achievement">Achievement</option>
                  <option value="excuse">Excuse</option>
                  <option value="legacy">Legacy</option>
                  <option value="processing">Processing</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recordings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recordings ({groupedEntries.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <span className="text-muted-foreground">
                  Loading recordings...
                </span>
              </div>
            ) : groupedEntries.length === 0 ? (
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
                      <TableHead>Type</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedEntries.map(
                      ([recordingId, recordingGroup], groupIndex) => (
                        <React.Fragment key={recordingId}>
                          {groupIndex > 0 && (
                            <TableRow className="h-3">
                              <TableCell
                                colSpan={3}
                                className="p-0 border-0"
                              ></TableCell>
                            </TableRow>
                          )}
                          {recordingGroup.map((recording, rowIndex) => (
                            <TableRow
                              key={recording.displayId}
                              className={`
                              border-l border-r border-l-blue-200 border-r-blue-200 bg-blue-50/20
                              ${
                                rowIndex === 0
                                  ? "border-t border-t-blue-200 rounded-t-lg"
                                  : ""
                              }
                              ${
                                rowIndex === recordingGroup.length - 1
                                  ? "border-b border-b-blue-200 rounded-b-lg"
                                  : ""
                              }
                              ${
                                recordingGroup.length === 1
                                  ? "border border-blue-200 rounded-lg"
                                  : ""
                              }
                              ${
                                recordingGroup.length > 1
                                  ? "bg-blue-50/30"
                                  : "bg-blue-50/20"
                              }
                            `}
                            >
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
                              <TableCell>
                                {getTypeBadge(
                                  recording.recordingType || "processing"
                                )}
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
                                        playingDisplayId === recording.displayId
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
                                    onClick={() =>
                                      setSelectedRecording(recording)
                                    }
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
                        </React.Fragment>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination Controls (bottom only) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              {pageWindow.map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}

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
                  <Label>Status</Label>
                  <div className="mt-1">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {selectedRecording.status.replace("_", " ")}
                    </span>
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
