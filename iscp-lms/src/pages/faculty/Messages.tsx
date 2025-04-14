/**
 * Messages.tsx (Faculty)
 * 
 * Author: Marc Laurence Lapating
 * Date: April 9, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Faculty messaging interface for communicating with
 * students, other faculty members, and administrators.
 */

import React, { useState, useEffect, useRef } from 'react';
import FacultyLayout from '../../components/FacultyLayout';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Badge,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import {
  Search,
  Send,
  InsertDriveFile,
  Image,
  MoreVert,
  Create,
  FilterList,
  ArrowBack,
  Close
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import messageService, { Conversation, Message, Contact } from '../../services/MessageService';

const getAvatarBgColor = (id: number) => {
  const colors = [
    '#1976d2', // blue
    '#2e7d32', // green
    '#c62828', // red
    '#673ab7', // deep purple
    '#f57c00', // orange
    '#0097a7', // cyan
    '#d81b60', // pink
    '#5c6bc0', // indigo
    '#546e7a', // blue gray
    '#4527a0'  // deep purple
  ];
  
  return colors[id % colors.length];
};

const Messages: React.FC = () => {
  const { authState } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [mobileView, setMobileView] = useState<'contacts' | 'conversation'>('contacts');
  const [newMessageDialogOpen, setNewMessageDialogOpen] = useState(false);
  const [searchUserInput, setSearchUserInput] = useState('');
  const [availableUsers, setAvailableUsers] = useState<Contact[]>([]);
  const [selectedUser, setSelectedUser] = useState<Contact | null>(null);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [typingUsers, setTypingUsers] = useState<Record<number, boolean>>({});
  const typingTimeoutRef = useRef<Record<number, NodeJS.Timeout>>({});
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [searchedMessages, setSearchedMessages] = useState<Message[]>([]);
  const [isSearchingMessages, setIsSearchingMessages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const conversationsData = await messageService.getConversations();
        setConversations(conversationsData);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchConversations();
  }, []);
  
  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedConversation) {
        try {
          const messagesData = await messageService.getMessages(selectedConversation);
          setMessages(messagesData);
          // Mark messages as read
          await messageService.markAsRead(selectedConversation);
          
          // Update the unread count in the conversations list
          setConversations(prevConversations => 
            prevConversations.map(conv => 
              conv.id === selectedConversation 
                ? { ...conv, unreadCount: 0 } 
                : conv
            )
          );
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      }
    };
    
    fetchMessages();
  }, [selectedConversation]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleConversationSelect = (conversationId: number) => {
    setSelectedConversation(conversationId);
    setMobileView('conversation');
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  };
  
  const handleMessageChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setMessageInput(event.target.value);
    
    if (selectedConversation && event.target.value.trim() !== '') {
      handleTypingIndicator(selectedConversation);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSendMessage();
    }
  };
  
  const handleSendMessage = async () => {
    if ((messageInput.trim() !== '' || selectedFile) && selectedConversation) {
      try {
        setSendingMessage(true);
        
        let attachmentUrl = '';
        let attachmentType = '';
        
        // Upload file if selected
        if (selectedFile) {
          setUploadingFile(true);
          const uploadResult = await messageService.uploadMessageAttachment(selectedFile);
          setUploadingFile(false);
          
          if (uploadResult) {
            attachmentUrl = uploadResult.url;
            attachmentType = uploadResult.type;
          } else {
            // Handle upload failure
            alert('Failed to upload attachment. Please try again.');
            setSendingMessage(false);
            return;
          }
        }
        
        const newMessage = await messageService.sendMessage(
          selectedConversation, 
          messageInput,
          attachmentUrl,
          attachmentType
        );
        
        setMessages(prevMessages => [...prevMessages, newMessage]);
        
        // Update the conversation in the list with the latest message
        setConversations(prevConversations => 
          prevConversations.map(conv => 
            conv.id === selectedConversation 
              ? { 
                  ...conv, 
                  lastMessage: {
                    ...newMessage,
                    sender_name: authState.user?.fullName || 'You'
                  }
                } 
              : conv
          )
        );
        
        setMessageInput('');
        setSelectedFile(null);
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        setSendingMessage(false);
      }
    }
  };
  
  const handleBackToContacts = () => {
    setMobileView('contacts');
  };
  
  const handleOpenNewMessageDialog = async () => {
    setNewMessageDialogOpen(true);
    try {
      const users = await messageService.getUsers();
      setAvailableUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };
  
  const handleCloseNewMessageDialog = () => {
    setNewMessageDialogOpen(false);
    setSelectedUser(null);
    setSearchUserInput('');
  };
  
  const handleSearchInputChange = async (event: React.SyntheticEvent, value: string) => {
    setSearchUserInput(value);
    
    if (value.length > 2) {
      try {
        const users = await messageService.getUsers(value);
        setAvailableUsers(users);
      } catch (error) {
        console.error('Error searching users:', error);
      }
    } else if (value.length === 0 && availableUsers.length === 0) {
      // If search is cleared and no users are shown, load all users
      try {
        const users = await messageService.getUsers();
        setAvailableUsers(users);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    }
  };
  
  const handleCreateConversation = async () => {
    if (!selectedUser) return;
    
    try {
      setCreatingConversation(true);
      
      let attachmentUrl = '';
      let attachmentType = '';
      
      // Upload file if selected
      if (selectedFile) {
        setUploadingFile(true);
        const uploadResult = await messageService.uploadMessageAttachment(selectedFile);
        setUploadingFile(false);
        
        if (uploadResult) {
          attachmentUrl = uploadResult.url;
          attachmentType = uploadResult.type;
        } else {
          // Handle upload failure
          alert('Failed to upload attachment. Please try again.');
          setCreatingConversation(false);
          return;
        }
      }
      
      const initialMsg = messageInput.trim() ? messageInput : undefined;
      const result = await messageService.createConversation(
        [selectedUser.id], 
        undefined, 
        'direct',
        initialMsg,
        attachmentUrl || undefined,
        attachmentType || undefined
      );
      
      // Refresh conversations list
      const conversationsData = await messageService.getConversations();
      setConversations(conversationsData);
      
      // Select the new conversation
      setSelectedConversation(result.conversationId);
      setMobileView('conversation');
      setMessageInput('');
      setSelectedFile(null);
      
      // Close dialog
      handleCloseNewMessageDialog();
      
      // Fetch messages for the new conversation
      const messagesData = await messageService.getMessages(result.conversationId);
      setMessages(messagesData);
      
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setCreatingConversation(false);
    }
  };
  
  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => {
    const otherUser = conv.otherParticipant;
    if (!otherUser) return false;
    
    return (
      otherUser.fullName.toLowerCase().includes(searchInput.toLowerCase()) ||
      (conv.lastMessage?.content || '').toLowerCase().includes(searchInput.toLowerCase())
    );
  });
  
  const selectedConversationDetails = selectedConversation 
    ? conversations.find(c => c.id === selectedConversation) 
    : null;
  
  // Add a function to simulate user typing (in a real app, this would use WebSockets)
  const handleTypingIndicator = (conversationId: number) => {
    if (!typingUsers[conversationId]) {
      setTypingUsers(prev => ({ ...prev, [conversationId]: true }));
      
      // Clear any existing timeout
      if (typingTimeoutRef.current[conversationId]) {
        clearTimeout(typingTimeoutRef.current[conversationId]);
      }
      
      // Set a timeout to clear the typing indicator after 3 seconds
      typingTimeoutRef.current[conversationId] = setTimeout(() => {
        setTypingUsers(prev => ({ ...prev, [conversationId]: false }));
      }, 3000);
    }
  };
  
  // Format timestamp to be more user-friendly
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'long' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  
  // Function to handle message search
  const handleMessageSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setMessageSearchQuery(query);
    
    if (query.trim() === '') {
      setIsSearchingMessages(false);
      setSearchedMessages([]);
      return;
    }
    
    setIsSearchingMessages(true);
    const filtered = messages.filter(msg => 
      msg.content.toLowerCase().includes(query.toLowerCase())
    );
    setSearchedMessages(filtered);
  };
  
  // File handling functions
  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
    
    // Reset the file input so the same file can be selected again
    if (event.target.value) {
      event.target.value = '';
    }
  };
  
  const handleRemoveSelectedFile = () => {
    setSelectedFile(null);
  };
  
  const handleOpenAttachment = (url: string) => {
    const fullUrl = url.startsWith('http') ? url : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${url}`;
    window.open(fullUrl, '_blank');
  };
  
  const renderMessage = (message: Message, index: number) => {
    const isCurrentUser = message.sender_id === (authState.user?.id || 0);
    
    return (
      <Box
        key={message.id}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
          mb: 2,
          maxWidth: '75%',
          width: 'fit-content',
          alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
          mr: isCurrentUser ? 0 : 'auto',
          ml: isCurrentUser ? 'auto' : 0
        }}
      >
        {!isCurrentUser && (
          <Typography 
            variant="caption" 
            sx={{ ml: 1.5, mb: 0.5, color: 'rgba(255, 255, 255, 0.7)' }}
          >
            {message.sender_name}
            {message.sender_campus && (
              <Chip
                label={message.sender_campus}
                size="small"
                sx={{
                  fontSize: '0.6rem',
                  height: 16,
                  ml: 1,
                  bgcolor: 'rgba(156, 39, 176, 0.2)',
                  color: 'secondary.light',
                }}
              />
            )}
          </Typography>
        )}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            bgcolor: isCurrentUser ? 'primary.main' : 'rgba(255, 255, 255, 0.1)',
            color: isCurrentUser ? '#fff' : 'rgba(255, 255, 255, 0.9)',
            borderRadius: 2,
            width: 'fit-content',
            maxWidth: '100%',
            wordWrap: 'break-word'
          }}
        >
          {message.content && (
            <Typography>{message.content}</Typography>
          )}
          
          {message.attachment_url && (
            <Box 
              sx={{ 
                mt: message.content ? 1 : 0, 
                p: 1, 
                bgcolor: isCurrentUser ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.15)', 
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer'
              }}
              onClick={() => handleOpenAttachment(message.attachment_url || '')}
            >
              <InsertDriveFile sx={{ mr: 1 }} />
              <Typography variant="body2">
                Attachment
              </Typography>
            </Box>
          )}
        </Paper>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
            mt: 0.5,
            mx: 1
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            {new Date(message.created_at).toLocaleString([], {
              hour: '2-digit',
              minute: '2-digit',
              month: 'short',
              day: 'numeric'
            })}
          </Typography>
          {isCurrentUser && (
            <Box
              component="span"
              sx={{
                ml: 0.5,
                color: message.read_by_all ? 'success.light' : 'rgba(255, 255, 255, 0.3)',
                fontSize: '0.7rem',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {message.read_by_all ? (
                <Box component="span" sx={{ ml: 0.5, display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', marginLeft: '2px' }}>✓✓</span>
                </Box>
              ) : message.read_by && message.read_by.length > 0 ? (
                <Box component="span" sx={{ ml: 0.5, display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', marginLeft: '2px' }}>✓</span>
                </Box>
              ) : null}
            </Box>
          )}
        </Box>
      </Box>
    );
  };
  
  return (
    <FacultyLayout title="Messages">
      <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 600, 
              color: '#fff',
              mb: 1
            }}
          >
            Messages
          </Typography>
          <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Communicate with your students and colleagues
          </Typography>
        </Box>
        
        {/* Messages Interface */}
        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            height: 'calc(100vh - 240px)',
            minHeight: 500,
            display: 'flex',
            flexDirection: 'row',
          }}
        >
          {/* Left Panel (Contacts) */}
          <Box 
            sx={{ 
              width: { xs: '100%', md: 320 },
              borderRight: '1px solid rgba(255, 255, 255, 0.1)',
              display: { 
                xs: mobileView === 'contacts' ? 'flex' : 'none', 
                md: 'flex' 
              },
              flexDirection: 'column',
              height: '100%',
            }}
          >
            {/* Search Bar */}
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <TextField
                placeholder="Search messages..."
                variant="outlined"
                size="small"
                fullWidth
                value={searchInput}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        <FilterList />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    color: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                  }
                }}
              />
            </Box>
            
            {/* Conversations List */}
            <List sx={{ 
              flexGrow: 1, 
              overflowY: 'auto', 
              p: 0,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(0, 0, 0, 0.1)',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: 'rgba(255, 255, 255, 0.3)',
              },
            }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress size={24} sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                </Box>
              ) : filteredConversations.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    No conversations found
                  </Typography>
                </Box>
              ) : (
                filteredConversations.map((conv) => {
                  const otherUser = conv.otherParticipant;
                  if (!otherUser) return null;
                  
                  return (
                    <React.Fragment key={conv.id}>
                      <ListItem 
                        alignItems="flex-start"
                        sx={{ 
                          px: 2, 
                          py: 1,
                          cursor: 'pointer',
                          bgcolor: selectedConversation === conv.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                          '&:hover': { 
                            bgcolor: selectedConversation === conv.id ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)' 
                          }
                        }}
                        onClick={() => handleConversationSelect(conv.id)}
                      >
                        <ListItemAvatar>
                          <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            variant="dot"
                            color={otherUser.status === 'online' ? 'success' : 'default'}
                          >
                            <Avatar 
                              alt={otherUser.fullName || 'User'} 
                              src={otherUser.profileImage || undefined}
                              sx={{ 
                                width: 48, 
                                height: 48,
                                bgcolor: otherUser.profileImage ? undefined : getAvatarBgColor(otherUser.id)
                              }}
                            >
                              {(otherUser.fullName || 'U').charAt(0)}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 500 }}>
                                {otherUser.fullName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                {formatMessageTime(conv.updatedAt)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: 'rgba(255, 255, 255, 0.7)',
                                  mb: 0.5,
                                  display: 'flex',
                                  alignItems: 'center',
                                  flexWrap: 'wrap'
                                }}
                              >
                                <Chip 
                                  label={otherUser.role} 
                                  size="small" 
                                  sx={{ 
                                    fontSize: '0.7rem',
                                    height: 20,
                                    mr: 1,
                                    mb: 0.5,
                                    bgcolor: otherUser.role === 'student' ? 'rgba(25, 118, 210, 0.2)' : 'rgba(76, 175, 80, 0.2)', 
                                    color: otherUser.role === 'student' ? 'primary.light' : 'success.light',
                                  }}
                                />
                                {otherUser.campus && (
                                  <Chip 
                                    label={otherUser.campus} 
                                    size="small" 
                                    sx={{ 
                                      fontSize: '0.7rem',
                                      height: 20,
                                      mr: 1,
                                      mb: 0.5,
                                      bgcolor: 'rgba(156, 39, 176, 0.2)',
                                      color: 'secondary.light',
                                    }}
                                  />
                                )}
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    fontSize: '0.75rem',
                                    display: 'inline-block',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '180px'
                                  }}
                                >
                                  {otherUser.email}
                                </Typography>
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: conv.unreadCount > 0 ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                                    fontWeight: conv.unreadCount > 0 ? 500 : 400,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '180px'
                                  }}
                                >
                                  {typingUsers[conv.id] ? (
                                    <Box component="span" sx={{ color: '#2196f3', fontStyle: 'italic' }}>
                                      typing...
                                    </Box>
                                  ) : (
                                    conv.lastMessage?.content || 'No messages yet'
                                  )}
                                </Typography>
                                {conv.unreadCount > 0 && (
                                  <Badge 
                                    badgeContent={conv.unreadCount} 
                                    color="primary"
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      <Divider component="li" sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                    </React.Fragment>
                  );
                })
              )}
            </List>
            
            {/* New Message Button */}
            <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Create />}
                onClick={handleOpenNewMessageDialog}
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                  },
                  borderRadius: 2,
                  py: 1
                }}
              >
                New Message
              </Button>
            </Box>
          </Box>
          
          {/* Right Panel (Conversation) */}
          <Box 
            sx={{ 
              flexGrow: 1, 
              display: { 
                xs: mobileView === 'conversation' ? 'flex' : 'none', 
                md: 'flex' 
              },
              flexDirection: 'column',
              height: '100%',
              position: 'relative'
            }}
          >
            {/* Mobile back button */}
            {mobileView === 'conversation' && (
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 8, 
                  left: 8, 
                  zIndex: 10,
                  display: { xs: 'block', md: 'none' }
                }}
              >
                <IconButton onClick={handleBackToContacts} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  <ArrowBack />
                </IconButton>
              </Box>
            )}
            
            {selectedConversation && selectedConversationDetails ? (
              <>
                {/* Conversation Header */}
                <Box sx={{ 
                  p: 2, 
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      alt={selectedConversationDetails.otherParticipant?.fullName || 'User'} 
                      src={selectedConversationDetails.otherParticipant?.profileImage || undefined}
                      sx={{ 
                        width: 40, 
                        height: 40, 
                        mr: 2,
                        bgcolor: selectedConversationDetails.otherParticipant?.profileImage 
                          ? undefined 
                          : getAvatarBgColor(selectedConversationDetails.otherParticipant?.id || 0)
                      }}
                    >
                      {(selectedConversationDetails.otherParticipant?.fullName || 'U').charAt(0)}
                    </Avatar>
                    
                    <Box>
                      <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 500 }}>
                        {selectedConversationDetails.otherParticipant?.fullName}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mr: 1 }}>
                          {selectedConversationDetails.otherParticipant?.role}
                        </Typography>
                        {selectedConversationDetails.otherParticipant?.campus && (
                          <Chip 
                            label={selectedConversationDetails.otherParticipant.campus} 
                            size="small" 
                            sx={{ 
                              fontSize: '0.7rem',
                              height: 20,
                              bgcolor: 'rgba(156, 39, 176, 0.2)',
                              color: 'secondary.light',
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {/* Search Messages Button */}
                    <IconButton 
                      onClick={() => setIsSearchingMessages(!isSearchingMessages)}
                      sx={{ 
                        color: isSearchingMessages ? 'primary.main' : 'rgba(255, 255, 255, 0.7)',
                        mr: 1
                      }}
                    >
                      <Search />
                    </IconButton>
                    <IconButton sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      <MoreVert />
                    </IconButton>
                  </Box>
                </Box>
                
                {/* Message Search Bar - shown when searching */}
                {isSearchingMessages && (
                  <Box sx={{ p: 1, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <TextField
                      placeholder="Search in conversation..."
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={messageSearchQuery}
                      onChange={handleMessageSearch}
                      autoFocus
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                          </InputAdornment>
                        ),
                        endAdornment: messageSearchQuery && (
                          <InputAdornment position="end">
                            <IconButton 
                              size="small" 
                              onClick={() => {
                                setMessageSearchQuery('');
                                setIsSearchingMessages(false);
                                setSearchedMessages([]);
                              }}
                            >
                              <Close sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                            </IconButton>
                          </InputAdornment>
                        ),
                        sx: {
                          color: '#fff',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                          },
                        }
                      }}
                    />
                    {messageSearchQuery && (
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 0.5, display: 'block' }}>
                        {searchedMessages.length} {searchedMessages.length === 1 ? 'result' : 'results'} found
                      </Typography>
                    )}
                  </Box>
                )}
                
                {/* Conversation Messages */}
                <Box sx={{ 
                  flexGrow: 1, 
                  overflowY: 'auto',
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'rgba(0, 0, 0, 0.1)',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    background: 'rgba(255, 255, 255, 0.3)',
                  },
                }}>
                  {messages.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        No messages yet. Start the conversation!
                      </Typography>
                    </Box>
                  ) : messageSearchQuery && isSearchingMessages ? (
                    searchedMessages.length === 0 ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          No messages matching "{messageSearchQuery}"
                        </Typography>
                      </Box>
                    ) : (
                      searchedMessages.map((message) => renderMessage(message, messages.indexOf(message)))
                    )
                  ) : (
                    messages.map((message) => renderMessage(message, messages.indexOf(message)))
                  )}
                  <div ref={messagesEndRef} />
                </Box>
                
                {/* Message Input */}
                <Box sx={{ 
                  p: 2, 
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {selectedFile && selectedFile.name && (
                    <Box sx={{ 
                      mb: 1, 
                      p: 1, 
                      bgcolor: 'rgba(255, 255, 255, 0.08)', 
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid rgba(255, 255, 255, 0.12)'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <InsertDriveFile sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />
                        <Typography variant="body2" sx={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(255, 255, 255, 0.7)' }}>
                          {selectedFile.name}
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={handleRemoveSelectedFile} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        <Close fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton 
                      sx={{ mr: 2, color: 'rgba(255, 255, 255, 0.7)' }}
                      onClick={handleFileSelect}
                      disabled={sendingMessage || uploadingFile}
                    >
                      <InsertDriveFile />
                    </IconButton>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                    <TextField
                      placeholder="Type a message..."
                      variant="outlined"
                      fullWidth
                      size="small"
                      value={messageInput}
                      onChange={handleMessageChange}
                      onKeyPress={handleKeyPress}
                      disabled={sendingMessage || uploadingFile}
                      InputProps={{
                        sx: {
                          color: '#fff',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                          },
                        }
                      }}
                    />
                    
                    <IconButton 
                      sx={{ 
                        ml: 2, 
                        bgcolor: 'primary.main',
                        color: '#fff',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                        }
                      }}
                      onClick={handleSendMessage}
                      disabled={(!messageInput.trim() && !selectedFile) || sendingMessage || uploadingFile}
                    >
                      {sendingMessage || uploadingFile ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : <Send />}
                    </IconButton>
                  </Box>
                </Box>
              </>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                p: 3,
                textAlign: 'center'
              }}>
                <Box 
                  sx={{ 
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2
                  }}
                >
                  <Send sx={{ fontSize: 40, color: 'rgba(255, 255, 255, 0.3)' }} />
                </Box>
                <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                  No conversation selected
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', maxWidth: 400 }}>
                  Select a contact from the list to start chatting or create a new message
                </Typography>
                
                <Button
                  variant="contained"
                  startIcon={<Create />}
                  onClick={handleOpenNewMessageDialog}
                  sx={{ 
                    mt: 3,
                    textTransform: 'none',
                    borderRadius: 2
                  }}
                >
                  New Message
                </Button>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
      
      {/* New Message Dialog */}
      <Dialog 
        open={newMessageDialogOpen} 
        onClose={handleCloseNewMessageDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: 'background.default',
            backgroundImage: 'none',
            color: 'text.primary'
          }
        }}
      >
        <DialogTitle>New Message</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={availableUsers}
            getOptionLabel={(option) => `${option.fullName} (${option.email})`}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar 
                    src={option.profileImage || undefined} 
                    alt={option.fullName}
                    sx={{ width: 32, height: 32, mr: 1 }}
                  />
                  <Box>
                    <Typography variant="body2">{option.fullName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.email} • {option.role}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
            value={selectedUser}
            onChange={(_, newValue) => setSelectedUser(newValue)}
            inputValue={searchUserInput}
            onInputChange={handleSearchInputChange}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search for a user"
                variant="outlined"
                fullWidth
                margin="normal"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  )
                }}
              />
            )}
          />
          
          <TextField
            label="Message"
            multiline
            rows={4}
            fullWidth
            margin="normal"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            variant="outlined"
          />
          
          {/* File Attachment for New Message */}
          {selectedFile && selectedFile.name && (
            <Box sx={{ 
              mt: 1, 
              p: 1, 
              bgcolor: 'rgba(255, 255, 255, 0.08)', 
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <InsertDriveFile sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />
                <Typography variant="body2" sx={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(255, 255, 255, 0.7)' }}>
                  {selectedFile.name}
                </Typography>
              </Box>
              <IconButton size="small" onClick={handleRemoveSelectedFile} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                <Close fontSize="small" />
              </IconButton>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewMessageDialog}>CANCEL</Button>
          <Button 
            onClick={handleCreateConversation}
            variant="contained"
            color="primary"
            disabled={!selectedUser || creatingConversation}
          >
            {creatingConversation ? <CircularProgress size={24} /> : 'START CONVERSATION'}
          </Button>
        </DialogActions>
      </Dialog>
    </FacultyLayout>
  );
};

export default Messages; 