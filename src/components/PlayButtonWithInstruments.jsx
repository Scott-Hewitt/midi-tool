import { useState, useEffect } from 'react';
import {
  Button,
  Tooltip,
  Box,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  FormControl,
  FormLabel,
  Select,
  Checkbox,
  VStack,
  HStack,
  Spinner,
  Flex,
  Divider,
  Text
} from '@chakra-ui/react';
import { usePlayback } from '../utils/PlaybackContext';
import { getAvailableInstruments } from '../utils/soundfontUtils';

/**
 * PlayButtonWithInstruments component
 * Enhanced play button with instrument selection options
 * 
 * @param {Object} data - MIDI data to play
 * @param {string} type - Type of data (melody, chord, composition)
 */
function PlayButtonWithInstruments({ data, type }) {
  const {
    isPlaying,
    activePlayingPart,
    useSoundFont,
    setUseSoundFont,
    playData,
    stopPlayback,
    setMelodyInstrument,
    setChordInstrument,
    setBassInstrument,
    melodyInstrument,
    chordInstrument,
    bassInstrument,
    loadInstruments,
    instrumentsLoading
  } = usePlayback();
  
  const [isThisPlaying, setIsThisPlaying] = useState(false);
  const [availableInstruments, setAvailableInstruments] = useState({});
  
  // Load available instruments on component mount
  useEffect(() => {
    setAvailableInstruments(getAvailableInstruments());
  }, []);
  
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
  
  // Handle instrument change
  const handleInstrumentChange = (instrumentType, value) => {
    switch (instrumentType) {
      case 'melody':
        setMelodyInstrument(value);
        break;
      case 'chord':
        setChordInstrument(value);
        break;
      case 'bass':
        setBassInstrument(value);
        break;
      default:
        break;
    }
    
    // Load the instruments
    loadInstruments();
  };
  
  return (
    <Flex align="center" gap={2}>
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
      
      <Popover placement="bottom-end">
        <PopoverTrigger>
          <Button
            size="md"
            variant="outline"
            colorScheme="primary"
            leftIcon={
              <Box as="span" className="icon">
                🎹
              </Box>
            }
          >
            Instruments
          </Button>
        </PopoverTrigger>
        <PopoverContent bg="rgba(30, 41, 59, 0.95)" backdropFilter="blur(10px)" borderColor="rgba(255, 255, 255, 0.1)" p={2}>
          <PopoverArrow bg="rgba(30, 41, 59, 0.95)" />
          <PopoverCloseButton color="white" />
          <PopoverHeader borderColor="rgba(255, 255, 255, 0.1)" fontWeight="bold" color="primary.300">
            Sound Options
          </PopoverHeader>
          <PopoverBody>
            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="use-soundfont" mb="0" color="white">
                  Use Realistic Sounds
                </FormLabel>
                <Checkbox
                  id="use-soundfont"
                  isChecked={useSoundFont}
                  onChange={(e) => setUseSoundFont(e.target.checked)}
                  colorScheme="primary"
                />
              </FormControl>
              
              {useSoundFont && (
                <>
                  <Divider borderColor="rgba(255, 255, 255, 0.1)" />
                  
                  {type === 'melody' && (
                    <FormControl>
                      <FormLabel color="white">Melody Instrument</FormLabel>
                      <Flex align="center">
                        <Select
                          value={melodyInstrument}
                          onChange={(e) => handleInstrumentChange('melody', e.target.value)}
                          isDisabled={instrumentsLoading}
                          bg="rgba(255, 255, 255, 0.1)"
                          borderColor="rgba(255, 255, 255, 0.15)"
                          _hover={{ borderColor: "primary.400" }}
                          color="white"
                          mr={2}
                        >
                          {Object.entries(availableInstruments).map(([value, name]) => (
                            <option key={value} value={value}>{name}</option>
                          ))}
                        </Select>
                        {instrumentsLoading && <Spinner size="sm" color="primary.400" />}
                      </Flex>
                    </FormControl>
                  )}
                  
                  {type === 'chord' && (
                    <FormControl>
                      <FormLabel color="white">Chord Instrument</FormLabel>
                      <Flex align="center">
                        <Select
                          value={chordInstrument}
                          onChange={(e) => handleInstrumentChange('chord', e.target.value)}
                          isDisabled={instrumentsLoading}
                          bg="rgba(255, 255, 255, 0.1)"
                          borderColor="rgba(255, 255, 255, 0.15)"
                          _hover={{ borderColor: "primary.400" }}
                          color="white"
                          mr={2}
                        >
                          {Object.entries(availableInstruments).map(([value, name]) => (
                            <option key={value} value={value}>{name}</option>
                          ))}
                        </Select>
                        {instrumentsLoading && <Spinner size="sm" color="primary.400" />}
                      </Flex>
                    </FormControl>
                  )}
                  
                  {type === 'composition' && (
                    <>
                      <FormControl>
                        <FormLabel color="white">Melody Instrument</FormLabel>
                        <Flex align="center">
                          <Select
                            value={melodyInstrument}
                            onChange={(e) => handleInstrumentChange('melody', e.target.value)}
                            isDisabled={instrumentsLoading}
                            bg="rgba(255, 255, 255, 0.1)"
                            borderColor="rgba(255, 255, 255, 0.15)"
                            _hover={{ borderColor: "primary.400" }}
                            color="white"
                            mr={2}
                          >
                            {Object.entries(availableInstruments).map(([value, name]) => (
                              <option key={value} value={value}>{name}</option>
                            ))}
                          </Select>
                          {instrumentsLoading && <Spinner size="sm" color="primary.400" />}
                        </Flex>
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel color="white">Chord Instrument</FormLabel>
                        <Flex align="center">
                          <Select
                            value={chordInstrument}
                            onChange={(e) => handleInstrumentChange('chord', e.target.value)}
                            isDisabled={instrumentsLoading}
                            bg="rgba(255, 255, 255, 0.1)"
                            borderColor="rgba(255, 255, 255, 0.15)"
                            _hover={{ borderColor: "primary.400" }}
                            color="white"
                            mr={2}
                          >
                            {Object.entries(availableInstruments).map(([value, name]) => (
                              <option key={value} value={value}>{name}</option>
                            ))}
                          </Select>
                          {instrumentsLoading && <Spinner size="sm" color="primary.400" />}
                        </Flex>
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel color="white">Bass Instrument</FormLabel>
                        <Flex align="center">
                          <Select
                            value={bassInstrument}
                            onChange={(e) => handleInstrumentChange('bass', e.target.value)}
                            isDisabled={instrumentsLoading}
                            bg="rgba(255, 255, 255, 0.1)"
                            borderColor="rgba(255, 255, 255, 0.15)"
                            _hover={{ borderColor: "primary.400" }}
                            color="white"
                            mr={2}
                          >
                            {Object.entries(availableInstruments).map(([value, name]) => (
                              <option key={value} value={value}>{name}</option>
                            ))}
                          </Select>
                          {instrumentsLoading && <Spinner size="sm" color="primary.400" />}
                        </Flex>
                      </FormControl>
                    </>
                  )}
                </>
              )}
              
              {!useSoundFont && (
                <Text color="gray.300" fontSize="sm">
                  Using basic synthesizer sounds. Enable realistic sounds for better quality.
                </Text>
              )}
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </Flex>
  );
}

export default PlayButtonWithInstruments;
