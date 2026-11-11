import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import Home from "./pages/Home";
import CV from "./pages/CV";
import Experience from "./pages/Experience";
import ShippyBooks from "./pages/ShippyBooks";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { appTheme } from "./theme";

function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
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
    </ThemeProvider>
  );
}

export default App;
