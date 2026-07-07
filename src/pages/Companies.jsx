import React, { useEffect, useState } from "react";
import api from "../api/axios";
import Sidebar from "../components/Sidebar";

function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selectedCompany, setSelectedCompany] = useState(null);

  const companyTypes = [
    "All",
    "Software",
    "Education",
    "Healthcare",
    "E-Commerce",
    "Travel",
    "NGO",
    "Marketing",
    "Finance",
    "Real Estate",
    "Other",
  ];

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Lock body scroll while the detail drawer is open
  useEffect(() => {
    document.body.style.overflow = selectedCompany ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedCompany]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/company/getAllCompanies", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setCompanies(res.data.data || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setCompanies([]);
      } else {
        setError(err.response?.data?.message || "Failed to load companies.");
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter((c) => {
    const matchesSearch = c.companyName
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesType = typeFilter === "All" || c.companyType === typeFilter;
    return matchesSearch && matchesType;
  });

  const deleteCompany = async (companyId) => {
    if (!window.confirm("Are you sure you want to delete this company?")) {
      return;
    }
    try {
      await api.delete(`/company/${companyId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      fetchCompanies();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete company.");
    }
  };

  return (
    <Sidebar>
      <div className="bg-gray-50 ">
        <div >
          {/* Header */}
          <div className="max-w-7xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Companies
              </h1>
              <p className="text-gray-500 mt-1 text-sm sm:text-base">
                Manage and view all registered companies.
              </p>
            </div>
            <div className="text-sm text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-1.5 self-start sm:self-auto">
              <i className="fa-solid fa-building mr-2 text-gray-400"></i>
              {filteredCompanies.length} of {companies.length}{" "}
              {companies.length === 1 ? "company" : "companies"}
            </div>
          </div>

          {/* Filters */}
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3 mb-6 sticky top-0 z-10 bg-gray-50 py-2">
            <div className="relative flex-1">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by company name..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
              />
            </div>

            <div className="relative sm:w-56">
              <i className="fa-solid fa-filter absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"></i>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full appearance-none pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
              >
                {companyTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <i className="fa-solid fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-7xl mx-auto">
            {loading && (
              <div className="flex flex-col justify-center items-center py-24 text-gray-400">
                <i className="fa-solid fa-spinner fa-spin text-3xl mb-3"></i>
                <p className="text-sm">Loading companies...</p>
              </div>
            )}

            {!loading && error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-6 text-center">
                <i className="fa-solid fa-triangle-exclamation text-2xl mb-2 block"></i>
                {error}
              </div>
            )}

            {!loading && !error && filteredCompanies.length === 0 && (
              <div className="text-center py-24 text-gray-400 bg-white border border-dashed border-gray-200 rounded-xl">
                <i className="fa-regular fa-folder-open text-5xl mb-4 block"></i>
                <p className="text-gray-600 font-medium">No companies found</p>
                <p className="text-sm mt-1">
                  Try adjusting your search or filter.
                </p>
              </div>
            )}

            {!loading && !error && filteredCompanies.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
                {filteredCompanies.map((company) => (
                  <CompanyCard
                    key={company._id}
                    company={company}
                    onView={() => setSelectedCompany(company)}
                    onDelete={() => deleteCompany(company._id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right-side detail drawer */}
      <CompanyDetailDrawer
        company={selectedCompany}
        onClose={() => setSelectedCompany(null)}
        onDelete={() => {
          if (selectedCompany) {
            deleteCompany(selectedCompany._id);
            setSelectedCompany(null);
          }
        }}
      />
    </Sidebar>
  );
}

function CompanyCard({ company, onView, onDelete }) {
  const {
    companyName,
    companyLogo,
    companyDescription,
    companyType,
    website,
    email,
    phone,
    address,
    isActive,
    socialMediaLinks = {
      facebook: null,
      instagram: null,
      linkedin: null,
      youtube: null,  
    },
  } = company;

  return (
    <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">
      {/* Top section */}
      <div className="p-4 pb-3 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
          {companyLogo ? (
            <img
              src={companyLogo}
              alt={companyName}
              className="w-full h-full object-cover"
            />
          ) : (
            <i className="fa-solid fa-building text-lg text-gray-300"></i>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2
            className="text-base font-semibold text-gray-900 truncate leading-tight"
            title={companyName}
          >
            {companyName}
          </h2>
          <span className="inline-block mt-1.5 text-[11px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full leading-none">
            {companyType}
          </span>
        </div>

        <span
          className={`flex-shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1.5 leading-none ${
            isActive
              ? "bg-green-50 text-green-600"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          <i
            className={`fa-solid fa-circle text-[5px] ${
              isActive ? "text-green-500" : "text-gray-400"
            }`}
          ></i>
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="h-px bg-gray-50 mx-4" />

      {/* Description */}
      <div className="px-4 py-3">
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {companyDescription}
        </p>
      </div>

      {/* Contact info */}
      <div className="px-4 pb-4 flex-1 space-y-2.5 text-sm text-gray-500">
        <div className="flex items-center gap-2.5">
          <i className="fa-solid fa-envelope w-3.5 text-center text-gray-300 text-xs flex-shrink-0"></i>
          <span className="truncate">{email}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <i className="fa-solid fa-phone w-3.5 text-center text-gray-300 text-xs flex-shrink-0"></i>
          <span className="truncate">{phone}</span>
        </div>
        <div className="flex items-start gap-2.5">
          <i className="fa-solid fa-location-dot w-3.5 text-center text-gray-300 text-xs flex-shrink-0 mt-1"></i>
          <span className="line-clamp-2">{address}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto px-4 py-3 border-t border-gray-50 flex items-center justify-between gap-2 bg-gray-50/50">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <a
            href={website || "#"}
            target="_blank"
            rel="noopener noreferrer"
            title="Website"
            onClick={(e) => e.stopPropagation()}
            className="text-gray-300 hover:text-blue-500 transition-colors leading-none"
          >
            <i className="fa-solid fa-globe text-sm"></i>
          </a>
          <a
            href={socialMediaLinks.facebook || "#"}
            target="_blank"
            rel="noopener noreferrer"
            title="Facebook"
            onClick={(e) => e.stopPropagation()}
            className="text-gray-300 hover:text-blue-600 transition-colors leading-none"
          >
            <i className="fa-brands fa-facebook text-sm"></i>
          </a>
          <a
            href={socialMediaLinks.linkedin || "#"}
            target="_blank"
            rel="noopener noreferrer"
            title="LinkedIn"
            onClick={(e) => e.stopPropagation()}
            className="text-gray-300 hover:text-blue-700 transition-colors leading-none"
          >
            <i className="fa-brands fa-linkedin text-sm"></i>
          </a>
          <a
            href={socialMediaLinks.youtube || "#"}
            target="_blank"
            rel="noopener noreferrer"
            title="YouTube"
            onClick={(e) => e.stopPropagation()}
            className="text-gray-300 hover:text-red-600 transition-colors leading-none"
          >
            <i className="fa-brands fa-youtube text-sm"></i>
          </a>
          <a
            href={socialMediaLinks.instagram || "#"}
            target="_blank"
            rel="noopener noreferrer"
            title="Instagram"
            onClick={(e) => e.stopPropagation()}
            className="text-gray-300 hover:text-pink-500 transition-colors leading-none"
          >
            <i className="fa-brands fa-instagram text-sm"></i>
          </a>
        </div>
         <div className="flex items-center gap-2.5 flex-shrink-0">
           <button
          onClick={onDelete}
          className="flex-shrink-0 text-xs font-semibold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-full px-3 py-1.5 flex items-center gap-1.5 transition-colors whitespace-nowrap"
        >
          Delete <i className="fa-solid fa-trash text-[10px]"></i>
        </button>

        <button
          onClick={onView}
          className="flex-shrink-0 text-xs font-semibold text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 hover:border-blue-600 rounded-full px-3 py-1.5 flex items-center gap-1.5 transition-colors whitespace-nowrap"
        >
          View <i className="fa-solid fa-arrow-right text-[10px]"></i>
        </button>
         </div>
      </div>
    </div>
  );
}

function CompanyDetailDrawer({ company, onClose, onDelete }) {
  const isOpen = !!company;

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const c = company || {};
  const {
    companyName,
    companyLogo,
    companyDescription,
    companyType,
    website,
    email,
    phone,
    address,
    isActive,
    slug,
    timezone,
    postingTime,
    createdAt,
    socialMediaLinks = {},
  } = c;

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {company && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                  {companyLogo ? (
                    <img
                      src={companyLogo}
                      alt={companyName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <i className="fa-solid fa-building text-2xl text-gray-300"></i>
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 truncate">
                    {companyName}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                      {companyType}
                    </span>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isActive
                          ? "bg-green-50 text-green-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <i
                        className={`fa-solid fa-circle text-[5px] ${
                          isActive ? "text-green-500" : "text-gray-400"
                        }`}
                      ></i>
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-7">
              {/* Description */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                  About
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {companyDescription}
                </p>
              </section>

              {/* Contact info */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <DetailRow icon="fa-envelope" label="Email" value={email} />
                  <DetailRow icon="fa-phone" label="Phone" value={phone} />
                  <DetailRow
                    icon="fa-location-dot"
                    label="Address"
                    value={address}
                  />
                  <DetailRow
                    icon="fa-globe"
                    label="Website"
                    value={website}
                    isLink
                  />
                </div>
              </section>

              {/* Social links */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                  Social Links
                </h3>
                <div className="flex items-center gap-3">
                  <SocialIcon
                    href={socialMediaLinks.facebook}
                    icon="fa-facebook"
                    hoverClass="hover:text-blue-600 hover:bg-blue-50"
                  />
                  <SocialIcon
                    href={socialMediaLinks.linkedin}
                    icon="fa-linkedin"
                    hoverClass="hover:text-blue-700 hover:bg-blue-50"
                  />
                  <SocialIcon
                    href={socialMediaLinks.youtube}
                    icon="fa-youtube"
                    hoverClass="hover:text-red-600 hover:bg-red-50"
                  />
                  <SocialIcon
                    href={socialMediaLinks.instagram}
                    icon="fa-instagram"
                    hoverClass="hover:text-pink-500 hover:bg-pink-50"
                  />
                </div>
              </section>

              {/* Additional details */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                  Additional Details
                </h3>
                <div className="space-y-3">
                  {slug && (
                    <DetailRow icon="fa-link" label="Slug" value={slug} />
                  )}
                  {timezone && (
                    <DetailRow
                      icon="fa-clock"
                      label="Timezone"
                      value={timezone}
                    />
                  )}
                  {postingTime && (
                    <DetailRow
                      icon="fa-calendar-clock"
                      label="Posting Time"
                      value={postingTime}
                    />
                  )}
                  {formattedDate && (
                    <DetailRow
                      icon="fa-calendar-plus"
                      label="Created On"
                      value={formattedDate}
                    />
                  )}
                </div>
              </section>
            </div>

            {/* Footer actions */}
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => console.log("Edit company:", company._id)}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-pen text-xs"></i> Edit
              </button>
                
              <button
                onClick={onDelete}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-trash text-xs"></i> Delete
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function DetailRow({ icon, label, value, isLink }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <i className={`fa-solid ${icon} text-gray-400 text-xs`}></i>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400 font-medium">{label}</p>
        {isLink ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline break-all"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm text-gray-700 break-words">{value}</p>
        )}
      </div>
    </div>
  );
}

function SocialIcon({ href, icon, hoverClass }) {
  const disabled = !href;
  return (
    <a
      href={href || "#"}
      target={disabled ? undefined : "_blank"}
      rel="noopener noreferrer"
      onClick={(e) => disabled && e.preventDefault()}
      className={`w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-300 transition-colors ${
        disabled ? "opacity-40 cursor-not-allowed" : `text-gray-500 ${hoverClass}`
      }`}
    >
      <i className={`fa-brands ${icon} text-base`}></i>
    </a>
  );
}

export default Companies;