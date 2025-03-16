import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
`;

const BackButton = styled.button`
  background-color: transparent;
  border: none;
  color: var(--primary-color);
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0;
  margin-bottom: 2rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

const EmailCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 2rem;
`;

const EmailHeader = styled.div`
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem;
`;

const Subject = styled.h1`
  font-size: 1.75rem;
  margin: 0 0 1rem 0;
  color: var(--text-color);
`;

const InfoRow = styled.div`
  display: flex;
  margin-bottom: 0.75rem;
  gap: 0.5rem;
  
  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const Label = styled.div`
  font-weight: 600;
  width: 80px;
  flex-shrink: 0;
`;

const Value = styled.div`
  color: var(--text-color);
`;

const EmailBody = styled.div`
  white-space: pre-wrap;
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const EmailBodyHtml = styled.div`
  iframe {
    width: 100%;
    min-height: 300px;
    border: none;
  }
`;

const AttachmentsSection = styled.div`
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
`;

const AttachmentsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
`;

const AttachmentCard = styled.div`
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 0.75rem;
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const AttachmentName = styled.div`
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AttachmentSize = styled.div`
  font-size: 0.8rem;
  color: var(--light-text);
`;

const AttachmentActions = styled.div`
  display: flex;
  justify-content: space-between;
`;

const AttachmentButton = styled.button`
  background-color: ${props => props.primary ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.primary ? 'white' : 'var(--primary-color)'};
  border: 1px solid var(--primary-color);
  border-radius: 4px;
  padding: 0.5rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  margin: 0 0.25rem;
  
  &:hover {
    background-color: ${props => props.primary ? '#0256b4' : 'rgba(3, 102, 214, 0.1)'};
  }
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
`;

const ActionButton = styled.button`
  background-color: ${props => props.primary ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.primary ? 'white' : 'var(--primary-color)'};
  border: 1px solid var(--primary-color);
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.primary ? '#0256b4' : 'rgba(3, 102, 214, 0.1)'};
  }
`;

const DraftSection = styled.div`
  margin-top: 2rem;
  background-color: #f3f9ff;
  border: 1px solid #c0d5e8;
  border-radius: 8px;
  padding: 1.5rem;
`;

const DraftTitle = styled.h3`
  margin-top: 0;
  color: var(--primary-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DraftContent = styled.div`
  white-space: pre-wrap;
  line-height: 1.6;
  background-color: white;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #e1ecf7;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
`;

const ErrorMessage = styled.div`
  color: var(--error-color);
  background-color: #ffebee;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
`;

// Icons
const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"></path>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
  </svg>
);

const EmailDetailPage = () => {
  const { emailId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState(null);
  
  const [draft, setDraft] = useState(null);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  
  useEffect(() => {
    const fetchEmail = async () => {
      try {
        setLoading(true);
        const response = await api.emails.getEmailDetail(emailId);
        setEmail(response.data);
        
        // Fetch attachments if any
        if (response.data.attachments && response.data.attachments.length > 0) {
          const attachmentsResponse = await api.attachments.listAttachments(emailId);
          setAttachments(attachmentsResponse.data);
        }
      } catch (error) {
        console.error('Error fetching email:', error);
        setError('Failed to load email. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmail();
  }, [emailId]);
  
  const handleGoBack = () => {
    navigate('/dashboard');
  };
  
  const handleGenerateDraft = async () => {
    try {
      setGeneratingDraft(true);
      const response = await api.drafts.generateDraft(emailId);
      setDraft(response.data);
    } catch (error) {
      console.error('Error generating draft:', error);
      setError('Failed to generate draft. Please try again later.');
    } finally {
      setGeneratingDraft(false);
    }
  };
  
  const handleDownloadAttachment = (attachmentId) => {
    window.open(api.attachments.getAttachmentDownloadUrl(emailId, attachmentId), '_blank');
  };
  
  const handleSummarizeAttachment = async (attachmentId) => {
    try {
      const response = await api.attachments.getAttachmentSummary(emailId, attachmentId);
      alert(`Summary: ${response.data.summary}`);
    } catch (error) {
      console.error('Error summarizing attachment:', error);
      alert('Failed to summarize attachment. Please try again later.');
    }
  };
  
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  if (loading) {
    return (
      <Container>
        <LoadingContainer>
          <LoadingSpinner text="Loading email..." />
        </LoadingContainer>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container>
        <BackButton onClick={handleGoBack}><BackIcon /> Back to Dashboard</BackButton>
        <ErrorMessage>{error}</ErrorMessage>
      </Container>
    );
  }
  
  if (!email) {
    return (
      <Container>
        <BackButton onClick={handleGoBack}><BackIcon /> Back to Dashboard</BackButton>
        <ErrorMessage>Email not found.</ErrorMessage>
      </Container>
    );
  }
  
  return (
    <Container>
      <BackButton onClick={handleGoBack}><BackIcon /> Back to Dashboard</BackButton>
      
      <EmailCard>
        <EmailHeader>
          <Subject>{email.subject}</Subject>
          <InfoRow>
            <Label>From:</Label>
            <Value>{email.sender}</Value>
          </InfoRow>
          <InfoRow>
            <Label>Date:</Label>
            <Value>{email.date}</Value>
          </InfoRow>
        </EmailHeader>
        
        {email.html ? (
          <EmailBodyHtml>
            <div dangerouslySetInnerHTML={{ __html: email.html }} />
          </EmailBodyHtml>
        ) : (
          <EmailBody>{email.body}</EmailBody>
        )}
        
        {email.attachments && email.attachments.length > 0 && (
          <AttachmentsSection>
            <h3>Attachments ({email.attachments.length})</h3>
            <AttachmentsList>
              {email.attachments.map(attachment => (
                <AttachmentCard key={attachment.attachment_id}>
                  <AttachmentName>{attachment.filename}</AttachmentName>
                  <AttachmentSize>
                    {attachment.size ? formatBytes(attachment.size) : 'Unknown size'}
                  </AttachmentSize>
                  <AttachmentActions>
                    <AttachmentButton
                      onClick={() => handleDownloadAttachment(attachment.attachment_id)}
                    >
                      Download
                    </AttachmentButton>
                    <AttachmentButton
                      primary
                      onClick={() => handleSummarizeAttachment(attachment.attachment_id)}
                    >
                      Summarize
                    </AttachmentButton>
                  </AttachmentActions>
                </AttachmentCard>
              ))}
            </AttachmentsList>
          </AttachmentsSection>
        )}
        
        <ActionBar>
          <ActionButton primary onClick={handleGenerateDraft} disabled={generatingDraft || draft}>
            {generatingDraft ? 'Generating...' : 'Generate Draft Reply'}
          </ActionButton>
        </ActionBar>
        
        {draft && (
          <DraftSection>
            <DraftTitle><PencilIcon /> AI Generated Draft</DraftTitle>
            <DraftContent>{draft.content.body}</DraftContent>
            <ActionBar>
              {/* In a full implementation, we might have buttons to save to Gmail, edit draft, etc. */}
              <ActionButton>Edit Draft</ActionButton>
              <ActionButton primary>Send Reply</ActionButton>
            </ActionBar>
          </DraftSection>
        )}
      </EmailCard>
    </Container>
  );
};

export default EmailDetailPage;
