import React, { useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";

/**
 * ---------------------------------------------------------------
 * Field names match the /media/upload route + Media schema:
 * companyId, tags (comma-separated string), files under the
 * multipart field name "media". Response shape:
 * { uploaded, failed, uploadedFiles, failedFiles: [{file, error}] }
 * ---------------------------------------------------------------
 */

const MAX_FILES = 30;
const ACCEPTED_TYPES = "image/*,video/*";

/** Human-readable file size, e.g. 1.4 MB */
function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function getFileKind(file) {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "other";
}

/** Resizes + re-encodes an image on a canvas to shrink its file size. */
function compressImage(file, { maxDimension = 1920, quality = 0.75 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) return reject(new Error("Image compression failed."));
          const compressedFile = new File([blob], file.name, {
            type: blob.type,
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read image for compression."));
    };

    img.src = objectUrl;
  });
}

/**
 * Best-effort in-browser video compression: draws each frame to a
 * downscaled canvas and re-encodes with MediaRecorder at a lower
 * bitrate. Output is always .webm. Requires Chrome/Edge (captureStream
 * + MediaRecorder support). Runs in real time (as long as the clip).
 */
function compressVideo(file, { maxDimension = 1280, videoBitsPerSecond = 2_000_000 } = {}) {
  return new Promise((resolve, reject) => {
    if (typeof MediaRecorder === "undefined" || !HTMLVideoElement.prototype.captureStream) {
      reject(new Error("Video compression isn't supported in this browser."));
      return;
    }

    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    video.onloadedmetadata = () => {
      let { videoWidth: width, videoHeight: height } = video;
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      const canvasStream = canvas.captureStream(24);
      const sourceStream = video.captureStream ? video.captureStream() : null;
      const audioTrack = sourceStream?.getAudioTracks?.()[0];
      if (audioTrack) canvasStream.addTrack(audioTrack);

      const recorder = new MediaRecorder(canvasStream, {
        mimeType: "video/webm;codecs=vp9,opus",
        videoBitsPerSecond,
      });

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        URL.revokeObjectURL(objectUrl);
        const blob = new Blob(chunks, { type: "video/webm" });
        const newName = file.name.replace(/\.[^/.]+$/, "") + ".webm";
        resolve(new File([blob], newName, { type: "video/webm", lastModified: Date.now() }));
      };
      recorder.onerror = (e) => reject(e.error || new Error("Video compression failed."));

      let rafId;
      const drawFrame = () => {
        ctx.drawImage(video, 0, 0, width, height);
        rafId = requestAnimationFrame(drawFrame);
      };

      video.onended = () => {
        cancelAnimationFrame(rafId);
        recorder.stop();
      };

      recorder.start();
      video.play().then(drawFrame).catch(reject);
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read video for compression."));
    };
  });
}

function FileTypeIcon({ kind, className }) {
  if (kind === "image") return <i className={`fa-solid fa-image ${className}`} />;
  if (kind === "video") return <i className={`fa-solid fa-film ${className}`} />;
  return <i className={`fa-solid fa-file ${className}`} />;
}

const STATUS_CONFIG = {
  pending: { label: "Ready", badge: "bg-slate-100 text-slate-500" },
  compressing: { label: "Compressing…", badge: "bg-amber-50 text-amber-600" },
  ready: { label: "Ready to upload", badge: "bg-emerald-50 text-emerald-600" },
  error: { label: "Error", badge: "bg-red-50 text-red-600" },
  uploaded: { label: "Uploaded", badge: "bg-emerald-50 text-emerald-600" },
  failed: { label: "Upload failed", badge: "bg-red-50 text-red-600" },
};

function UploadMedia() {
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");

  const [tags, setTags] = useState("");
  const [compressEnabled, setCompressEnabled] = useState(true);
  const [items, setItems] = useState([]); // { id, file, previewUrl, kind, status, originalSize, finalSize, error }
  const [isDragging, setIsDragging] = useState(false);
  const [formError, setFormError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState(null); // { uploadedCount, failedCount, failedFiles }

  const fileInputRef = useRef(null);

  React.useEffect(() => {
    fetchCompanies();
  }, []);

  async function fetchCompanies() {
    setCompaniesLoading(true);
    setCompaniesError("");
    try {
      const res = await api.get("/company/getAllCompanies");
      setCompanies(res.data.data || []);
    } catch (err) {
      setCompaniesError(err.response?.data?.message || "Failed to load companies.");
    } finally {
      setCompaniesLoading(false);
    }
  }

  function addFiles(fileList) {
    const incoming = Array.from(fileList).filter((f) => getFileKind(f) !== "other");
    if (incoming.length === 0) return;

    setItems((prev) => {
      const room = MAX_FILES - prev.length;
      const accepted = incoming.slice(0, Math.max(room, 0));
      const newItems = accepted.map((file) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        kind: getFileKind(file),
        status: "pending",
        originalSize: file.size,
        finalSize: file.size,
        error: "",
      }));
      return [...prev, ...newItems];
    });
    setFormError("");
    setResult(null);
  }

  function handleInputChange(e) {
    addFiles(e.target.files);
    e.target.value = ""; // allow re-selecting the same file later
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }

  function removeItem(id) {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  }

  function updateItem(id, patch) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  /** Compresses every pending item in place before upload. */
  async function compressAll(currentItems) {
    const results = [];
    for (const item of currentItems) {
      updateItem(item.id, { status: "compressing" });
      try {
        const compressed =
          item.kind === "image" ? await compressImage(item.file) : await compressVideo(item.file);
        updateItem(item.id, { status: "ready", finalSize: compressed.size });
        results.push({ ...item, file: compressed, finalSize: compressed.size, status: "ready" });
      } catch (err) {
        // Compression is best-effort — fall back to the original file.
        updateItem(item.id, { status: "ready", finalSize: item.file.size });
        results.push({ ...item, status: "ready" });
      }
    }
    return results;
  }

  async function handleUpload() {
    setFormError("");
    setResult(null);

    if (!selectedCompanyId) {
      setFormError("Please select a company.");
      return;
    }
    if (!tags.trim()) {
      setFormError("Please add at least one tag.");
      return;
    }
    if (items.length === 0) {
      setFormError("Please select at least one image or video.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    let filesToUpload = items;
    if (compressEnabled) {
      filesToUpload = await compressAll(items);
    }

    const formData = new FormData();
    formData.append("companyId", selectedCompanyId);
    formData.append("tags", tags);
    filesToUpload.forEach((item) => formData.append("media", item.file));

    try {
      const res = await api.post("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (evt.total) setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      });

      const data = res.data;
      const failedNames = new Set((data.failedFiles || []).map((f) => f.file));

      setItems((prev) =>
        prev.map((item) =>
          failedNames.has(item.file.name)
            ? { ...item, status: "failed", error: data.failedFiles.find((f) => f.file === item.file.name)?.error }
            : { ...item, status: "uploaded" }
        )
      );

      setResult({
        uploadedCount: data.uploaded || 0,
        failedCount: data.failed || 0,
        failedFiles: data.failedFiles || [],
      });
    } catch (err) {
      setFormError(err.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleUploadMore() {
    items.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    setItems([]);
    setTags("");
    setResult(null);
    setFormError("");
  }

  const totalOriginalSize = items.reduce((sum, i) => sum + i.originalSize, 0);
  const totalFinalSize = items.reduce((sum, i) => sum + i.finalSize, 0);
  const savedBytes = Math.max(totalOriginalSize - totalFinalSize, 0);

  return (
    <Sidebar>
      <div className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Upload Media</h1>
            <p className="mt-1 text-sm text-slate-500">
              Upload images and videos for a company. Files can be compressed automatically before upload.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left column — settings */}
            <div className="space-y-5 lg:col-span-1">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Company</label>
                {companiesLoading ? (
                  <p className="text-sm text-slate-400">
                    <i className="fa-solid fa-spinner fa-spin mr-2" />Loading companies...
                  </p>
                ) : companiesError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-xs text-red-600">{companiesError}</p>
                    <button onClick={fetchCompanies} className="mt-1 text-xs font-medium text-red-700 hover:underline">
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <i className="fa-solid fa-building pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                    <select
                      value={selectedCompanyId}
                      onChange={(e) => setSelectedCompanyId(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-8 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="">Select a company…</option>
                      {companies.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.companyName}
                        </option>
                      ))}
                    </select>
                    <i className="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Tags</label>
                <div className="relative">
                  <i className="fa-solid fa-tag pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="summer, sale, promo"
                    className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-400">Comma-separated. At least one tag is required.</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={compressEnabled}
                    onChange={(e) => setCompressEnabled(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                  />
                  <span>
                    <p className="text-sm font-medium text-slate-700">Compress before upload</p>
                    <p className="mt-0.5 text-xs text-slate-400">Shrinks images &amp; videos to save bandwidth</p>
                  </span>
                </label>
                {compressEnabled && (
                  <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                    <i className="fa-solid fa-circle-info mt-0.5" />
                    Video compression runs in your browser and can take as long as the clip itself.
                  </p>
                )}
                {items.length > 0 && savedBytes > 0 && (
                  <p className="mt-3 text-xs font-medium text-emerald-600">
                    Estimated savings: {formatBytes(savedBytes)}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading || items.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {uploading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" />
                    Uploading… {uploadProgress}%
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-cloud-arrow-up" />
                    Upload {items.length > 0 ? `${items.length} file${items.length === 1 ? "" : "s"}` : "Media"}
                  </>
                )}
              </button>

              {uploading && (
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              {formError && (
                <p className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                  <i className="fa-solid fa-circle-exclamation" />
                  {formError}
                </p>
              )}

              {result && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-circle-check text-emerald-500" />
                    <p className="text-sm font-semibold text-slate-900">
                      {result.uploadedCount} file{result.uploadedCount === 1 ? "" : "s"} uploaded
                    </p>
                  </div>
                  {result.failedCount > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium text-red-600">{result.failedCount} failed:</p>
                      {result.failedFiles.map((f, idx) => (
                        <p key={idx} className="truncate text-xs text-slate-500">
                          {f.file} — {f.error}
                        </p>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleUploadMore}
                    className="mt-4 w-full rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Upload More
                  </button>
                </div>
              )}
            </div>

            {/* Right column — dropzone + file grid */}
            <div className="lg:col-span-2">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
                  isDragging ? "border-indigo-400 bg-indigo-50/60" : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  multiple
                  onChange={handleInputChange}
                  className="hidden"
                />
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
                  <i className="fa-solid fa-cloud-arrow-up text-2xl text-indigo-500" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">Drag &amp; drop files here</h3>
                <p className="mt-1 text-sm text-slate-500">or click to browse — images and videos, up to {MAX_FILES} files</p>
              </div>

              {items.length > 0 && (
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                  {items.map((item) => {
                    const statusInfo = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
                    return (
                      <div key={item.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div
                          className="relative h-40 w-full flex-shrink-0 overflow-hidden bg-slate-100"
                          onMouseEnter={(e) => {
                            const videoEl = e.currentTarget.querySelector("video");
                            if (videoEl) videoEl.play().catch(() => {});
                          }}
                          onMouseLeave={(e) => {
                            const videoEl = e.currentTarget.querySelector("video");
                            if (videoEl) {
                              videoEl.pause();
                              videoEl.currentTime = 0;
                            }
                          }}
                        >
                          {item.kind === "image" ? (
                            <img src={item.previewUrl} alt={item.file.name} className="h-full w-full object-cover" />
                          ) : (
                            <video
                              src={item.previewUrl}
                              className="h-full w-full object-cover"
                              muted
                              loop
                              playsInline
                              preload="metadata"
                            />
                          )}

                          <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white">
                            <FileTypeIcon kind={item.kind} className="text-xs" />
                          </span>

                          {item.kind === "video" && item.status !== "compressing" && (
                            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10 opacity-100 transition-opacity group-hover:opacity-0">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white">
                                <i className="fa-solid fa-play text-[10px]" />
                              </span>
                            </span>
                          )}

                          {item.status !== "uploading" && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeItem(item.id);
                              }}
                              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                              aria-label="Remove file"
                            >
                              <i className="fa-solid fa-xmark text-xs" />
                            </button>
                          )}

                          {item.status === "compressing" && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                              <i className="fa-solid fa-spinner fa-spin text-xl text-white" />
                            </div>
                          )}
                        </div>

                        <div className="p-2.5">
                          <p className="truncate text-xs font-medium text-slate-700" title={item.file.name}>
                            {item.file.name}
                          </p>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">
                              {item.finalSize !== item.originalSize
                                ? `${formatBytes(item.finalSize)} (was ${formatBytes(item.originalSize)})`
                                : formatBytes(item.originalSize)}
                            </span>
                          </div>
                          <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${statusInfo.badge}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}

export default UploadMedia;