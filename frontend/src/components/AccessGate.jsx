import { useState } from "react";
import { checkAccess, setAccessCode } from "../api";

export default function AccessGate({ onSuccess }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setAccessCode(code.trim());
    try {
      await checkAccess();
      onSuccess();
    } catch (err) {
      setError(err.status === 401 ? "Wrong access code." : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="gate">
      <form className="card" onSubmit={submit}>
        <h2>Access code required</h2>
        <p className="empty">
          This demo runs AI agents on a shared server, so it is protected. Enter the access code to
          continue.
        </p>
        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Access code"
          autoFocus
        />
        {error && <p className="error-text">{error}</p>}
        <button className="primary" type="submit" disabled={busy || !code.trim()}>
          {busy ? "Checking..." : "Enter"}
        </button>
      </form>
    </div>
  );
}
