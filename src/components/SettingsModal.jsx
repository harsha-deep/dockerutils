import { useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

function SettingsModal({ darkMode, onToggleDark, onClose }) {
  const [updateStatus, setUpdateStatus] = useState(null); // null | "checking" | "available" | "downloading" | "up-to-date" | "error"
  const [updateError, setUpdateError] = useState(null);

  const checkForUpdates = async () => {
    setUpdateStatus("checking");
    setUpdateError(null);
    try {
      const update = await check();
      if (update) {
        setUpdateStatus("downloading");
        await update.downloadAndInstall();
        setUpdateStatus("available");
        await relaunch();
      } else {
        setUpdateStatus("up-to-date");
      }
    } catch (err) {
      setUpdateStatus("error");
      setUpdateError(err?.toString() || "Update check failed");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#252526] rounded-2xl shadow-2xl w-96 p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-[#D4D4D4]">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-[#9E9E9E] hover:text-gray-600 dark:hover:text-[#D4D4D4] cursor-pointer transition-colors"
            aria-label="Close settings"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <hr className="border-gray-200 dark:border-[#3C3C3C]" />

        {/* Dark Mode Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#2D2D2D] flex items-center justify-center">
              {darkMode ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4 text-indigo-400"
                >
                  <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-4 h-4 text-amber-500"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" strokeLinecap="round" />
                  <line x1="12" y1="21" x2="12" y2="23" strokeLinecap="round" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" strokeLinecap="round" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" strokeLinecap="round" />
                  <line x1="1" y1="12" x2="3" y2="12" strokeLinecap="round" />
                  <line x1="21" y1="12" x2="23" y2="12" strokeLinecap="round" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" strokeLinecap="round" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-[#D4D4D4]">
                Dark Mode
              </p>
              <p className="text-xs text-gray-500 dark:text-[#9E9E9E]">
                {darkMode ? "Dark theme active" : "Light theme active"}
              </p>
            </div>
          </div>

          {/* Toggle switch */}
          <button
            role="switch"
            aria-checked={darkMode}
            onClick={onToggleDark}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              darkMode ? "bg-indigo-600" : "bg-gray-300 dark:bg-[#3C3C3C]"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                darkMode ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <hr className="border-gray-200 dark:border-[#3C3C3C]" />

        {/* Check for Updates Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#2D2D2D] flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-4 h-4 text-green-500"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-[#D4D4D4]">
                Updates
              </p>
              <p className="text-xs text-gray-500 dark:text-[#9E9E9E]">
                {updateStatus === "checking" && "Checking for updates…"}
                {updateStatus === "downloading" && "Downloading update…"}
                {updateStatus === "up-to-date" && "You're on the latest version"}
                {updateStatus === "error" && (updateError || "Update check failed")}
                {updateStatus === null && "Check for new versions"}
              </p>
            </div>
          </div>
          <button
            onClick={checkForUpdates}
            disabled={updateStatus === "checking" || updateStatus === "downloading"}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {updateStatus === "checking" || updateStatus === "downloading" ? "Checking…" : "Check"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
