import React, { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";

const PLATFORM_META = {
  facebook: {
    label: "Facebook",
    icon: "fa-brands fa-facebook-f",
    ring: "ring-blue-100 bg-blue-50 text-blue-700",
    border: "border-blue-100",
  },
  instagram: {
    label: "Instagram",
    icon: "fa-brands fa-instagram",
    ring: "ring-pink-100 bg-pink-50 text-pink-700",
    border: "border-pink-100",
  },
  linkedin: {
    label: "LinkedIn",
    icon: "fa-brands fa-linkedin-in",
    ring: "ring-sky-100 bg-sky-50 text-sky-700",
    border: "border-sky-100",
  },
  youtube: {
    label: "YouTube",
    icon: "fa-brands fa-youtube",
    ring: "ring-red-100 bg-red-50 text-red-700",
    border: "border-red-100",
  },
};

// Facebook/Instagram/LinkedIn share the same generic { accessToken/caption
// + imageUrl|videoUrl } shape (LinkedIn just doesn't need an account id —
// it resolves the author from the access token itself). YouTube is handled
// separately below since its upload + token-refresh routes take a
// completely different payload.
const POST_ROUTE_MAP = {
  facebook: {
    image: "/social-accounts/facebook/post-image",
    video: "/social-accounts/facebook/post-video",
    accountIdKey: "pageId",
  },
  instagram: {
    image: "/social-accounts/instagram/post-image",
    video: "/social-accounts/instagram/post-video",
    accountIdKey: "instagramAccountId",
  },
  linkedin: {
    image: "/social-accounts/linkedin/post-image",
    video: "/social-accounts/linkedin/post-video",
    accountIdKey: null,
  },
};

const YOUTUBE_UPLOAD_ROUTE = "/social-accounts/youtube/upload";
const YOUTUBE_REFRESH_ROUTE = "/social-accounts/youtube/refresh-token";
// Refresh proactively if the stored token expires within this window,
// rather than waiting for the upload call to fail with an expired token.
const YOUTUBE_TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

function isPlatformSupported(platform) {
  return Boolean(POST_ROUTE_MAP[platform]) || platform === "youtube";
}

function getPlatformMeta(platform) {
  return PLATFORM_META[platform] || {
    label: platform,
    icon: "fa-solid fa-share-nodes",
    ring: "ring-gray-100 bg-gray-50 text-gray-700",
    border: "border-gray-100",
  };
}

function getMediaType(file) {
  if (!file) return "";
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "";
}

function formatFileSize(bytes) {
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

function maskValue(value, visible = 4) {
  if (!value) return "—";
  if (value.length <= visible) return value;
  return `${"•".repeat(Math.max(value.length - visible, 4))}${value.slice(-visible)}`;
}

function buildTags({ caption, companyName, selectedAccounts, mediaType }) {
  const tagSource = [caption, companyName, mediaType, ...selectedAccounts.map((account) => account.platform)];
  const tags = tagSource
    .join(" ")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 2);

  return [...new Set(tags)].slice(0, 12).join(", ");
}

function compressVideo(file, { maxDimension = 1280, videoBitsPerSecond = 2_000_000 } = {}) {
  return new Promise((resolve, reject) => {
    if (typeof MediaRecorder === "undefined" || !HTMLVideoElement.prototype.captureStream) {
      reject(new Error("Video compression is not supported in this browser."));
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
      const context = canvas.getContext("2d");

      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Video compression failed to initialize."));
        return;
      }

      const canvasStream = canvas.captureStream(24);
      const sourceStream = video.captureStream ? video.captureStream() : null;
      const audioTrack = sourceStream?.getAudioTracks?.()[0];
      if (audioTrack) canvasStream.addTrack(audioTrack);

      const recorder = new MediaRecorder(canvasStream, {
        mimeType: "video/webm;codecs=vp9,opus",
        videoBitsPerSecond,
      });

      const chunks = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.onerror = (event) => {
        URL.revokeObjectURL(objectUrl);
        reject(event.error || new Error("Video compression failed."));
      };

      recorder.onstop = () => {
        URL.revokeObjectURL(objectUrl);
        const blob = new Blob(chunks, { type: "video/webm" });
        const compressedName = file.name.replace(/\.[^/.]+$/, "") + ".webm";
        resolve(new File([blob], compressedName, { type: "video/webm", lastModified: Date.now() }));
      };

      let rafId;
      const drawFrame = () => {
        context.drawImage(video, 0, 0, width, height);
        rafId = requestAnimationFrame(drawFrame);
      };

      video.onended = () => {
        cancelAnimationFrame(rafId);
        recorder.stop();
      };

      recorder.start();
      video.play().then(drawFrame).catch((error) => {
        cancelAnimationFrame(rafId);
        URL.revokeObjectURL(objectUrl);
        reject(error);
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read the video file."));
    };
  });
}

function ManualPosting() {
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");

  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState("");
  const [selectedAccountIds, setSelectedAccountIds] = useState([]);

  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState("");
  const [formError, setFormError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState("info"); // 'info' | 'success' | 'error'
  const [statusDetail, setStatusDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // YouTube-specific fields — youtube.videos.insert needs a title
  // separate from the caption, plus a privacy status and optional tags.
  const [youtubeTitle, setYoutubeTitle] = useState("");
  const [youtubePrivacy, setYoutubePrivacy] = useState("public");
  const [youtubeTags, setYoutubeTags] = useState("");

  const fileInputRef = useRef(null);
  const messageRef = useRef(null);

  const selectedCompany = useMemo(
    () => companies.find((company) => company._id === selectedCompanyId) || null,
    [companies, selectedCompanyId]
  );

  const selectedAccounts = useMemo(
    () => accounts.filter((account) => selectedAccountIds.includes(account._id)),
    [accounts, selectedAccountIds]
  );

  const mediaType = useMemo(() => getMediaType(selectedFile), [selectedFile]);
  const previewUrl = filePreviewUrl;
  const visibleAccounts = useMemo(
    () => accounts.filter((account) => mediaType !== "image" || account.platform !== "youtube"),
    [accounts, mediaType]
  );
  const hasYoutubeSelection = selectedAccounts.some((account) => account.platform === "youtube");
  const hasLinkedinSelection = selectedAccounts.some((account) => account.platform === "linkedin");

  // Step numbers stay correct whether or not the YouTube section is showing.
  const youtubeStepNumber = 4;
  const captionStepNumber = mediaType === "video" ? 5 : 4;

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (!selectedCompanyId) {
      setAccounts([]);
      setSelectedAccountIds([]);
      setSelectedFile(null);
      setFilePreviewUrl("");
      return;
    }

    fetchAccounts(selectedCompanyId);
    setSelectedAccountIds([]);
    setSelectedFile(null);
    setFilePreviewUrl("");
    setCaption("");
    setYoutubeTitle("");
    setYoutubePrivacy("public");
    setYoutubeTags("");
    setFormError("");
    setStatusMessage("");
    setStatusDetail("");
  }, [selectedCompanyId]);

  useEffect(() => {
    if (mediaType === "image") {
      setSelectedAccountIds((prev) => prev.filter((accountId) => accounts.find((item) => item._id === accountId)?.platform !== "youtube"));
    }
  }, [mediaType, accounts]);

  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  // Always bring the status/error banner into view so progress updates
  // during a long submit aren't missed while scrolled down the form.
  useEffect(() => {
    if ((formError || statusMessage) && messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [formError, statusMessage]);

  function dismissMessage() {
    setFormError("");
    setStatusMessage("");
    setStatusDetail("");
  }

  async function fetchCompanies() {
    setCompaniesLoading(true);
    setCompaniesError("");
    try {
      const res = await api.get("/company/getAllCompanies");
      setCompanies(res.data.data || []);
    } catch (error) {
      setCompaniesError(error.response?.data?.message || "Failed to load companies.");
    } finally {
      setCompaniesLoading(false);
    }
  }

  async function fetchAccounts(companyId) {
    setAccountsLoading(true);
    setAccountsError("");
    try {
      const res = await api.get(`/social-accounts/getSocialAccounts/${companyId}`);
      setAccounts(res.data.data || []);
    } catch (error) {
      setAccountsError(error.response?.data?.message || "Failed to load social accounts.");
    } finally {
      setAccountsLoading(false);
    }
  }

  function handleCompanyChange(event) {
    setSelectedCompanyId(event.target.value);
    setFormError("");
    setStatusMessage("");
    setStatusDetail("");
  }

  function toggleAccount(accountId) {
    setSelectedAccountIds((prev) => (prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]));
    setFormError("");
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setSelectedFile(null);
      setFilePreviewUrl("");
      return;
    }

    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);

    setSelectedFile(file);
    setFilePreviewUrl(URL.createObjectURL(file));
    setFormError("");
    setStatusMessage("");
    setStatusDetail("");
  }

  function handleReset() {
    setSelectedCompanyId("");
    setAccounts([]);
    setSelectedAccountIds([]);
    setSelectedFile(null);
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setFilePreviewUrl("");
    setCaption("");
    setYoutubeTitle("");
    setYoutubePrivacy("public");
    setYoutubeTags("");
    setFormError("");
    setStatusMessage("");
    setStatusDetail("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  /**
   * Returns a valid YouTube access token for this account, refreshing it
   * first via /social-accounts/youtube/refresh-token if it's expired or
   * about to expire. Falls back to the stored token if refresh fails —
   * the upload call itself will then surface any auth error.
   */
  async function getFreshYoutubeAccessToken(account) {
    const expiry = account.tokenExpiry ? new Date(account.tokenExpiry).getTime() : null;
    const needsRefresh = !expiry || expiry - Date.now() <= YOUTUBE_TOKEN_REFRESH_BUFFER_MS;

    if (!needsRefresh) return account.accessToken;

    try {
      const res = await api.post(YOUTUBE_REFRESH_ROUTE, { companyId: selectedCompanyId });
      return res.data?.accessToken || account.accessToken;
    } catch (error) {
      console.warn("YouTube token refresh failed, using stored token instead.", error);
      return account.accessToken;
    }
  }

  /** Publishes the uploaded video to YouTube via /social-accounts/youtube/upload. */
  async function postToYoutube(account, mediaSource) {
    const accessToken = await getFreshYoutubeAccessToken(account);
    const tagsArray = youtubeTags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    await api.post(YOUTUBE_UPLOAD_ROUTE, {
      accessToken,
      title: youtubeTitle,
      description: caption,
      tags: tagsArray,
      privacyStatus: youtubePrivacy,
      videoUrl: mediaSource.mediaUrl,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedCompanyId) {
      setFormError("Select a company first.");
      return;
    }

    if (!selectedAccounts.length) {
      setFormError("Select at least one social account.");
      return;
    }

    if (!selectedFile) {
      setFormError("Upload a media file to continue.");
      return;
    }

    if (hasYoutubeSelection && !youtubeTitle.trim()) {
      setFormError("Add a YouTube title for this video.");
      return;
    }

    const currentMediaType = getMediaType(selectedFile) || "image";
    const companyName = selectedCompany?.companyName || "social automation";
    const tags = buildTags({
      caption,
      companyName,
      selectedAccounts,
      mediaType: currentMediaType,
    });

    if (!tags) {
      setFormError("Unable to build tags for media upload.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    setStatusMessage("");
    setStatusTone("info");
    setStatusDetail("");

    try {
      const instagramSelected = selectedAccounts.some((account) => account.platform === "instagram");
      const youtubeSelected = selectedAccounts.some((account) => account.platform === "youtube");
      const linkedinSelected = selectedAccounts.some((account) => account.platform === "linkedin");

      setStatusMessage(
        currentMediaType === "video" ? "Compressing video before upload..." : "Preparing image for upload..."
      );
      setStatusDetail(
        currentMediaType === "video"
          ? "This page compresses the video before uploading to keep publishing faster and more reliable."
          : "Images are uploaded directly without compression."
      );

      let uploadFile = selectedFile;
      if (currentMediaType === "video") {
        try {
          uploadFile = await compressVideo(selectedFile);
          setStatusMessage("Video compressed. Uploading to Cloudinary and saving to the database...");
          setStatusDetail("Large videos take longer because of file size, resolution, and Meta server load. That is normal.");
        } catch (compressionError) {
          setStatusMessage("Video compression is not available here. Uploading the original file instead...");
          setStatusDetail("Compression is best effort in the browser.");
          uploadFile = selectedFile;
        }
      }

      const formData = new FormData();
      formData.append("companyId", selectedCompanyId);
      formData.append("tags", tags);
      formData.append("media", uploadFile);

      const uploadResponse = await api.post("/media/upload", formData);
      const mediaSource = uploadResponse.data?.uploadedFiles?.[0] || null;

      if (!mediaSource) {
        throw new Error("Media was uploaded, but no media record was returned.");
      }

      const supportedAccounts = selectedAccounts.filter((account) => isPlatformSupported(account.platform));
      const unsupportedAccounts = selectedAccounts.filter((account) => !isPlatformSupported(account.platform));
      const postTargetField = mediaSource.mediaType === "video" ? "video" : "image";

      if (supportedAccounts.length === 0) {
        setStatusTone("error");
        setFormError("Selected social accounts are not wired for posting yet.");
        setStatusMessage("No supported posting target was selected.");
        return;
      }

      setStatusMessage(
        mediaSource.mediaType === "video"
          ? "Upload complete. Publishing the video to connected accounts..."
          : "Upload complete. Publishing the image to connected accounts..."
      );
      setStatusDetail(
        instagramSelected && mediaSource.mediaType === "video"
          ? "Instagram video processing can take 30-90 seconds or longer. 70 seconds is completely normal."
          : instagramSelected
            ? "Instagram image publishing can still take a moment depending on Meta server load."
            : youtubeSelected && mediaSource.mediaType === "video"
              ? "YouTube uploads run through Google's servers and can take a minute or more depending on video length."
              : linkedinSelected && mediaSource.mediaType === "video"
                ? "LinkedIn waits for the video to finish processing before publishing — this can take up to a minute."
                : "Publishing is running now."
      );

      let postedCount = 0;
      for (const account of supportedAccounts) {
        if (account.platform === "youtube") {
          await postToYoutube(account, mediaSource);
          postedCount += 1;
          continue;
        }

        const routeInfo = POST_ROUTE_MAP[account.platform];
        const payload = {
          accessToken: account.accessToken,
          caption,
        };

        // LinkedIn has no accountIdKey — its API derives the author
        // from the access token, so nothing else needs to be sent.
        if (routeInfo.accountIdKey) {
          payload[routeInfo.accountIdKey] = account.pageId;
        }

        if (mediaSource.mediaType === "video") {
          payload.videoUrl = mediaSource.mediaUrl;
        } else {
          payload.imageUrl = mediaSource.mediaUrl;
        }

        await api.post(routeInfo[postTargetField], payload);
        postedCount += 1;
      }

      const unsupportedMessage =
        unsupportedAccounts.length > 0
          ? ` ${unsupportedAccounts.map((account) => account.platform).join(", ")} are not wired for posting yet.`
          : "";

      setStatusTone("success");
      setStatusMessage(
        mediaSource
          ? `Media is ready and posted to ${postedCount} account${postedCount === 1 ? "" : "s"}.${unsupportedMessage}`
          : `Media upload and posting completed.${unsupportedMessage}`
      );
      setStatusDetail(
        mediaSource.mediaType === "video" && instagramSelected
          ? "Processing time depends on video duration, file size, Meta server load, and resolution. 70 seconds is completely normal."
          : mediaSource.mediaType === "video" && youtubeSelected
            ? "YouTube shows the video as 'processing' for a short while after upload — that's expected."
            : ""
      );
    } catch (error) {
      setStatusTone("error");
      setFormError(error.response?.data?.message || error.message || "Failed to submit manual post.");
      setStatusMessage("Media upload or posting failed.");
      setStatusDetail("");
    } finally {
      setSubmitting(false);
    }
  }

  const previewKind = mediaType || "";
  const hasMessage = Boolean(formError || statusMessage);
  const messageTone = formError ? "error" : statusTone;

  return (
    <Sidebar>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
          {/* Hero */}
          <div className="mb-6 flex flex-col gap-5 rounded-3xl border border-gray-200 bg-white px-5 py-6 shadow-sm sm:px-6 sm:py-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 ring-1 ring-indigo-100">
                <i className="fa-solid fa-pen-to-square"></i>
                Manual Posting Workflow
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Publish media with company-aware social accounts
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-500 sm:text-base">
                Pick a company, choose connected accounts, select a media item from that company's library or upload a new one, then publish with the right platform route automatically.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 text-center text-sm sm:grid-cols-3 lg:min-w-[360px]">
              <StatPill label="Accounts" value={selectedAccounts.length} />
              <StatPill label="Media" value={previewKind ? previewKind.toUpperCase() : "NONE"} />
              <StatPill label="Queue" value={selectedCompany ? "Ready" : "Pick company"} />
            </div>
          </div>

          {/* Status / error banner — always visible near the top of the page */}
          {hasMessage && (
            <div
              ref={messageRef}
              className={`mb-6 flex items-start justify-between gap-3 rounded-2xl border px-4 py-3.5 text-sm shadow-sm ${
                messageTone === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : messageTone === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-blue-200 bg-blue-50 text-blue-700"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <i
                  className={`fa-solid mt-0.5 ${
                    messageTone === "error"
                      ? "fa-triangle-exclamation"
                      : messageTone === "success"
                        ? "fa-circle-check"
                        : "fa-spinner fa-spin"
                  }`}
                ></i>
                <div>
                  <p className="font-medium">{formError || statusMessage}</p>
                  {!formError && statusDetail && <p className="mt-1 text-xs leading-relaxed opacity-90">{statusDetail}</p>}
                </div>
              </div>
              <button
                type="button"
                onClick={dismissMessage}
                aria-label="Dismiss message"
                className="flex-shrink-0 text-current opacity-60 transition-opacity hover:opacity-100"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
              <SectionTitle
                icon="fa-building"
                title="1. Company and accounts"
                description="Choose the company first, then select the connected social accounts you want to use."
              />

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">Company</label>
                  <div className="relative">
                    <i className="fa-solid fa-building absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <select
                      value={selectedCompanyId}
                      onChange={handleCompanyChange}
                      className="w-full appearance-none rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-10 text-sm text-gray-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    >
                      <option value="">Select company</option>
                      {companies.map((company) => (
                        <option key={company._id} value={company._id}>
                          {company.companyName}
                        </option>
                      ))}
                    </select>
                    <i className="fa-solid fa-chevron-down pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  </div>
                  {companiesLoading && <InlineHint text="Loading companies..." />}
                  {!companiesLoading && companiesError && <InlineError text={companiesError} />}
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Auto-filled from DB</p>
                  <div className="mt-2 space-y-2 text-sm text-gray-700">
                    <KeyValue label="Company" value={selectedCompany?.companyName || "Not selected"} />
                    <KeyValue label="Accounts" value={`${selectedAccounts.length} selected`} />
                    <KeyValue label="Video rule" value={mediaType === "video" ? "YouTube visible" : "YouTube hidden"} />
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <SectionTitle
                    icon="fa-share-nodes"
                    title="2. Select social accounts"
                    description="Each connected account already carries its page ID and access token from the backend."
                  />
                  <span className="inline-flex w-fit items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                    {selectedAccounts.length} selected
                  </span>
                </div>

                {!selectedCompanyId && (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                    Choose a company to load connected social accounts.
                  </div>
                )}

                {selectedCompanyId && accountsLoading && (
                  <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 py-10 text-sm text-gray-500">
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    Loading social accounts...
                  </div>
                )}

                {selectedCompanyId && !accountsLoading && accountsError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">{accountsError}</div>
                )}

                {selectedCompanyId && !accountsLoading && !accountsError && visibleAccounts.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-500">
                    No connected social accounts found for this company.
                  </div>
                )}

                {visibleAccounts.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {visibleAccounts.map((account) => {
                      const meta = getPlatformMeta(account.platform);
                      const selected = selectedAccountIds.includes(account._id);

                      return (
                        <button
                          key={account._id}
                          type="button"
                          onClick={() => toggleAccount(account._id)}
                          className={`group rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                            selected ? `border-transparent ring-2 ${meta.ring}` : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${meta.border} ${selected ? meta.ring : "bg-gray-50 text-gray-500"}`}>
                              <i className={`${meta.icon} text-lg`}></i>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${selected ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                              {selected ? "Selected" : "Tap to select"}
                            </span>
                          </div>

                          <div className="mt-3">
                            <h3 className="text-sm font-semibold text-gray-900">{account.accountName}</h3>
                            <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">{meta.label}</p>
                          </div>

                          <div className="mt-3 space-y-1.5 text-xs text-gray-500">
                            <KeyValue label="Page ID" value={maskValue(account.pageId, 6)} compact />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <SectionTitle
                  icon="fa-photo-film"
                  title="3. Upload media"
                  description="Upload a new image or video file. Videos are compressed before upload when possible."
                />

                <div className="mt-5 rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-4">
                  <label className="mb-2 block text-sm font-semibold text-gray-800">Image or video</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="block w-full cursor-pointer rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 file:mr-4 file:rounded-xl file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-700"
                  />

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <InfoCard label="Media type" value={previewKind ? previewKind.toUpperCase() : "Not selected"} />
                    <InfoCard label="File size" value={selectedFile ? formatFileSize(selectedFile.size) : "—"} />
                  </div>

                  {mediaType === "video" && (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        Video posts are compressed before upload when a new file is selected.
                    </div>
                  )}
                </div>

                <div className="mt-5 rounded-3xl border border-gray-200 bg-white">
                  <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-800">Selected media preview</div>
                  <div className="flex min-h-[240px] items-center justify-center bg-gray-50 p-4">
                    {!previewUrl && (
                      <div className="text-center text-sm text-gray-400">
                        <i className="fa-regular fa-image mb-2 block text-3xl"></i>
                        Pick a file to preview it here.
                      </div>
                    )}

                    {previewUrl && mediaType === "image" && (
                      <img src={previewUrl} alt="Selected media preview" className="max-h-[300px] w-full rounded-2xl object-contain" />
                    )}

                    {previewUrl && mediaType === "video" && (
                      <video src={previewUrl} controls className="max-h-[300px] w-full rounded-2xl bg-black object-contain" />
                    )}
                  </div>
                </div>
              </div>

              {mediaType === "video" && (
                <div>
                  <SectionTitle
                    icon="fa-youtube"
                    title={`${youtubeStepNumber}. YouTube selection`}
                    description="Visible only for video content so the workflow stays focused on the required platform."
                  />

                  {visibleAccounts.some((account) => account.platform === "youtube") ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {visibleAccounts
                        .filter((account) => account.platform === "youtube")
                        .map((account) => {
                          const meta = getPlatformMeta(account.platform);
                          const selected = selectedAccountIds.includes(account._id);

                          return (
                            <button
                              key={account._id}
                              type="button"
                              onClick={() => toggleAccount(account._id)}
                              className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                                selected ? `border-transparent ring-2 ${meta.ring}` : "border-gray-200 bg-white"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${meta.border} ${selected ? meta.ring : "bg-gray-50 text-gray-500"}`}>
                                  <i className={`${meta.icon} text-lg`}></i>
                                </div>
                                <div>
                                  <h3 className="text-sm font-semibold text-gray-900">{account.accountName}</h3>
                                  <p className="text-xs text-gray-500">{meta.label}</p>
                                </div>
                              </div>
                              <div className="mt-3 text-xs text-gray-500">
                                <KeyValue label="Page ID" value={maskValue(account.pageId, 6)} compact />
                                <KeyValue
                                  label="Token expiry"
                                  value={account.tokenExpiry ? new Date(account.tokenExpiry).toLocaleDateString() : "—"}
                                  compact
                                />
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                      No YouTube account is connected for this company.
                    </div>
                  )}

                  {hasYoutubeSelection && (
                    <div className="mt-4 space-y-4 rounded-2xl border border-red-100 bg-red-50/40 p-4">
                      <p className="flex items-center gap-2 text-sm font-semibold text-red-700">
                        <i className="fa-brands fa-youtube"></i>
                        YouTube video details
                      </p>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Video Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={youtubeTitle}
                          onChange={(event) => setYoutubeTitle(event.target.value)}
                          placeholder="e.g. Behind the scenes at our studio"
                          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
                        />
                        <p className="mt-1 text-xs text-gray-400">
                          Required by YouTube — the caption below is used as the video description.
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-gray-700">Privacy</label>
                          <select
                            value={youtubePrivacy}
                            onChange={(event) => setYoutubePrivacy(event.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
                          >
                            <option value="public">Public</option>
                            <option value="unlisted">Unlisted</option>
                            <option value="private">Private</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-gray-700">Video Tags</label>
                          <input
                            type="text"
                            value={youtubeTags}
                            onChange={(event) => setYoutubeTags(event.target.value)}
                            placeholder="marketing, launch, demo"
                            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
                          />
                          <p className="mt-1 text-xs text-gray-400">Comma-separated, optional.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <SectionTitle
                  icon="fa-comment-dots"
                  title={`${captionStepNumber}. Caption`}
                  description="Write or refine the caption before uploading and publishing."
                />

                <textarea
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  rows={5}
                  placeholder="Write your caption, hashtags, or posting notes..."
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
                {hasYoutubeSelection && (
                  <p className="mt-1.5 text-xs text-gray-400">
                    This same text is also used as the YouTube video description.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 rounded-2xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-700">Selected accounts:</span>{" "}
                  {selectedAccounts.map((account) => getPlatformMeta(account.platform).label).join(", ") || "None"}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:w-auto"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    {submitting ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-cloud-arrow-up mr-2"></i>
                        Save media and publish
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <SectionTitle
                  icon="fa-list-check"
                  title="Live summary"
                  description="This panel reflects the exact data that will be sent to the backend."
                />

                <div className="space-y-3 text-sm text-gray-600">
                  <KeyValue label="Company" value={selectedCompany?.companyName || "Not selected"} />
                  <KeyValue label="Accounts" value={selectedAccounts.length ? `${selectedAccounts.length} selected` : "None"} />
                  <KeyValue label="Media" value={previewKind ? previewKind.toUpperCase() : "Not selected"} />
                  <KeyValue label="YouTube" value={mediaType === "video" ? (hasYoutubeSelection ? "Included" : "Optional") : "Hidden"} />
                  {hasYoutubeSelection && (
                    <KeyValue label="YouTube title" value={youtubeTitle || "Not set"} />
                  )}
                </div>

                <div className="mt-5 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900">Posting setup</p>
                  <div className="mt-2 space-y-2">
                    <KeyValue label="Selected file" value={selectedFile?.name || "None"} />
                    <KeyValue label="Media source" value={selectedFile ? "Upload" : "None"} />
                    <KeyValue label="Media type" value={previewKind ? previewKind.toUpperCase() : "None"} />
                  </div>
                </div>
              </div>

              {mediaType === "video" && (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm sm:p-6">
                  <p className="font-semibold">Video processing note</p>
                  <p className="mt-2 leading-relaxed text-amber-900/90">
                    Instagram video publishing can take time. This depends on video duration, file size, Meta server load, and resolution. Small images usually take 1–5 seconds, 10-second MP4 files often take 10–30 seconds, 30–60 second reels can take 30–90 seconds, and large videos can take 1–3 minutes. So 70 seconds is completely normal.
                  </p>
                  {hasYoutubeSelection && (
                    <p className="mt-3 leading-relaxed text-amber-900/90">
                      For YouTube, the access token is checked before upload and refreshed automatically via the stored refresh token if it's close to expiring — no manual reconnect needed.
                    </p>
                  )}
                  {hasLinkedinSelection && (
                    <p className="mt-3 leading-relaxed text-amber-900/90">
                      For LinkedIn, the server waits for the video to finish processing before creating the post, so the publish step can take up to about a minute by itself.
                    </p>
                  )}
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}

function SectionTitle({ icon, title, description }) {
  return (
    <div className="mb-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <i className={`fa-solid ${icon}`}></i>
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="rounded-2xl bg-gray-50 px-4 py-3 ring-1 ring-gray-100">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-base font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function KeyValue({ label, value, compact = false }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${compact ? "text-xs" : "text-sm"}`}>
      <span className="text-gray-500">{label}</span>
      <span className="max-w-[65%] truncate font-medium text-gray-800">{value}</span>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-gray-100">
      <div className="text-xs uppercase tracking-wide text-gray-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function InlineHint({ text }) {
  return <p className="mt-2 text-xs text-gray-500">{text}</p>;
}

function InlineError({ text }) {
  return <p className="mt-2 text-xs text-red-600">{text}</p>;
}

export default ManualPosting;