import { io } from 'socket.io-client';

const SOCKET_URL = 'https://krishishare.onrender.com';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});
