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
import { ensureAudioContext, isAudioContextInitialized, hasHadUserInteraction } from '../utils/audioContext';

/**
 * Welcome screen component that initializes audio on user interaction
 * @param {Object} props - Component props
 * @param {Function} props.onInitialized - Callback when audio is initialized
 */
const WelcomeScreen = ({ onInitialized }) => {
  // Check if we should show the welcome screen
  const shouldShowWelcomeScreen = !isAudioContextInitialized() || !isToneInitializedStatus() || !hasHadUserInteraction();

  // Use localStorage to remember if the user has seen the welcome screen
  const hasSeenWelcomeScreen = localStorage.getItem('hasSeenWelcomeScreen') === 'true';

  const { isOpen, onClose } = useDisclosure({
    defaultIsOpen: shouldShowWelcomeScreen && !hasSeenWelcomeScreen
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
      const context = await ensureAudioContext();

      // Then initialize Tone.js with a small delay to ensure the context is ready
      setTimeout(async () => {
        try {
          await initializeTone();
          console.log('Audio context and Tone.js initialized successfully');

          // Save that the user has seen the welcome screen
          localStorage.setItem('hasSeenWelcomeScreen', 'true');

          onClose();
          if (onInitialized) onInitialized();
        } catch (toneError) {
          console.error('Failed to initialize Tone.js:', toneError);
        } finally {
          setIsInitializing(false);
        }
      }, 100);
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      setIsInitializing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false} closeOnEsc={false}>
      <ModalOverlay backdropFilter="blur(10px)" bg="rgba(0, 0, 0, 0.7)" />
      <ModalContent bg="rgba(30, 41, 59, 0.8)" backdropFilter="blur(12px)" border="1px solid rgba(255, 255, 255, 0.1)">
        <ModalHeader>
          <Heading size="lg" color="primary.400">Welcome to MIDI Melody & Chord Generator</Heading>
        </ModalHeader>

        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text>
              This application allows you to create melodies, chord progressions, and full compositions.
            </Text>
            <Text>
              To enable audio playback, we need to initialize the audio system.
              Please click the button below to start.
            </Text>
            <Box p={4} bg="rgba(0, 0, 0, 0.2)" borderRadius="md">
              <Text fontSize="sm" color="gray.300">
                Note: Web browsers require user interaction before allowing audio playback.
                This is a security feature to prevent unwanted autoplay experiences.
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
