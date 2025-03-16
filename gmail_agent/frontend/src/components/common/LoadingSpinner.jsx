import React from 'react';
import styled, { keyframes } from 'styled-components';

const spinAnimation = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const SpinnerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: ${props => props.fullScreen ? '100vh' : '100%'};
  width: 100%;
`;

const Spinner = styled.div`
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: var(--primary-color);
  animation: ${spinAnimation} 1s linear infinite;
`;

const LoadingText = styled.p`
  margin-left: 10px;
  color: var(--text-color);
  font-size: 16px;
`;

const LoadingSpinner = ({ fullScreen = false, text = null }) => {
  return (
    <SpinnerContainer fullScreen={fullScreen}>
      <Spinner />
      {text && <LoadingText>{text}</LoadingText>}
    </SpinnerContainer>
  );
};

export default LoadingSpinner;
