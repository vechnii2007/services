import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Typography, Avatar, Paper } from '@mui/material';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import { formatDistance } from 'date-fns';
import SendIcon from '@mui/icons-material/Send';
import styled from '@emotion/styled';

const MessageContainer = styled(Box)`
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 400px;
    overflow-y: auto;
    padding: 20px;
`;

const Message = styled(Paper)`
    padding: 10px;
    margin: 5px;
    max-width: 70%;
    align-self: ${props => props.isMine ? 'flex-end' : 'flex-start'};
    background-color: ${props => props.isMine ? '#e3f2fd' : '#f5f5f5'};
`;

const TypingIndicator = styled(Typography)`
    font-style: italic;
    color: #666;
    font-size: 0.8rem;
    margin: 5px;
`;

const Chat = ({ recipientId, recipientName }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const { socket } = useSocket();
    const { user } = useAuth();
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (!socket) return;

        // Загрузка истории сообщений
        const loadMessages = async () => {
            try {
                const response = await fetch(`/api/messages/${recipientId}`);
                const data = await response.json();
                setMessages(data);
                scrollToBottom();
            } catch (error) {
                console.error('Error loading messages:', error);
            }
        };

        loadMessages();

        // Подписка на новые сообщения
        socket.on('private_message', (message) => {
            setMessages(prev => [...prev, message]);
            scrollToBottom();
        });

        // Подписка на индикатор печатания
        socket.on('typing', (data) => {
            if (data.userId === recipientId) {
                setIsTyping(true);
                setTimeout(() => setIsTyping(false), 3000);
            }
        });

        return () => {
            socket.off('private_message');
            socket.off('typing');
        };
    }, [socket, recipientId]);

    const handleTyping = () => {
        if (!socket) return;

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        socket.emit('typing', { recipientId });

        typingTimeoutRef.current = setTimeout(() => {
            typingTimeoutRef.current = null;
        }, 2000);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        const messageData = {
            recipientId,
            message: newMessage.trim()
        };

        socket.emit('private_message', messageData);

        // Оптимистичное обновление UI
        setMessages(prev => [...prev, {
            senderId: user.id,
            message: newMessage.trim(),
            timestamp: new Date()
        }]);

        setNewMessage('');
        scrollToBottom();
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">
                    Chat with {recipientName}
                </Typography>
            </Box>

            <MessageContainer>
                {messages.map((msg, index) => (
                    <Message
                        key={index}
                        isMine={msg.senderId === user.id}
                        elevation={1}
                    >
                        <Typography variant="body1">
                            {msg.message}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                            {formatDistance(new Date(msg.timestamp), new Date(), { addSuffix: true })}
                        </Typography>
                    </Message>
                ))}
                {isTyping && (
                    <TypingIndicator>
                        {recipientName} is typing...
                    </TypingIndicator>
                )}
                <div ref={messagesEndRef} />
            </MessageContainer>

            <Box
                component="form"
                onSubmit={handleSendMessage}
                sx={{
                    p: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    gap: 1
                }}
            >
                <TextField
                    fullWidth
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleTyping}
                    placeholder="Type a message..."
                    variant="outlined"
                    size="small"
                />
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={!newMessage.trim()}
                    endIcon={<SendIcon />}
                >
                    Send
                </Button>
            </Box>
        </Box>
    );
};

export default Chat; 