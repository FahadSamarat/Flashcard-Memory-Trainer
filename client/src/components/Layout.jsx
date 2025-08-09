import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Label,
  Modal,
  ModalBody,
  ModalHeader,
  TextInput,
} from "flowbite-react";
import {
  Dropdown,
  DropdownDivider,
  DropdownHeader,
  DropdownItem,
  Avatar,
} from "flowbite-react";

import api from "../lib/api";

export default function Layout({ children }) {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isDecksActive = location.pathname.startsWith("/decks");
  const navClass = (active) =>
    `${active ? "text-[#5dd39e]" : "hover:text-gray-500"} transition-colors`;
  const [openModal, setOpenModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [openSignup, setOpenSignup] = useState(false);
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [authUser, setAuthUser] = useState(null);

  function onCloseModal() {
    setOpenModal(false);
    setEmail("");
    setPassword("");
  }
  function onCloseSignup() {
    setOpenSignup(false);
    setSignupName("");
    setSignupEmail("");
    setSignupPassword("");
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userJson = localStorage.getItem("user");
    if (token && userJson) {
      try {
        const parsed = JSON.parse(userJson);
        setAuthUser(parsed);
      } catch (err) {
        // bad stored user; clear
        localStorage.removeItem("user");
        console.log(err);
      }
    }
  }, []);

  useEffect(() => {
    const openLogin = () => setOpenModal(true);
    document.addEventListener("open-login-modal", openLogin);
    return () => document.removeEventListener("open-login-modal", openLogin);
  }, []);

  const handleLogin = async () => {
    try {
      const res = await api.post("/api/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setAuthUser(res.data.user);
      onCloseModal();
    } catch (e) {
      alert(e?.response?.data?.error || "Login failed");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/api/auth/signup", {
        name: signupName,
        email: signupEmail,
        password: signupPassword,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setAuthUser(res.data.user);
      onCloseSignup();
    } catch (e) {
      alert(e?.response?.data?.error || "Signup failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthUser(null);
    // Full refresh ensures protected state is reset everywhere
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-bg-[#00a6fb]/60 to-transparent backdrop-blur-md text-white flex items-center h-14">
        <h1 className="text-xl font-bold mr-16 pl-4 h-full pt-2.5">
          Flashcard Memory Trainer
        </h1>
        <ul className="flex space-x-6 text-lg">
          {isHomePage ? (
            <>
              <li>
                <a
                  href="#home"
                  className="hover:text-gray-500 transition-colors"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  className="hover:text-gray-500 transition-colors"
                >
                  About
                </a>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link
                  to="/#home"
                  className="hover:text-gray-500 transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/#about"
                  className="hover:text-gray-500 transition-colors"
                >
                  About
                </Link>
              </li>
            </>
          )}
          {authUser && (
            <li>
              <Link to="/decks" className={navClass(isDecksActive)}>
                Decks
              </Link>
            </li>
          )}
        </ul>
        <div className="ml-auto flex items-center gap-2 pr-4">
          {!authUser ? (
            <>
              <Button
                className="cursor-pointer border-none"
                color="dark"
                size="sm"
                onClick={() => setOpenModal(true)}
              >
                Log In
              </Button>
              <Button
                className="cursor-pointer bg-gradient-to-r from-cyan-500 to-blue-500"
                color="purple"
                size="sm"
                onClick={() => setOpenSignup(true)}
              >
                Sign Up
              </Button>
            </>
          ) : (
            <Dropdown
              inline
              arrowIcon={false}
              label={
                <Avatar
                  rounded
                  alt={authUser.name}
                  img={undefined}
                  placeholderInitials={authUser.name?.[0]?.toUpperCase() || "U"}
                />
              }
            >
              <DropdownHeader>
                <span className="block text-sm">{authUser.name}</span>
                <span className="block truncate text-sm font-medium">
                  {authUser.email}
                </span>
              </DropdownHeader>
              <DropdownItem onClick={() => {}}>Profile</DropdownItem>
              <DropdownDivider />
              <DropdownItem onClick={handleLogout}>Sign out</DropdownItem>
            </Dropdown>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Log In Modal */}
      <Modal show={openModal} size="md" onClose={onCloseModal} popup>
        <ModalHeader />
        <ModalBody>
          <div className="space-y-6">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              Log in to our platform
            </h3>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="email">Your email</Label>
              </div>
              <TextInput
                id="email"
                placeholder="name@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="password">Your password</Label>
              </div>
              <TextInput
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="w-full">
              <Button
                className="bg-gradient-to-r from-cyan-500 to-blue-500 cursor-pointer"
                onClick={handleLogin}
              >
                Log in to your account
              </Button>
            </div>
            <div className="flex justify-between text-sm font-medium text-gray-500 dark:text-gray-300">
              Not registered?&nbsp;
              <a
                href="#"
                className="text-primary-700 hover:underline dark:text-primary-500"
                onClick={(e) => {
                  e.preventDefault();
                  setOpenModal(false);
                  setOpenSignup(true);
                }}
              >
                Create account
              </a>
            </div>
          </div>
        </ModalBody>
      </Modal>

      {/* Sign Up Modal */}
      <Modal show={openSignup} size="md" onClose={onCloseSignup} popup>
        <ModalHeader />
        <ModalBody>
          <div className="space-y-6">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              Create your account
            </h3>
            <form className="space-y-4" onSubmit={handleSignup}>
              <div>
                <Label htmlFor="signup-name" value="Full Name" />
                <TextInput
                  id="signup-name"
                  type="text"
                  placeholder="Name"
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="signup-email" value="Email" />
                <TextInput
                  id="signup-email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="signup-password" value="Password" />
                <TextInput
                  id="signup-password"
                  type="password"
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button className="cursor-pointer" color="light" type="button" onClick={onCloseSignup}>
                  Cancel
                </Button>
                <Button
                  className="cursor-pointer bg-gradient-to-r from-cyan-500 to-blue-500"
                  type="submit"
                >
                  Sign Up
                </Button>
              </div>
              <div className="flex justify-between text-sm font-medium text-gray-500 dark:text-gray-300">
                Already registered?&nbsp;
                <a
                  href="#"
                  className="text-primary-700 hover:underline dark:text-primary-500"
                  onClick={(e) => {
                    e.preventDefault();
                    setOpenModal(true);
                    setOpenSignup(false);
                  }}
                >
                  Log in to your account
                </a>
              </div>
            </form>
          </div>
        </ModalBody>
      </Modal>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm">
                &copy; 2025 Flashcard Memory Trainer. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-6">
              <a
                href="#"
                className="text-sm hover:text-gray-500 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-sm hover:text-gray-500 transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-sm hover:text-gray-500 transition-colors"
              >
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
