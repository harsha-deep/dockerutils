import "./App.css";
import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { Toaster } from "sonner";
import { MENU, REFRESH_INTERVAL } from "./constants";
import ContainersView from "./components/ContainersView";
import ImagesView from "./components/ImagesView";
import ServicesView from "./components/ServicesView";
import NetworksView from "./components/NetworksView";
import VolumesView from "./components/VolumesView";
import AboutModal from "./components/AboutModal";
import SettingsModal from "./components/SettingsModal";

function App() {
  const [view, setView] = useState("containers");
  const [showAbout, setShowAbout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("darkMode");
    return stored !== null ? stored === "true" : false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const toggleDark = () => setDarkMode((prev) => !prev);

  useEffect(() => {
    const interval = setInterval(() => { }, REFRESH_INTERVAL);

    const unlistenPromise = listen("menu-event", (event) => {
      const id = event.payload;

      switch (id) {
        case MENU.CONTAINERS:
          setView("containers");
          break;

        case MENU.IMAGES:
          setView("images");
          break;

        case MENU.SERVICES:
          setView("services");
          break;

        case MENU.NETWORKS:
          setView("networks");
          break;

        case MENU.VOLUMES:
          setView("volumes");
          break;

        case MENU.SETTINGS:
          setShowSettings(true);
          break;

        case MENU.ABOUT:
          setShowAbout(true);
          break;

        default:
          console.log("Unhandled menu:", id);
      }
    });

    return () => {
      clearInterval(interval);
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1E1E1E] text-gray-900 dark:text-[#D4D4D4] transition-colors">
      <Toaster richColors position="bottom-right" />

      <div className="px-5 pt-5 pb-2">
        <h2 className="text-xl font-semibold capitalize">{view}</h2>
      </div>

      {view === "containers" && <ContainersView />}
      {view === "images" && <ImagesView />}
      {view === "services" && <ServicesView />}
      {view === "networks" && <NetworksView />}
      {view === "volumes" && <VolumesView />}

      {showSettings && (
        <SettingsModal
          darkMode={darkMode}
          onToggleDark={toggleDark}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}

export default App;