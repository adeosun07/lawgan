import { useState, useEffect } from 'react'
import axios from 'axios'
import AdminAuth from '../components/AdminAuth'
import styles from '../styles/AdminPage.module.css'
import { getImageSrc } from '../utils/imageHelper'

const API_BASE_URL = import.meta.env.VITE_BACKEND_API

function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState('create') // 'create', 'manage', 'editorial', 'executives', 'ads', 'quotes'
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  // Article form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    summary: '',
    content: '',
    category: 'law',
    is_breaking: false,
    author_name: '',
    image: null
  })
  const [imagePreview, setImagePreview] = useState(null)
  const [editingArticleId, setEditingArticleId] = useState(null)

  // Articles list state
  const [articles, setArticles] = useState([])

  // Editorial board state
  const [editorialMembers, setEditorialMembers] = useState([])
  const [editorialForm, setEditorialForm] = useState({
    name: '',
    position: '',
    about: '',
    image: null
  })
  const [editorialImagePreview, setEditorialImagePreview] = useState(null)
  const [editingMemberId, setEditingMemberId] = useState(null)

  // Executives state
  const [executives, setExecutives] = useState([])
  const [executiveForm, setExecutiveForm] = useState({
    name: '',
    position: '',
    about: '',
    image: null
  })
  const [executiveImagePreview, setExecutiveImagePreview] = useState(null)
  const [editingExecutiveId, setEditingExecutiveId] = useState(null)

  // Advertisement state
  const [advertisements, setAdvertisements] = useState([])
  const [advertForm, setAdvertForm] = useState({
    url: '',
    owner: '',
    page: 'home',
    image: null
  })
  const [advertImagePreview, setAdvertImagePreview] = useState(null)
  const [editingAdvertId, setEditingAdvertId] = useState(null)

  // Quotes state
  const [quotes, setQuotes] = useState([])
  const [quoteForm, setQuoteForm] = useState({
    title: '',
    author: ''
  })
  const [editingQuoteId, setEditingQuoteId] = useState(null)

  const categories = ['law', 'politics', 'foreign-affairs', 'reviews', 'editorial']
  const advertPages = ['home', 'law', 'politics', 'foreign-affairs', 'reviews', 'article']

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      setIsAuthenticated(true)
      loadDraft()
      fetchArticles()
      fetchEditorialMembers()
      fetchExecutives()
      fetchAdvertisements()
      fetchQuotes()
    }
  }, [])

  const loadDraft = () => {
    const savedDraft = localStorage.getItem('articleDraft')
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft)
        setFormData(draft.formData)
        if (draft.imagePreview) {
          setImagePreview(draft.imagePreview)
        }
      } catch (error) {
        console.error('Failed to load draft:', error)
      }
    }
  }

  const fetchArticles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/articles`)
      // Handle both array response and object with articles property
      const articlesData = Array.isArray(response.data) ? response.data : (response.data.articles || [])
      setArticles(articlesData)
    } catch (error) {
      console.error('Failed to fetch articles:', error)
      setArticles([]) // Ensure articles is always an array
    }
  }

  const fetchEditorialMembers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/editorial-boards`)
      const membersData = Array.isArray(response.data) ? response.data : (response.data.editorialBoards || [])
      setEditorialMembers(membersData)
    } catch (error) {
      console.error('Failed to fetch editorial members:', error)
      setEditorialMembers([])
    }
  }

  const fetchExecutives = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/executives`)
      const execData = Array.isArray(response.data)
        ? response.data
        : (response.data.executives || [])
      setExecutives(execData)
    } catch (error) {
      console.error('Failed to fetch executives:', error)
      setExecutives([])
    }
  }

  const fetchAdvertisements = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/advertisements`)
      const advertsData = response.data.advertisements || []
      setAdvertisements(advertsData)
    } catch (error) {
      console.error('Failed to fetch advertisements:', error)
      setAdvertisements([])
    }
  }

  const fetchQuotes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/quotes`)
      const quotesData = response.data.quotes || []
      setQuotes(quotesData)
    } catch (error) {
      console.error('Failed to fetch quotes:', error)
      setQuotes([])
    }
  }

  const handleAuthSuccess = () => {
    setIsAuthenticated(true)
    loadDraft()
    fetchArticles()
    fetchEditorialMembers()
    fetchExecutives()
    fetchAdvertisements()
    fetchQuotes()
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    setIsAuthenticated(false)
    setActiveTab('create')
    setMessage({ type: '', text: '' })
  }

  // Article form handlers
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    if (name === 'title') {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      setFormData(prev => ({
        ...prev,
        slug: generatedSlug
      }))
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }))
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveDraft = (e) => {
    e.preventDefault()
    
    try {
      const draftData = {
        formData: {
          title: formData.title,
          slug: formData.slug,
          summary: formData.summary,
          content: formData.content,
          category: formData.category,
          is_breaking: formData.is_breaking,
          author_name: formData.author_name,
          image: null
        },
        imagePreview: imagePreview,
        savedAt: new Date().toISOString()
      }
      
      localStorage.setItem('articleDraft', JSON.stringify(draftData))
      
      setMessage({ 
        type: 'success', 
        text: 'Draft saved locally! You can continue editing later.' 
      })
      
      setTimeout(() => {
        setMessage({ type: '', text: '' })
      }, 3000)
      
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Failed to save draft. Please try again.' 
      })
    }
  }

  const handleClearDraft = (e) => {
    e.preventDefault()
    
    if (window.confirm('Are you sure you want to clear the current draft? This action cannot be undone.')) {
      resetArticleForm()
      localStorage.removeItem('articleDraft')
      
      setMessage({ 
        type: 'success', 
        text: 'Draft cleared successfully.' 
      })
      
      setTimeout(() => {
        setMessage({ type: '', text: '' })
      }, 3000)
    }
  }

  const resetArticleForm = () => {
    setFormData({
      title: '',
      slug: '',
      summary: '',
      content: '',
      category: 'law',
      is_breaking: false,
      author_name: '',
      image: null
    })
    setImagePreview(null)
    setEditingArticleId(null)
  }

  const handlePublish = async (e) => {
    e.preventDefault()
    
    if (!window.confirm('Are you sure you want to publish this article? It will be immediately visible to readers.')) {
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      if (!formData.title || !formData.slug || !formData.content || !formData.author_name) {
        setMessage({ 
          type: 'error', 
          text: 'Please fill in all required fields (Title, Slug, Content, Author)' 
        })
        setLoading(false)
        return
      }

      const requestBody = {
        title: formData.title,
        slug: formData.slug,
        summary: formData.summary,
        content: formData.content,
        category: formData.category,
        is_breaking: formData.is_breaking,
        author: formData.author_name
      }
      
      // Convert image to base64 if present
      if (formData.image) {
        const reader = new FileReader()
        const base64Promise = new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(formData.image)
        })
        const base64Data = await base64Promise
        requestBody.image_base64 = base64Data
        requestBody.image_mime = formData.image.type
      } else if (imagePreview && imagePreview.startsWith('http')) {
        // Keep existing image URL when editing
        requestBody.image_base64 = imagePreview
      }

      const token = localStorage.getItem('adminToken')
      
      if (editingArticleId) {
        await axios.patch(`${API_BASE_URL}/articles/edit`, {
          id: editingArticleId,
          ...requestBody,
          newSlug: requestBody.slug
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
        setMessage({ type: 'success', text: 'Article updated successfully!' })
      } else {
        await axios.post(`${API_BASE_URL}/articles/publish`, requestBody, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
        setMessage({ type: 'success', text: 'Article published successfully!' })
      }

      setTimeout(() => {
        resetArticleForm()
        localStorage.removeItem('articleDraft')
        fetchArticles()
        setMessage({ type: '', text: '' })
        setActiveTab('manage')
      }, 2000)

    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to submit article. Please try again.' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditArticle = (article) => {
    setFormData({
      title: article.title,
      slug: article.slug,
      summary: article.summary || '',
      content: article.content,
      category: article.category,
      is_breaking: article.is_breaking,
      author_name: article.author_name,
      image: null
    })
    if (article.image_url || article.image) {
      setImagePreview(getImageSrc(article))
    }
    setEditingArticleId(article.id)
    setActiveTab('create')
  }

  const handleDeleteArticle = async (articleId) => {
    if (!window.confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      return
    }

    try {
      const token = localStorage.getItem('adminToken')
      await axios.delete(`${API_BASE_URL}/articles/delete`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: { id: articleId }
      })
      setMessage({ type: 'success', text: 'Article deleted successfully!' })
      fetchArticles()
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Failed to delete article. Please try again.' 
      })
    }
  }

  // Editorial board handlers
  const handleEditorialChange = (e) => {
    const { name, value } = e.target
    setEditorialForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleEditorialImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setEditorialForm(prev => ({
        ...prev,
        image: file
      }))
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditorialImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmitEditorial = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      if (!editorialForm.name || !editorialForm.position || !editorialForm.about) {
        setMessage({ 
          type: 'error', 
          text: 'Please fill in all required fields' 
        })
        setLoading(false)
        return
      }

      const requestBody = {
        name: editorialForm.name,
        about: `${editorialForm.position}\n\n${editorialForm.about}` // Combine position with about
      }
      
      // Convert image to base64 if present
      if (editorialForm.image) {
        const reader = new FileReader()
        const base64Promise = new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(editorialForm.image)
        })
        const base64Data = await base64Promise
        requestBody.image_base64 = base64Data
        requestBody.image_mime = editorialForm.image.type
      } else if (editorialImagePreview && editorialImagePreview.startsWith('http')) {
        // Keep existing image when editing
        requestBody.image_base64 = editorialImagePreview
      }

      const token = localStorage.getItem('adminToken')
      
      if (editingMemberId) {
        await axios.patch(`${API_BASE_URL}/editorial-boards`, {
          id: editingMemberId,
          ...requestBody
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
        setMessage({ type: 'success', text: 'Editorial member updated successfully!' })
      } else {
        await axios.post(`${API_BASE_URL}/editorial-boards`, requestBody, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
        setMessage({ type: 'success', text: 'Editorial member added successfully!' })
      }

      setTimeout(() => {
        resetEditorialForm()
        fetchEditorialMembers()
        setMessage({ type: '', text: '' })
      }, 2000)

    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to submit editorial member. Please try again.' 
      })
    } finally {
      setLoading(false)
    }
  }

  const resetEditorialForm = () => {
    setEditorialForm({
      name: '',
      position: '',
      about: '',
      image: null
    })
    setEditorialImagePreview(null)
    setEditingMemberId(null)
  }

  const handleEditMember = (member) => {
    // Extract position from about field (first line)
    const aboutLines = member.about ? member.about.split('\n') : []
    const position = aboutLines[0] || ''
    const about = aboutLines.slice(2).join('\n') || '' // Skip first line and empty line
    
    setEditorialForm({
      name: member.name,
      position: position,
      about: about,
      image: null
    })
    if (member.image || member.image_url) {
      setEditorialImagePreview(getImageSrc(member, 'https://placehold.co/300x300'))
    }
    setEditingMemberId(member.id)
  }

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to delete this editorial member? This action cannot be undone.')) {
      return
    }

    try {
      const token = localStorage.getItem('adminToken')
      await axios.delete(`${API_BASE_URL}/editorial-boards`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: { id: memberId }
      })
      setMessage({ type: 'success', text: 'Editorial member deleted successfully!' })
      fetchEditorialMembers()
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Failed to delete editorial member. Please try again.' 
      })
    }
  }

  // Executive handlers
  const handleExecutiveChange = (e) => {
    const { name, value } = e.target
    setExecutiveForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleExecutiveImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setExecutiveForm(prev => ({
        ...prev,
        image: file
      }))

      const reader = new FileReader()
      reader.onloadend = () => {
        setExecutiveImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmitExecutive = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      if (!executiveForm.name) {
        setMessage({
          type: 'error',
          text: 'Please provide the executive name'
        })
        setLoading(false)
        return
      }

      const requestBody = {
        name: executiveForm.name,
        position: executiveForm.position,
        about: executiveForm.about
      }

      if (executiveForm.image) {
        const reader = new FileReader()
        const base64Promise = new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(executiveForm.image)
        })
        const base64Data = await base64Promise
        requestBody.image_base64 = base64Data
        requestBody.image_mime = executiveForm.image.type
      } else if (executiveImagePreview && executiveImagePreview.startsWith('http')) {
        requestBody.image_base64 = executiveImagePreview
      }

      const token = localStorage.getItem('adminToken')

      if (editingExecutiveId) {
        await axios.patch(`${API_BASE_URL}/executives`, {
          id: editingExecutiveId,
          ...requestBody
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
        setMessage({ type: 'success', text: 'Executive updated successfully!' })
      } else {
        await axios.post(`${API_BASE_URL}/executives`, requestBody, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
        setMessage({ type: 'success', text: 'Executive added successfully!' })
      }

      setTimeout(() => {
        resetExecutiveForm()
        fetchExecutives()
        setMessage({ type: '', text: '' })
      }, 2000)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to submit executive. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const resetExecutiveForm = () => {
    setExecutiveForm({
      name: '',
      position: '',
      about: '',
      image: null
    })
    setExecutiveImagePreview(null)
    setEditingExecutiveId(null)
  }

  const handleEditExecutive = (executive) => {
    setExecutiveForm({
      name: executive.name || '',
      position: executive.position || '',
      about: executive.about || '',
      image: null
    })
    if (executive.image || executive.image_url) {
      setExecutiveImagePreview(getImageSrc(executive, 'https://placehold.co/300x300'))
    }
    setEditingExecutiveId(executive.id)
    setActiveTab('executives')
  }

  const handleDeleteExecutive = async (executiveId) => {
    if (!window.confirm('Are you sure you want to delete this executive? This action cannot be undone.')) {
      return
    }

    try {
      const token = localStorage.getItem('adminToken')
      await axios.delete(`${API_BASE_URL}/executives`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: { id: executiveId }
      })
      setMessage({ type: 'success', text: 'Executive deleted successfully!' })
      fetchExecutives()
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to delete executive. Please try again.'
      })
    }
  }

  // Advertisement handlers
  const handleAdvertChange = (e) => {
    const { name, value } = e.target
    setAdvertForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAdvertImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAdvertForm(prev => ({
        ...prev,
        image: file
      }))

      const reader = new FileReader()
      reader.onloadend = () => {
        setAdvertImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const resetAdvertForm = () => {
    setAdvertForm({
      url: '',
      owner: '',
      page: 'home',
      image: null
    })
    setAdvertImagePreview(null)
    setEditingAdvertId(null)
  }

  const handleEditAdvert = (advert) => {
    setAdvertForm({
      url: advert.url || '',
      owner: advert.owner || '',
      page: advert.page || 'home',
      image: null
    })
    setAdvertImagePreview(getImageSrc(advert, 'https://placehold.co/600x300'))
    setEditingAdvertId(advert.id)
    setActiveTab('ads')
  }

  const handleDeleteAdvert = async (advertId) => {
    if (!window.confirm('Are you sure you want to delete this advertisement? This action cannot be undone.')) {
      return
    }

    try {
      const token = localStorage.getItem('adminToken')
      await axios.delete(`${API_BASE_URL}/advertisements/delete`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: { id: advertId }
      })
      setMessage({ type: 'success', text: 'Advertisement deleted successfully!' })
      fetchAdvertisements()
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to delete advertisement. Please try again.'
      })
    }
  }

  const handleSubmitAdvert = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      if (!advertForm.url || !advertForm.owner || !advertForm.page) {
        setMessage({
          type: 'error',
          text: 'Please fill in all required fields (URL, Owner, Page).'
        })
        setLoading(false)
        return
      }

      if (!editingAdvertId && !advertForm.image) {
        setMessage({
          type: 'error',
          text: 'Please upload an advertisement image.'
        })
        setLoading(false)
        return
      }

      const requestBody = {
        url: advertForm.url,
        owner: advertForm.owner,
        page: advertForm.page
      }

      if (advertForm.image) {
        const reader = new FileReader()
        const base64Promise = new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(advertForm.image)
        })
        const base64Data = await base64Promise
        requestBody.image_base64 = base64Data
        requestBody.image_mime = advertForm.image.type
      }

      const token = localStorage.getItem('adminToken')

      if (editingAdvertId) {
        await axios.patch(`${API_BASE_URL}/advertisements/edit`, {
          id: editingAdvertId,
          ...requestBody
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
        setMessage({ type: 'success', text: 'Advertisement updated successfully!' })
      } else {
        await axios.post(`${API_BASE_URL}/advertisements/publish`, requestBody, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
        setMessage({ type: 'success', text: 'Advertisement published successfully!' })
      }

      setTimeout(() => {
        resetAdvertForm()
        fetchAdvertisements()
        setMessage({ type: '', text: '' })
      }, 1500)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to submit advertisement. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  // Quote handlers
  const handleQuoteChange = (e) => {
    const { name, value } = e.target
    setQuoteForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const resetQuoteForm = () => {
    setQuoteForm({
      title: '',
      author: ''
    })
    setEditingQuoteId(null)
  }

  const handleEditQuote = (quote) => {
    setQuoteForm({
      title: quote.title || '',
      author: quote.author || ''
    })
    setEditingQuoteId(quote.id)
    setActiveTab('quotes')
  }

  const handleDeleteQuote = async (quoteId) => {
    if (!window.confirm('Are you sure you want to delete this quote?')) {
      return
    }

    try {
      const token = localStorage.getItem('adminToken')
      await axios.delete(`${API_BASE_URL}/quotes/delete`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: { id: quoteId }
      })
      setMessage({ type: 'success', text: 'Quote deleted successfully!' })
      fetchQuotes()
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to delete quote. Please try again.'
      })
    }
  }

  const handleSubmitQuote = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      if (!quoteForm.title || !quoteForm.author) {
        setMessage({
          type: 'error',
          text: 'Please fill in both quote and author.'
        })
        setLoading(false)
        return
      }

      if (!editingQuoteId && quotes.length >= 6) {
        setMessage({
          type: 'error',
          text: 'Quote limit reached. Delete a quote to add a new one.'
        })
        setLoading(false)
        return
      }

      const token = localStorage.getItem('adminToken')

      if (editingQuoteId) {
        await axios.patch(`${API_BASE_URL}/quotes/edit`, {
          id: editingQuoteId,
          title: quoteForm.title,
          author: quoteForm.author
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
        setMessage({ type: 'success', text: 'Quote updated successfully!' })
      } else {
        await axios.post(`${API_BASE_URL}/quotes/publish`, {
          title: quoteForm.title,
          author: quoteForm.author
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
        setMessage({ type: 'success', text: 'Quote published successfully!' })
      }

      setTimeout(() => {
        resetQuoteForm()
        fetchQuotes()
        setMessage({ type: '', text: '' })
      }, 1500)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to submit quote. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return <AdminAuth onAuthSuccess={handleAuthSuccess} />
  }

  const filteredArticles = selectedCategory === 'all' 
    ? (articles || [])
    : (articles || []).filter(article => article.category === selectedCategory)

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminHeader}>
        <div>
          <h1>Admin Dashboard</h1>
          <p>Manage articles, editorial board, executives, advertisements, and quotes</p>
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          Logout
        </button>
      </div>

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.tabContainer}>
        <button 
          className={`${styles.tab} ${activeTab === 'create' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('create')}
        >
          {editingArticleId ? 'Edit Article' : 'Create Article'}
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'manage' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          Manage Articles
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'editorial' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('editorial')}
        >
          Editorial Board
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'executives' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('executives')}
        >
          Executives
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'ads' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('ads')}
        >
          Advertisements
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'quotes' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('quotes')}
        >
          Quotes
        </button>
      </div>

      <div className={styles.adminContent}>
        {activeTab === 'create' && (
          <form className={styles.articleForm}>
            <h2>{editingArticleId ? 'Edit Article' : 'Create New Article'}</h2>
            
            <div className={styles.formGroup}>
              <label htmlFor="title">
                Article Title <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter article title"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="slug">
                URL Slug <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="article-url-slug"
                required
              />
              <small>URL-friendly version of the title (auto-generated)</small>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="category">
                  Category <span className={styles.required}>*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="is_breaking"
                    checked={formData.is_breaking}
                    onChange={handleChange}
                  />
                  <span>Breaking News</span>
                </label>
                <small>Mark as breaking news (limited to 6 latest)</small>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="author_name">
                Author Name <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="author_name"
                name="author_name"
                value={formData.author_name}
                onChange={handleChange}
                placeholder="e.g., John Doe"
                required
              />
              <small>Enter the author's full name</small>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="image">Featured Image</label>
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                onChange={handleImageChange}
                className={styles.fileInput}
              />
              {imagePreview && (
                <div className={styles.imagePreview}>
                  <img src={imagePreview} alt="Preview" />
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="summary">Article Summary</label>
              <textarea
                id="summary"
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                placeholder="Brief summary of the article (optional)"
                rows="3"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="content">
                Article Content <span className={styles.required}>*</span>
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Write your article content here..."
                rows="15"
                required
              />
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.clearBtn}
                onClick={handleClearDraft}
                disabled={loading}
              >
                Clear Draft
              </button>
              
              <button
                type="button"
                className={styles.draftBtn}
                onClick={handleSaveDraft}
                disabled={loading}
              >
                Save as Draft
              </button>
              
              <button
                type="button"
                className={styles.publishBtn}
                onClick={handlePublish}
                disabled={loading}
              >
                {loading ? 'Publishing...' : (editingArticleId ? 'Update Article' : 'Publish Article')}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'manage' && (
          <div className={styles.manageSection}>
            <div className={styles.manageHeader}>
              <h2>Manage Articles</h2>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={styles.categoryFilter}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.articlesGrid}>
              {filteredArticles.length === 0 ? (
                <p className={styles.emptyState}>No articles found</p>
              ) : (
                filteredArticles.map(article => (
                  <div key={article.id} className={styles.articleCard}>
                    {article.image_url || article.image ? (
                      <img src={getImageSrc(article)} alt={article.title} className={styles.articleCardImage} />
                    ) : null}
                    <div className={styles.articleCardContent}>
                      <h3>{article.title}</h3>
                      <p className={styles.articleMeta}>
                        <span className={styles.categoryBadge}>{article.category}</span>
                        {article.is_breaking && <span className={styles.breakingBadge}>Breaking</span>}
                      </p>
                      <p className={styles.articleExcerpt}>
                        {article.summary || (article.content ? article.content.substring(0, 100) + '...' : 'No content available')}
                      </p>
                      <div className={styles.articleActions}>
                        <button onClick={() => handleEditArticle(article)} className={styles.editBtn}>
                          Edit
                        </button>
                        <button onClick={() => handleDeleteArticle(article.id)} className={styles.deleteBtn}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'editorial' && (
          <div className={styles.editorialSection}>
            <div className={styles.editorialFormContainer}>
              <h2>{editingMemberId ? 'Edit Editorial Member' : 'Add Editorial Member'}</h2>
              
              <form className={styles.editorialForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="ed_name">
                    Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="ed_name"
                    name="name"
                    value={editorialForm.name}
                    onChange={handleEditorialChange}
                    placeholder="Editor's full name"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="position">
                    Position <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="position"
                    name="position"
                    value={editorialForm.position}
                    onChange={handleEditorialChange}
                    placeholder="e.g., Editor-in-Chief, Senior Editor"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="ed_image">Photo</label>
                  <input
                    type="file"
                    id="ed_image"
                    name="image"
                    accept="image/*"
                    onChange={handleEditorialImageChange}
                    className={styles.fileInput}
                  />
                  {editorialImagePreview && (
                    <div className={styles.imagePreview}>
                      <img src={editorialImagePreview} alt="Preview" />
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="about">
                    About <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    id="about"
                    name="about"
                    value={editorialForm.about}
                    onChange={handleEditorialChange}
                    placeholder="Brief bio and background..."
                    rows="5"
                    required
                  />
                </div>

                <div className={styles.formActions}>
                  {editingMemberId && (
                    <button
                      type="button"
                      className={styles.clearBtn}
                      onClick={resetEditorialForm}
                    >
                      Cancel
                    </button>
                  )}
                  
                  <button
                    type="button"
                    className={styles.publishBtn}
                    onClick={handleSubmitEditorial}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : (editingMemberId ? 'Update Member' : 'Add Member')}
                  </button>
                </div>
              </form>
            </div>

            <div className={styles.editorialList}>
              <h3>Editorial Board Members</h3>
              {editorialMembers.length === 0 ? (
                <p className={styles.emptyState}>No editorial members found</p>
              ) : (
                <div className={styles.membersGrid}>
                  {editorialMembers.map(member => {
                    // Extract position from about field
                    const aboutLines = member.about ? member.about.split('\n') : []
                    const position = aboutLines[0] || ''
                    const aboutText = aboutLines.slice(2).join('\n') || member.about || ''
                    
                    return (
                      <div key={member.id} className={styles.memberCard}>
                        {member.image || member.image_url ? (
                          <img src={getImageSrc(member, 'https://placehold.co/300x300')} alt={member.name} className={styles.memberImage} />
                        ) : null}
                        <div className={styles.memberContent}>
                          <h4>{member.name}</h4>
                          <p className={styles.memberPosition}>{position}</p>
                          <p className={styles.memberAbout}>{aboutText}</p>
                          <div className={styles.memberActions}>
                            <button onClick={() => handleEditMember(member)} className={styles.editBtn}>
                              Edit
                            </button>
                            <button onClick={() => handleDeleteMember(member.id)} className={styles.deleteBtn}>
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'executives' && (
          <div className={styles.editorialSection}>
            <div className={styles.editorialFormContainer}>
              <h2>{editingExecutiveId ? 'Edit Executive' : 'Add Executive'}</h2>

              <form className={styles.editorialForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="ex_name">
                    Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="ex_name"
                    name="name"
                    value={executiveForm.name}
                    onChange={handleExecutiveChange}
                    placeholder="Executive full name"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="ex_position">Position</label>
                  <input
                    type="text"
                    id="ex_position"
                    name="position"
                    value={executiveForm.position}
                    onChange={handleExecutiveChange}
                    placeholder="e.g., President, Secretary"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="ex_image">Photo</label>
                  <input
                    type="file"
                    id="ex_image"
                    name="image"
                    accept="image/*"
                    onChange={handleExecutiveImageChange}
                    className={styles.fileInput}
                  />
                  {executiveImagePreview && (
                    <div className={styles.imagePreview}>
                      <img src={executiveImagePreview} alt="Preview" />
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="ex_about">About</label>
                  <textarea
                    id="ex_about"
                    name="about"
                    value={executiveForm.about}
                    onChange={handleExecutiveChange}
                    placeholder="Brief bio and responsibilities..."
                    rows="5"
                  />
                </div>

                <div className={styles.formActions}>
                  {editingExecutiveId && (
                    <button
                      type="button"
                      className={styles.clearBtn}
                      onClick={resetExecutiveForm}
                    >
                      Cancel
                    </button>
                  )}

                  <button
                    type="button"
                    className={styles.publishBtn}
                    onClick={handleSubmitExecutive}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : (editingExecutiveId ? 'Update Executive' : 'Add Executive')}
                  </button>
                </div>
              </form>
            </div>

            <div className={styles.editorialList}>
              <h3>Executives</h3>
              {executives.length === 0 ? (
                <p className={styles.emptyState}>No executives found</p>
              ) : (
                <div className={styles.membersGrid}>
                  {executives.map(executive => (
                    <div key={executive.id} className={styles.memberCard}>
                      {executive.image || executive.image_url ? (
                        <img src={getImageSrc(executive, 'https://placehold.co/300x300')} alt={executive.name} className={styles.memberImage} />
                      ) : null}
                      <div className={styles.memberContent}>
                        <h4>{executive.name}</h4>
                        {executive.position && (
                          <p className={styles.memberPosition}>{executive.position}</p>
                        )}
                        {executive.about && (
                          <p className={styles.memberAbout}>{executive.about}</p>
                        )}
                        <div className={styles.memberActions}>
                          <button onClick={() => handleEditExecutive(executive)} className={styles.editBtn}>
                            Edit
                          </button>
                          <button onClick={() => handleDeleteExecutive(executive.id)} className={styles.deleteBtn}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ads' && (
          <div className={styles.adsSection}>
            <div className={styles.adsFormContainer}>
              <h2>{editingAdvertId ? 'Edit Advertisement' : 'Publish Advertisement'}</h2>

              <form className={styles.advertForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="ad_url">
                    Destination URL <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="url"
                    id="ad_url"
                    name="url"
                    value={advertForm.url}
                    onChange={handleAdvertChange}
                    placeholder="https://example.com"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="ad_owner">
                    Owner <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="ad_owner"
                    name="owner"
                    value={advertForm.owner}
                    onChange={handleAdvertChange}
                    placeholder="Company or brand name"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="ad_page">
                    Page <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="ad_page"
                    name="page"
                    value={advertForm.page}
                    onChange={handleAdvertChange}
                  >
                    {advertPages.map((page) => (
                      <option key={page} value={page}>
                        {page.replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="ad_image">
                    Advertisement Image <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="file"
                    id="ad_image"
                    name="image"
                    accept="image/*"
                    onChange={handleAdvertImageChange}
                    className={styles.fileInput}
                  />
                  {advertImagePreview && (
                    <div className={styles.imagePreview}>
                      <img src={advertImagePreview} alt="Advertisement preview" />
                    </div>
                  )}
                </div>

                <div className={styles.formActions}>
                  {editingAdvertId && (
                    <button
                      type="button"
                      className={styles.clearBtn}
                      onClick={resetAdvertForm}
                    >
                      Cancel
                    </button>
                  )}

                  <button
                    type="button"
                    className={styles.publishBtn}
                    onClick={handleSubmitAdvert}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : (editingAdvertId ? 'Update Advertisement' : 'Publish Advertisement')}
                  </button>
                </div>
              </form>
            </div>

            <div className={styles.adsList}>
              <h3>All Advertisements</h3>
              {advertisements.length === 0 ? (
                <p className={styles.emptyState}>No advertisements found</p>
              ) : (
                <div className={styles.adsGrid}>
                  {advertisements.map((advert) => (
                    <div key={advert.id} className={styles.adCard}>
                      <img
                        src={getImageSrc(advert, 'https://placehold.co/600x300')}
                        alt={advert.owner}
                        className={styles.adImage}
                      />
                      <div className={styles.adContent}>
                        <div className={styles.adMeta}>
                          <span className={styles.adBadge}>{advert.page}</span>
                          <span>{advert.owner}</span>
                        </div>
                        <a
                          href={advert.url}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.adLink}
                        >
                          {advert.url}
                        </a>
                        <div className={styles.adActions}>
                          <button onClick={() => handleEditAdvert(advert)} className={styles.editBtn}>
                            Edit
                          </button>
                          <button onClick={() => handleDeleteAdvert(advert.id)} className={styles.deleteBtn}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'quotes' && (
          <div className={styles.quotesSection}>
            <div className={styles.quotesFormContainer}>
              <h2>{editingQuoteId ? 'Edit Quote' : 'Publish Quote'}</h2>
              <p className={styles.helperText}>Maximum of 6 quotes on the homepage.</p>

              <form className={styles.quotesForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="quote_title">
                    Quote <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    id="quote_title"
                    name="title"
                    value={quoteForm.title}
                    onChange={handleQuoteChange}
                    placeholder="Enter the quote"
                    rows="4"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="quote_author">
                    Author <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="quote_author"
                    name="author"
                    value={quoteForm.author}
                    onChange={handleQuoteChange}
                    placeholder="Quote author"
                    required
                  />
                </div>

                <div className={styles.formActions}>
                  {editingQuoteId && (
                    <button
                      type="button"
                      className={styles.clearBtn}
                      onClick={resetQuoteForm}
                    >
                      Cancel
                    </button>
                  )}

                  <button
                    type="button"
                    className={styles.publishBtn}
                    onClick={handleSubmitQuote}
                    disabled={loading || (!editingQuoteId && quotes.length >= 6)}
                  >
                    {loading ? 'Saving...' : (editingQuoteId ? 'Update Quote' : 'Publish Quote')}
                  </button>
                </div>
              </form>
            </div>

            <div className={styles.quotesList}>
              <h3>Published Quotes</h3>
              {quotes.length === 0 ? (
                <p className={styles.emptyState}>No quotes found</p>
              ) : (
                <div className={styles.quotesGrid}>
                  {quotes.map((quote) => (
                    <div key={quote.id} className={styles.quoteCard}>
                      <p className={styles.quoteText}>“{quote.title}”</p>
                      <p className={styles.quoteAuthor}>— {quote.author}</p>
                      <div className={styles.quoteActions}>
                        <button onClick={() => handleEditQuote(quote)} className={styles.editBtn}>
                          Edit
                        </button>
                        <button onClick={() => handleDeleteQuote(quote.id)} className={styles.deleteBtn}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPage
