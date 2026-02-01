import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/ArticlePage.module.css';
import { getImageSrc } from '../utils/imageHelper';
import AdvertisementSlot from '../components/AdvertisementSlot';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API;

const ArticlePage = () => {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/articles`);
        const articles = response.data.articles || [];
        const current = articles.find((item) => item.slug === slug);

        if (!current) {
          setError('Article not found.');
          setArticle(null);
          setRelatedArticles([]);
          return;
        }

        setArticle(current);
        const related = articles
          .filter((item) => item.category === current.category && item.slug !== current.slug)
          .slice(0, 4);
        setRelatedArticles(related);
      } catch (err) {
        setError('Failed to load article. Please try again.');
        setArticle(null);
        setRelatedArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  const formattedDate = useMemo(() => {
    if (!article?.created_at) return '';
    return new Date(article.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [article?.created_at]);

  const contentParagraphs = useMemo(() => {
    if (!article?.content) return [];
    return article.content
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }, [article?.content]);

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.status}>Loading article...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <p className={styles.statusError}>{error}</p>
        <Link to="/" className={styles.backLink}>Back to home</Link>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <article className={styles.page}>
      <div className={styles.hero}>
        <img src={getImageSrc(article)} alt={article.title} className={styles.heroImage} />
        <div className={styles.heroOverlay}>
          <span className={styles.category}>{article.category}</span>
          <h1 className={styles.title}>{article.title}</h1>
          <div className={styles.meta}>
            <span>{article.author || 'Lawgan News'}</span>
            {formattedDate && <span>• {formattedDate}</span>}
          </div>
        </div>
      </div>

      <div className={styles.body}>
        {article.summary && <p className={styles.summary}>{article.summary}</p>}
        {contentParagraphs.map((paragraph, index) => (
          <p key={index} className={styles.paragraph}>{paragraph}</p>
        ))}
      </div>

      <div className={styles.adSection}>
        <AdvertisementSlot page="article" index={0} className={styles.adBox} />
      </div>

      <section className={styles.relatedSection}>
        <h2 className={styles.relatedTitle}>You should also read</h2>
        <div className={styles.relatedGrid}>
          {relatedArticles.map((item) => (
            <Link key={item.slug} to={`/article/${item.slug}`} className={styles.relatedCard}>
              <img src={getImageSrc(item, 'https://placehold.co/400x300')} alt={item.title} />
              <div className={styles.relatedContent}>
                <span className={styles.relatedCategory}>{item.category}</span>
                <h3>{item.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
};

export default ArticlePage;
