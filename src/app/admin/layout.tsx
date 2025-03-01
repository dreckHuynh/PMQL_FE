"use client";

import { useState } from "react";
import "../globals.css";
import Link from "next/link";
import CurrentTime from "../../components/timer";
import LogoutButton from "../../components/logoutButton";
import { XMarkIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";
import ResetPasswordButton from "@/components/resetPasswordButton";
import { useAuth } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const pathname = usePathname();

  const menuItems = [
    {
      href: "/admin/teams",
      label: "Tổ",
      hidden: !user?.is_admin,
    },
    { href: "/admin/customers", label: "Khách hàng" },
    {
      href: "/admin/employees",
      label: "Nhân viên",
      hidden: !user?.is_admin && !user?.is_team_lead,
    },
    {
      href: "/admin/statistical",
      label: "Thống kê",
    },
  ];

  // Toggle sidebar function
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div>
      {/* Navbar */}
      <nav
        className={`fixed top-0 z-10 bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 sm:ml-64 sm:w-[calc(100vw_-_16rem)] w-full ml-0`}
      >
        <div className="px-3 py-3 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            {/* Sidebar Toggle Button */}
            <button
              onClick={toggleSidebar}
              type="button"
              className="p-2 rounded-lg sm:hidden text-gray-900 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600"
              aria-label="Toggle sidebar"
            >
              {isSidebarOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>

            {/* Centered Current Time */}
            <div className="flex-1 flex justify-center">
              <CurrentTime />
            </div>

            {/* Logout Button */}
            <ResetPasswordButton />
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700 sm:translate-x-0`}
      >
        <div className="h-full px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800">
          <ul className="space-y-2 font-medium">
            {menuItems.map(
              (item) =>
                item.hidden || (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center p-2 rounded-lg group transition-colors ${
                        pathname === item.href
                          ? "bg-gray-200 dark:bg-gray-700 text-blue-600 dark:text-blue-400 font-semibold"
                          : "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <span className="ms-3">{item.label}</span>
                    </Link>
                  </li>
                )
            )}
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <div className="p-4 sm:ml-64">
        <div className="p-4 mt-14">{children}</div>
      </div>
    </div>
  );
}
