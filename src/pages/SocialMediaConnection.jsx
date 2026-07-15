import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";

const PLATFORMS = [
  { id: "facebook", name: "Facebook", icon: "fa-brands fa-facebook", color: "#1877F2" },
  { id: "instagram", name: "Instagram", icon: "fa-brands fa-instagram", color: "#E1306C" },
  { id: "linkedin", name: "LinkedIn", icon: "fa-brands fa-linkedin", color: "#0A66C2" },
  { id: "twitter", name: "X (Twitter)", icon: "fa-brands fa-x-twitter", color: "#0F1419" },
  { id: "youtube", name: "YouTube", icon: "fa-brands fa-youtube", color: "#FF0000" },
];

const EXPIRING_SOON_DAYS = 10;

const STATUS_STYLES = {
  active: { label: "Active", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  expiring: { label: "Expiring Soon", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  expired: { label: "Expired", dot: "bg-red-500", badge: "bg-red-50 text-red-700 ring-red-600/20" },
  inactive: { label: "Inactive", dot: "bg-slate-400", badge: "bg-slate-50 text-slate-600 ring-slate-500/20" },
};

function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const diffMs = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function getAccountStatus(account) {
  if (!account.isActive) return "inactive";
  const daysLeft = getDaysUntil(account.tokenExpiry);
  if (daysLeft === null) return "active";
  if (daysLeft < 0) return "expired";
  if (daysLeft <= EXPIRING_SOON_DAYS) return "expiring";
  return "active";
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function toDateInputValue(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function maskToken(token) {
  if (!token) return "—";
  return `${"•".repeat(Math.max(token.length - 4, 4))}${token.slice(-4)}`;
}

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.active;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${style.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

function SocialMediaConnection() {
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState("");

  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState("select-platform"); // 'select-platform' | 'enter-details'
  const [platformDraft, setPlatformDraft] = useState(null);
  const [form, setForm] = useState({ accountName: "", pageId: "", accessToken: "", tokenExpiry: "" });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [disconnectTarget, setDisconnectTarget] = useState(null); // account object | null
  const [disconnecting, setDisconnecting] = useState(false);

  // Edit account details — accountName, accessToken, tokenExpiry (matches PUT /updateSocialAccount/:id)
  const [editTarget, setEditTarget] = useState(null); // account object | null
  const [editForm, setEditForm] = useState({ accountName: "", accessToken: "", tokenExpiry: "" , pageId: ""});
  const [editErrors, setEditErrors] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  // Token reveal/copy — gated behind an admin password check
  const [revealedTokens, setRevealedTokens] = useState({}); // { [accountId]: true }
  const [pendingTokenAction, setPendingTokenAction] = useState(null); // { accountId, action: 'reveal' | 'copy' } | null
  const [passwordInput, setPasswordInput] = useState("");
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const selectedCompany = companies.find((c) => c._id === selectedCompanyId) || null;
  const connectedPlatformIds = accounts.map((a) => a.platform);
  const allPlatformsConnected = connectedPlatformIds.length === PLATFORMS.length;
  const token = localStorage.getItem("token"); // Assuming the token is stored in localStorage after login

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompanyId) fetchAccounts(selectedCompanyId);
  }, [selectedCompanyId]);

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

  async function fetchAccounts(companyId) {
    setAccountsLoading(true);
    setAccountsError("");
    try {
      const res = await api.get(`/social-accounts/getSocialAccounts/${companyId}`);
      setAccounts(res.data.data || []);
    } catch (err) {
      setAccountsError(err.response?.data?.message || "Failed to load social accounts.");
    } finally {
      setAccountsLoading(false);
    }
  }

  function openAddModal() {
    setPlatformDraft(null);
    setForm({ accountName: "", pageId: "", accessToken: "", tokenExpiry: "" });
    setFormErrors({});
    setModalStep("select-platform");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  function pickPlatform(platform) {
    if (connectedPlatformIds.includes(platform.id)) return;
    setPlatformDraft(platform);
    setModalStep("enter-details");
  }

  function handleFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validateForm() {
    const errors = {};
    if (!form.accountName.trim()) errors.accountName = "Account name is required.";
    if (!form.pageId.trim()) errors.pageId = "Page ID is required.";
    if (!form.accessToken.trim()) errors.accessToken = "Access token is required.";
    if (!form.tokenExpiry) errors.tokenExpiry = "Token expiry date is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleConnectSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      await api.post("/social-accounts/addSocialAccount", {
        companyId: selectedCompanyId,
        platform: platformDraft.id,
        accountName: form.accountName.trim(),
        pageId: form.pageId.trim(),
        accessToken: form.accessToken.trim(),
        tokenExpiry: form.tokenExpiry,
      });
      closeModal();
      fetchAccounts(selectedCompanyId);
    } catch (err) {
      setFormErrors({ submit: err.response?.data?.message || "Failed to connect account." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnectConfirm() {
    if (!disconnectTarget) return;
    setDisconnecting(true);
    try {
      await api.delete(`/social-accounts/deleteSocialAccount/${disconnectTarget._id}`);
      setDisconnectTarget(null);
      fetchAccounts(selectedCompanyId);
    } catch (err) {
      setAccountsError(err.response?.data?.message || "Failed to disconnect account.");
      setDisconnectTarget(null);
    } finally {
      setDisconnecting(false);
    }
  }

  function openEditModal(account) {
    setEditTarget(account);
    setEditForm({
      accountName: account.accountName || "",
      pageId: account.pageId || "",
      accessToken: "",
      tokenExpiry: toDateInputValue(account.tokenExpiry),
    });
    setEditErrors({});
  }

  function closeEditModal() {
    if (editSaving) return;
    setEditTarget(null);
  }

  function handleEditFormChange(field, value) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    setEditErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validateEditForm() {
    const errors = {};
    if (!editForm.accountName.trim()) errors.accountName = "Account name is required.";
    if (!editForm.pageId.trim()) errors.pageId = "Page ID is required.";
    if (!editForm.tokenExpiry) errors.tokenExpiry = "Token expiry date is required.";
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!editTarget || !validateEditForm()) return;

    setEditSaving(true);
    try {
      const payload = {
        accountName: editForm.accountName.trim(),
        pageId: editForm.pageId.trim(),
        tokenExpiry: editForm.tokenExpiry,
      };
      // Only send accessToken if the admin actually typed a new one —
      // otherwise leave the existing (hashed) token untouched.
      if (editForm.accessToken.trim()) {
        payload.accessToken = editForm.accessToken.trim();
      }

      const res = await api.put(`/social-accounts/updateSocialAccount/${editTarget._id}`, payload);
      const updated = res.data.data;
      setAccounts((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
      setEditTarget(null);
    } catch (err) {
      setEditErrors({ submit: err.response?.data?.message || "Failed to update account." });
    } finally {
      setEditSaving(false);
    }
  }

  function requestTokenAction(account, action) {
    if (revealedTokens[account._id]) {
      if (action === "copy") copyToken(account._id, account.accessToken);
      else hideToken(account._id);
      return;
    }
    setPendingTokenAction({ accountId: account._id, action });
    setPasswordInput("");
    setVerifyError("");
  }

  function hideToken(accountId) {
    setRevealedTokens((prev) => {
      const next = { ...prev };
      delete next[accountId];
      return next;
    });
  }

  async function copyToken(accountId, token) {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedId(accountId);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Clipboard API may be unavailable (e.g. insecure context) — fail silently.
    }
  }

  function cancelPasswordCheck() {
    setPendingTokenAction(null);
    setPasswordInput("");
    setVerifyError("");
  }

  async function handleVerifyPassword(e) {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setVerifyError("Password is required.");
      return;
    }

    setVerifyingPassword(true);
    setVerifyError("");
    try {
      // Re-checks the logged-in admin's own password before exposing a token.
      // Adjust the endpoint below to whatever your auth API exposes for this.
      await api.post("/user/verify-password", { password: passwordInput , email : token ? JSON.parse(atob(token.split('.')[1])).email : ""}); // Assuming the token is a JWT and contains the email in its payload

      const { accountId, action } = pendingTokenAction;
      setRevealedTokens((prev) => ({ ...prev, [accountId]: true }));

      if (action === "copy") {
        const account = accounts.find((a) => a._id === accountId);
        if (account) copyToken(accountId, account.accessToken);
      }

      setPendingTokenAction(null);
      setPasswordInput("");
    } catch (err) {
      setVerifyError(err.response?.data?.message || "Incorrect password.");
    } finally {
      setVerifyingPassword(false);
    }
  }

  /* ---------------- Step 1: choose a company ---------------- */
  if (!selectedCompany) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center bg-slate-50 px-4 py-12">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
              <i className="fa-solid fa-building text-xl text-indigo-600" />
            </div>
            <h1 className="mt-4 text-center text-xl font-semibold text-slate-900">Select a Company</h1>
            <p className="mt-1 text-center text-sm text-slate-500">
              Choose which company's social media accounts you'd like to manage.
            </p>

            {companiesLoading && (
              <p className="mt-6 text-center text-sm text-slate-400">
                <i className="fa-solid fa-spinner fa-spin mr-2" />Loading companies...
              </p>
            )}

            {!companiesLoading && companiesError && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
                <p className="text-sm text-red-600">{companiesError}</p>
                <button onClick={fetchCompanies} className="mt-2 text-sm font-medium text-red-700 hover:underline">
                  Retry
                </button>
              </div>
            )}

            {!companiesLoading && !companiesError && companies.length === 0 && (
              <p className="mt-6 text-center text-sm text-slate-400">No companies found.</p>
            )}

            {!companiesLoading && !companiesError && companies.length > 0 && (
              <div className="mt-6 space-y-3">
                {companies.map((company) => (
                  <button
                    key={company._id}
                    type="button"
                    onClick={() => setSelectedCompanyId(company._id)}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3.5 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/50"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-600">
                        {company.companyName.charAt(0)}
                      </span>
                      <span className="text-sm font-medium text-slate-800">{company.companyName}</span>
                    </span>
                    <i className="fa-solid fa-chevron-right text-xs text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Sidebar>
    );
  }

  /* ---------------- Step 2: accounts dashboard ---------------- */
  return (
    <Sidebar>
      <div className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>{selectedCompany.companyName}</span>
                <button
                  type="button"
                  onClick={() => setSelectedCompanyId(null)}
                  className="font-medium text-indigo-600 hover:underline"
                >
                  Change
                </button>
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Social Media Accounts</h1>
              <p className="mt-1 text-sm text-slate-500">Connect and manage social media accounts for this company.</p>
            </div>

            <button
              type="button"
              onClick={openAddModal}
              disabled={allPlatformsConnected}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <i className="fa-solid fa-plus" />
              Add New Social Account
            </button>
          </div>

          {/* Content */}
          {accountsLoading && (
            <div className="flex justify-center py-20 text-slate-400">
              <i className="fa-solid fa-spinner fa-spin text-2xl" />
            </div>
          )}

          {!accountsLoading && accountsError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
              <i className="fa-solid fa-triangle-exclamation mb-2 block text-xl text-red-500" />
              <p className="text-sm text-red-600">{accountsError}</p>
              <button
                onClick={() => fetchAccounts(selectedCompanyId)}
                className="mt-3 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                Retry
              </button>
            </div>
          )}

          {!accountsLoading && !accountsError && accounts.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
                <i className="fa-solid fa-link text-xl text-indigo-500" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">No social accounts connected</h3>
              <p className="mt-1.5 max-w-sm text-sm text-slate-500">
                Click "Add New Social Account" to connect Facebook, Instagram, LinkedIn, X, or YouTube.
              </p>
            </div>
          )}

          {!accountsLoading && !accountsError && accounts.length > 0 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {accounts.map((account) => {
                const platform = PLATFORMS.find((p) => p.id === account.platform);
                const status = getAccountStatus(account);
                const daysLeft = getDaysUntil(account.tokenExpiry);
                const isRevealed = Boolean(revealedTokens[account._id]);

                return (
                  <article
                    key={account._id}
                    className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <header className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${platform.color}1A` }}>
                          <i className={`${platform.icon} text-lg`} style={{ color: platform.color }} />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900">{platform.name}</h3>
                      </div>
                      <StatusBadge status={status} />
                    </header>

                    <dl className="mt-5 flex-1 space-y-3 text-sm">
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Account Name</dt>
                        <dd className="mt-0.5 truncate text-slate-700">{account.accountName}</dd>
                      </div>

                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Page ID</dt>
                        <dd className="mt-0.5 truncate font-mono text-slate-700">{account.pageId}</dd>
                      </div>

                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Access Token</dt>
                        <dd className="mt-0.5 flex items-center gap-2">
                          <span className="truncate font-mono text-slate-700">
                            {isRevealed ? account.accessToken : maskToken(account.accessToken)}
                          </span>
                          <button
                            type="button"
                            onClick={() => requestTokenAction(account, "reveal")}
                            className="flex-shrink-0 text-slate-400 hover:text-slate-600"
                            aria-label={isRevealed ? "Hide access token" : "Show access token"}
                            title={isRevealed ? "Hide token" : "Verify password to view token"}
                          >
                            <i className={`fa-solid ${isRevealed ? "fa-eye-slash" : "fa-eye"} text-xs`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => requestTokenAction(account, "copy")}
                            className="flex-shrink-0 text-slate-400 hover:text-slate-600"
                            aria-label="Copy access token"
                            title={isRevealed ? "Copy token" : "Verify password to copy token"}
                          >
                            <i className={`fa-solid ${copiedId === account._id ? "fa-check text-emerald-500" : "fa-copy"} text-xs`} />
                          </button>
                          {!isRevealed && <i className="fa-solid fa-lock text-[10px] text-slate-300" title="Password verification required" />}
                        </dd>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Created</dt>
                          <dd className="mt-0.5 text-slate-700">{formatDate(account.createdAt)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Token Expiry</dt>
                          <dd className={`mt-0.5 font-medium ${status === "expired" ? "text-red-600" : status === "expiring" ? "text-amber-600" : "text-slate-700"}`}>
                            {formatDate(account.tokenExpiry)}
                          </dd>
                        </div>
                      </div>

                      {status === "expiring" && (
                        <p className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                          <i className="fa-solid fa-triangle-exclamation" />
                          Expires in {daysLeft} day{daysLeft === 1 ? "" : "s"} — refresh the token soon.
                        </p>
                      )}
                      {status === "expired" && (
                        <p className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                          <i className="fa-solid fa-circle-xmark" />
                          Token expired {Math.abs(daysLeft)} day{Math.abs(daysLeft) === 1 ? "" : "s"} ago. Reconnect to resume posting.
                        </p>
                      )}
                    </dl>

                    <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        onClick={() => openEditModal(account)}
                        className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <i className="fa-solid fa-pen mr-1.5 text-xs" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDisconnectTarget(account)}
                        className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
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

        {/* Connect account modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={closeModal} />

            <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">
                  {modalStep === "select-platform" ? "Choose a Platform" : `Connect ${platformDraft?.name}`}
                </h2>
                <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              {modalStep === "select-platform" ? (
                <>
                  <p className="mt-1 text-sm text-slate-500">Already-connected platforms are disabled below.</p>
                  <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5">
                    {PLATFORMS.map((platform) => {
                      const isConnected = connectedPlatformIds.includes(platform.id);
                      return (
                        <button
                          key={platform.id}
                          type="button"
                          onClick={() => pickPlatform(platform)}
                          disabled={isConnected}
                          className={`relative flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border p-2 transition-colors ${
                            isConnected
                              ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-50"
                              : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/60"
                          }`}
                        >
                          {isConnected && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                              <i className="fa-solid fa-check text-[10px]" />
                            </span>
                          )}
                          <i className={`${platform.icon} text-xl`} style={{ color: isConnected ? "#94a3b8" : platform.color }} />
                          <span className="text-center text-[11px] font-medium leading-tight text-slate-600">{platform.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <form onSubmit={handleConnectSubmit} className="mt-5 space-y-4">
                  <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                    <i className={`${platformDraft.icon} text-lg`} style={{ color: platformDraft.color }} />
                    <span className="text-sm font-medium text-slate-700">{platformDraft.name}</span>
                    <button type="button" onClick={() => setModalStep("select-platform")} className="ml-auto text-xs font-medium text-indigo-600 hover:underline">
                      Change
                    </button>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Account Name</label>
                    <input
                      type="text"
                      value={form.accountName}
                      onChange={(e) => handleFormChange("accountName", e.target.value)}
                      placeholder="e.g. Azytrosys Official"
                      className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 ${formErrors.accountName ? "border-red-300 focus:ring-red-500" : "border-slate-300 focus:ring-indigo-500"}`}
                    />
                    {formErrors.accountName && <p className="mt-1 text-xs text-red-600">{formErrors.accountName}</p>}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Page ID</label>
                    <input
                      type="text"
                      value={form.pageId}
                      onChange={(e) => handleFormChange("pageId", e.target.value)}
                      placeholder="e.g. 1029384756123"
                      className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 ${formErrors.pageId ? "border-red-300 focus:ring-red-500" : "border-slate-300 focus:ring-indigo-500"}`}
                    />
                    {formErrors.pageId && <p className="mt-1 text-xs text-red-600">{formErrors.pageId}</p>}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Access Token</label>
                    <input
                      type="password"
                      value={form.accessToken}
                      onChange={(e) => handleFormChange("accessToken", e.target.value)}
                      placeholder="Paste access token"
                      className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 ${formErrors.accessToken ? "border-red-300 focus:ring-red-500" : "border-slate-300 focus:ring-indigo-500"}`}
                    />
                    {formErrors.accessToken && <p className="mt-1 text-xs text-red-600">{formErrors.accessToken}</p>}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Token Expiry Date</label>
                    <input
                      type="date"
                      value={form.tokenExpiry}
                      onChange={(e) => handleFormChange("tokenExpiry", e.target.value)}
                      className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 ${formErrors.tokenExpiry ? "border-red-300 focus:ring-red-500" : "border-slate-300 focus:ring-indigo-500"}`}
                    />
                    {formErrors.tokenExpiry && <p className="mt-1 text-xs text-red-600">{formErrors.tokenExpiry}</p>}
                  </div>

                  {formErrors.submit && <p className="text-xs text-red-600">{formErrors.submit}</p>}

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={closeModal} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {saving ? "Connecting..." : "Connect Account"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Edit account modal */}
        {editTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={closeEditModal} />

            <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">
                  Edit {PLATFORMS.find((p) => p.id === editTarget.platform)?.name} Account
                </h2>
                <button type="button" onClick={closeEditModal} className="text-slate-400 hover:text-slate-600">
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Account Name</label>
                  <input
                    type="text"
                    value={editForm.accountName}
                    onChange={(e) => handleEditFormChange("accountName", e.target.value)}
                    placeholder="e.g. Azytrosys Official"
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 ${editErrors.accountName ? "border-red-300 focus:ring-red-500" : "border-slate-300 focus:ring-indigo-500"}`}
                  />
                  {editErrors.accountName && <p className="mt-1 text-xs text-red-600">{editErrors.accountName}</p>}
                </div>
                 <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Page Id</label>
                  <input
                    type="text"
                    value={editForm.pageId}
                    onChange={(e) => handleEditFormChange("pageId", e.target.value)}
                    placeholder="e.g. 1725356425525552"
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 ${editErrors.pageId ? "border-red-300 focus:ring-red-500" : "border-slate-300 focus:ring-indigo-500"}`}
                  />
                  {editErrors.pageId && <p className="mt-1 text-xs text-red-600">{editErrors.pageId}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Access Token</label>
                  <input
                    type="password"
                    value={editForm.accessToken}
                    onChange={(e) => handleEditFormChange("accessToken", e.target.value)}
                    placeholder="Leave blank to keep the current token"
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 ${editErrors.accessToken ? "border-red-300 focus:ring-red-500" : "border-slate-300 focus:ring-indigo-500"}`}
                  />
                  {editErrors.accessToken && <p className="mt-1 text-xs text-red-600">{editErrors.accessToken}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Token Expiry Date</label>
                  <input
                    type="date"
                    value={editForm.tokenExpiry}
                    onChange={(e) => handleEditFormChange("tokenExpiry", e.target.value)}
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 ${editErrors.tokenExpiry ? "border-red-300 focus:ring-red-500" : "border-slate-300 focus:ring-indigo-500"}`}
                  />
                  {editErrors.tokenExpiry && <p className="mt-1 text-xs text-red-600">{editErrors.tokenExpiry}</p>}
                </div>

                {editErrors.submit && <p className="text-xs text-red-600">{editErrors.submit}</p>}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={closeEditModal} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSaving}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {editSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Disconnect confirmation modal */}
        {disconnectTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDisconnectTarget(null)} />
            <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
                <i className="fa-solid fa-triangle-exclamation text-lg text-red-600" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-slate-900">
                Disconnect {PLATFORMS.find((p) => p.id === disconnectTarget.platform)?.name}?
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">
                This will stop scheduled posts for this account. You can reconnect it again at any time.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setDisconnectTarget(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectConfirm}
                  disabled={disconnecting}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
                >
                  {disconnecting ? "Disconnecting..." : "Disconnect"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Password verification modal — required before revealing/copying a token */}
        {pendingTokenAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={cancelPasswordCheck} />
            <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50">
                <i className="fa-solid fa-lock text-lg text-indigo-600" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-slate-900">Confirm Your Password</h2>
              <p className="mt-1.5 text-sm text-slate-500">
                For security, re-enter your account password to {pendingTokenAction.action === "copy" ? "copy" : "view"} this access token.
              </p>

              <form onSubmit={handleVerifyPassword} className="mt-5">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  autoFocus
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setVerifyError("");
                  }}
                  placeholder="Enter your password"
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2 ${verifyError ? "border-red-300 focus:ring-red-500" : "border-slate-300 focus:ring-indigo-500"}`}
                />
                {verifyError && <p className="mt-1 text-xs text-red-600">{verifyError}</p>}

                <div className="mt-5 flex justify-end gap-3">
                  <button type="button" onClick={cancelPasswordCheck} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={verifyingPassword}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {verifyingPassword ? "Verifying..." : "Verify"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}

export default SocialMediaConnection;