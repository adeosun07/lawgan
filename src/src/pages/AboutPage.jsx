import { useEffect, useState } from 'react';
import axios from 'axios';
import styles from '../styles/AboutPage.module.css';
import { getImageSrc } from '../utils/imageHelper';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API;

const AboutPage = () => {
  const [executives, setExecutives] = useState([]);
  const [executivesLoading, setExecutivesLoading] = useState(true);

  useEffect(() => {
    fetchExecutives();
  }, []);

  const fetchExecutives = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/executives`);
      const execData = Array.isArray(response.data)
        ? response.data
        : (response.data.executives || []);
      setExecutives(execData);
    } catch (error) {
      console.error('Error fetching executives:', error);
      setExecutives([]);
    } finally {
      setExecutivesLoading(false);
    }
  };

  return (
    <div className={styles.aboutPage}>
      <div className={styles.pageHeader}>
        <h1>About LAWGAN</h1>
        <p className={styles.tagline}>...for law and justice</p>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <p className={styles.mainAbout}>
            An association with the goal to bring together all Law graduates in Nigeria and foreign Law graduates who are Nigerians for the promotion of their welfare, interests and contributions through the instrumentality of laws.
          </p>
        </section>

        <section className={styles.section}>
          <h2>LAWGAN NEWS</h2>
          <p>
            The media area of the Law Graduates of Nigeria (LAWGAN) pursuant to section 39 of the Nigerian constitution (1999) as amended.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Executive Team</h2>
          {executivesLoading ? (
            <p className={styles.loadingText}>Loading executives...</p>
          ) : executives.length === 0 ? (
            <p className={styles.emptyState}>No executives found</p>
          ) : (
            <div className={styles.boardContainer}>
              {executives.map((executive) => (
                <div key={executive.id} className={styles.memberCard}>
                  <img
                    src={getImageSrc(executive, 'https://via.placeholder.com/300x300')}
                    alt={executive.name}
                  />
                  <h3>{executive.name}</h3>
                  <h4>{executive.position || 'Executive'}</h4>
                  <p>{executive.about || ''}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
