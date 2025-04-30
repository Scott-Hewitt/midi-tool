import { useState, useEffect } from 'react';
import { Button, Tooltip, Box } from '@chakra-ui/react';
import { usePlayback } from '../utils/PlaybackContext';

/**
 * PlayButton component
 * @param {Object} data - MIDI data to play
 * @param {string} type - Type of data (melody, chord, composition)
 */
function PlayButton({ data, type }) {
  const { isPlaying, activePlayingPart, playData, stopPlayback } = usePlayback();
  const [isThisPlaying, setIsThisPlaying] = useState(false);
  
  // Update isThisPlaying when global playback state changes
  useEffect(() => {
    setIsThisPlaying(isPlaying && activePlayingPart === type);
  }, [isPlaying, activePlayingPart, type]);
  
  // Handle play/stop
  const handlePlayToggle = async () => {
    if (isThisPlaying) {
      stopPlayback();
    } else {
      await playData(data, type);
    }
  };
  
  return (
    <Tooltip label={isThisPlaying ? 'Stop' : 'Play'}>
      <Button
        onClick={handlePlayToggle}
        colorScheme={isThisPlaying ? 'red' : 'primary'}
        size="md"
        variant={isThisPlaying ? 'solid' : 'outline'}
        leftIcon={
          <Box as="span" className="icon">
            {isThisPlaying ? '⏹️' : '▶️'}
          </Box>
        }
      >
        {isThisPlaying ? 'Stop' : 'Play'}
      </Button>
    </Tooltip>
  );
}

export default PlayButton;
