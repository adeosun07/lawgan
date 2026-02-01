import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/ForeignAffairsPage.module.css';
import { getImageSrc } from '../utils/imageHelper';
import AdvertisementSlot from '../components/AdvertisementSlot';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API;

const ForeignAffairsPage = () => {
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    fetchForeignAffairsArticles();
  }, []);

  const fetchForeignAffairsArticles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/articles/category/foreign-affairs`);
      setArticles(response.data.articles || []);
    } catch (error) {
      console.error('Error fetching foreign affairs articles:', error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  // Format articles with proper date/time
  const formattedArticles = articles.map(article => ({
    ...article,
    date: new Date(article.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    time: new Date(article.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }));

  const latestNews = {
    main: formattedArticles[0] || { id: 0, title: 'No articles available', image_url: '', content: '', date: '', time: '' },
    side: formattedArticles.slice(1, 5)
  };

  const featuredNews = formattedArticles.slice(5, 8);

  const gridNews = formattedArticles.slice(8, 11);

  const carouselNews = [latestNews.main, ...latestNews.side.slice(0, 3)];

  const nextSlide = () => {
    setCurrentCarouselIndex((prev) => (prev + 1) % carouselNews.length);
  };

  const prevSlide = () => {
    setCurrentCarouselIndex((prev) => (prev - 1 + carouselNews.length) % carouselNews.length);
  };

  if (loading) {
    return (
      <div className={styles.foreignAffairsPage}>
        <div className={styles.pageHeader}>
          <h1>Foreign Affairs</h1>
          <p>Loading foreign affairs articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.foreignAffairsPage}>
      <div className={styles.pageHeader}>
        <h1>Foreign Affairs</h1>
        <p>International relations, diplomacy, and global affairs</p>
      </div>

      {/* First Section: Latest News with Side News */}
      <div className={styles.topSection}>
        <div className={styles.mainNews}>
          <img src={getImageSrc(latestNews.main, 'https://via.placeholder.com/800x600')} alt={latestNews.main.title} className={styles.mainImage} />
          <a href={`/article/${latestNews.main.slug}`} className={styles.caption}>
            {latestNews.main.title}
          </a>
          <p className={styles.excerpt}>{latestNews.main.content?.substring(0, 150) || 'No excerpt available'}...</p>
          <div className={styles.newsTime}>
            <span className={styles.newsDate}>{latestNews.main.date}</span>
            <span className={styles.timeStamp}>{latestNews.main.time}</span>
          </div>
        </div>

        <div className={styles.sideNews}>
          <h2 className={styles.sectionTitle}>More Updates</h2>
          <div className={styles.sideNewsScroll}>
            {latestNews.side.map((news) => (
              <div key={news.id} className={styles.sideNewsItem}>
                <img src={getImageSrc(news, 'https://via.placeholder.com/300x200')} alt={news.title} />
                <div className={styles.sideNewsContent}>
                  <a href={`/article/${news.slug}`} className={styles.sideCaption}>
                    {news.title}
                  </a>
                  <div className={styles.sideNewsTime}>
                    <span className={styles.newsDate}>{news.date}</span>
                    <span className={styles.timeStamp}>{news.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Carousel */}
      <div className={styles.carousel}>
        <div className={styles.carouselContainer}>
          <div className={styles.carouselItem}>
            <img src={getImageSrc(carouselNews[currentCarouselIndex], 'https://via.placeholder.com/800x600')} alt={carouselNews[currentCarouselIndex].title} />
            <a href={`/article/${carouselNews[currentCarouselIndex].slug}`} className={styles.carouselCaption}>
              {carouselNews[currentCarouselIndex].title}
            </a>
            <div className={styles.carouselTime}>
              <span className={styles.newsDate}>{carouselNews[currentCarouselIndex].date}</span>
              <span className={styles.timeStamp}>{carouselNews[currentCarouselIndex].time}</span>
            </div>
          </div>
          <button className={styles.carouselBtnPrev} onClick={prevSlide}>‹</button>
          <button className={styles.carouselBtnNext} onClick={nextSlide}>›</button>
        </div>
        <div className={styles.carouselDots}>
          {carouselNews.map((_, index) => (
            <span
              key={index}
              className={`${styles.dot} ${index === currentCarouselIndex ? styles.activeDot : ''}`}
              onClick={() => setCurrentCarouselIndex(index)}
            />
          ))}
        </div>
      </div>

      {/* Second Section: Featured News with Ads (1:3:1 grid) */}
      <div className={styles.featuredSection}>
        <div className={styles.adColumn}>
          <AdvertisementSlot page="foreign-affairs" index={0} className={styles.adBox} />
        </div>

        <div className={styles.featuredNewsColumn}>
          {featuredNews.map((news) => (
            <article key={news.id} className={styles.featuredNewsCard}>
              <div className={styles.featuredNewsText}>
                <a href={`/article/${news.slug}`} className={styles.featuredTitle}>
                  {news.title}
                </a>
                <div className={styles.featuredTime}>
                  <span className={styles.newsDate}>{news.date}</span>
                  <span className={styles.timeStamp}>{news.time}</span>
                </div>
                <p className={styles.featuredExcerpt}>{news.content?.substring(0, 120) || 'No excerpt available'}...</p>
              </div>
              <div className={styles.featuredNewsImage}>
                <img src={getImageSrc(news, 'https://via.placeholder.com/400x300')} alt={news.title} />
              </div>
            </article>
          ))}
        </div>

        <div className={styles.adColumn}>
          <AdvertisementSlot page="foreign-affairs" index={1} className={styles.adBox} />
        </div>
      </div>

      {/* Mobile Ads */}
      <div className={styles.mobileAds}>
        <AdvertisementSlot page="foreign-affairs" index={2} className={styles.adBox} />
      </div>

      {/* Third Section: Grid News (like homepage) */}
      <div className={styles.gridSection}>
        {gridNews.map((news) => (
          <article key={news.id} className={styles.gridNewsCard}>
            <img src={getImageSrc(news, 'https://via.placeholder.com/400x300')} alt={news.title} />
            <div className={styles.gridNewsContent}>
              <h3><a href={`/article/${news.slug}`}>{news.title}</a></h3>
              <p className={styles.gridExcerpt}>{news.content?.substring(0, 100) || 'No excerpt available'}...</p>
              <span className={styles.gridDate}>{news.date}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default ForeignAffairsPage;
