import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies (session)
});

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      console.log('Unauthorized request - redirecting to login');
      // If we're not already on the landing page, redirect there
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    
    // Handle server errors
    if (error.response && error.response.status >= 500) {
      console.error('Server error:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

// Email API methods
const emailAPI = {
  getPriorityEmails: async (timeFrameHours = 24) => {
    return api.get(`/emails/priority?time_frame_hours=${timeFrameHours}`);
  },
  
  getReplyNeededEmails: async (timeFrameHours = 24) => {
    return api.get(`/emails/reply-needed?time_frame_hours=${timeFrameHours}`);
  },
  
  getEmailList: async (timeFrameHours = 24, options = {}) => {
    const { includePromotions = false, includeSocial = false, searchQuery = null, maxResults = null } = options;
    
    let url = `/emails/list?time_frame_hours=${timeFrameHours}&include_promotions=${includePromotions}&include_social=${includeSocial}`;
    
    if (searchQuery) {
      url += `&search_query=${encodeURIComponent(searchQuery)}`;
    }
    
    if (maxResults) {
      url += `&max_results=${maxResults}`;
    }
    
    return api.get(url);
  },
  
  getEmailDetail: async (emailId) => {
    return api.get(`/emails/${emailId}`);
  }
};

// Draft API methods
const draftAPI = {
  generateDraft: async (emailId, customInstructions = null) => {
    return api.post(`/drafts/generate/${emailId}`, { custom_instructions: customInstructions });
  },
  
  listDrafts: async () => {
    return api.get('/drafts/list');
  },
  
  getDraft: async (draftId) => {
    return api.get(`/drafts/${draftId}`);
  }
};

// Chat API methods
const chatAPI = {
  sendQuery: async (query, timeFrameHours = 24) => {
    return api.post('/chat/query', { query, time_frame_hours: timeFrameHours });
  },
  
  clearHistory: async () => {
    return api.post('/chat/clear-history');
  }
};

// Attachment API methods
const attachmentAPI = {
  listAttachments: async (emailId) => {
    return api.get(`/attachments/${emailId}`);
  },
  
  getAttachmentSummary: async (emailId, attachmentId) => {
    return api.get(`/attachments/${emailId}/${attachmentId}/summary`);
  },
  
  getAttachmentDownloadUrl: (emailId, attachmentId) => {
    return `/api/attachments/${emailId}/${attachmentId}/download`;
  }
};

// Extend the api object with our domain-specific methods
api.emails = emailAPI;
api.drafts = draftAPI;
api.chat = chatAPI;
api.attachments = attachmentAPI;

export default api;
