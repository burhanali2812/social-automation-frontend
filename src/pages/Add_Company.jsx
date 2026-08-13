import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";

const COMPANY_TYPES = [
  "Software", "Education", "Healthcare", "E-Commerce",
  "Travel", "NGO", "Marketing", "Finance", "Real Estate",
  "Food_Beverage", "Entertainment", "Other",
];

const TIMEZONES = [
  "Asia/Karachi", "Asia/Dubai", "Asia/Kolkata", "Asia/Dhaka",
  "Europe/London", "America/New_York", "America/Los_Angeles", "Australia/Sydney",
];

const TYPE_ICONS = {
  Software: "fa-code", Education: "fa-graduation-cap", Healthcare: "fa-heart-pulse",
  "E-Commerce": "fa-cart-shopping", Travel: "fa-plane", NGO: "fa-hands-holding-circle",
  Marketing: "fa-bullhorn", Finance: "fa-chart-line", "Real Estate": "fa-building",
  Food_Beverage: "fa-utensils", Entertainment: "fa-film", Other: "fa-circle-question",
};

const initialState = {
  companyName: "", companyLogo: "", companyDescription: "", companyType: "",
  website: "", email: "", phone: "", address: "",
  facebook: "", instagram: "", linkedin: "", youtube: "",
  defaultGeminiPrompt: "", timezone: "Asia/Karachi", postingTime: "09:00",
};

/* ── Primitives ──────────────────────────────── */
const Label = ({ htmlFor, required, hint, children }) => (
  <div className="mb-1.5">
    <label htmlFor={htmlFor} className="text-sm font-semibold text-gray-700">
      {children}{required && <span className="ml-0.5 text-rose-500">*</span>}
    </label>
    {hint && <p className="mt-0.5 text-xs text-gray-400">{hint}</p>}
  </div>
);

const FieldError = ({ msg }) =>
  msg ? (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-500">
      <i className="fas fa-triangle-exclamation text-[9px]"></i>{msg}
    </p>
  ) : null;

const InputWrap = ({ icon, iconPrefix = "fas", children }) => (
  <div className="relative">
    <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-gray-400">
      <i className={`${iconPrefix} ${icon} w-3.5 text-center text-xs`}></i>
    </span>
    {children}
  </div>
);

function Add_Company() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [form, setForm]             = useState(initialState);
  const [errors, setErrors]         = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep]             = useState(0); // 0=basic 1=contact 2=social 3=automation
  const [maxStepReached, setMaxStepReached] = useState(0); // furthest step the user has validated into

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => { const n = { ...p }; delete n[name]; return n; });
  };

  const validate = (fields = null) => {
    const e = {};
    const f = form;

    const all = !fields;
    const has = (k) => all || fields.includes(k);

    if (has("companyName")) {
      if (!f.companyName.trim()) e.companyName = "Company name is required";
      else if (f.companyName.trim().length < 2) e.companyName = "Min 2 characters";
      else if (f.companyName.trim().length > 100) e.companyName = "Max 100 characters";
    }
    if (has("companyLogo") && f.companyLogo && !/^https?:\/\/.+/i.test(f.companyLogo.trim()))
      e.companyLogo = "Must start with http:// or https://";
    if (has("companyDescription")) {
      if (!f.companyDescription.trim()) e.companyDescription = "Description is required";
      else if (f.companyDescription.trim().length < 20) e.companyDescription = "Min 20 characters";
      else if (f.companyDescription.trim().length > 1000) e.companyDescription = "Max 1000 characters";
    }
    if (has("companyType") && !f.companyType) e.companyType = "Select a company type";
    if (has("website") && f.website && !/^https?:\/\/.+/i.test(f.website.trim()))
      e.website = "Must start with http:// or https://";
    if (has("email")) {
      if (!f.email.trim()) e.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = "Invalid email address";
    }
    if (has("phone")) {
      if (!f.phone.trim()) e.phone = "Phone is required";
      else if (!/^[+]?[0-9]{10,15}$/.test(f.phone.trim())) e.phone = "10–15 digits only";
    }
    if (has("address")) {
      if (!f.address.trim()) e.address = "Address is required";
      else if (f.address.trim().length < 5) e.address = "Too short";
      else if (f.address.trim().length > 300) e.address = "Max 300 characters";
    }
    if (has("facebook") && f.facebook && !/^https?:\/\/(www\.)?facebook\.com\/.+/i.test(f.facebook.trim()))
      e.facebook = "Must be a valid facebook.com URL";
    if (has("instagram") && f.instagram && !/^https?:\/\/(www\.)?instagram\.com\/.+/i.test(f.instagram.trim()))
      e.instagram = "Must be a valid instagram.com URL";
    if (has("linkedin") && f.linkedin && !/^https?:\/\/(www\.)?linkedin\.com\/.+/i.test(f.linkedin.trim()))
      e.linkedin = "Must be a valid linkedin.com URL";
    if (has("youtube") && f.youtube && !/^https?:\/\/(www\.)?youtube\.com\/.+/i.test(f.youtube.trim()))
      e.youtube = "Must be a valid youtube.com URL";
    if (has("defaultGeminiPrompt")) {
      if (!f.defaultGeminiPrompt.trim()) e.defaultGeminiPrompt = "Prompt is required";
      else if (f.defaultGeminiPrompt.trim().length < 20) e.defaultGeminiPrompt = "Min 20 characters";
      else if (f.defaultGeminiPrompt.trim().length > 3000) e.defaultGeminiPrompt = "Max 3000 characters";
    }

    setErrors((prev) => fields ? { ...prev, ...e } : e);
    return Object.keys(e).length === 0;
  };

  const STEPS = [
    { label: "Basic Info",  icon: "fa-building",     fields: ["companyName","companyType","companyLogo","companyDescription"] },
    { label: "Contact",     icon: "fa-address-card", fields: ["email","phone","website","address"] },
    { label: "Social Links",icon: "fa-share-nodes",  fields: ["facebook","instagram","linkedin","youtube"] },
    { label: "Automation",  icon: "fa-robot",        fields: ["defaultGeminiPrompt"] },
  ];

  const goNext = () => {
    const ok = validate(STEPS[step].fields);
    if (!ok) { toast.error("Fix the errors in this section first."); return; }
    const next = Math.min(step + 1, STEPS.length - 1);
    setStep(next);
    setMaxStepReached((m) => Math.max(m, next));
  };
  const goPrev = () => setStep((s) => Math.max(s - 1, 0));

  // Jump directly to any step already visited — lets the user backtrack
  // (e.g. from Step 4 to recheck Step 2) without losing validated progress,
  // and hop forward again without redoing validation.
  const jumpToStep = (i) => {
    if (i > maxStepReached) return; // can't skip ahead to a step not yet unlocked
    setStep(i);
  };

  const handleReset = () => { setForm(initialState); setErrors({}); setStep(0); setMaxStepReached(0); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { toast.error("Please fix all errors before submitting."); return; }
    setSubmitting(true);
    const tid = toast.loading("Creating company…");
    try {
      const res = await api.post("/company",
        {
          ...form,
          companyLogo: form.companyLogo.trim() || null,
          website: form.website.trim() || null,
          facebook: form.facebook.trim() || null,
          instagram: form.instagram.trim() || null,
          linkedin: form.linkedin.trim() || null,
          youtube: form.youtube.trim() || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data?.message || "Company created!", { id: tid });
      setTimeout(() => navigate("/companies"), 1200);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Something went wrong.", { id: tid });
    } finally {
      setSubmitting(false);
    }
  };

  const base = "w-full rounded-xl border bg-gray-50/70 px-3.5 py-2.5 pl-9 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
  const cx   = (f) => `${base} ${errors[f] ? "border-rose-400 bg-rose-50/60 focus:border-rose-500 focus:ring-rose-100" : "border-gray-200"}`;

  const descLen   = form.companyDescription.length;
  const promptLen = form.defaultGeminiPrompt.length;

  const Counter = ({ val, max }) => (
    <span className={`text-xs tabular-nums ${val > max ? "text-rose-500 font-semibold" : val > max * 0.9 ? "text-amber-500" : "text-gray-400"}`}>
      {val}/{max}
    </span>
  );

  const lastStep = STEPS.length - 1;

  return (
    <Sidebar>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: "14px", fontSize: "13.5px", fontWeight: 500, padding: "12px 16px" },
          success: { iconTheme: { primary: "#2563eb", secondary: "#fff" } },
          loading: { iconTheme: { primary: "#6366f1", secondary: "#fff" } },
        }}
      />

      {/* ── Page Header ─────────────────────────── */}
      <div className="mb-8">
        <nav className="mb-3 flex items-center gap-2 text-xs text-gray-400">
          <a href="/companies" className="flex items-center gap-1.5 font-medium transition-colors hover:text-blue-600">
            <i className="fas fa-building text-[10px]"></i>Companies
          </a>
          <i className="fas fa-chevron-right text-[8px]"></i>
          <span className="font-semibold text-gray-600">Add Company</span>
        </nav>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Register New Company
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Set up a company profile and configure its social media automation.
            </p>
          </div>
          <a
            href="/companies"
            className="flex w-fit shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition-all hover:border-gray-300 hover:shadow"
          >
            <i className="fas fa-arrow-left text-xs"></i>
            Back
          </a>
        </div>
      </div>

      {/* ── Step Indicator ──────────────────────── */}
      {/* Any step already visited (i <= maxStepReached) can be clicked to jump
          straight to it — this is what lets you backtrack from a later step
          to recheck/edit an earlier one, then hop forward again freely. */}
      <div className="mb-2 flex items-center gap-0">
        {STEPS.map((s, i) => {
          const isCurrent  = i === step;
          const isVisited  = i <= maxStepReached && !isCurrent;
          const isLocked   = i > maxStepReached;
          return (
            <React.Fragment key={s.label}>
              <button
                type="button"
                onClick={() => jumpToStep(i)}
                disabled={isLocked}
                title={isVisited ? `Back to ${s.label}` : undefined}
                className={`group flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all
                  ${isCurrent
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                    : isVisited
                      ? "cursor-pointer text-blue-600 hover:bg-blue-50"
                      : "cursor-not-allowed text-gray-400"}`}
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold
                  ${isCurrent ? "bg-white/25 text-white" : isVisited ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
                  {isVisited ? <i className="fas fa-check text-[10px]"></i> : i + 1}
                </span>
                <span className="hidden sm:block">{s.label}</span>
                {isVisited && (
                  <i className="fas fa-pen text-[9px] text-blue-400 opacity-0 transition-opacity group-hover:opacity-100 hidden sm:inline-block"></i>
                )}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`h-px flex-1 mx-2 transition-colors ${i < maxStepReached ? "bg-blue-300" : "bg-gray-200"}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <p className="mb-6 text-xs text-gray-400">
        <i className="fas fa-circle-info mr-1"></i>
        You can click any completed step above to go back and recheck it.
      </p>

      <form onSubmit={handleSubmit} noValidate>

        {/* ══ STEP 0 — Basic Information ══════════ */}
        {step === 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                  <i className="fas fa-building text-sm text-blue-600"></i>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Basic Information</h2>
                  <p className="text-xs text-gray-400">Identity and description of the company</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* Company Name */}
                <div className="md:col-span-2">
                  <Label htmlFor="companyName" required>Company Name</Label>
                  <InputWrap icon="fa-briefcase">
                    <input id="companyName" name="companyName" type="text"
                      value={form.companyName} onChange={handleChange}
                      placeholder="e.g. The Education's Cradle Institute"
                      className={cx("companyName")} />
                  </InputWrap>
                  <FieldError msg={errors.companyName} />
                </div>

                {/* Company Type — visual card picker */}
                <div className="md:col-span-2">
                  <Label htmlFor="companyType" required>Company Type</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {COMPANY_TYPES.map((t) => (
                      <button key={t} type="button" onClick={() => {
                        setForm((p) => ({ ...p, companyType: t }));
                        if (errors.companyType) setErrors((p) => { const n = { ...p }; delete n.companyType; return n; });
                      }}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-xs font-semibold transition-all
                          ${form.companyType === t
                            ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm shadow-blue-100"
                            : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-white"}`}
                      >
                        <i className={`fas ${TYPE_ICONS[t]} text-base ${form.companyType === t ? "text-blue-600" : "text-gray-400"}`}></i>
                        {t}
                      </button>
                    ))}
                  </div>
                  <FieldError msg={errors.companyType} />
                </div>

                {/* Logo URL */}
                <div>
                  <Label htmlFor="companyLogo" hint="Optional — must be a public image URL">
                    Company Logo URL
                  </Label>
                  <InputWrap icon="fa-image">
                    <input id="companyLogo" name="companyLogo" type="text"
                      value={form.companyLogo} onChange={handleChange}
                      placeholder="https://example.com/logo.png"
                      className={cx("companyLogo")} />
                  </InputWrap>
                  <FieldError msg={errors.companyLogo} />
                  {form.companyLogo && !errors.companyLogo && (
                    <div className="mt-2 flex items-center gap-2.5">
                      <img src={form.companyLogo} alt="Preview"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                        className="h-9 w-9 rounded-xl border border-gray-200 object-contain p-1" />
                      <span className="text-xs text-gray-400">Logo preview</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <Label htmlFor="companyDescription" required hint="Describe what this company does and its core focus">
                    Company Description
                  </Label>
                  <textarea id="companyDescription" name="companyDescription"
                    rows={4} value={form.companyDescription} onChange={handleChange}
                    placeholder="Describe the company's mission, services, and target audience…"
                    className={`${cx("companyDescription")} resize-none !pl-3.5`} />
                  <div className="mt-1.5 flex items-start justify-between gap-3">
                    <FieldError msg={errors.companyDescription} />
                    <Counter val={descLen} max={1000} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 1 — Contact Information ════════ */}
        {step === 1 && (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
                  <i className="fas fa-address-card text-sm text-violet-600"></i>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Contact Information</h2>
                  <p className="text-xs text-gray-400">How to reach this company</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <div>
                  <Label htmlFor="email" required>Email Address</Label>
                  <InputWrap icon="fa-envelope">
                    <input id="email" name="email" type="email"
                      value={form.email} onChange={handleChange}
                      placeholder="contact@company.com" className={cx("email")} />
                  </InputWrap>
                  <FieldError msg={errors.email} />
                </div>

                <div>
                  <Label htmlFor="phone" required hint="Include country code e.g. +92">
                    Phone Number
                  </Label>
                  <InputWrap icon="fa-phone">
                    <input id="phone" name="phone" type="text"
                      value={form.phone} onChange={handleChange}
                      placeholder="+923001234567" className={cx("phone")} />
                  </InputWrap>
                  <FieldError msg={errors.phone} />
                </div>

                <div>
                  <Label htmlFor="website" hint="Optional">Website</Label>
                  <InputWrap icon="fa-globe">
                    <input id="website" name="website" type="text"
                      value={form.website} onChange={handleChange}
                      placeholder="https://company.com" className={cx("website")} />
                  </InputWrap>
                  <FieldError msg={errors.website} />
                </div>

                <div>
                  <Label htmlFor="address" required>Office Address</Label>
                  <InputWrap icon="fa-location-dot">
                    <input id="address" name="address" type="text"
                      value={form.address} onChange={handleChange}
                      placeholder="Street, City, Country" className={cx("address")} />
                  </InputWrap>
                  <FieldError msg={errors.address} />
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 2 — Social Media Links ═════════ */}
        {step === 2 && (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50">
                  <i className="fas fa-share-nodes text-sm text-pink-600"></i>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Social Media Links</h2>
                  <p className="text-xs text-gray-400">Optional — link the company's social profiles</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <div>
                  <Label htmlFor="facebook" hint="Optional — full facebook.com profile/page URL">
                    Facebook
                  </Label>
                  <InputWrap icon="fa-facebook" iconPrefix="fab">
                    <input id="facebook" name="facebook" type="text"
                      value={form.facebook} onChange={handleChange}
                      placeholder="https://facebook.com/yourcompany"
                      className={cx("facebook")} />
                  </InputWrap>
                  <FieldError msg={errors.facebook} />
                </div>

                <div>
                  <Label htmlFor="instagram" hint="Optional — full instagram.com profile URL">
                    Instagram
                  </Label>
                  <InputWrap icon="fa-instagram" iconPrefix="fab">
                    <input id="instagram" name="instagram" type="text"
                      value={form.instagram} onChange={handleChange}
                      placeholder="https://instagram.com/yourcompany"
                      className={cx("instagram")} />
                  </InputWrap>
                  <FieldError msg={errors.instagram} />
                </div>

                <div>
                  <Label htmlFor="linkedin" hint="Optional — full linkedin.com company URL">
                    LinkedIn
                  </Label>
                  <InputWrap icon="fa-linkedin" iconPrefix="fab">
                    <input id="linkedin" name="linkedin" type="text"
                      value={form.linkedin} onChange={handleChange}
                      placeholder="https://linkedin.com/company/yourcompany"
                      className={cx("linkedin")} />
                  </InputWrap>
                  <FieldError msg={errors.linkedin} />
                </div>

                <div>
                  <Label htmlFor="youtube" hint="Optional — full youtube.com channel URL">
                    YouTube
                  </Label>
                  <InputWrap icon="fa-youtube" iconPrefix="fab">
                    <input id="youtube" name="youtube" type="text"
                      value={form.youtube} onChange={handleChange}
                      placeholder="https://youtube.com/@yourcompany"
                      className={cx("youtube")} />
                  </InputWrap>
                  <FieldError msg={errors.youtube} />
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 3 — Automation Settings ════════ */}
        {step === 3 && (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                  <i className="fas fa-robot text-sm text-emerald-600"></i>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Automation Settings</h2>
                  <p className="text-xs text-gray-400">Scheduling and AI content defaults</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-gray-400">
                      <i className="fas fa-earth-asia text-xs"></i>
                    </span>
                    <select id="timezone" name="timezone" value={form.timezone} onChange={handleChange}
                      className={`${base} cursor-pointer appearance-none !border-gray-200 pr-9`}>
                      {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-gray-400">
                      <i className="fas fa-chevron-down text-[10px]"></i>
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="postingTime" hint="Daily default time for scheduled posts">
                    Posting Time
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-gray-400">
                      <i className="fas fa-clock text-xs"></i>
                    </span>
                    <input id="postingTime" name="postingTime" type="time"
                      value={form.postingTime} onChange={handleChange}
                      className={`${base} cursor-pointer !border-gray-200`} />
                  </div>
                </div>

                {/* Gemini Prompt */}
                <div className="md:col-span-2">
                  <Label htmlFor="defaultGeminiPrompt" required
                    hint="Gemini uses this context when generating captions and content for this company">
                    Default Gemini Prompt
                  </Label>
                  <div className="relative rounded-xl border border-gray-200 bg-gray-50/70 transition-all focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
                    <div className="flex items-center gap-2 border-b border-gray-100 px-3.5 py-2">
                      <i className="fas fa-wand-magic-sparkles text-xs text-violet-500"></i>
                      <span className="text-xs font-medium text-gray-400">AI Prompt</span>
                    </div>
                    <textarea id="defaultGeminiPrompt" name="defaultGeminiPrompt"
                      rows={6} value={form.defaultGeminiPrompt} onChange={handleChange}
                      placeholder={"e.g. You are a professional social media manager for an education institute.\n\nWrite engaging captions in both Urdu and English.\nTone: friendly, inspiring, and authoritative.\nAlways end with a relevant hashtag cluster."}
                      className={`w-full resize-none rounded-b-xl bg-transparent px-3.5 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 ${errors.defaultGeminiPrompt ? "placeholder:text-rose-300" : ""}`} />
                  </div>
                  <div className="mt-1.5 flex items-start justify-between gap-3">
                    <FieldError msg={errors.defaultGeminiPrompt} />
                    <Counter val={promptLen} max={3000} />
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ── Navigation Bar ───────────────────── */}
        <div className="mt-5 flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {step < lastStep
              ? <><span className="font-semibold text-gray-500">Step {step + 1}</span> of {STEPS.length} — {STEPS[step].label}</>
              : <><span className="text-rose-500">*</span> All required fields must be filled</>
            }
          </div>

          <div className="flex items-center gap-3">
            {step === 0 ? (
              <button type="button" onClick={handleReset}
                className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50">
                <i className="fas fa-rotate-left text-xs"></i>Reset
              </button>
            ) : (
              <>
                <button type="button" onClick={goPrev}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50">
                  <i className="fas fa-arrow-left text-xs"></i>Back
                </button>

                {/* Quick-jump to any earlier visited step */}
                {maxStepReached > 0 && (
                  <div className="relative">
                    <select
                      value=""
                      onChange={(e) => e.target.value !== "" && jumpToStep(Number(e.target.value))}
                      className="cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-3.5 pr-8 text-xs font-semibold text-gray-500 outline-none transition-all hover:bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      title="Jump to a completed step"
                    >
                      <option value="" disabled>Jump to step…</option>
                      {STEPS.map((s, i) => (
                        i !== step && i <= maxStepReached
                          ? <option key={s.label} value={i}>{s.label}</option>
                          : null
                      ))}
                    </select>
                    <i className="fas fa-chevron-down pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-400"></i>
                  </div>
                )}
              </>
            )}

            {step < lastStep ? (
              <button type="button" onClick={goNext}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-all hover:bg-blue-700">
                Continue<i className="fas fa-arrow-right text-xs"></i>
              </button>
            ) : (
              <button type="submit" disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                {submitting
                  ? <><i className="fas fa-spinner fa-spin text-xs"></i>Creating…</>
                  : <><i className="fas fa-plus text-xs"></i>Create Company</>}
              </button>
            )}
          </div>
        </div>

      </form>
    </Sidebar>
  );
}

export default Add_Company;