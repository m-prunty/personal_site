import React from "react";
import { MDRender } from "../components/Markdown";
import md from "/resume.md";

function CV() {
  return (
    <div className="cv">
       <div className="cv-header">
        <h1>My CV</h1>
        <p className="subtitle">Backend Developer · C / Python · Linux</p>
      </div>

      <div className="md">
        <MDRender filename={md} />
      </div>
    </div>
  );
}

export default CV;
