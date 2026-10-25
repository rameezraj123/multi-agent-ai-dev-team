const LABELS = {
  queued: ["Queued", "running"],
  planning: ["Planning", "running"],
  developing: ["Developing", "running"],
  testing: ["Testing", "running"],
  reviewing: ["Reviewing", "running"],
  completed: ["Completed", "success"],
  completed_with_issues: ["Done, tests failing", "warn"],
  failed: ["Failed", "error"],
};

export const FINISHED = ["completed", "completed_with_issues", "failed"];
export const isFinished = (status) => FINISHED.includes(status);

export default function StatusBadge({ status }) {
  const [label, tone] = LABELS[status] || [status, "running"];
  return <span className={`badge ${tone}`}>{label}</span>;
}
