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
  const [melodyData, setMelodyData] = useState(null);
  const [chordData, setChordData] = useState(null);
  const [compositionData, setCompositionData] = useState(null);

  const [activeTab, setActiveTab] = useState(0);
  const { currentUser } = useAuth();
  const toast = useToast();

  useEffect(() => {
    initSyncService(toast);
  }, [toast]);

  useEffect(() => {
    if (currentUser) {
      setAnalyticsUserId(currentUser.uid);
    }
  }, [currentUser]);

  useEffect(() => {
    trackPageView('App');
  }, []);
  useEffect(() => {
    const interactionEvents = ['mousedown', 'keydown', 'touchstart'];

    const handleUserInteraction = () => {
      registerUserInteraction();
    };

    interactionEvents.forEach(event => {
      document.addEventListener(event, handleUserInteraction);
    });

    return () => {
      interactionEvents.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, []);

  const handleAudioInitialized = () => {
    localStorage.setItem('hasSeenWelcomeScreen', 'true');
  };

  const handleMelodyGenerated = data => {
    if (activeTab === 0) {
      setMelodyData(data);
    }
  };

  const handleChordGenerated = data => {
    if (activeTab === 1) {
      setChordData(data);
    }
  };

  const handleCompositionGenerated = data => {
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
        <Text>MIDI Melody & Chord Generator</Text>
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

  const GeneratorTabs = () => {
    const handleTabChange = index => {
      setActiveTab(index);
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
