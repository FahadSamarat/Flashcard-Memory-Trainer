import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useRef, useEffect } from "react";
import "./App.css";
import Layout from "./components/Layout";
//
import Home from "./components/Home";
import About from "./components/About";
import Decks from "./components/Decks";

function HomePage() {
  const homeRef = useRef(null);
  const aboutRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    // Handle initial navigation with hash (when coming from other routes)
    const hash = location.hash.substring(1); // Remove the # symbol
    if (hash) {
      setTimeout(() => {
        if (hash === "home" && homeRef.current) {
          homeRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        } else if (hash === "about" && aboutRef.current) {
          aboutRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 200); // Small delay to ensure components are mounted
    }
  }, [location.hash]);

  useEffect(() => {
    // Handle navigation clicks for smooth scrolling
    const handleNavClick = (e) => {
      if (
        e.target.tagName === "A" &&
        e.target.getAttribute("href")?.startsWith("#")
      ) {
        e.preventDefault();
        const targetId = e.target.getAttribute("href").substring(1);
        
        // Use refs to scroll to components
        if (targetId === "home" && homeRef.current) {
          homeRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          window.history.pushState(null, "", "#home");
        } else if (targetId === "about" && aboutRef.current) {
          aboutRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          window.history.pushState(null, "", "#about");
        }
      }
    };

    // Add event listener to document for navigation clicks
    document.addEventListener("click", handleNavClick);

    // Cleanup function
    return () => {
      document.removeEventListener("click", handleNavClick);
    };
  }, [location.hash]);

  return (
    <>
      <div ref={homeRef}>
        <Home />
      </div>
      <div ref={aboutRef}>
        <About />
      </div>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/decks" element={<Decks />} />
        </Routes>
      </Layout>
    </Router>
  );
}
