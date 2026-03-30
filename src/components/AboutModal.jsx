import { openUrl } from "@tauri-apps/plugin-opener";
import { GITHUB_URL, APP_VERSION } from "../constants";

function AboutModal({ onClose }) {
  const handleGitHub = async () => {
    try {
      await openUrl(GITHUB_URL);
    } catch {
      // fallback: copy to clipboard or ignore
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-80 p-8 flex flex-col items-center gap-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Docker-inspired icon */}
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
          <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-10 h-10"
          >
            {/* Container stack icon */}
            <rect x="4" y="22" width="10" height="8" rx="1.5" fill="white" />
            <rect x="16" y="22" width="10" height="8" rx="1.5" fill="white" />
            <rect x="28" y="22" width="10" height="8" rx="1.5" fill="white" />
            <rect x="4" y="12" width="10" height="8" rx="1.5" fill="white" opacity="0.7" />
            <rect x="16" y="12" width="10" height="8" rx="1.5" fill="white" opacity="0.7" />
            <rect x="16" y="32" width="10" height="8" rx="1.5" fill="white" opacity="0.5" />
            {/* Whale tail hint */}
            <path
              d="M39 30 C42 28 44 24 44 20"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.8"
            />
          </svg>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Dockyard
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            v{APP_VERSION}
          </p>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          A lightweight desktop tool to manage Docker containers, images, services, networks, and volumes.
        </p>

        <button
          onClick={handleGitHub}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors cursor-pointer"
        >
          {/* GitHub icon */}
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.296 2.747-1.026 2.747-1.026.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0022 12.021C22 6.484 17.522 2 12 2z" />
          </svg>
          View on GitHub
        </button>

        <button
          onClick={onClose}
          className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default AboutModal;
