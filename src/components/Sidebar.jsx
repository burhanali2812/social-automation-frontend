import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function Sidebar({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem("token");
  const decoded = useMemo(() => {
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch {
      return null;
    }
  }, [token]);

  const userRole = decoded?.role || null;
  const userEmail = decoded?.email || "";
  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : "A";

  const [isOpen, setIsOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);

  const toggleDropdown = (title) => {
    setOpenMenu((prev) => (prev === title ? null : title));
  };

  const handlelogOut = () => {
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (confirmed) {
      localStorage.removeItem("token");
      navigate("/");
    }
  };

  const roleList = {
    admin: [
      { title: "Dashboard", icon: "fa-house", href: "/adminPanel" },
      {
        title: "Companies",
        icon: "fa-building",
        children: [
          { title: "All Companies", href: "/companies" },
          { title: "Add Company", href: "/companies/add" },
        ],
      },
      { title: "Social Accounts", icon: "fa-share-nodes", href: "/social-accounts" },
      {
        title: "Media Library",
        icon: "fa-photo-film",
        children: [
          { title: "All Media", href: "/media" },
          { title: "Upload Media", href: "/media/upload" },
          { title: "Scheduled", href: "/media/scheduled" },
          { title: "Posted", href: "/media/posted" },
          { title: "Failed", href: "/media/failed" },
        ],
      },
      {
        title: "AI Content",
        icon: "fa-robot",
        children: [
          { title: "Generated Captions", href: "/ai/captions" },
          { title: "Prompt Templates", href: "/ai/prompts" },
        ],
      },
      {
        title: "Scheduler",
        icon: "fa-calendar-check",
        children: [
          { title: "Scheduler Status", href: "/scheduler" },
          { title: "Run Now", href: "/scheduler/run" },
        ],
      },
      { title: "Manual Posting", icon: "fa-hand-pointer", href: "/manual-posting" },
      {
        title: "Logs & Reports",
        icon: "fa-file-lines",
        children: [
          { title: "Posting Logs", href: "/logs" },
          { title: "Reports", href: "/reports" },
        ],
      },
      {
        title: "Settings",
        icon: "fa-gear",
        children: [
          { title: "Profile", href: "/profile" },
          { title: "System Settings", href: "/settings" },
        ],
      },
    ],
  };

  const menuItems = userRole ? roleList[userRole] || [] : [];

  // Auto-expand whichever group contains the current route.
  useEffect(() => {
    const activeParent = menuItems.find(
      (item) => item.children && item.children.some((child) => child.href === location.pathname)
    );
    if (activeParent) setOpenMenu(activeParent.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  const isChildActive = (href) => location.pathname === href;
  const isParentActive = (item) =>
    item.href ? location.pathname === item.href : item.children?.some((c) => c.href === location.pathname);

  const BrandMark = ({ size = "h-10 w-10", textSize = "text-base" }) => (
    <div
      className={`${size} ${textSize} flex flex-shrink-0 items-center justify-center rounded-lg bg-gray-900 font-bold text-white`}
    >
      EC
    </div>
  );

  const NavList = () => (
    <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-3 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {menuItems.map((item) =>
        item.children ? (
          <div key={item.title}>
            <button
              type="button"
              onClick={() => toggleDropdown(item.title)}
              className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isParentActive(item) ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="flex items-center gap-3">
                <i className={`fas ${item.icon} w-[18px] text-center text-[15px] text-gray-400`} />
                <span className="flex-1 text-left">{item.title}</span>
              </span>
              <i
                className={`fas fa-chevron-right text-[11px] text-gray-400 transition-transform duration-150 ${
                  openMenu === item.title ? "rotate-90" : ""
                }`}
              />
            </button>

            <div
              className={`ml-[27px] overflow-hidden border-l border-gray-200 pl-4 transition-all duration-150 ease-out ${
                openMenu === item.title ? "mt-0.5 mb-1 max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="flex flex-col gap-0.5 py-0.5">
                {item.children.map((child) => (
                  <a
                    key={child.title}
                    href={child.href}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isChildActive(child.href) ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                    }`}
                  >
                    {child.title}
                  </a>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <a
            key={item.title}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isParentActive(item) ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <i className={`fas ${item.icon} w-[18px] text-center text-[15px] text-gray-400`} />
            <span className="flex-1">{item.title}</span>
          </a>
        )
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-[1045] mx-4 mt-2.5 flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm lg:hidden">
        <div className="flex flex-shrink-0 items-center">
          <BrandMark size="h-9 w-9" textSize="text-sm" />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h1 className="text-sm font-semibold leading-tight text-gray-900">AI Social Automation</h1>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleMenu}
            aria-label="Toggle sidebar menu"
            aria-expanded={isOpen}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
          >
            <i className="fas fa-bars" />
          </button>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-[1040] hidden w-[270px] flex-col border-r border-gray-100 bg-white lg:flex">
        <div className="flex flex-col items-center gap-3 border-b border-gray-100 px-5 py-6">
          <BrandMark size="h-14 w-14" textSize="text-xl" />
          <div className="text-center">
            <h1 className="text-base font-bold leading-snug text-gray-900">AI Social Automation</h1>
            <p className="mt-0.5 text-xs text-gray-400">Admin</p>
          </div>
        </div>

        <NavList />

        <div className="mt-auto space-y-3 border-t border-gray-100 p-4">
          {userEmail && (
            <div className="flex items-center gap-3 px-1">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                {userInitial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-800">{userEmail}</p>
                <p className="text-xs capitalize text-gray-400">{userRole}</p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handlelogOut}
            className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <i className="fas fa-right-from-bracket" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile dropdown panel */}
      <aside
        className={`fixed inset-x-0 top-0 z-[1050] flex max-h-screen flex-col rounded-b-2xl bg-white shadow-xl transition-transform duration-300 ease-out lg:hidden ${
          isOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5">
          <h2 className="text-sm font-semibold text-gray-900">Menu</h2>
          <button
            type="button"
            onClick={closeMenu}
            aria-label="Close sidebar menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
          >
            <i className="fas fa-xmark" />
          </button>
        </div>

        {userEmail && (
          <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-800">{userEmail}</p>
              <p className="text-xs capitalize text-gray-400">{userRole}</p>
            </div>
          </div>
        )}

        <NavList />

        <div className="border-t border-gray-100 p-4">
          <button
            type="button"
            onClick={handlelogOut}
            className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <i className="fas fa-right-from-bracket" />
            Logout
          </button>
        </div>
      </aside>

      {isOpen && <div onClick={closeMenu} className="fixed inset-0 z-[1048] bg-black/45 lg:hidden" />}

      <main className="min-h-screen  py-5 pt-[100px] lg:ml-[270px] lg:px-6 lg:py-6 lg:pt-6">
        {children}
      </main>
    </div>
  );
}

export default Sidebar;