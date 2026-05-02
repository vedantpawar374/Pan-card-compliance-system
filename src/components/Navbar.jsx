import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, handleLogout } = useContext(AppContext);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleLogoutClick = () => {
    handleLogout();
    navigate('/login');
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
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>

        <div className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
          <div className="navbar-links">
            <button
              className="nav-link"
              onClick={() => {
                navigate('/dashboard');
                setMenuOpen(false);
              }}
            >
              Dashboard
            </button>
            <button
              className="nav-link"
              onClick={() => {
                navigate('/pan-details');
                setMenuOpen(false);
              }}
            >
              PAN Details
            </button>
            <button
              className="nav-link"
              onClick={() => {
                navigate('/form16-details');
                setMenuOpen(false);
              }}
            >
              Income Details
            </button>
            <button
              className="nav-link"
              onClick={() => {
                navigate('/tax-analysis');
                setMenuOpen(false);
              }}
            >
              Tax Analysis
            </button>
            <button
              className="nav-link"
              onClick={() => {
                navigate('/compliance-tasks');
                setMenuOpen(false);
              }}
            >
              Tasks
            </button>
          </div>

          <div className="navbar-user">
            <span className="user-info">
              {user?.name && `${user.name}`}
            </span>
            <button
              className="btn-logout"
              onClick={() => {
                handleLogoutClick();
                setMenuOpen(false);
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
