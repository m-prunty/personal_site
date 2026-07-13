import { MDRender } from "../components/Markdown";
import md from "/resume.md";

function CV() {
  return (
    <div className="cv" style={{ padding: "40px" }}>
      <div className="cv-header">
        <h1>My CV</h1>
        <h2 className="subtitle">Backend Developer · C / Python · Linux</h2>
      </div>

      <div className="md" style={{ padding: "40px" }}>
        <MDRender filename={md} />
      </div>
    </div>
  );
}

export default CV;
