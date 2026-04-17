import Ably from 'ably';

// This will only work on the server side because ABLY_API_KEY is not NEXT_PUBLIC
const isServer = typeof window === 'undefined';

export const ably = isServer 
  ? new Ably.Realtime({ key: process.env.ABLY_API_KEY })
  : new Ably.Realtime({ authUrl: '/api/ably/auth' });

export const getAblyChannel = (userId1: string, userId2: string) => {
  const sortedIds = [userId1, userId2].sort();
  return ably.channels.get(`chat:${sortedIds[0]}-${sortedIds[1]}`);
};
