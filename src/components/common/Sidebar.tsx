"use client";

import React, { FC, useState } from "react";
import Link from "next/link";

import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  ClipboardList,
  ChevronDown,
} from "lucide-react";

interface IconProps {
  size?: number;
}

interface MenuItem {
  title: string;
  icon: React.ReactElement<IconProps>;
  path?: string;
  submenu?: {
    title: string;
    path: string;
    icon: React.ReactElement<IconProps>;
    className?: string;
  }[];
}

const instructureMenuItems: MenuItem[] = [
  {
    title: "Dashboard",
    icon: <LayoutDashboard size={12} />,
    path: "/instructure/dashboard",
  },
  {
    title: "My Courses",
    icon: <BookOpen size={20} />,
    path: "/instructure/my-course",
  },
  {
    title: "Certificate",
    icon: <FileText size={20} />,
    path: "/instructure/certificate",
  },
];

const adminMenuItems: MenuItem[] = [
  {
    title: "Dashboard",
    icon: <LayoutDashboard size={12} />,
    path: "/dashboard",
  },
  {
    title: "User management",
    icon: <Users size={20} />,
    submenu: [
      { title: "user", path: "/user", icon: <Users size={16} /> },
      { title: "usertype", path: "/usertype", icon: <Users size={16} /> },
      /* HIDDEN - User Rule menu item
      {
        title: "user rule",
        path: "/user-rule",
        icon: <ClipboardList size={16} />,
      },
      */
      { title: "instructure", path: "/instructure", icon: <Users size={16} /> },
      { title: "participant", path: "/participant", icon: <Users size={16} /> },
    ],
  },
  {
    title: "Training management",
    icon: <BookOpen size={20} />,
    submenu: [
      {
        title: "course schedule",
        path: "/course-schedule",
        icon: <ClipboardList size={16} />,
      },
      {
        title: "course type",
        path: "/course-type",
        icon: <BookOpen size={16} />,
      },
      { title: "courses", path: "/courses", icon: <BookOpen size={16} /> },
      {
        title: "list certificate",
        path: "/list-certificate",
        icon: <FileText size={16} />,
      },
    ],
  },
  {
    title: "Report",
    icon: <FileText size={20} />,
    submenu: [
      {
        title: "certificate expired",
        path: "/certificate-expired",
        icon: <FileText size={16} />,
      },
      {
        title: "payment report",
        path: "/payment-report",
        icon: <FileText size={16} />,
      },
    ],
  },
];

const participantMenuItems: MenuItem[] = [
  {
    title: "Dashboard",
    icon: <LayoutDashboard size={12} />,
    path: "/participant/dashboard",
  },
  {
    title: "My Courses",
    icon: <BookOpen size={20} />,
    path: "/participant/my-course",
  },
  {
    title: "My Certificates",
    icon: <FileText size={20} />,
    path: "/participant/my-certificate",
  },
  {
    title: "Payment",
    icon: <FileText size={20} />,
    path: "/participant/payment",
  },
];

export interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
  variant?: "admin" | "participant" | "instructure";
}

const Sidebar: FC<SidebarProps> = ({
  isMobileOpen,
  onMobileClose,
  variant = "admin",
}) => {
  const [openMenus, setOpenMenus] = useState<string[]>(
    variant === "admin"
      ? ["User management", "Training management", "Report"]
      : []
  );

  const menuItems =
    variant === "admin"
      ? adminMenuItems
      : variant === "participant"
      ? participantMenuItems
      : instructureMenuItems;

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => {
      if (prev.includes(title)) {
        return prev.filter((item) => item !== title);
      } else {
        return [...prev, title];
      }
    });
  };

  return (
    <>
      {/* Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50
          w-48 h-screen bg-[#E7E7E7]
          transition-transform duration-300 ease-in-out
          ${
            isMobileOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }
        `}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-2 flex justify-end md:hidden">
            <button
              onClick={() => {
                onMobileClose();
                document.body.style.overflow = "auto";
              }}
              className="p-1 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Menu Items dengan custom scrollbar */}
          <div className="flex-1 overflow-y-auto scrollbar-hide px-2 py-1">
            <div className="space-y-1 pb-16">
              {menuItems.map((item) => (
                <div key={item.title} className="space-y-0.5">
                  {item.submenu ? (
                    <div className="space-y-1">
                      <button
                        onClick={() => toggleMenu(item.title)}
                        className="flex items-center justify-between w-full p-1.5 text-gray-700 hover:bg-gray-100 rounded-md"
                      >
                        <div className="flex items-center gap-1.5">
                          {React.cloneElement(item.icon, { size: 14 })}
                          <span className="text-xs font-medium">
                            {item.title}
                          </span>
                        </div>
                        <ChevronDown
                          size={12}
                          className={`transform transition-transform duration-300 ${
                            openMenus.includes(item.title) ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      <div
                        className={`ml-5 mb-2 transform transition-all duration-300 ease-in-out ${
                          openMenus.includes(item.title)
                            ? "opacity-100 max-h-96 translate-y-0"
                            : "opacity-0 max-h-0 -translate-y-2 overflow-hidden"
                        }`}
                      >
                        <div className="bg-white rounded-md p-0.5">
                          {item.submenu.map((subItem) => (
                            <Link
                              key={subItem.path}
                              href={subItem.path}
                              className={`flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 py-1 px-1.5 rounded transition-colors ${
                                subItem.className || ""
                              }`}
                            >
                              {React.cloneElement(subItem.icon, { size: 12 })}
                              <span>{subItem.title}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={item.path || "#"}
                      className="flex items-center gap-2 p-1.5 text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                      {React.cloneElement(item.icon, { size: 14 })}
                      <span className="text-xs font-medium">{item.title}</span>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
