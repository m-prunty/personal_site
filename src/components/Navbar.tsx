import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/Navbar.css";
import { Reorder as ReorderIcon } from "@mui/icons-material";
import Logo from "/quad_parabola_fin.svg";

function Navbar() {
  const [expandNavbar, setExpandNavbar] = useState<boolean>(false);

  const location = useLocation();

  useEffect(() => {
    setExpandNavbar(false);
  }, [location]);

  return (
    <div className="navbar" id={expandNavbar ? "open" : "close"}>
      <div className="toggleButton">
        <button
          onClick={() => {
            setExpandNavbar((prev) => !prev);
          }}
        >
          <ReorderIcon />
        </button>
      </div>
      <div className="links">
        <img src={Logo} alt="logo" className="logo" />
        <Link to="/"> Home </Link>
        <Link to="/cv"> CV </Link>
        <Link to="/experience"> Experience </Link>
        <Link to="/shippybooks"> ShippyBooks </Link>
      </div>
    </div>
  );
}

export default Navbar;
