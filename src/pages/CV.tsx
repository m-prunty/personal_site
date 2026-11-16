import { MDRender } from "../components/Markdown";
import md from "/resume.md";
import "../styles/CV.css";

function CV() {
  return (
    <div className="cv">
      <div className="cv-header">
        <h1>My CV</h1>
        <h2 className="subtitle">Backend Developer · C / Python · Linux</h2>
      </div>

      <div className="md">
        <MDRender filename={md} />
      </div>
    </div>
  );
}

export default CV;
