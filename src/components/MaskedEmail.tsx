
import React from 'react';

interface MaskedEmailProps {
  email: string;
  showFull?: boolean;
}

const MaskedEmail: React.FC<MaskedEmailProps> = ({ email, showFull = false }) => {
  if (showFull) {
    return <span>{email}</span>;
  }

  // Email is already masked by the database function, so just display it
  // This component now serves as a consistent interface for email display
  return <span>{email}</span>;
};

export default MaskedEmail;
