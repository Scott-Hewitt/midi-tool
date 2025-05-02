import { useState, useEffect } from 'react';
import { Box, Button, Text, useToast } from '@chakra-ui/react';
import { initializeTone } from '../utils/toneContext';
import { ensureAudioContext, registerUserInteraction } from '../utils/audioContext';

function AudioInitializer() {
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const checkAudioStatus = async () => {
      try {
        if (window.Tone && window.Tone.context && window.Tone.context.state === 'running') {
          setAudioInitialized(true);
        }
      } catch (error) {
        console.error('Error checking audio status:', error);
      }
    };

    checkAudioStatus();
  }, []);

  const handleInitializeAudio = async () => {
    try {
      setIsInitializing(true);

      registerUserInteraction();

      const audioContext = await ensureAudioContext();

      if (!audioContext) {
        throw new Error('Failed to initialize AudioContext');
      }

      // Initialize Tone.js - this must be done during a user gesture
      const toneInitialized = await initializeTone();
      setAudioInitialized(true);
      toast({
        title: 'Audio enabled',
        description: 'You can now play and export audio',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error initializing audio:', error);
      toast({
        title: 'Audio initialization failed',
        description: 'Please try again or check browser permissions',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsInitializing(false);
    }
  };

  if (audioInitialized) {
    return null;
  }

  return (
    <Box
      position="fixed"
      bottom="20px"
      right="20px"
      zIndex="1000"
      bg="rgba(30, 41, 59, 0.8)"
      p={4}
      borderRadius="md"
      boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
      backdropFilter="blur(10px)"
      border="1px solid rgba(255, 255, 255, 0.1)"
    >
      <Text mb={3} fontWeight="medium" color="white">
        Audio playback requires user interaction
      </Text>
      <Button
        onClick={handleInitializeAudio}
        colorScheme="primary"
        isLoading={isInitializing}
        loadingText="Enabling audio..."
        leftIcon={
          <span role="img" aria-label="sound">
            🔊
          </span>
        }
      >
        Enable Audio
      </Button>
    </Box>
  );
}

export default AudioInitializer;
