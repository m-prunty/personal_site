import "./App.css";
<<<<<<< HEAD:src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";
=======
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
>>>>>>> origin/tsport:src/App.tsx
import Home from "./pages/Home";
import CV from "./pages/CV";
import Experience from "./pages/Experience";
import ShippyBooks from "./pages/ShippyBooks";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

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
