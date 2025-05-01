import { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Container,
  VStack,
  HStack,
  useToast,
} from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';

// Components
import MelodyGenerator from './components/MelodyGenerator';
import ChordGenerator from './components/ChordGenerator';
import CompositionGenerator from './components/CompositionGenerator';
import Visualization from './components/Visualization';
import MIDIExportWithSave from './components/MIDIExportWithSave';
import UserMenu from './components/auth/UserMenu';
import MyCompositions from './components/user/MyCompositions';
import Favorites from './components/user/Favorites';
import BackupExport from './components/user/BackupExport';
import PlayButton from './components/PlayButton';
import AudioInitializer from './components/AudioInitializer';

// Firebase Auth
import { useAuth } from './utils/firebase/AuthContext';
import { registerUserInteraction, hasHadUserInteraction } from './utils/audioContext';
import WelcomeScreen from './components/WelcomeScreen';

// Services and Utilities
import { initSyncService } from './utils/syncService';
import { setAnalyticsUserId, trackPageView } from './services/analytics';
import { PlaybackProvider } from './utils/PlaybackContext';

function App() {
  // Each tab will have its own state that's completely isolated
  const [melodyData, setMelodyData] = useState(null);
  const [chordData, setChordData] = useState(null);
  const [compositionData, setCompositionData] = useState(null);

  // Track which tab is active to prevent data interference
  const [activeTab, setActiveTab] = useState(0);
  // Audio initialization state is managed by WelcomeScreen component
  // This is used to determine if we should show the welcome screen
  // We use hasHadUserInteraction() to check if audio is initialized
  const { currentUser } = useAuth();
  const toast = useToast();

  // Initialize sync service
  useEffect(() => {
    initSyncService(toast);
  }, [toast]);

  // Set analytics user ID when user changes
  useEffect(() => {
    if (currentUser) {
      setAnalyticsUserId(currentUser.uid);
    }
  }, [currentUser]);

  // Track page views
  useEffect(() => {
    trackPageView('App');
  }, []);

  // Add global user interaction listener
  useEffect(() => {
    // Register user interaction events
    const interactionEvents = ['mousedown', 'keydown', 'touchstart'];

    const handleUserInteraction = () => {
      registerUserInteraction();
    };

    // Add event listeners
    interactionEvents.forEach(event => {
      document.addEventListener(event, handleUserInteraction);
    });

    // Clean up event listeners
    return () => {
      interactionEvents.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, []);

  // Audio initialization is now handled by the WelcomeScreen component
  // This function is kept for backward compatibility
  const handleAudioInitialized = () => {
    // Audio initialization is now tracked via localStorage in WelcomeScreen
    localStorage.setItem('hasSeenWelcomeScreen', 'true');
  };

  const handleMelodyGenerated = data => {
    // Only update melody data if we're on the melody tab
    if (activeTab === 0) {
      setMelodyData(data);
    }
  };

  const handleChordGenerated = data => {
    // Only update chord data if we're on the chord tab
    if (activeTab === 1) {
      setChordData(data);
    }
  };

  const handleCompositionGenerated = data => {
    // Only update composition data if we're on the composition tab
    if (activeTab === 2) {
      setCompositionData(data);
    }
  };

  // Main App Layout
  const AppLayout = ({ children }) => (
    <Container maxW="container.xl" px={6} py={8} minH="100vh" display="flex" flexDirection="column">
      {/* Welcome screen with audio initialization */}
      <WelcomeScreen onInitialized={handleAudioInitialized} />
      <Box as="header" mb={8}>
        <Flex justify="space-between" align="center" mb={8}>
          <Link to="/">
            <Heading
              as="h1"
              fontSize="2rem"
              fontWeight="700"
              letterSpacing="-0.025em"
              color="primary.400"
              textShadow="0 0 15px rgba(99, 102, 241, 0.5)"
            >
              MIDI Melody & Chord Generator
            </Heading>
          </Link>

          <HStack spacing={4}>
            <Link to="/my-compositions">
              <Text color="gray.300" _hover={{ color: 'primary.300' }} fontWeight="500">
                My Compositions
              </Text>
            </Link>
            <Link to="/favorites">
              <Text color="gray.300" _hover={{ color: 'primary.300' }} fontWeight="500">
                Favorites
              </Text>
            </Link>
            <Link to="/backup-export">
              <Text color="gray.300" _hover={{ color: 'primary.300' }} fontWeight="500">
                Backup & Export
              </Text>
            </Link>
            <UserMenu />
          </HStack>
        </Flex>

        {children}
      </Box>

      <Box as="footer" mt="auto" textAlign="center" py={4} color="gray.300">
        <Text>MIDI Melody & Chord Generator - MVP Version</Text>
      </Box>
    </Container>
  );

  // Protected Route Component
  const ProtectedRoute = ({ children }) => {
    if (!currentUser) {
      return <Navigate to="/" replace />;
    }

    return children;
  };

  // Generator Tabs Component
  const GeneratorTabs = () => {
    // Handle tab change
    const handleTabChange = index => {
      // Update the active tab in the parent component
      setActiveTab(index);

      // We no longer reset data for other tabs to preserve generator state
    };

    return (
      <Tabs
        variant="soft-rounded"
        colorScheme="primary"
        isLazy
        onChange={handleTabChange}
        index={activeTab}
      >
        <TabList
          overflowX="auto"
          overflowY="hidden"
          py={2}
          css={{
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': {
              display: 'none',
            },
          }}
        >
          <Tab px={6} py={3} transition="all 0.3s ease">
            Melody Generator
          </Tab>
          <Tab px={6} py={3} transition="all 0.3s ease">
            Chord Generator
          </Tab>
          <Tab px={6} py={3} transition="all 0.3s ease">
            Composition Studio
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel p={0} mt={6}>
            <VStack spacing={8} align="stretch">
              <Box>
                <MelodyGenerator onMelodyGenerated={handleMelodyGenerated} />
              </Box>

              {melodyData && (
                <>
                  <Box>
                    <Visualization data={melodyData} type="melody" />
                  </Box>

                  <Box>
                    <MIDIExportWithSave data={melodyData} type="melody" />
                  </Box>
                </>
              )}
            </VStack>
          </TabPanel>

          <TabPanel p={0} mt={6}>
            <VStack spacing={8} align="stretch">
              <Box>
                <ChordGenerator onChordGenerated={handleChordGenerated} />
              </Box>

              {chordData && (
                <>
                  <Box>
                    <Visualization data={chordData} type="chord" />
                  </Box>

                  <Box>
                    <MIDIExportWithSave data={chordData} type="chord" />
                  </Box>
                </>
              )}
            </VStack>
          </TabPanel>

          <TabPanel p={0} mt={6}>
            <VStack spacing={8} align="stretch">
              <Box>
                <CompositionGenerator onCompositionGenerated={handleCompositionGenerated} />
              </Box>

              {compositionData && (
                <>
                  <Box>
                    <Visualization data={compositionData} type="composition" />
                  </Box>

                  <Box>
                    <MIDIExportWithSave data={compositionData} type="composition" />
                  </Box>
                </>
              )}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    );
  };

  return (
    <PlaybackProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <AppLayout>
                <GeneratorTabs />
              </AppLayout>
            }
          />

          <Route
            path="/my-compositions"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MyCompositions />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Favorites />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/backup-export"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <BackupExport />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={
              <AppLayout>
                <Box textAlign="center" py={10}>
                  <Heading size="xl" mb={6} color="primary.400">
                    Page Not Found
                  </Heading>
                  <Text mb={6}>The page you're looking for doesn't exist.</Text>
                  <Link to="/">
                    <Text color="primary.400" fontWeight="bold">
                      Return to Home
                    </Text>
                  </Link>
                </Box>
              </AppLayout>
            }
          />
        </Routes>

        {/* Fallback audio initializer that shows if audio isn't initialized */}
        {!hasHadUserInteraction() && <AudioInitializer />}
      </Router>
    </PlaybackProvider>
  );
}

export default App;
