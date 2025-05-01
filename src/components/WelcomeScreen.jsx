import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@chakra-ui/react';
import { initializeTone, isToneInitializedStatus } from '../utils/toneContext';
import {
  ensureAudioContext,
  isAudioContextInitialized,
  hasHadUserInteraction,
} from '../utils/audioContext';

/**
 * Welcome screen component that initializes audio on user interaction
 * @param {Object} props - Component props
 * @param {Function} props.onInitialized - Callback when audio is initialized
 */
const WelcomeScreen = ({ onInitialized }) => {
  // Check if we should show the welcome screen - always show if audio needs to be initialized
  const shouldShowWelcomeScreen =
    !isAudioContextInitialized() || !isToneInitializedStatus() || !hasHadUserInteraction();

  // Use localStorage to remember if the user has seen the welcome screen
  // but only use this if audio is already initialized
  // This value is used in App-with-firebase.jsx to determine if we should show the welcome screen
  localStorage.getItem('hasSeenWelcomeScreen') === 'true';

  const { isOpen, onClose } = useDisclosure({
    // Always show if audio needs to be initialized, regardless of whether they've seen the screen before
    defaultIsOpen: shouldShowWelcomeScreen,
  });
  const [isInitializing, setIsInitializing] = useState(false);

  // If audio is already initialized, call onInitialized
  useEffect(() => {
    if (isAudioContextInitialized() && isToneInitializedStatus() && !isOpen) {
      if (onInitialized) onInitialized();
    }
  }, [isOpen, onInitialized]);

  const handleStart = async () => {
    setIsInitializing(true);

    try {
      // First ensure the AudioContext is initialized
      await ensureAudioContext();

      // Then initialize Tone.js immediately while we still have the user gesture context
      await initializeTone();
      console.log('Audio context and Tone.js initialized successfully');

      // Save that the user has seen the welcome screen
      localStorage.setItem('hasSeenWelcomeScreen', 'true');

      onClose();
      if (onInitialized) onInitialized();
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      setIsInitializing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false} closeOnEsc={false}>
      <ModalOverlay backdropFilter="blur(10px)" bg="rgba(0, 0, 0, 0.7)" />
      <ModalContent
        bg="rgba(30, 41, 59, 0.9)"
        backdropFilter="blur(12px)"
        border="1px solid rgba(255, 255, 255, 0.1)"
      >
        <ModalHeader>
          <Heading size="lg" color="primary.300" textShadow="0 1px 3px rgba(0, 0, 0, 0.3)">
            Welcome to MIDI Melody & Chord Generator
          </Heading>
        </ModalHeader>

        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text fontWeight="medium" color="white" textShadow="0 1px 2px rgba(0, 0, 0, 0.2)">
              This application allows you to create melodies, chord progressions, and full
              compositions.
            </Text>
            <Text fontWeight="medium" color="white" textShadow="0 1px 2px rgba(0, 0, 0, 0.2)">
              To enable audio playback, we need to initialize the audio system. Please click the
              button below to start.
            </Text>
            <Box
              p={4}
              bg="rgba(0, 0, 0, 0.3)"
              borderRadius="md"
              borderLeft="3px solid"
              borderColor="primary.500"
            >
              <Text
                fontSize="sm"
                color="gray.200"
                fontWeight="medium"
                textShadow="0 1px 2px rgba(0, 0, 0, 0.3)"
              >
                Note: Web browsers require user interaction before allowing audio playback. This is
                a security feature to prevent unwanted autoplay experiences.
              </Text>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button
            colorScheme="primary"
            onClick={handleStart}
            isLoading={isInitializing}
            loadingText="Initializing Audio"
            size="lg"
            width="100%"
          >
            Start Creating Music
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default WelcomeScreen;
