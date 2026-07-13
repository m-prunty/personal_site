import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";
import { School as SchoolIcon, Work as WorkIcon } from "@mui/icons-material";

function Experience() {
  return (
    <div className="experience">
      <VerticalTimeline lineColor="#3e497a">
        <VerticalTimelineElement
          className="vertical-timeline-element--work"
          date="2026 - current"
          iconStyle={{ background: "#e9d35b", color: "#fff" }}
          icon={<WorkIcon />}
        >
          <h3 className="vertical-timeline-element-title">Alignerr</h3>
          <h4 className="vertical-timeline-element-subtitle">
            <a href="https://www.alignerr.com/"> Company site </a>
          </h4>
          <p>Python, OOP, Design principles, AI training</p>
        </VerticalTimelineElement>

        <VerticalTimelineElement
          className="vertical-timeline-element--education"
          date="2025 - current"
          iconStyle={{ background: "#3e497a", color: "#fff" }}
          icon={<SchoolIcon />}
        >
          <h3 className="vertical-timeline-element-title">42 Heilbronn</h3>
          <h4 className="vertical-timeline-element-subtitle">
            <a href="https://www.42heilbronn.de/en/learning-model/">42 Next </a>
          </h4>
          <p>
            Python, OOP, AI, C/C++, Linux, Bash scripting, Vim, Code Review{" "}
          </p>
        </VerticalTimelineElement>

        <VerticalTimelineElement
          className="vertical-timeline-element--education"
          date="2023 - 2025"
          iconStyle={{ background: "#3e497a", color: "#fff" }}
          icon={<SchoolIcon />}
        >
          <h3 className="vertical-timeline-element-title">42 London</h3>
          <h4 className="vertical-timeline-element-subtitle">
            <a href="https://42london.com/curriculum/">42 Common Core </a>
          </h4>
          <p>C/C++, Linux, Bash scripting, Vim, Code Review </p>
        </VerticalTimelineElement>

        <VerticalTimelineElement
          className="vertical-timeline-element--education"
          date="2023 - 2024"
          iconStyle={{ background: "#3e497a", color: "#fff" }}
          icon={<SchoolIcon />}
        >
          <h3 className="vertical-timeline-element-title">
            Hyperion/CoGrammer
          </h3>

          <h4 className="vertical-timeline-element-subtitle">
            <a href="https://www.hyperiondev.com/bootcamps/data-science-bootcamp/">
              {" "}
              Data Science Bootcamp{" "}
            </a>
          </h4>
          <p> Python, Data Analysis skills, Machine Learning </p>
        </VerticalTimelineElement>

        <VerticalTimelineElement
          className="vertical-timeline-element--education"
          date="2020 - 2022"
          iconStyle={{ background: "#3e497a", color: "#fff" }}
          icon={<SchoolIcon />}
        >
          <h3 className="vertical-timeline-element-title">UCC, Ireland</h3>

          <h4 className="vertical-timeline-element-subtitle">
            <a href="https://www.ucc.ie/en/ck411/">
              {" "}
              BSc Data Science & Analytics{" "}
            </a>
          </h4>
          <p>
            {" "}
            Python, Java, SQL, R, Statistics and Probability, Calculus
            (Multivariable), Linear Algebra, Algorithms and Data Structures,
            Maths Modelling, Regression Analysis.
            <a href="https://ucc-ie-public.courseleaf.com/programmes/bscdsa/#programmerequirementstext">
              {" "}
              full list...{" "}
            </a>
          </p>
        </VerticalTimelineElement>

        <VerticalTimelineElement
          className="vertical-timeline-element--education"
          date="2018 - 2019"
          iconStyle={{ background: "#3e497a", color: "#fff" }}
          icon={<SchoolIcon />}
        >
          <h3 className="vertical-timeline-element-title">
            NUI Galway, Ireland
          </h3>

          <h4 className="vertical-timeline-element-subtitle">
            Mature Student Access Programme - Science Path
          </h4>
          <p>Maths, Physics, Biology, Chemistry, Academic Skills</p>
        </VerticalTimelineElement>

        <VerticalTimelineElement
          className="vertical-timeline-element--work"
          date="2006 - 2025"
          iconStyle={{ background: "#e9d35b", color: "#fff" }}
          icon={<WorkIcon />}
        >
          <h3 className="vertical-timeline-element-title">Career as a Chef</h3>
          <p>
            I have had a dynamic and varied career as a Chef since first
            starting in professional kitchens at 16 years old.
            <br />
            I've worked my way up from dish washing to running my own kitchens
            in a broad variety of establishments in Ireland, U.K, France and
            Australia
          </p>
        </VerticalTimelineElement>
      </VerticalTimeline>
    </div>
  );
}

export default Experience;
