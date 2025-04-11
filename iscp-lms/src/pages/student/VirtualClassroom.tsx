import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  IconButton,
  Avatar,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Badge,
  Chip,
  Tooltip,
  CircularProgress,
  Container
} from '@mui/material';
import {
  Send,
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  ScreenShare,
  StopScreenShare,
  Chat,
  Description,
  PresentToAll,
  People,
  Share,
  Download,
  PanTool,
  MeetingRoom,
  Add,
  Message
} from '@mui/icons-material';
import StudentLayout from '../../components/StudentLayout';
import studentService from '../../services/StudentService';

interface Message {
  id: string;
  sender: string;
  senderAvatar?: string;
  text: string;
  timestamp: Date;
  isTeacher: boolean;
}

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isTeacher: boolean;
  isSpeaking: boolean;
  hasRaisedHand: boolean;
  isMuted: boolean;
  isVideoOn: boolean;
}

interface ClassSessionInfo {
  id: string;
  courseName: string;
  instructor: string;
  startTime: Date;
  endTime: Date;
  topic: string;
  description: string;
}

// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
      style={{ height: '100%' }}
    >
      {value === index && (
        <Box sx={{ height: '100%', pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const VirtualClassroom: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tabValue, setTabValue] = useState<number>(0);
  const [sessionInfo, setSessionInfo] = useState<ClassSessionInfo | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [handRaised, setHandRaised] = useState<boolean>(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  
  useEffect(() => {
    // Simulate loading classroom data
    const loadVirtualClassroom = async () => {
      try {
        // In a real implementation, this would fetch data from the API
        setTimeout(() => {
          // Mock session info
          setSessionInfo({
            id: '12345',
            courseName: 'Astrobiology 101',
            instructor: 'Dr. Jane Smith',
            startTime: new Date(),
            endTime: new Date(new Date().getTime() + 90 * 60000), // 90 minutes from now
            topic: 'Introduction to Extraterrestrial Ecosystems',
            description: 'Today we will be exploring the fundamental principles of extraterrestrial ecosystems and the potential for life beyond Earth.'
          });
          
          // Mock participants
          setParticipants([
            {
              id: '1',
              name: 'Dr. Jane Smith',
              avatar: '/assets/avatars/teacher1.jpg',
              isTeacher: true,
              isSpeaking: true,
              hasRaisedHand: false,
              isMuted: false,
              isVideoOn: true
            },
            {
              id: '2',
              name: 'John Doe',
              avatar: '/assets/avatars/student1.jpg',
              isTeacher: false,
              isSpeaking: false,
              hasRaisedHand: false,
              isMuted: true,
              isVideoOn: false
            },
            {
              id: '3',
              name: 'Alice Johnson',
              avatar: '/assets/avatars/student2.jpg',
              isTeacher: false,
              isSpeaking: false,
              hasRaisedHand: true,
              isMuted: true,
              isVideoOn: false
            },
            {
              id: '4',
              name: 'Bob Williams',
              avatar: '/assets/avatars/student3.jpg',
              isTeacher: false,
              isSpeaking: false,
              hasRaisedHand: false,
              isMuted: true,
              isVideoOn: false
            },
            {
              id: '5',
              name: 'Emily Davis',
              avatar: '/assets/avatars/student4.jpg',
              isTeacher: false,
              isSpeaking: false,
              hasRaisedHand: false,
              isMuted: false,
              isVideoOn: true
            }
          ]);
          
          // Mock chat messages
          setMessages([
            {
              id: '1',
              sender: 'Dr. Jane Smith',
              senderAvatar: '/assets/avatars/teacher1.jpg',
              text: 'Welcome to our virtual classroom everyone! Today we will be discussing extraterrestrial ecosystems.',
              timestamp: new Date(new Date().getTime() - 10 * 60000),
              isTeacher: true
            },
            {
              id: '2',
              sender: 'Alice Johnson',
              senderAvatar: '/assets/avatars/student2.jpg',
              text: 'I read the chapter on extremophiles, are we going to be covering that today?',
              timestamp: new Date(new Date().getTime() - 8 * 60000),
              isTeacher: false
            },
            {
              id: '3',
              sender: 'Dr. Jane Smith',
              senderAvatar: '/assets/avatars/teacher1.jpg',
              text: 'Yes, Alice! Extremophiles are a great example of how life can adapt to harsh conditions, which gives us clues about potential life on other planets.',
              timestamp: new Date(new Date().getTime() - 7 * 60000),
              isTeacher: true
            },
            {
              id: '4',
              sender: 'Bob Williams',
              senderAvatar: '/assets/avatars/student3.jpg',
              text: 'I\'m having trouble accessing the supplementary materials Dr. Smith mentioned last week. Can someone help?',
              timestamp: new Date(new Date().getTime() - 5 * 60000),
              isTeacher: false
            },
            {
              id: '5',
              sender: 'Dr. Jane Smith',
              senderAvatar: '/assets/avatars/teacher1.jpg',
              text: 'Bob, I\'ve just uploaded them again to the course materials section. You should be able to access them now.',
              timestamp: new Date(new Date().getTime() - 4 * 60000),
              isTeacher: true
            }
          ]);
          
          setIsLoading(false);
        }, 1500);
      } catch (error) {
        console.error('Error loading virtual classroom:', error);
        setIsLoading(false);
      }
    };
    
    loadVirtualClassroom();
    
    // Cleanup function
    return () => {
      // In a real implementation, this would disconnect from any video/audio streams
      console.log('Leaving virtual classroom');
    };
  }, []);
  
  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Function to handle tab changes
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Function to handle sending messages
  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;
    
    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'You',
      text: newMessage,
      timestamp: new Date(),
      isTeacher: false
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage('');
  };
  
  // Function to handle key press (Enter to send)
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };
  
  // Format time (HH:MM AM/PM)
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Calculate time remaining in session
  const getTimeRemaining = () => {
    if (!sessionInfo) return '00:00:00';
    
    const now = new Date();
    const diff = sessionInfo.endTime.getTime() - now.getTime();
    
    if (diff <= 0) return '00:00:00';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  if (isLoading) {
    return (
      <StudentLayout title="Virtual Classroom">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
        </Box>
      </StudentLayout>
    );
  }
  
  return (
    <StudentLayout title="Virtual Classroom">
      <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
        <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', p: 2 }}>
          {/* Class information header */}
          <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h5" fontWeight="bold">{sessionInfo?.courseName}</Typography>
                <Typography variant="subtitle1" color="text.secondary">{sessionInfo?.topic}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip 
                  label={`Time Remaining: ${getTimeRemaining()}`} 
                  color="primary" 
                  sx={{ mr: 2 }}
                />
                <Button 
                  variant="outlined" 
                  color="error" 
                  startIcon={<MeetingRoom />}
                >
                  Leave Class
                </Button>
              </Box>
            </Box>
          </Paper>
          
          {/* Main content area */}
          <Grid container spacing={2} sx={{ flexGrow: 1, height: 'calc(100% - 70px)' }}>
            {/* Left side - video/presentation */}
            <Grid sx={{ gridColumn: 'span 8', height: '100%' }}>
              <Paper elevation={1} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Main video display */}
                <Box sx={{ 
                  bgcolor: '#000', 
                  flexGrow: 1, 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* This would be replaced with actual video stream */}
                  <Box sx={{ 
                    width: '100%', 
                    height: '100%', 
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                    color: '#fff',
                    backgroundImage: 'url(https://via.placeholder.com/1280x720)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}>
                  </Box>
                  
                  {/* Overlay controls */}
                  <Box sx={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    left: 0, 
                    right: 0, 
                    p: 2, 
                    bgcolor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 2
                  }}>
                    <Tooltip title={isMuted ? "Unmute" : "Mute"}>
                      <IconButton 
                        color="primary" 
                        onClick={() => setIsMuted(!isMuted)}
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}
                      >
                        {isMuted ? <MicOff /> : <Mic />}
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}>
                      <IconButton 
                        color="primary" 
                        onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}
                      >
                        {isVideoEnabled ? <Videocam /> : <VideocamOff />}
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title={isScreenSharing ? "Stop sharing" : "Share screen"}>
                      <IconButton 
                        color="primary" 
                        onClick={() => setIsScreenSharing(!isScreenSharing)}
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}
                      >
                        {isScreenSharing ? <StopScreenShare /> : <ScreenShare />}
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title={handRaised ? "Lower hand" : "Raise hand"}>
                      <IconButton 
                        color={handRaised ? "secondary" : "primary"} 
                        onClick={() => setHandRaised(!handRaised)}
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}
                      >
                        <PanTool />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            
            {/* Right side - tabs for chat, participants, etc. */}
            <Grid sx={{ gridColumn: 'span 4', height: '100%' }}>
              <Paper elevation={1} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Tabs for different sections */}
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange} 
                  variant="fullWidth" 
                  sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                  <Tab icon={<Chat />} label="Chat" />
                  <Tab icon={<People />} label="Participants" />
                  <Tab icon={<Description />} label="Materials" />
                </Tabs>
                
                {/* Chat tab */}
                <TabPanel value={tabValue} index={0}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* Messages container */}
                    <Box sx={{ 
                      flexGrow: 1, 
                      overflow: 'auto',
                      mb: 2,
                      p: 1
                    }}>
                      {messages.map((msg) => (
                        <Box 
                          key={msg.id} 
                          sx={{ 
                            mb: 2,
                            display: 'flex',
                            alignItems: 'flex-start'
                          }}
                        >
                          <Avatar 
                            src={msg.senderAvatar} 
                            sx={{ 
                              width: 32, 
                              height: 32, 
                              mr: 1,
                              bgcolor: msg.isTeacher ? 'secondary.main' : 'primary.main'
                            }}
                          >
                            {msg.sender.charAt(0)}
                          </Avatar>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography 
                                variant="subtitle2" 
                                fontWeight="bold"
                                sx={{ mr: 1 }}
                              >
                                {msg.sender}
                              </Typography>
                              {msg.isTeacher && (
                                <Chip 
                                  label="Instructor" 
                                  size="small" 
                                  color="secondary" 
                                  sx={{ height: 20, fontSize: '0.7rem' }} 
                                />
                              )}
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                {formatTime(msg.timestamp)}
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {msg.text}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                      <div ref={messagesEndRef} />
                    </Box>
                    
                    {/* Message input */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TextField
                        fullWidth
                        placeholder="Type a message..."
                        variant="outlined"
                        size="small"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                      />
                      <IconButton 
                        color="primary" 
                        onClick={handleSendMessage}
                        disabled={newMessage.trim() === ''}
                        sx={{ ml: 1 }}
                      >
                        <Send />
                      </IconButton>
                    </Box>
                  </Box>
                </TabPanel>
                
                {/* Participants tab */}
                <TabPanel value={tabValue} index={1}>
                  <List sx={{ width: '100%' }}>
                    {participants.map((participant) => (
                      <ListItem
                        key={participant.id}
                        secondaryAction={
                          participant.hasRaisedHand ? (
                            <Tooltip title="Hand raised">
                              <PanTool color="secondary" />
                            </Tooltip>
                          ) : null
                        }
                      >
                        <ListItemAvatar>
                          <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            badgeContent={
                              participant.isSpeaking ? (
                                <Box sx={{ bgcolor: 'success.main', width: 10, height: 10, borderRadius: '50%', border: '2px solid white' }} />
                              ) : null
                            }
                          >
                            <Avatar 
                              src={participant.avatar}
                              sx={{ 
                                bgcolor: participant.isTeacher ? 'secondary.main' : 'primary.main',
                                border: participant.isSpeaking ? '2px solid #4caf50' : 'none'
                              }}
                            >
                              {participant.name.charAt(0)}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body1">{participant.name}</Typography>
                              {participant.isTeacher && (
                                <Chip 
                                  label="Instructor" 
                                  size="small" 
                                  color="secondary" 
                                  sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              {participant.isMuted ? <MicOff fontSize="small" color="disabled" /> : <Mic fontSize="small" color="success" />}
                              {participant.isVideoOn ? <Videocam fontSize="small" color="success" sx={{ ml: 1 }} /> : <VideocamOff fontSize="small" color="disabled" sx={{ ml: 1 }} />}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </TabPanel>
                
                {/* Materials tab */}
                <TabPanel value={tabValue} index={2}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Class Materials
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.light' }}>
                          <Description />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Lecture Slides - Extraterrestrial Ecosystems"
                        secondary="PDF • 2.4 MB • Shared today"
                      />
                      <IconButton>
                        <Download />
                      </IconButton>
                    </ListItem>
                    <Divider variant="inset" component="li" />
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.light' }}>
                          <PresentToAll />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Interactive Model - Extremophile Habitats"
                        secondary="HTML • Shared 2 days ago"
                      />
                      <IconButton>
                        <Share />
                      </IconButton>
                    </ListItem>
                    <Divider variant="inset" component="li" />
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'info.light' }}>
                          <Description />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Required Reading - Chapter 5"
                        secondary="PDF • 1.8 MB • Shared last week"
                      />
                      <IconButton>
                        <Download />
                      </IconButton>
                    </ListItem>
                  </List>
                </TabPanel>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </StudentLayout>
  );
};

export default VirtualClassroom; 