import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Navbar.module.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Law', path: '/law' },
    { name: 'Politics', path: '/politics' },
    { name: 'Foreign Affairs', path: '/foreign-affairs' },
    { name: 'Reviews', path: '/reviews' },
    { name: 'About LAWGAN', path: '/about' },
    { name: 'Editorial Board', path: '/editorial-board' },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      {/* Hamburger Menu Button */}
      <button 
        className={`${styles.hamburger} ${isMenuOpen ? styles.active : ''}`}
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Navigation */}
      <nav className={`${styles.navbar} ${isMenuOpen ? styles.open : ''}`}>
        <ul className={styles.navList}>
          {navLinks.map((link, index) => (
            <li key={index} className={styles.navItem}>
              <Link 
                to={link.path} 
                className={styles.navLink}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
};

export default Navbar;
