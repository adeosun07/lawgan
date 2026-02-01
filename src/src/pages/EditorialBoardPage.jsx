import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/EditorialBoardPage.module.css';
import { getImageSrc } from '../utils/imageHelper';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API;

const EditorialBoardPage = () => {
  const [loading, setLoading] = useState(true);
  const [boardMembers, setBoardMembers] = useState([]);

  useEffect(() => {
    fetchBoardMembers();
  }, []);

  const fetchBoardMembers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/editorial-boards`);
      const membersData = Array.isArray(response.data)
        ? response.data
        : (response.data.editorialBoards || []);
      // Map the response to match component structure
      const members = membersData.map(member => {
        // Extract position from about field (first line is position)
        const aboutLines = (member.about || '').split('\n');
        const position = aboutLines[0] || 'Editorial Board Member';
        const bio = aboutLines.slice(1).join(' ') || 'Member of the editorial board';
        
        return {
          id: member.id,
          name: member.name,
          position: position,
          bio: bio,
          image: member.image
        };
      });
      setBoardMembers(members);
    } catch (error) {
      console.error('Error fetching editorial board:', error);
      setBoardMembers([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.editorialPage}>
        <div className={styles.pageHeader}>
          <h1>Editorial Board</h1>
          <p>Loading editorial board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.editorialPage}>
      <div className={styles.pageHeader}>
        <h1>Editorial Board</h1>
        <p>Meet the team behind Lawgan News</p>
      </div>

      <div className={styles.boardContainer}>
        {boardMembers.map((member) => (
          <div key={member.id} className={styles.memberCard}>
            <img src={getImageSrc(member, 'https://via.placeholder.com/300x300')} alt={member.name} />
            <h3>{member.name}</h3>
            <h4>{member.position}</h4>
            <p>{member.bio}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EditorialBoardPage;
