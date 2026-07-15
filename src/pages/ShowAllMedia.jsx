import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";

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

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatDuration(seconds) {
  if (!seconds) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function ShowAllMedia() {
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);

  const [media, setMedia] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState("");

  const [companyFilter, setCompanyFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    fetchCompanies();
    fetchMedia();
  }, []);

  async function fetchCompanies() {
    setCompaniesLoading(true);
    try {
      const res = await api.get("/company/getAllCompanies");
      setCompanies(res.data.data || []);
    } catch (err) {
      // Company names are a nice-to-have here — media still shows without them.
    } finally {
      setCompaniesLoading(false);
    }
  }

  async function fetchMedia() {
    setMediaLoading(true);
    setMediaError("");
    try {
      const res = await api.get("/media/allMedia");
      setMedia(res.data.data || []);
    } catch (err) {
      setMediaError(err.response?.data?.message || "Failed to load media.");
    } finally {
      setMediaLoading(false);
    }
  }

  function getCompanyName(companyId) {
    const company = companies.find((c) => c._id === companyId);
    return company ? company.companyName : "Unknown Company";
  }

  const filteredMedia = useMemo(() => {
    return media.filter((item) => {
      if (companyFilter !== "all" && item.companyId !== companyFilter) return false;
      if (typeFilter !== "all" && item.mediaType !== typeFilter) return false;

      const createdAt = new Date(item.createdAt);
      if (fromDate && createdAt < new Date(fromDate)) return false;
      if (toDate && createdAt > new Date(`${toDate}T23:59:59`)) return false;

      return true;
    });
  }, [media, companyFilter, typeFilter, fromDate, toDate]);

  function resetFilters() {
    setCompanyFilter("all");
    setTypeFilter("all");
    setFromDate("");
    setToDate("");
  }

  async function handleDeleteMedia(item) {
    if (!window.confirm(`Delete ${item.originalFileName}? This cannot be undone.`)) return;

    try {
      await api.delete(`/media/deleteMedia/${item._id}`);
      setMedia((prev) => prev.filter((m) => m._id !== item._id));
    } catch (err) {
      window.alert(err.response?.data?.message || "Failed to delete media.");
    }
  }

  const hasActiveFilters = companyFilter !== "all" || typeFilter !== "all" || fromDate || toDate;

  return (
    <Sidebar>
      <div className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">All Media</h1>
              <p className="mt-1 text-sm text-slate-500">Browse, filter, and manage every uploaded image and video.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-500">
              <i className="fa-solid fa-photo-film mr-2 text-slate-400" />
              {filteredMedia.length} of {media.length} file{media.length === 1 ? "" : "s"}
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end sm:flex-wrap">
            <div className="flex-1 min-w-[180px]">
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Company</label>
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                disabled={companiesLoading}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="all">All Companies</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[140px]">
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Content Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
              </select>
            </div>

            <div className="flex-1 min-w-[140px]">
              <label className="mb-1.5 block text-xs font-medium text-slate-500">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="flex-1 min-w-[140px]">
              <label className="mb-1.5 block text-xs font-medium text-slate-500">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <i className="fa-solid fa-rotate-left text-xs" />
                Reset
              </button>
            )}
          </div>

          {/* Content */}
          {mediaLoading && (
            <div className="flex justify-center py-24 text-slate-400">
              <i className="fa-solid fa-spinner fa-spin text-2xl" />
            </div>
          )}

          {!mediaLoading && mediaError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
              <i className="fa-solid fa-triangle-exclamation mb-2 block text-xl text-red-500" />
              <p className="text-sm text-red-600">{mediaError}</p>
              <button
                onClick={fetchMedia}
                className="mt-3 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                Retry
              </button>
            </div>
          )}

          {!mediaLoading && !mediaError && filteredMedia.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
                <i className="fa-solid fa-photo-film text-xl text-indigo-500" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">No media found</h3>
              <p className="mt-1.5 max-w-sm text-sm text-slate-500">
                {media.length === 0 ? "No media has been uploaded yet." : "Try adjusting your filters."}
              </p>
            </div>
          )}

          {!mediaLoading && !mediaError && filteredMedia.length > 0 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredMedia.map((item) => (
                <article
                  key={item._id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div
                    className="relative h-48 w-full flex-shrink-0 overflow-hidden bg-slate-100"
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
                    {item.mediaType === "image" ? (
                      <img
                        src={item.mediaUrl}
                        alt={item.originalFileName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <video
                        src={item.mediaUrl}
                        className="h-full w-full object-cover"
                        muted
                        loop
                        playsInline
                        preload="metadata"
                      />
                    )}

                    <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white">
                      <i className={`fa-solid ${item.mediaType === "image" ? "fa-image" : "fa-film"} text-xs`} />
                    </span>

                    {item.mediaType === "video" && (
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10 opacity-100 transition-opacity group-hover:opacity-0">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white">
                          <i className="fa-solid fa-play text-xs" />
                        </span>
                      </span>
                    )}

                    {item.duration && (
                      <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        {formatDuration(item.duration)}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteMedia(item)}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-red-600 hover:text-white"
                      aria-label="Delete media"
                      title="Delete media"
                    >
                      <i className="fa-solid fa-trash text-xs" />
                    </button>
                  </div>

                  <div className="flex flex-1 flex-col p-3.5">
                    <p className="truncate text-sm font-medium text-slate-800" title={item.originalFileName}>
                      {item.originalFileName}
                    </p>

                    <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                      <i className="fa-solid fa-building text-[10px] text-slate-400" />
                      <span className="truncate">{getCompanyName(item.companyId)}</span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                      <span>{formatBytes(item.fileSize)}</span>
                      {item.width && item.height && (
                        <span>
                          {item.width}×{item.height}
                        </span>
                      )}
                      <span>{formatDate(item.createdAt)}</span>
                    </div>

                    {item.tags?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                            #{tag}
                          </span>
                        ))}
                        {item.tags.length > 3 && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                            +{item.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-auto pt-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          item.isAssigned ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${item.isAssigned ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {item.isAssigned ? "Assigned" : "Unassigned"}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

      </div>
    </Sidebar>
  );
}

export default ShowAllMedia;