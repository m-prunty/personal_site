import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";
import Home from "./pages/Home";
import CV from "./pages/CV";
import Experience from "./pages/Experience";
import ShippyBooks from "./pages/ShippyBooks";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const port_mysql = 8800;

function App() {
  return (
    <div className="App">
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cv" element={<CV />} />
          <Route path="/experience" element={<Experience />} />
          <Route path="/shippybooks" element={<ShippyBooks />} />
        </Routes>
        <Footer />
      </Router>
    </div>
  );
}

export default App;
