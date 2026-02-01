import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/HomePage.module.css';
import { getImageSrc } from '../utils/imageHelper';
import AdvertisementSlot from '../components/AdvertisementSlot';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API;

export default function HomePage() {
  const [breakingNews, setBreakingNews] = useState([]);
  const [lawNews, setLawNews] = useState([]);
  const [politicsNews, setPoliticsNews] = useState([]);
  const [foreignNews, setForeignNews] = useState([]);
  const [reviewsNews, setReviewsNews] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllArticles();
    fetchQuotes();
  }, []);
  
  const fetchAllArticles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/articles`);
      const articles = response.data.articles || [];
      console.log('Fetched articles:', articles);
      
      // Filter breaking news (latest 6 with is_breaking flag)
      const breaking = articles
        .filter(article => article.is_breaking)
        .slice(0, 6);
      setBreakingNews(breaking);

      // Filter by category and get latest 3 for each
      setLawNews(articles.filter(a => a.category === 'law').slice(0, 3));
      setPoliticsNews(articles.filter(a => a.category === 'politics').slice(0, 3));
      setForeignNews(articles.filter(a => a.category === 'foreign-affairs').slice(0, 3));
      setReviewsNews(articles.filter(a => a.category === 'reviews').slice(0, 3));
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
      setError('Failed to load articles. Please make sure the backend server is running at ' + API_BASE_URL);
      setLoading(false);
    }
  };

  const fetchQuotes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/quotes`);
      const quotesData = response.data.quotes || [];
      setQuotes(quotesData);
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
      setQuotes([]);
    }
  };

  const mainNews = breakingNews[0] || {
    image_url: 'https://placehold.co/800x600',
    title: 'Loading news...'
  };

  const displayQuotes = quotes.length
    ? quotes
    : [
        { id: 'fallback-1', title: 'Justice delayed is justice denied', author: 'William Ewart Gladstone' },
        { id: 'fallback-2', title: 'The law is reason, free from passion', author: 'Aristotle' },
        { id: 'fallback-3', title: 'Injustice anywhere is a threat to justice everywhere', author: 'Martin Luther King Jr.' }
      ];

  const handleShare = (platform) => {
    console.log(`Sharing to ${platform}`);
  };

  return (
    <div className={styles.homePage}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>Loading articles...</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Error Loading Articles</h2>
          <p style={{ color: '#666', marginBottom: '1rem' }}>{error}</p>
          <button 
            onClick={() => { setLoading(true); setError(null); fetchAllArticles(); }}
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#3b82f6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Main News and Breaking News Section */}
          <div className={styles.topSection}>
            {/* Main News */}
            <div className={styles.mainNews}>
              <img src={getImageSrc(mainNews)} alt="Main news" className={styles.mainImage} />
              <a href={`/article/${mainNews.slug}`} className={styles.caption}>{mainNews.title}</a>
              <div className={styles.shareButtons}>
                <span>Share:</span>
                <button onClick={() => handleShare('X')} className={styles.shareBtn}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </button>
                <button onClick={() => handleShare('Facebook')} className={styles.shareBtn}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
                <button onClick={() => handleShare('Instagram')} className={styles.shareBtn}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Breaking News */}
            <div className={styles.breakingNews}>
              <h2 className={styles.sectionTitle}>Breaking News</h2>
              <div className={styles.breakingNewsScroll}>
                {breakingNews.slice(1).map((news) => (
                  <div key={news.id} className={styles.breakingNewsItem}>
                    <img src={getImageSrc(news)} alt="Breaking news" />
                    <div className={styles.breakingNewsContent}>
                        <a href={`/article/${news.slug}`} className={styles.breakingCaption}>{news.title}</a>
                      <div className={styles.breakingNewsTime}>
                        <span className={styles.newsDate}>{new Date(news.created_at).toLocaleDateString()}</span>
                        <span className={styles.newsTime}>{new Date(news.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Category Sections */}
          <section className={styles.categorySection}>
            <div className={styles.categoryHeader}>
              <h2 className={styles.categoryTitle}>Law</h2>
              <a href="/law" className={styles.seeMore}>See More →</a>
            </div>
            <div className={styles.newsGrid}>
              {lawNews.map((news) => (
                <div key={news.id} className={styles.newsCard}>
                <img src={getImageSrc(news)} alt="Law news" />
                    <a href={`/article/${news.slug}`} className={styles.newsCaption}>{news.title}</a>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.categorySection}>
            <div className={styles.categoryHeader}>
              <h2 className={styles.categoryTitle}>Politics</h2>
              <a href="/politics" className={styles.seeMore}>See More →</a>
            </div>
            <div className={styles.newsGrid}>
              {politicsNews.map((news) => (
                <div key={news.id} className={styles.newsCard}>
                <img src={getImageSrc(news)} alt="Politics news" />
                    <a href={`/article/${news.slug}`} className={styles.newsCaption}>{news.title}</a>
                </div>
              ))}
            </div>
          </section>

      {/* Advert Section (Mobile - After Politics) */}
      <div className={styles.advertMobile}>
        <AdvertisementSlot page="home" index={0} className={styles.advert} />
      </div>

      {/* Advert and Quotes Section (Desktop) */}
      <div className={styles.advertQuotesSection}>
        <AdvertisementSlot page="home" index={1} className={styles.advert} />
        <div className={styles.quotes}>
          <h2 className={styles.categoryTitle}>Quotes</h2>
          {displayQuotes.map((quote) => (
            <blockquote key={quote.id} className={styles.quote}>
              <p>"{quote.title}"</p>
              <cite>— {quote.author}</cite>
            </blockquote>
          ))}
        </div>
      </div>

      <section className={styles.categorySection}>
        <div className={styles.categoryHeader}>
          <h2 className={styles.categoryTitle}>Foreign Affairs</h2>
          <a href="/foreign-affairs" className={styles.seeMore}>See More →</a>
        </div>
        <div className={styles.newsGrid}>
          {foreignNews.map((news) => (
            <div key={news.id} className={styles.newsCard}>
              <img src={getImageSrc(news)} alt="Foreign affairs news" />
                <a href={`/article/${news.slug}`} className={styles.newsCaption}>{news.title}</a>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.categorySection}>
        <div className={styles.categoryHeader}>
          <h2 className={styles.categoryTitle}>Reviews</h2>
          <a href="/reviews" className={styles.seeMore}>See More →</a>
        </div>
        <div className={styles.newsGrid}>
          {reviewsNews.map((news) => (
            <div key={news.id} className={styles.newsCard}>
              <img src={getImageSrc(news)} alt="Reviews" />
                <a href={`/article/${news.slug}`} className={styles.newsCaption}>{news.title}</a>
            </div>
          ))}
        </div>
      </section>

      {/* Quotes Section (Mobile) */}
      <div className={styles.quotesMobile}>
        <div className={styles.quotes}>
          <h2 className={styles.categoryTitle}>Quotes</h2>
          {displayQuotes.map((quote) => (
            <blockquote key={quote.id} className={styles.quote}>
              <p>"{quote.title}"</p>
              <cite>— {quote.author}</cite>
            </blockquote>
          ))}
        </div>
      </div>
        </>
      )}
    </div>
  );
};
