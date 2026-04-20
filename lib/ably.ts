import Ably from 'ably';

// This will only work on the server side because ABLY_API_KEY is not NEXT_PUBLIC
const isServer = typeof window === 'undefined';

const ablyOptions = isServer 
  ? (process.env.ABLY_API_KEY ? { key: process.env.ABLY_API_KEY } : null)
  : { authUrl: '/api/ably/auth' };

export const ably = ablyOptions 
  ? new Ably.Realtime(ablyOptions)
  : (null as unknown as Ably.Realtime);

export const getAblyChannel = (userId1: string, userId2: string) => {
  const sortedIds = [userId1, userId2].sort();
  return ably.channels.get(`chat:${sortedIds[0]}-${sortedIds[1]}`);
};
