import React, { useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, handleLogout } = useContext(AppContext);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const profileMenuRef = useRef(null);

  const displayName =
    user?.name?.trim() || user?.email?.split("@")?.[0] || "User";
  const userInitials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((namePart) => namePart[0].toUpperCase())
      .join("") || "U";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    handleLogout();
    navigate("/login");
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <span className="brand-icon">📊</span>
          <span className="brand-text">Tax Compliance</span>
        </div>

        <button
          className="menu-toggle"
          onClick={() => {
            setMenuOpen(!menuOpen);
            if (menuOpen) {
              setProfileOpen(false);
            }
          }}
        >
          ☰
        </button>

        <div className={`navbar-menu ${menuOpen ? "open" : ""}`}>
          <div className="navbar-links">
            <button
              className="nav-link"
              onClick={() => {
                navigate("/dashboard");
                setMenuOpen(false);
                setProfileOpen(false);
              }}
            >
              Dashboard
            </button>
            <button
              className="nav-link"
              onClick={() => {
                navigate("/pan-details");
                setMenuOpen(false);
                setProfileOpen(false);
              }}
            >
              PAN Details
            </button>
            <button
              className="nav-link"
              onClick={() => {
                navigate("/form16-details");
                setMenuOpen(false);
                setProfileOpen(false);
              }}
            >
              Income Details
            </button>
            <button
              className="nav-link"
              onClick={() => {
                navigate("/tax-analysis");
                setMenuOpen(false);
                setProfileOpen(false);
              }}
            >
              Tax Analysis
            </button>
            <button
              className="nav-link"
              onClick={() => {
                navigate("/compliance-tasks");
                setMenuOpen(false);
                setProfileOpen(false);
              }}
            >
              Tasks
            </button>
          </div>

          <div className="navbar-user">
            <div className="profile-dropdown" ref={profileMenuRef}>
              <button
                type="button"
                className={`user-profile-trigger ${profileOpen ? "active" : ""}`}
                title={displayName}
                onClick={() => setProfileOpen((prev) => !prev)}
              >
                <div className="user-profile">
                  <div className="user-avatar" aria-hidden="true">
                    {userInitials}
                  </div>
                  <div className="user-meta">
                    <span className="user-name">{displayName}</span>
                    {user?.user_type ? (
                      <span className="user-role">{user.user_type}</span>
                    ) : null}
                  </div>
                </div>
              </button>

              <div className={`profile-menu ${profileOpen ? "open" : ""}`}>
                <p className="profile-menu-title">Profile</p>
                <p className="profile-menu-item">
                  <span className="profile-menu-label">Name:</span>{" "}
                  {displayName}
                </p>
                <p className="profile-menu-item">
                  <span className="profile-menu-label">Email:</span>{" "}
                  {user?.email || "Not available"}
                </p>
                <p className="profile-menu-item">
                  <span className="profile-menu-label">Type:</span>{" "}
                  {user?.user_type || "Not set"}
                </p>

                <button
                  className="btn-logout profile-logout"
                  onClick={() => {
                    handleLogoutClick();
                    setMenuOpen(false);
                    setProfileOpen(false);
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
