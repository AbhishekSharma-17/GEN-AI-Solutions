import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Header = styled.header`
  background-color: var(--primary-color);
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  h1 {
    font-size: 1.5rem;
    margin: 0;
    font-weight: 600;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserEmail = styled.span`
  font-size: 0.9rem;
`;

const LogoutButton = styled.button`
  background-color: transparent;
  color: white;
  border: 1px solid white;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const MainContent = styled.main`
  display: flex;
  flex: 1;
`;

const Sidebar = styled.aside`
  width: 250px;
  background-color: var(--secondary-color);
  padding: 1.5rem 1rem;
  border-right: 1px solid var(--border-color);
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
`;

const NavMenu = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const NavItem = styled.a`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  color: var(--text-color);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover, &.active {
    background-color: rgba(3, 102, 214, 0.1);
    color: var(--primary-color);
  }
`;

const SectionTitle = styled.h2`
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.75rem;
  color: var(--text-color);
`;

const EmailsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const EmailCard = styled.div`
  background-color: white;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const EmailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const EmailSender = styled.div`
  font-weight: 600;
`;

const EmailDate = styled.div`
  font-size: 0.9rem;
  color: var(--light-text);
`;

const EmailSubject = styled.div`
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
  color: var(--primary-color);
`;

const EmailSnippet = styled.div`
  color: var(--text-color);
  font-size: 0.9rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const EmailSummary = styled.div`
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
  font-style: italic;
  color: var(--light-text);
  font-size: 0.9rem;
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
`;

const ActionButton = styled.button`
  background-color: ${props => props.primary ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.primary ? 'white' : 'var(--primary-color)'};
  border: 1px solid var(--primary-color);
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.primary ? '#0256b4' : 'rgba(3, 102, 214, 0.1)'};
  }
`;

const NoEmailsMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: var(--light-text);
`;

// Icons
const EnvelopeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 7l-10 7-10-7" />
  </svg>
);

const InboxIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);

const PriorityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const ReplyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 17 4 12 9 7" />
    <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
  </svg>
);

const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const DashboardPage = () => {
  const { userEmail, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('priority');
  const [loading, setLoading] = useState(true);
  const [priorityEmails, setPriorityEmails] = useState({ top_important_emails: [], reply_needed_emails: [] });
  const [recentEmails, setRecentEmails] = useState([]);

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        setLoading(true);
        
        if (activeTab === 'priority') {
          const response = await api.emails.getPriorityEmails();
          setPriorityEmails(response.data);
        } else if (activeTab === 'inbox') {
          const response = await api.emails.getEmailList();
          setRecentEmails(response.data.emails);
        } else if (activeTab === 'reply') {
          const response = await api.emails.getReplyNeededEmails();
          setRecentEmails(response.data);
        }
        
      } catch (error) {
        console.error('Error fetching emails:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
  }, [activeTab]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleEmailClick = (emailId) => {
    navigate(`/email/${emailId}`);
  };

  const handleGenerateDraft = async (emailId) => {
    try {
      await api.drafts.generateDraft(emailId);
      // Could show a success notification here
    } catch (error) {
      console.error('Error generating draft:', error);
      // Could show an error notification here
    }
  };

  const renderEmails = () => {
    if (loading) {
      return <LoadingSpinner text="Loading emails..." />;
    }

    if (activeTab === 'priority') {
      return (
        <>
          <SectionTitle>Important Emails</SectionTitle>
          <EmailsContainer>
            {priorityEmails.top_important_emails && priorityEmails.top_important_emails.length > 0 ? (
              priorityEmails.top_important_emails.map((email) => (
                <EmailCard key={email.email_id} onClick={() => handleEmailClick(email.email_id)}>
                  <EmailHeader>
                    <EmailSender>{email.sender}</EmailSender>
                    <EmailDate>{email.date}</EmailDate>
                  </EmailHeader>
                  <EmailSubject>{email.subject}</EmailSubject>
                  <EmailSnippet>{email.snippet}</EmailSnippet>
                  {email.summary && <EmailSummary>{email.summary}</EmailSummary>}
                  <ActionButtonsContainer>
                    <ActionButton onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateDraft(email.email_id);
                    }}>
                      Generate Draft
                    </ActionButton>
                  </ActionButtonsContainer>
                </EmailCard>
              ))
            ) : (
              <NoEmailsMessage>No important emails at the moment.</NoEmailsMessage>
            )}
          </EmailsContainer>

          <SectionTitle style={{ marginTop: '2rem' }}>Emails Needing Reply</SectionTitle>
          <EmailsContainer>
            {priorityEmails.reply_needed_emails && priorityEmails.reply_needed_emails.length > 0 ? (
              priorityEmails.reply_needed_emails.map((email) => (
                <EmailCard key={email.email_id} onClick={() => handleEmailClick(email.email_id)}>
                  <EmailHeader>
                    <EmailSender>{email.sender}</EmailSender>
                    <EmailDate>{email.date}</EmailDate>
                  </EmailHeader>
                  <EmailSubject>{email.subject}</EmailSubject>
                  <EmailSnippet>{email.snippet}</EmailSnippet>
                  {email.summary && <EmailSummary>{email.summary}</EmailSummary>}
                  <ActionButtonsContainer>
                    <ActionButton primary onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateDraft(email.email_id);
                    }}>
                      Generate Reply
                    </ActionButton>
                  </ActionButtonsContainer>
                </EmailCard>
              ))
            ) : (
              <NoEmailsMessage>No emails requiring replies at the moment.</NoEmailsMessage>
            )}
          </EmailsContainer>
        </>
      );
    } else {
      return (
        <>
          <SectionTitle>
            {activeTab === 'inbox' ? 'Recent Emails' : 'Emails Needing Reply'}
          </SectionTitle>
          <EmailsContainer>
            {recentEmails && recentEmails.length > 0 ? (
              recentEmails.map((email) => (
                <EmailCard key={email.email_id} onClick={() => handleEmailClick(email.email_id)}>
                  <EmailHeader>
                    <EmailSender>{email.sender}</EmailSender>
                    <EmailDate>{email.date}</EmailDate>
                  </EmailHeader>
                  <EmailSubject>{email.subject}</EmailSubject>
                  <EmailSnippet>{email.snippet}</EmailSnippet>
                  {email.summary && <EmailSummary>{email.summary}</EmailSummary>}
                  <ActionButtonsContainer>
                    <ActionButton primary={activeTab === 'reply'} onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateDraft(email.email_id);
                    }}>
                      {activeTab === 'reply' ? 'Generate Reply' : 'Generate Draft'}
                    </ActionButton>
                  </ActionButtonsContainer>
                </EmailCard>
              ))
            ) : (
              <NoEmailsMessage>No emails found.</NoEmailsMessage>
            )}
          </EmailsContainer>
        </>
      );
    }
  };

  return (
    <DashboardContainer>
      <Header>
        <Logo>
          <EnvelopeIcon />
          <h1>Gmail Agent</h1>
        </Logo>
        <UserInfo>
          <UserEmail>{userEmail}</UserEmail>
          <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
        </UserInfo>
      </Header>

      <MainContent>
        <Sidebar>
          <NavMenu>
            <NavItem 
              className={activeTab === 'priority' ? 'active' : ''} 
              onClick={() => setActiveTab('priority')}
            >
              <PriorityIcon /> Priority Inbox
            </NavItem>
            <NavItem 
              className={activeTab === 'inbox' ? 'active' : ''} 
              onClick={() => setActiveTab('inbox')}
            >
              <InboxIcon /> All Emails
            </NavItem>
            <NavItem 
              className={activeTab === 'reply' ? 'active' : ''} 
              onClick={() => setActiveTab('reply')}
            >
              <ReplyIcon /> Needs Reply
            </NavItem>
            <NavItem onClick={() => navigate('/chat')}>
              <ChatIcon /> Chat
            </NavItem>
          </NavMenu>
        </Sidebar>

        <ContentArea>
          {renderEmails()}
        </ContentArea>
      </MainContent>
    </DashboardContainer>
  );
};

export default DashboardPage;
