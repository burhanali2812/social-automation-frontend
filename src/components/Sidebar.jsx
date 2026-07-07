import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Sidebar({ children }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userRole = token ? JSON.parse(atob(token.split(".")[1])).role : null;

  const [isOpen, setIsOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);

  const toggleDropdown = (title) => {
    setOpenMenu(openMenu === title ? null : title);
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
      {
        title: "Social Accounts",
        icon: "fa-share-nodes",
        children: [
          { title: "Connected Accounts", href: "/social-accounts" },
          { title: "Connect Account", href: "/social-accounts" },
        ],
      },
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
      {
        title: "Upload & Post Testing",
        icon: "fa-calendar-check",
        children: [
          { title: "Upload & Post Testing", href: "/testing-upload" },
        ],
      },
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
      { title: "Logout", icon: "fa-right-from-bracket", onClick: handlelogOut },
    ],
  };

  const menuItems = userRole ? roleList[userRole] || [] : [];

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  const BrandMark = ({ size = "h-10 w-10", textSize = "text-base" }) => (
    <div
      className={`${size} ${textSize} flex flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 font-bold text-white`}
    >
      EC
    </div>
  );

  const NavList = ({ inPanel }) => (
    <nav className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overflow-x-hidden px-3 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {menuItems.map((item) =>
        item.children ? (
          <div key={item.title}>
            <button
              type="button"
              onClick={() => toggleDropdown(item.title)}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
            >
              <span className="flex items-center gap-3.5">
                <i className={`fas ${item.icon} w-[18px] text-center text-[15px]`}></i>
                <span className="flex-1 text-left">{item.title}</span>
              </span>
              <i
                className={`fas text-[13px] text-gray-400 transition-transform ${
                  openMenu === item.title ? "fa-chevron-down" : "fa-chevron-right"
                }`}
              ></i>
            </button>

            {openMenu === item.title && (
              <div className="ml-[27px] mt-1.5 mb-2 flex flex-col gap-1 border-l-2 border-gray-200 pl-4 animate-[fadeIn_0.2s_ease]">
                {item.children.map((child) => (
                  <a
                    key={child.title}
                    href={child.href}
                    className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-gray-600 transition-all hover:translate-x-1 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <i className="fas fa-circle text-[6px] text-gray-400"></i>
                    {child.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        ) : inPanel ? (
          <a
            key={item.title}
            href={item.href || "#"}
            onClick={(e) => {
              if (item.onClick) {
                e.preventDefault();
                item.onClick();
              }
            }}
            className="flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
          >
            <i className={`fas ${item.icon} w-[18px] text-center text-[15px]`}></i>
            <span className="flex-1">{item.title}</span>
          </a>
        ) : null
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-[1045] mx-4 mt-2.5 flex items-center justify-between rounded-2xl border-b border-gray-100 bg-white px-4 py-3 shadow-sm lg:hidden">
        <div className="flex flex-shrink-0 items-center">
          <BrandMark size="h-9 w-9" textSize="text-sm" />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h1 className="text-sm font-semibold leading-tight text-gray-900">
            AI Social Automation
          </h1>
         
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleMenu}
            aria-label="Toggle sidebar menu"
            aria-expanded={isOpen}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200"
          >
            <i className="fas fa-bars"></i>
          </button>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-[1040] hidden w-[270px] flex-col border-r border-gray-100 bg-white lg:flex">
        <div className="flex flex-col items-center gap-3 border-b border-gray-100 px-5 py-6">
          <BrandMark size="h-14 w-14" textSize="text-xl" />
          <div className="text-center">
            <h1 className="text-base font-bold leading-snug text-gray-900">
              AI Social Automation
            </h1>
       
          </div>
        </div>

        <NavList inPanel={false} />

        <div className="mt-auto p-4">
          <button
            type="button"
            onClick={handlelogOut}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-red-500 px-3.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600"
          >
            <i className="fas fa-right-from-bracket"></i>
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
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200"
          >
            <i className="fas fa-xmark"></i>
          </button>
        </div>

        <NavList inPanel={true} />
      </aside>

      {isOpen && (
        <div
          onClick={closeMenu}
          className="fixed inset-0 z-[1048] bg-black/45 lg:hidden"
        ></div>
      )}

      <main className="min-h-screen px-4 py-5 pt-[100px] lg:ml-[270px] lg:px-6 lg:py-6 lg:pt-6">
        {children}
      </main>
    </div>
  );
}

export default Sidebar;