import styles from '../styles/Header.module.css';
import logo from '../assets/images/logo.jpg';
import Navbar from './Navbar';

const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <div className={styles.logo}>
          <img src={logo} alt="Lawgan Logo" className={styles.logoImg} />
        </div>

        <div className={styles.headerTitle}>
          <h1>LAWGAN NEWS</h1>
          <p className={styles.motto}>...for law and justice</p>
        </div>

        <Navbar />
      </div>
    </header>
  );
};

export default Header;
