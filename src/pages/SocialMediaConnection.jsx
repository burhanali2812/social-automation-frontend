import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
/**
 * ---------------------------------------------------------------
 * Mock data — replace with real API calls (Axios) when wiring up
 * the backend. Left inline here since this is a self-contained,
 * single-file version of the page.
 * ---------------------------------------------------------------
 */
const COMPANIES = [
  { id: "cmp_azytrosys", name: "Azytrosys" },
  { id: "cmp_etrip", name: "E-Trip & Welfare Organization" },
];

const PLATFORMS = [
  { id: "facebook", name: "Facebook", icon: "fa-brands fa-facebook", color: "#1877F2" },
  { id: "instagram", name: "Instagram", icon: "fa-brands fa-instagram", color: "#E1306C" },
  { id: "linkedin", name: "LinkedIn", icon: "fa-brands fa-linkedin", color: "#0A66C2" },
  { id: "twitter", name: "X (Twitter)", icon: "fa-brands fa-x-twitter", color: "#0F1419" },
  { id: "youtube", name: "YouTube", icon: "fa-brands fa-youtube", color: "#FF0000" },
];

const STATUS_STYLES = {
  connected: { label: "Connected", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  expiring: { label: "Expiring Soon", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  expired: { label: "Expired", dot: "bg-red-500", badge: "bg-red-50 text-red-700 ring-red-600/20" },
};

// Seed a couple of already-connected accounts per company so the page
// isn't empty on first render. Remove once wired to a real backend.
const INITIAL_ACCOUNTS = {
  cmp_azytrosys: {
    facebook: { appId: "1029384756123", accessToken: "EAABsbCS1iHgBAO9ZC8xj7ZBk9x1qLzP", status: "connected", connectedSince: "2025-11-02" },
    instagram: { appId: "4478291056", accessToken: "IGQWRPa1FQb2dRZAExYYUdOUUxT", status: "expiring", connectedSince: "2025-09-14" },
  },
  cmp_etrip: {
    linkedin: { appId: "86p1x9a7z0kd21", accessToken: "AQXn3z8vLp2QwErTyUiOpAsDfGhJk", status: "connected", connectedSince: "2025-12-01" },
  },
};

/** Masks a token, showing only the last 4 characters. */
const maskToken = (token) => `${"•".repeat(Math.max(token.length - 4, 4))}${token.slice(-4)}`;

const StatusBadge = ({ status }) => {
  const config = STATUS_STYLES[status] ?? STATUS_STYLES.connected;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${config.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

/**
 * `initialCompanyId` lets a parent route/navigation pass the company
 * along (e.g. <SocialMediaConnection initialCompanyId={location.state?.companyId} />).
 * If provided, the company-selection step is skipped entirely.
 */
function SocialMediaConnection({ initialCompanyId = null }) {
  const [selectedCompanyId, setSelectedCompanyId] = useState(initialCompanyId);
  const [accountsByCompany, setAccountsByCompany] = useState(INITIAL_ACCOUNTS);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState("select-platform"); // 'select-platform' | 'enter-credentials'
  const [platformDraft, setPlatformDraft] = useState(null);
  const [formValues, setFormValues] = useState({ appId: "", accessToken: "" });
  const [formErrors, setFormErrors] = useState({});
  const [showTokenInForm, setShowTokenInForm] = useState(false);

  const [revealedTokens, setRevealedTokens] = useState({});
  const [copiedPlatformId, setCopiedPlatformId] = useState(null);

  const selectedCompany = useMemo(
    () => COMPANIES.find((c) => c.id === selectedCompanyId) ?? null,
    [selectedCompanyId]
  );

  const connectedAccounts = accountsByCompany[selectedCompanyId] ?? {};
  const connectedPlatformIds = Object.keys(connectedAccounts);
  const allPlatformsConnected = connectedPlatformIds.length === PLATFORMS.length;

  useEffect(() => {
    if (copiedPlatformId) {
      const timeout = setTimeout(() => setCopiedPlatformId(null), 1500);
      return () => clearTimeout(timeout);
    }
  }, [copiedPlatformId]);

  const openAddModal = () => {
    setPlatformDraft(null);
    setFormValues({ appId: "", accessToken: "" });
    setFormErrors({});
    setShowTokenInForm(false);
    setModalStep("select-platform");
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handlePickPlatform = (platform) => {
    if (connectedAccounts[platform.id]) return; // already connected — disabled
    setPlatformDraft(platform);
    setModalStep("enter-credentials");
  };

  const handleFormChange = (field) => (event) => {
    setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formValues.appId.trim()) errors.appId = "App ID is required.";
    if (!formValues.accessToken.trim()) errors.accessToken = "Access Token is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitCredentials = (event) => {
    event.preventDefault();
    if (!validateForm() || !platformDraft) return;

    // TODO: replace with an Axios POST to /api/social/:platform/connect/:companyId
    setAccountsByCompany((prev) => ({
      ...prev,
      [selectedCompanyId]: {
        ...prev[selectedCompanyId],
        [platformDraft.id]: {
          appId: formValues.appId.trim(),
          accessToken: formValues.accessToken.trim(),
          status: "connected",
          connectedSince: new Date().toISOString().slice(0, 10),
        },
      },
    }));

    closeModal();
  };

  const handleRemoveAccount = (platformId, platformName) => {
    const confirmed = window.confirm(`Disconnect ${platformName}? This will stop scheduled posts for this account.`);
    if (!confirmed) return;

    // TODO: replace with an Axios DELETE to /api/social/:platform/disconnect/:companyId
    setAccountsByCompany((prev) => {
      const next = { ...prev[selectedCompanyId] };
      delete next[platformId];
      return { ...prev, [selectedCompanyId]: next };
    });
  };

  const handleCopyToken = async (platformId, token) => {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedPlatformId(platformId);
    } catch {
      // Clipboard API may be unavailable (e.g. insecure context) — fail silently.
    }
  };

  /** ---------------------- Step 1: choose a company ---------------------- */
  if (!selectedCompany) {
    return (
   <Sidebar>
       <div className="flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
            <i className="fa-solid fa-building text-xl text-indigo-600" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-center text-xl font-semibold text-slate-900">
            Select a Company
          </h1>
          <p className="mt-1 text-center text-sm text-slate-500">
            Choose which company's social media accounts you'd like to manage.
          </p>

          <div className="mt-6 space-y-3">
            {COMPANIES.map((company) => (
              <button
                key={company.id}
                type="button"
                onClick={() => setSelectedCompanyId(company.id)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3.5 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-600">
                    {company.name.charAt(0)}
                  </span>
                  <span className="text-sm font-medium text-slate-800">{company.name}</span>
                </span>
                <i className="fa-solid fa-chevron-right text-xs text-slate-400" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </div>
   </Sidebar>
    );
  }

  /** ---------------------- Step 2: accounts dashboard ---------------------- */
  return (
  <Sidebar>
      <div className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>{selectedCompany.name}</span>
              <button
                type="button"
                onClick={() => setSelectedCompanyId(null)}
                className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Change
              </button>
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              Social Media Accounts
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Connect and manage social media accounts for this company.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            disabled={allPlatformsConnected}
            title={allPlatformsConnected ? "All platforms are already connected" : undefined}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <i className="fa-solid fa-plus" aria-hidden="true" />
            Add New Social Account
          </button>
        </div>

        {/* Accounts grid / empty state */}
        {connectedPlatformIds.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
              <i className="fa-solid fa-link text-xl text-indigo-500" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">No social accounts connected</h3>
            <p className="mt-1.5 max-w-sm text-sm text-slate-500">
              Click "Add New Social Account" to connect Facebook, Instagram, LinkedIn, X, or YouTube.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {connectedPlatformIds.map((platformId) => {
              const platform = PLATFORMS.find((p) => p.id === platformId);
              const account = connectedAccounts[platformId];
              const isRevealed = Boolean(revealedTokens[platformId]);

              return (
                <article
                  key={platformId}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <header className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--pc)]/10"
                        style={{ "--pc": platform.color }}
                      >
                        <i className={`${platform.icon} text-lg text-[var(--pc)]`} style={{ "--pc": platform.color }} aria-hidden="true" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">{platform.name}</h3>
                    </div>
                    <StatusBadge status={account.status} />
                  </header>

                  <dl className="mt-5 flex-1 space-y-3 text-sm">
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">App ID</dt>
                      <dd className="mt-0.5 truncate font-mono text-slate-700">{account.appId}</dd>
                    </div>

                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Access Token</dt>
                      <dd className="mt-0.5 flex items-center gap-2">
                        <span className="truncate font-mono text-slate-700">
                          {isRevealed ? account.accessToken : maskToken(account.accessToken)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setRevealedTokens((prev) => ({ ...prev, [platformId]: !prev[platformId] }))
                          }
                          className="flex-shrink-0 text-slate-400 hover:text-slate-600"
                          aria-label={isRevealed ? "Hide access token" : "Show access token"}
                        >
                          <i className={`fa-solid ${isRevealed ? "fa-eye-slash" : "fa-eye"} text-xs`} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyToken(platformId, account.accessToken)}
                          className="flex-shrink-0 text-slate-400 hover:text-slate-600"
                          aria-label="Copy access token"
                        >
                          <i className={`fa-solid ${copiedPlatformId === platformId ? "fa-check text-emerald-500" : "fa-copy"} text-xs`} aria-hidden="true" />
                        </button>
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Connected Since</dt>
                      <dd className="mt-0.5 text-slate-700">{account.connectedSince}</dd>
                    </div>
                  </dl>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => handleRemoveAccount(platformId, platform.name)}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                    >
                      Disconnect
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Social Account modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={closeModal} aria-hidden="true" />

          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                {modalStep === "select-platform" ? "Choose a Platform" : `Connect ${platformDraft?.name}`}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>

            {modalStep === "select-platform" ? (
              <>
                <p className="mt-1 text-sm text-slate-500">
                  Already-connected platforms are disabled below.
                </p>
                <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {PLATFORMS.map((platform) => {
                    const isConnected = Boolean(connectedAccounts[platform.id]);
                    return (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => handlePickPlatform(platform)}
                        disabled={isConnected}
                        className={`relative flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border p-2 transition-colors ${
                          isConnected
                            ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-50"
                            : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        }`}
                      >
                        {isConnected && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                            <i className="fa-solid fa-check text-[10px]" aria-hidden="true" />
                          </span>
                        )}
                        <i
                          className={`${platform.icon} text-xl`}
                          style={{ color: isConnected ? "#94a3b8" : platform.color }}
                          aria-hidden="true"
                        />
                        <span className="text-[11px] font-medium leading-tight text-slate-600 text-center">
                          {platform.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmitCredentials} className="mt-5 space-y-4">
                <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                  <i
                    className={`${platformDraft.icon} text-lg`}
                    style={{ color: platformDraft.color }}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-slate-700">{platformDraft.name}</span>
                  <button
                    type="button"
                    onClick={() => setModalStep("select-platform")}
                    className="ml-auto text-xs font-medium text-indigo-600 hover:underline"
                  >
                    Change
                  </button>
                </div>

                <div>
                  <label htmlFor="appId" className="mb-1.5 block text-sm font-medium text-slate-700">
                    App ID
                  </label>
                  <input
                    id="appId"
                    type="text"
                    value={formValues.appId}
                    onChange={handleFormChange("appId")}
                    placeholder="e.g. 1029384756123"
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                      formErrors.appId ? "border-red-300 focus:ring-red-500" : "border-slate-300 focus:ring-indigo-500"
                    }`}
                  />
                  {formErrors.appId && <p className="mt-1 text-xs text-red-600">{formErrors.appId}</p>}
                </div>

                <div>
                  <label htmlFor="accessToken" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Access Token
                  </label>
                  <div className="relative">
                    <input
                      id="accessToken"
                      type={showTokenInForm ? "text" : "password"}
                      value={formValues.accessToken}
                      onChange={handleFormChange("accessToken")}
                      placeholder="Paste access token"
                      className={`w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                        formErrors.accessToken ? "border-red-300 focus:ring-red-500" : "border-slate-300 focus:ring-indigo-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowTokenInForm((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      aria-label={showTokenInForm ? "Hide token" : "Show token"}
                    >
                      <i className={`fa-solid ${showTokenInForm ? "fa-eye-slash" : "fa-eye"} text-xs`} aria-hidden="true" />
                    </button>
                  </div>
                  {formErrors.accessToken && <p className="mt-1 text-xs text-red-600">{formErrors.accessToken}</p>}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                  >
                    Connect Account
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  </Sidebar>
  );
}

export default SocialMediaConnection;