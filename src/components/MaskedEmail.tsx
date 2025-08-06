import React from 'react';

interface MaskedEmailProps {
  email: string;
  showFull?: boolean;
}

const MaskedEmail: React.FC<MaskedEmailProps> = ({ email, showFull = false }) => {
  if (showFull) {
    return <span>{email}</span>;
  }

  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) {
    return <span>{email}</span>;
  }

  // Show first 2 characters, then asterisks, then @domain
  const maskedLocal = localPart.length > 2 
    ? `${localPart.substring(0, 2)}${'*'.repeat(Math.max(localPart.length - 2, 3))}`
    : `${localPart}***`;

  return <span>{maskedLocal}@{domain}</span>;
};

export default MaskedEmail;