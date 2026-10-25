import { useState } from "react";
import { createProject } from "../api";

const EXAMPLES = [
  "Build a command-line todo list manager",
  "Build a password strength checker with a scoring system",
  "Build a library for converting between temperature, length and weight units",
];

export default function RequirementForm({ onCreated }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const project = await createProject(text.trim());
      setText("");
      onCreated(project);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const tooShort = text.trim().length < 10;

  return (
    <section className="card">
      <h2>New project</h2>
      <textarea
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Describe the software you want built (at least 10 characters)..."
      />
      <div className="chips">
        {EXAMPLES.map((example) => (
          <button key={example} type="button" className="chip" onClick={() => setText(example)}>
            {example}
          </button>
        ))}
      </div>
      {error && <p className="error-text">{error}</p>}
      <button className="primary" onClick={submit} disabled={busy || tooShort}>
        {busy ? "Starting..." : "Build it"}
      </button>
    </section>
  );
}
