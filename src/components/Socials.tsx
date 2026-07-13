import {
  GitHub as GithubIcon,
  LinkedIn as LinkedInIcon,
  Email as EmailIcon,
} from "@mui/icons-material";

export const Socials = () => {
  return (
    <div>
      <a href="https://github.com/m-prunty" target="_blank" rel="noreferrer">
        <GithubIcon />
      </a>
      <a
        href="https://www.linkedin.com/in/marcusprunty/"
        target="_blank"
        rel="noreferrer"
      >
        <LinkedInIcon />
      </a>
      <a href="mailto:marcusprunty@gmail.com" target="_blank" rel="noreferrer">
        <EmailIcon />
      </a>
    </div>
  );
};
