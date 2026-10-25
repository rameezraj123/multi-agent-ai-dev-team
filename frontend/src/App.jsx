import { useCallback, useEffect, useState } from "react";
import { checkAccess, listProjects } from "./api";
import AccessGate from "./components/AccessGate";
import RequirementForm from "./components/RequirementForm";
import ProjectList from "./components/ProjectList";
import ProjectView from "./components/ProjectView";

export default function App() {
  const [auth, setAuth] = useState("checking"); // checking | needed | ok
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [backendError, setBackendError] = useState("");

  // Ask the backend whether an access code is needed (and whether the saved one still works).
  useEffect(() => {
    checkAccess()
      .then(() => setAuth("ok"))
      // Any other error (e.g. backend offline) falls through so the red banner can explain it.
      .catch((err) => setAuth(err.status === 401 ? "needed" : "ok"));
  }, []);

  const refresh = useCallback(async () => {
    try {
      setProjects(await listProjects());
      setBackendError("");
    } catch (err) {
      if (err.status === 401) setAuth("needed");
      else setBackendError("Cannot reach the backend. Is it running? (A free server may need ~1 minute to wake up.)");
    }
  }, []);

  useEffect(() => {
    if (auth !== "ok") return undefined;
    refresh();
    const timer = setInterval(refresh, 4000);
    return () => clearInterval(timer);
  }, [auth, refresh]);

  const handleCreated = (project) => {
    setSelectedId(project.id);
    refresh();
  };

  if (auth === "checking") return <p className="empty center">Connecting...</p>;
  if (auth === "needed") return <AccessGate onSuccess={() => setAuth("ok")} />;

  return (
    <div className="app">
      <header className="topbar">
        <h1>Multi-Agent AI Software Dev Team</h1>
        <p>Describe software in plain English. Four AI agents plan, build, test and review it.</p>
      </header>

      {backendError && <div className="banner error">{backendError}</div>}

      <div className="layout">
        <aside className="sidebar">
          <RequirementForm onCreated={handleCreated} />
          <ProjectList projects={projects} selectedId={selectedId} onSelect={setSelectedId} />
        </aside>

        <main className="main">
          {selectedId ? (
            <ProjectView key={selectedId} id={selectedId} />
          ) : (
            <div className="welcome">
              <h2>Welcome</h2>
              <p>
                Type what you want built on the left and press <strong>Build it</strong>. You can
                watch each agent work in real time.
              </p>
              <ol>
                <li><strong>Project Manager</strong> writes the plan</li>
                <li><strong>Developer</strong> writes the code</li>
                <li><strong>Tester</strong> writes and runs tests, sending bugs back to the Developer</li>
                <li><strong>Code Reviewer</strong> reviews the final result</li>
              </ol>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
