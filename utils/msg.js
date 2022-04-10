const { v4: uuidv4 } = require("uuid");

const createRoom = (user) =>
  Object.keys(user).length !== 0 && [
    {
      _id: uuidv4(),
      text: `${user.displayName} create the chat. Start chatting!`,
      createdAt: new Date(),
      system: true,
    },
  ];

const joinRoom = (user) =>
  Object.keys(user).length !== 0 && [
    {
      _id: uuidv4(),
      text: `${user.displayName} 加入聊天室！`,
      createdAt: new Date(),
      system: true,
    },
  ];

const leaveRoom = (user) =>
  Object.keys(user).length !== 0 && [
    {
      _id: uuidv4(),
      text: `${user.displayName} leave the chat.`,
      createdAt: new Date(),
      system: true,
    },
  ];

const privateRoom = () => [
  {
    _id: uuidv4(),
    text: `This is your private room, only the invited users can join this room.`,
    createdAt: new Date(),
    system: true,
  },
];

const publicRoom = () => [
  {
    _id: uuidv4(),
    text: `Welcome to the public room, your messages will be broadcast to all users.`,
    createdAt: new Date(),
    system: true,
  },
];

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  privateRoom,
  publicRoom,
};
