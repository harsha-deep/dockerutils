import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";

function EnvironmentsView({ settings, setSettings }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEnv, setNewEnv] = useState({
    name: "",
    host: "",
    port: 22,
    username: "",
    password: "",
  });

  const saveAndApplySettings = async (newSettings) => {
    try {
      await invoke("save_settings", { newSettings });
      setSettings(newSettings);
      toast.success("Settings saved");
    } catch (e) {
      toast.error(`Failed to save settings: ${e}`);
    }
  };

  const handleSetActive = async (envId) => {
    const updated = { ...settings, active_env_id: envId };
    await saveAndApplySettings(updated);
  };

  const handleDelete = async (envId) => {
    if (envId === "local") return;
    
    // Default to local if deleting the active one
    const newActiveId = settings.active_env_id === envId ? "local" : settings.active_env_id;
    
    const updated = {
      ...settings,
      active_env_id: newActiveId,
      environments: settings.environments.filter((e) => {
        if (e.type === "Local") return true;
        return e.id !== envId;
      }),
    };
    await saveAndApplySettings(updated);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const env = {
      type: "Ssh",
      id: crypto.randomUUID(),
      name: newEnv.name,
      host: newEnv.host,
      port: parseInt(newEnv.port, 10),
      username: newEnv.username,
      password: newEnv.password || null,
    };

    const updated = {
      ...settings,
      environments: [...settings.environments, env],
    };
    await saveAndApplySettings(updated);
    setShowAddModal(false);
    setNewEnv({ name: "", host: "", port: 22, username: "", password: "" });
  };

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Manage Environments</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Add SSH Environment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settings.environments.map((env) => {
          const isLocal = env.type === "Local";
          const id = isLocal ? "local" : env.id;
          const isActive = settings.active_env_id === id;

          return (
            <div
              key={id}
              className={`p-4 rounded-xl border ${
                isActive
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-[#3C3C3C] bg-white dark:bg-[#252526]"
              } shadow-sm transition-all`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isActive ? "bg-green-500" : "bg-gray-400"}`}></div>
                  <h4 className="font-semibold text-lg">{isLocal ? "Local Machine" : env.name}</h4>
                </div>
                {isActive && (
                  <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 px-2 py-1 rounded-full font-medium">
                    Active
                  </span>
                )}
              </div>
              
              {!isLocal && (
                <div className="text-sm text-gray-600 dark:text-[#9E9E9E] mb-4">
                  <p>{env.username}@{env.host}:{env.port}</p>
                </div>
              )}
              {isLocal && (
                <div className="text-sm text-gray-600 dark:text-[#9E9E9E] mb-4">
                  <p>Uses local Docker daemon</p>
                </div>
              )}

              <div className="flex gap-2 mt-auto">
                {!isActive && (
                  <button
                    onClick={() => handleSetActive(id)}
                    className="flex-1 bg-gray-100 dark:bg-[#3C3C3C] hover:bg-gray-200 dark:hover:bg-[#4D4D4D] px-3 py-1.5 rounded text-sm font-medium transition-colors"
                  >
                    Connect
                  </button>
                )}
                {!isLocal && (
                  <button
                    onClick={() => handleDelete(id)}
                    className="flex-none text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-[#252526] rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">Add SSH Environment</h2>
            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  required
                  type="text"
                  value={newEnv.name}
                  onChange={(e) => setNewEnv({ ...newEnv, name: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#3C3C3C] rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  placeholder="Production Server"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-[3]">
                  <label className="block text-sm font-medium mb-1">Host</label>
                  <input
                    required
                    type="text"
                    value={newEnv.host}
                    onChange={(e) => setNewEnv({ ...newEnv, host: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#3C3C3C] rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                    placeholder="192.168.1.100"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Port</label>
                  <input
                    required
                    type="number"
                    value={newEnv.port}
                    onChange={(e) => setNewEnv({ ...newEnv, port: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#3C3C3C] rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  required
                  type="text"
                  value={newEnv.username}
                  onChange={(e) => setNewEnv({ ...newEnv, username: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#3C3C3C] rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  placeholder="root"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={newEnv.password}
                  onChange={(e) => setNewEnv({ ...newEnv, password: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#3C3C3C] rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  placeholder="Optional (if using agent, though not supported yet)"
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-[#3C3C3C] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Add Environment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnvironmentsView;
