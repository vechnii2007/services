import React, { useEffect } from "react";

const useSocket = () => {
  const [socket, setSocket] = React.useState(null);

  useEffect(() => {
    if (socket) {
      // ... existing code ...
    }
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  return socket;
};

export default useSocket;
