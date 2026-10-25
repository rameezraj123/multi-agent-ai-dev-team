import StatusBadge from "./StatusBadge";

export default function ProjectList({ projects, selectedId, onSelect }) {
  return (
    <section className="card">
      <h2>Your projects</h2>
      {projects.length === 0 ? (
        <p className="empty">Nothing yet. Your projects will show up here.</p>
      ) : (
        <ul className="project-list">
          {projects.map((p) => (
            <li key={p.id}>
              <button
                className={p.id === selectedId ? "project-item active" : "project-item"}
                onClick={() => onSelect(p.id)}
              >
                <span className="project-title">
                  #{p.id} {p.requirement}
                </span>
                <StatusBadge status={p.status} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
