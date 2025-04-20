import React, { useEffect } from 'react';

const MyRequests = () => {
  const t = useEffect(() => {
    fetchRequests();
  }, [fetchRequests, t]);

  return (
    // ... existing code ...
  );
};

export default MyRequests; 