/**
 * Messages.tsx (Admin)
 * 
 * Author: Marc Laurence Lapating
 * Date: April 13, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Administrator messaging interface for communicating with
 * faculty, students, and other administrators across the system.
 */

import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../components/AdminLayout';
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
import { format } from 'date-fns';

// Utility function to generate avatar background color
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
      
      const response = await messageService.createConversation(
        [selectedUser.id],
        undefined,
        'direct',
        messageInput,
        attachmentUrl,
        attachmentType
      );
      
      // If conversation already exists, select it
      if (response.alreadyExists) {
        const existingConversation = conversations.find(c => c.id === response.conversationId);
        if (existingConversation) {
          setSelectedConversation(existingConversation.id);
          setMobileView('conversation');
        } else {
          // Reload conversations to get the one that already exists
          const conversationsData = await messageService.getConversations();
          setConversations(conversationsData);
          setSelectedConversation(response.conversationId);
          setMobileView('conversation');
        }
      } else {
        // New conversation created, reload conversations
        const conversationsData = await messageService.getConversations();
        setConversations(conversationsData);
        setSelectedConversation(response.conversationId);
        setMobileView('conversation');
      }
      
      setMessageInput('');
      setSelectedUser(null);
      setNewMessageDialogOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setCreatingConversation(false);
    }
  };
  
  const handleTypingIndicator = (conversationId: number) => {
    // Clear previous timeout if exists
    if (typingTimeoutRef.current[conversationId]) {
      clearTimeout(typingTimeoutRef.current[conversationId]);
    }
    
    // Set typing indicator
    setTypingUsers(prev => ({ ...prev, [conversationId]: true }));
    
    // Clear typing indicator after 3 seconds
    typingTimeoutRef.current[conversationId] = setTimeout(() => {
      setTypingUsers(prev => ({ ...prev, [conversationId]: false }));
    }, 3000);
  };
  
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return format(date, 'h:mm a'); // Today: "3:45 PM"
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return format(date, 'EEEE'); // Day of week: "Monday"
    } else {
      return format(date, 'MMM d'); // Oct 12
    }
  };
  
  const handleMessageSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setMessageSearchQuery(query);
    
    if (query.trim() === '') {
      setIsSearchingMessages(false);
      setSearchedMessages([]);
      return;
    }
    
    setIsSearchingMessages(true);
    const results = messages.filter(message => 
      message.content.toLowerCase().includes(query.toLowerCase())
    );
    setSearchedMessages(results);
  };
  
  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit. Please select a smaller file.');
        return;
      }
      
      setSelectedFile(file);
    }
  };
  
  const handleRemoveSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleOpenAttachment = (url: string) => {
    window.open(url, '_blank');
  };
  
  const renderMessage = (message: Message, index: number) => {
    const isSender = message.sender_id === Number(authState.user?.id);
    const showAvatar = !isSender;
    const messageDate = new Date(message.created_at);
    const formattedTime = format(messageDate, 'hh:mm a');
    const formattedDate = format(messageDate, 'MMM dd, hh:mm a');
  
    return (
      <Box 
        key={message.id} 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: isSender ? 'flex-end' : 'flex-start',
          mb: 4,
          width: '100%'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 0.5,
          width: '100%',
          justifyContent: isSender ? 'flex-end' : 'flex-start'
        }}>
          {!isSender && (
            <>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.85rem'
                }}
              >
                {message.sender_name}
              </Typography>
              {message.sender_campus && (
                <Chip
                  label={message.sender_campus}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.7rem',
                    ml: 1,
                    backgroundColor: 'rgba(255, 153, 51, 0.8)',
                    color: 'white',
                    '& .MuiChip-label': {
                      px: 1
                    }
                  }}
                />
              )}
            </>
          )}
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'flex-end',
          justifyContent: isSender ? 'flex-end' : 'flex-start',
          width: '100%'
        }}>
          {showAvatar && (
            <Avatar 
              src={message.sender_profile_image || undefined}
              sx={{ 
                width: 38, 
                height: 38,
                bgcolor: getAvatarBgColor(message.sender_id),
                mr: 1
              }}
            >
              {message.sender_name.substring(0, 1).toUpperCase()}
            </Avatar>
          )}
          
          <Box sx={{ maxWidth: '70%' }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 2,
                borderRadius: 1,
                bgcolor: isSender ? '#1976d2' : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                fontSize: '0.9rem',
                minWidth: 40,
              }}
            >
              {message.content}
            </Paper>
            
            {message.attachment_url && (
              <Box 
                sx={{ 
                  mt: 1,
                  p: 1.5,
                  borderRadius: 1,
                  backgroundColor: 'rgba(25, 118, 210, 0.2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  border: '1px solid rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.3)'
                  }
                }}
                onClick={() => handleOpenAttachment(message.attachment_url!)}
              >
                <Box 
                  sx={{ 
                    p: 1,
                    backgroundColor: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1
                  }}
                >
                  {message.attachment_type?.startsWith('image/') ? (
                    <Image fontSize="small" sx={{ color: '#1976d2' }} />
                  ) : (
                    <InsertDriveFile fontSize="small" sx={{ color: '#1976d2' }} />
                  )}
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'white', fontWeight: 500 }}>
                    Attachment
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
        
        <Typography 
          variant="caption" 
          sx={{ 
            mt: 0.5,
            display: 'block',
            textAlign: isSender ? 'right' : 'left',
            color: 'rgba(255, 255, 255, 0.5)',
            pl: isSender ? 0 : 6,
            pr: isSender ? 1 : 0,
            fontSize: '0.7rem'
          }}
        >
          {formattedTime}
        </Typography>
      </Box>
    );
  };

  return (
    <AdminLayout title="Messages">
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: 'calc(100vh - 64px)',
        bgcolor: '#0a1128',
        borderRadius: 1,
        overflow: 'hidden'
      }}>
        {/* Messages header with subtitle */}
        <Box sx={{ 
          p: 3, 
          pb: 1,
          bgcolor: '#0a1128'
        }}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 400, mb: 1 }}>
            Messages
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Communicate with your administrators and staff
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          height: 'calc(100% - 80px)',
          flexDirection: { xs: 'column', md: 'row' }
        }}>
          {/* Conversations List */}
          <Box 
            sx={{ 
              width: { xs: '100%', md: 320 },
              borderRight: '1px solid rgba(255, 255, 255, 0.1)',
              bgcolor: '#0e1b3d',
              display: { xs: mobileView === 'contacts' ? 'flex' : 'none', md: 'flex' },
              flexDirection: 'column',
              height: '100%'
            }}
          >
            <Box sx={{ 
              p: 2, 
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Typography variant="h6" sx={{ color: 'white' }}>Messages</Typography>
              <IconButton 
                color="primary"
                onClick={handleOpenNewMessageDialog}
                sx={{ ml: 1 }}
              >
                <Create sx={{ color: 'white' }} />
              </IconButton>
            </Box>
            
            <Box sx={{ 
              p: 2, 
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)' 
            }}>
              <TextField
                placeholder="Search conversations"
                fullWidth
                size="small"
                value={searchInput}
                onChange={handleSearchChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                    color: 'white',
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(255, 255, 255, 0.5)',
                    opacity: 1
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                    </InputAdornment>
                  )
                }}
              />
            </Box>
            
            <List sx={{ 
              overflowY: 'auto',
              flexGrow: 1,
              p: 0
            }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                conversations.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="rgba(255, 255, 255, 0.7)">
                      No conversations yet
                    </Typography>
                    <Button 
                      variant="contained" 
                      sx={{ mt: 2, textTransform: 'uppercase' }}
                      onClick={handleOpenNewMessageDialog}
                    >
                      Start a new conversation
                    </Button>
                  </Box>
                ) : (
                  conversations
                    .filter(conv => 
                      !searchInput || 
                      (conv.otherParticipant?.fullName?.toLowerCase().includes(searchInput.toLowerCase())) ||
                      (conv.title?.toLowerCase().includes(searchInput.toLowerCase()))
                    )
                    .map(conversation => (
                      <React.Fragment key={conversation.id}>
                        <ListItem 
                          alignItems="flex-start"
                          onClick={() => handleConversationSelect(conversation.id)}
                          sx={{ 
                            py: 2,
                            px: 2,
                            borderLeft: selectedConversation === conversation.id 
                              ? '4px solid'
                              : '4px solid transparent',
                            borderLeftColor: 'primary.main',
                            bgcolor: selectedConversation === conversation.id 
                              ? 'rgba(25, 118, 210, 0.15)'
                              : 'transparent',
                            '&:hover': {
                              bgcolor: 'rgba(255, 255, 255, 0.05)',
                              cursor: 'pointer'
                            }
                          }}
                        >
                          <ListItemAvatar>
                            <Badge
                              overlap="circular"
                              badgeContent={conversation.unreadCount > 0 ? conversation.unreadCount : 0}
                              color="primary"
                              invisible={conversation.unreadCount === 0}
                            >
                              <Avatar 
                                src={conversation.otherParticipant?.profileImage || undefined}
                                sx={{ 
                                  bgcolor: getAvatarBgColor(conversation.id),
                                  width: 40,
                                  height: 40
                                }}
                              >
                                {conversation.otherParticipant?.fullName?.charAt(0).toUpperCase() || 'U'}
                              </Avatar>
                            </Badge>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'flex-start' 
                              }}>
                                <Typography 
                                  component="span" 
                                  variant="subtitle2"
                                  sx={{ 
                                    fontWeight: conversation.unreadCount > 0 ? 600 : 400,
                                    color: conversation.unreadCount > 0 ? 'white' : 'rgba(255, 255, 255, 0.9)'
                                  }}
                                >
                                  {conversation.otherParticipant?.fullName || 'Unknown'}
                                </Typography>
                                <Typography 
                                  component="span" 
                                  variant="caption" 
                                  sx={{ 
                                    fontSize: '0.7rem',
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    ml: 1
                                  }}
                                >
                                  {conversation.lastMessage && formatMessageTime(conversation.lastMessage.created_at)}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Box sx={{ display: 'flex', gap: 0.5, my: 0.7 }}>
                                  {conversation.otherParticipant?.role && (
                                    <Chip
                                      label={conversation.otherParticipant.role}
                                      size="small"
                                      sx={{
                                        height: 20,
                                        fontSize: '0.7rem',
                                        backgroundColor: conversation.otherParticipant.role === 'teacher' ? '#2e7d32' : 
                                                        conversation.otherParticipant.role === 'student' ? '#1976d2' : 
                                                        conversation.otherParticipant.role === 'admin' ? '#d32f2f' : 'grey',
                                        color: 'white',
                                        '& .MuiChip-label': {
                                          px: 1
                                        }
                                      }}
                                    />
                                  )}
                                  
                                  {conversation.otherParticipant?.campus && (
                                    <Chip
                                      label={conversation.otherParticipant.campus}
                                      size="small"
                                      sx={{
                                        height: 20,
                                        fontSize: '0.7rem',
                                        backgroundColor: 'rgba(255, 153, 51, 0.8)',
                                        color: 'white',
                                        '& .MuiChip-label': {
                                          px: 1
                                        }
                                      }}
                                    />
                                  )}
                                </Box>
                                <Typography 
                                  component="span"
                                  variant="body2"
                                  sx={{ 
                                    display: 'block',
                                    fontWeight: conversation.unreadCount > 0 ? 600 : 'inherit',
                                    color: conversation.unreadCount > 0 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '100%',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  {conversation.lastMessage?.content || 'No messages yet'}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        <Divider component="li" sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                      </React.Fragment>
                    ))
                )
              )}
            </List>
          </Box>
          
          {/* Messages Area */}
          <Box sx={{ 
            flexGrow: 1,
            bgcolor: '#0d1631',
            display: { xs: mobileView === 'conversation' ? 'flex' : 'none', md: 'flex' },
            flexDirection: 'column',
            height: '100%',
            position: 'relative'
          }}>
            {selectedConversation ? (
              <>
                {/* Conversation Header */}
                <Box sx={{ 
                  p: 2,
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: '#0e1b3d'
                }}>
                  <IconButton 
                    sx={{ 
                      mr: 1,
                      display: { xs: 'flex', md: 'none' },
                      color: 'white'
                    }}
                    onClick={handleBackToContacts}
                  >
                    <ArrowBack />
                  </IconButton>
                  
                  {conversations.find(c => c.id === selectedConversation)?.otherParticipant && (
                    <Avatar 
                      src={conversations.find(c => c.id === selectedConversation)?.otherParticipant?.profileImage || undefined}
                      sx={{ 
                        mr: 2,
                        bgcolor: getAvatarBgColor(selectedConversation)
                      }}
                    >
                      {conversations.find(c => c.id === selectedConversation)?.otherParticipant?.fullName?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                  )}
                  
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" sx={{ color: 'white' }}>
                      {conversations.find(c => c.id === selectedConversation)?.otherParticipant?.fullName || 'Unknown'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                      {conversations.find(c => c.id === selectedConversation)?.otherParticipant?.role && (
                        <Chip
                          label={conversations.find(c => c.id === selectedConversation)?.otherParticipant?.role}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            backgroundColor: 
                              conversations.find(c => c.id === selectedConversation)?.otherParticipant?.role === 'teacher' ? '#2e7d32' : 
                              conversations.find(c => c.id === selectedConversation)?.otherParticipant?.role === 'student' ? '#1976d2' : 
                              conversations.find(c => c.id === selectedConversation)?.otherParticipant?.role === 'admin' ? '#d32f2f' : 'grey',
                            color: 'white',
                            '& .MuiChip-label': {
                              px: 1
                            }
                          }}
                        />
                      )}
                      
                      {conversations.find(c => c.id === selectedConversation)?.otherParticipant?.campus && (
                        <Chip
                          label={conversations.find(c => c.id === selectedConversation)?.otherParticipant?.campus}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            backgroundColor: 'rgba(255, 153, 51, 0.8)',
                            color: 'white',
                            '& .MuiChip-label': {
                              px: 1
                            }
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                  
                  <TextField
                    placeholder="Search in conversation"
                    size="small"
                    value={messageSearchQuery}
                    onChange={handleMessageSearch}
                    sx={{ 
                      width: 220,
                      display: { xs: 'none', sm: 'block' },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                        },
                        color: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)'
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                      },
                      '& .MuiInputBase-input::placeholder': {
                        color: 'rgba(255, 255, 255, 0.5)',
                        opacity: 1
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                        </InputAdornment>
                      )
                    }}
                  />
                  
                  <IconButton sx={{ color: 'white' }}>
                    <MoreVert />
                  </IconButton>
                </Box>
                
                {/* Messages */}
                <Box sx={{ 
                  flexGrow: 1,
                  overflowY: 'auto',
                  p: 3,
                  bgcolor: '#0d1631'
                }}>
                  {isSearchingMessages ? (
                    searchedMessages.length > 0 ? (
                      <>
                        <Paper 
                          elevation={0} 
                          sx={{ 
                            p: 2, 
                            mb: 2, 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            bgcolor: 'rgba(25, 118, 210, 0.15)',
                            color: 'white'
                          }}
                        >
                          <Typography variant="body2">
                            Found {searchedMessages.length} messages matching "{messageSearchQuery}"
                          </Typography>
                          <IconButton 
                            size="small"
                            sx={{ color: 'white' }}
                            onClick={() => {
                              setMessageSearchQuery('');
                              setIsSearchingMessages(false);
                            }}
                          >
                            <Close />
                          </IconButton>
                        </Paper>
                        {searchedMessages.map((message, index) => renderMessage(message, index))}
                      </>
                    ) : (
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          mb: 2, 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          bgcolor: 'rgba(25, 118, 210, 0.15)',
                          color: 'white'
                        }}
                      >
                        <Typography variant="body2">
                          No messages found matching "{messageSearchQuery}"
                        </Typography>
                        <IconButton 
                          size="small"
                          sx={{ color: 'white' }} 
                          onClick={() => {
                            setMessageSearchQuery('');
                            setIsSearchingMessages(false);
                          }}
                        >
                          <Close />
                        </IconButton>
                      </Paper>
                    )
                  ) : (
                    messages.map((message, index) => renderMessage(message, index))
                  )}
                  <div ref={messagesEndRef} />
                </Box>
                
                {/* Message Input */}
                <Box sx={{ 
                  p: 2,
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  bgcolor: '#0e1b3d',
                  display: 'flex',
                  alignItems: 'flex-end'
                }}>
                  <IconButton 
                    onClick={handleFileSelect}
                    disabled={uploadingFile || sendingMessage}
                    sx={{ color: 'white', mr: 1 }}
                  >
                    <InsertDriveFile />
                  </IconButton>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif"
                  />
                  
                  <TextField
                    multiline
                    maxRows={4}
                    variant="outlined"
                    fullWidth
                    value={messageInput}
                    onChange={handleMessageChange}
                    onKeyDown={handleKeyPress}
                    disabled={uploadingFile || sendingMessage}
                    placeholder="Type a message..."
                    sx={{
                      mx: 1,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                        },
                        color: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)'
                      },
                      '& .MuiInputBase-input::placeholder': {
                        color: 'rgba(255, 255, 255, 0.5)',
                        opacity: 1
                      },
                    }}
                  />
                  
                  <IconButton 
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={(!messageInput.trim() && !selectedFile) || uploadingFile || sendingMessage}
                    sx={{ ml: 1 }}
                  >
                    {(uploadingFile || sendingMessage) ? (
                      <CircularProgress size={24} />
                    ) : (
                      <Send />
                    )}
                  </IconButton>
                </Box>
              </>
            ) : (
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  bgcolor: '#0d1631',
                  p: 3
                }}
              >
                <Box sx={{ mb: 2 }}>
                  <Box
                    component="div"
                    sx={{
                      width: 70,
                      height: 70,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 3,
                      mx: 'auto'
                    }}
                  >
                    <Send sx={{ fontSize: 30, color: 'rgba(255, 255, 255, 0.5)' }} />
                  </Box>
                </Box>
                <Typography variant="h6" align="center" gutterBottom sx={{ color: 'white', fontWeight: 400 }}>
                  No conversation selected
                </Typography>
                <Typography variant="body2" align="center" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 3, maxWidth: 450 }}>
                  Select a contact from the list to start chatting or create a new message
                </Typography>
                <Button 
                  variant="contained"
                  color="primary"
                  startIcon={<Create />}
                  onClick={handleOpenNewMessageDialog}
                  sx={{ 
                    mt: 2, 
                    textTransform: 'uppercase', 
                    px: 3,
                    py: 1,
                    bgcolor: '#1976d2',
                    fontWeight: 500,
                    letterSpacing: '0.5px',
                    '&:hover': {
                      bgcolor: '#0f62b6'
                    }
                  }}
                >
                  New Message
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
      
      {/* New Message Dialog */}
      <Dialog 
        open={newMessageDialogOpen} 
        onClose={handleCloseNewMessageDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0e1b3d',
            color: 'white',
            borderRadius: 1,
            maxWidth: '500px'
          }
        }}
      >
        <DialogTitle sx={{ 
          color: 'white', 
          fontSize: '1.25rem', 
          fontWeight: 500, 
          bgcolor: '#0e1b3d', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          py: 1.5
        }}>
          New Message
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: '#0e1b3d' }}>
          <Box sx={{ mb: 2, px: 0 }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                px: 2,
                py: 1.5, 
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: 400,
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              — Search for a user
            </Typography>
            <Autocomplete
              options={availableUsers}
              getOptionLabel={(option) => option.fullName}
              renderOption={(props, option) => (
                <Box 
                  component="li" 
                  {...props}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    color: '#111',
                    backgroundColor: '#fff',
                    py: 1
                  }}
                >
                  <Avatar 
                    src={option.profileImage || undefined}
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      mr: 2,
                      bgcolor: getAvatarBgColor(option.id)
                    }}
                  >
                    {option.fullName.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#111' }}>{option.fullName}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                      {option.role} {option.campus ? `• ${option.campus}` : ''}
                    </Typography>
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  fullWidth
                  placeholder="Search for users..."
                  sx={{
                    mx: 0,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 0,
                      '& fieldset': {
                        border: 'none',
                      },
                      '&:hover fieldset': {
                        border: 'none',
                      },
                      '&.Mui-focused fieldset': {
                        border: 'none',
                      },
                      color: '#111',
                      backgroundColor: '#fff'
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: 'rgba(0, 0, 0, 0.6)',
                      opacity: 1
                    },
                  }}
                />
              )}
              inputValue={searchUserInput}
              onInputChange={handleSearchInputChange}
              value={selectedUser}
              onChange={(event, newValue) => {
                setSelectedUser(newValue);
              }}
              loading={creatingConversation}
              loadingText="Searching users..."
              popupIcon={<Search sx={{ color: '#1976d2', mr: 1 }} />}
              sx={{
                '& .MuiAutocomplete-endAdornment': {
                  color: '#1976d2'
                },
                '& .MuiAutocomplete-paper': {
                  backgroundColor: '#fff',
                  color: '#111'
                },
                '& .MuiAutocomplete-listbox': {
                  backgroundColor: '#fff',
                  color: '#111'
                }
              }}
            />
          </Box>
          
          <TextField
            multiline
            rows={4}
            variant="outlined"
            fullWidth
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Message"
            sx={{
              mt: 0,
              px: 2,
              py: 2,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  border: 'none',
                },
                '&:hover fieldset': {
                  border: 'none',
                },
                '&.Mui-focused fieldset': {
                  border: 'none',
                },
                color: 'white',
                backgroundColor: 'transparent'
              },
              '& .MuiInputBase-input::placeholder': {
                color: 'rgba(255, 255, 255, 0.5)',
                opacity: 1
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', p: 2, justifyContent: 'space-between' }}>
          <Button 
            onClick={handleCloseNewMessageDialog} 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              textTransform: 'uppercase',
              fontWeight: 500,
              letterSpacing: '0.5px',
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateConversation}
            variant="contained" 
            color="primary"
            disabled={!selectedUser || creatingConversation || (uploadingFile && !selectedFile)}
            sx={{
              textTransform: 'uppercase',
              fontWeight: 500,
              letterSpacing: '0.5px',
              px: 3,
              bgcolor: '#1976d2',
            }}
          >
            {creatingConversation ? (
              <CircularProgress size={20} sx={{ mr: 1 }} />
            ) : null}
            Start Conversation
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
};

export default Messages; 