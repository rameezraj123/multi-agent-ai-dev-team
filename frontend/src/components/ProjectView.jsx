import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { downloadProject, getProject } from "../api";
import StatusBadge, { isFinished } from "./StatusBadge";

// The status always names the agent that is working right now.
const STEPS = [
  { key: "planning", name: "Project Manager", desc: "Plans the project" },
  { key: "developing", name: "Developer", desc: "Writes the code" },
  { key: "testing", name: "Tester", desc: "Runs the tests" },
  { key: "reviewing", name: "Code Reviewer", desc: "Reviews the result" },
];

const TABS = [
  ["activity", "Activity"],
  ["plan", "Plan"],
  ["code", "Code"],
  ["tests", "Tests"],
  ["review", "Review"],
];

function Pipeline({ status }) {
  const done = status === "completed" || status === "completed_with_issues";
  const active = STEPS.findIndex((s) => s.key === status);
  return (
    <ol className="pipeline">
      {STEPS.map((step, i) => {
        let state = "idle";
        if (done) state = "done";
        else if (status !== "failed" && i < active) state = "done";
        else if (i === active) state = "active";
        return (
          <li key={step.key} className={`step ${state}`}>
            <span className="dot">{state === "done" ? "✓" : i + 1}</span>
            <div>
              <strong>{step.name}</strong>
              <small>{step.desc}</small>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Placeholder({ children }) {
  return <p className="empty">{children}</p>;
}

function ActivityTab({ logs }) {
  if (!logs.length) return <Placeholder>Waiting for the first agent to report...</Placeholder>;
  return (
    <ul className="activity">
      {logs.map((log, i) => (
        <li key={i}>
          <time>{new Date(log.time).toLocaleTimeString()}</time>
          <strong>{log.agent}</strong>
          <span>{log.message}</span>
        </li>
      ))}
    </ul>
  );
}

function CodeTab({ files }) {
  const names = Object.keys(files || {});
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!names.length) return <Placeholder>The Developer has not written any code yet.</Placeholder>;

  const current = names.includes(selected) ? selected : names[0];
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(files[current]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard not available; ignore
    }
  };

  return (
    <div className="code-tab">
      <ul className="file-list">
        {names.map((name) => (
          <li key={name}>
            <button
              className={name === current ? "file active" : "file"}
              onClick={() => setSelected(name)}
            >
              {name}
            </button>
          </li>
        ))}
      </ul>
      <div className="code-wrap">
        <button className="copy" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
        <pre className="code">{files[current]}</pre>
      </div>
    </div>
  );
}

function TestsTab({ project }) {
  if (!project.test_report) return <Placeholder>Tests have not run yet.</Placeholder>;
  return (
    <>
      <p>
        Result:{" "}
        <span className={project.tests_passed ? "badge success" : "badge error"}>
          {project.tests_passed ? "All tests passed" : "Tests failing"}
        </span>
      </p>
      <pre className="code">{project.test_report}</pre>
    </>
  );
}

export default function ProjectView({ id }) {
  const [project, setProject] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("activity");

  // Ask the backend for progress every 2 seconds until the project is finished.
  useEffect(() => {
    let cancelled = false;
    let timer;

    async function load() {
      try {
        const data = await getProject(id);
        if (cancelled) return;
        setProject(data);
        setError("");
        if (!isFinished(data.status)) timer = setTimeout(load, 2000);
      } catch (err) {
        if (cancelled) return;
        setError(err.message);
        timer = setTimeout(load, 4000);
      }
    }

    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id]);

  if (!project) return <p className="empty">{error || "Loading..."}</p>;

  const hasFiles = Object.keys(project.files || {}).length > 0;

  return (
    <div className="project-view">
      <div className="project-head">
        <div>
          <h2>Project #{project.id}</h2>
          <p className="requirement">{project.requirement}</p>
        </div>
        <div className="head-right">
          <StatusBadge status={project.status} />
          {project.iterations > 0 && (
            <small>
              {project.iterations} developer {project.iterations === 1 ? "pass" : "passes"}
            </small>
          )}
          {hasFiles && isFinished(project.status) && (
            <button
              className="primary link"
              onClick={() => downloadProject(project.id).catch((err) => alert(err.message))}
            >
              Download .zip
            </button>
          )}
        </div>
      </div>

      {project.status === "failed" && (
        <div className="banner error">
          Something went wrong: {project.error || "unknown error"}
        </div>
      )}
      {project.status === "completed_with_issues" && (
        <div className="banner warn">
          The Developer used all fix attempts but some tests still fail. See the Tests and Review
          tabs.
        </div>
      )}

      <Pipeline status={project.status} />

      <nav className="tabs">
        {TABS.map(([key, label]) => (
          <button key={key} className={tab === key ? "tab active" : "tab"} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </nav>

      <div className="tab-body">
        {tab === "activity" && <ActivityTab logs={project.logs || []} />}
        {tab === "plan" &&
          (project.plan ? (
            <div className="markdown"><ReactMarkdown>{project.plan}</ReactMarkdown></div>
          ) : (
            <Placeholder>The Project Manager is still working on the plan.</Placeholder>
          ))}
        {tab === "code" && <CodeTab files={project.files} />}
        {tab === "tests" && <TestsTab project={project} />}
        {tab === "review" &&
          (project.review ? (
            <div className="markdown"><ReactMarkdown>{project.review}</ReactMarkdown></div>
          ) : (
            <Placeholder>The review appears once testing is finished.</Placeholder>
          ))}
      </div>
    </div>
  );
}
