import { useState, useEffect } from 'react';
import { Button, Tooltip, Box } from '@chakra-ui/react';
import { usePlayback } from '../utils/PlaybackContext';

function PlayButton({ data, type }) {
  const { isPlaying, activePlayingPart, playData, stopPlayback } = usePlayback();
  const [isThisPlaying, setIsThisPlaying] = useState(false);

  useEffect(() => {
    setIsThisPlaying(isPlaying && activePlayingPart === type);
  }, [isPlaying, activePlayingPart, type]);

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
