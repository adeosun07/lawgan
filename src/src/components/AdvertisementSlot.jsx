import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { getImageSrc } from '../utils/imageHelper';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API;

const AdvertisementSlot = ({
  page,
  index = 0,
  className,
  imageClassName,
  linkClassName,
  placeholderText = 'Advertisement',
  placeholderImage = 'https://placehold.co/600x300'
}) => {
  const [ads, setAds] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchAds = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/advertisements/page/${page}`);
        const adverts = response.data.advertisements || [];
        console.log("ad url", adverts.map(ad => ad.url));
        if (isMounted) {
          setAds(adverts);
        }
      } catch (error) {
        if (isMounted) {
          setAds([]);
        }
      }
    };

    fetchAds();

    return () => {
      isMounted = false;
    };
  }, [page]);

  const advert = useMemo(() => {
    if (!ads.length) return null;
    const safeIndex = Math.abs(index) % ads.length;
    return ads[safeIndex];
  }, [ads, index]);

  if (!advert) {
    return (
      <div className={className}>
        <p>{placeholderText}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <a href={advert.url} target="_blank" rel="noreferrer" className={linkClassName}>
        <img
          src={getImageSrc(advert, placeholderImage)}
          alt={advert.owner || 'Advertisement'}
          className={imageClassName}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
        />
      </a>
    </div>
  );
};

export default AdvertisementSlot;
