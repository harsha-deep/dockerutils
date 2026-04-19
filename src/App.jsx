import "./App.css";
import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { Toaster } from "sonner";
import { MENU, REFRESH_INTERVAL } from "./constants";
import ContainersView from "./components/ContainersView";
import ImagesView from "./components/ImagesView";
import ServicesView from "./components/ServicesView";
import NetworksView from "./components/NetworksView";
import VolumesView from "./components/VolumesView";
import EnvironmentsView from "./components/EnvironmentsView";
import AboutModal from "./components/AboutModal";
import SettingsModal from "./components/SettingsModal";

function App() {
  const [view, setView] = useState("containers");
  const [showAbout, setShowAbout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({ environments: [], active_env_id: "local" });

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
    // Fetch initial settings
    invoke("get_settings").then(setSettings).catch(console.error);

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

        case MENU.ENVIRONMENTS:
          setView("environments");
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
      <Toaster richColors closeButton position="bottom-right" />

      <div className="px-5 pt-5 pb-2">
        <h2 className="text-xl font-semibold capitalize">{view}</h2>
      </div>

      {view === "containers" && <ContainersView />}
      {view === "images" && <ImagesView />}
      {view === "services" && <ServicesView />}
      {view === "networks" && <NetworksView />}
      {view === "volumes" && <VolumesView />}
      {view === "environments" && <EnvironmentsView settings={settings} setSettings={setSettings} />}

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