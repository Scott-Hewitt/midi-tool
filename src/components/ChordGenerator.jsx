import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { initializeTone, createSynth } from '../utils/toneContext';
import { ensureAudioContext, getAudioContext } from '../utils/audioContext';
import {
  Box,
  Heading,
  SimpleGrid,
  FormControl,
  FormLabel,
  Select,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Checkbox,
  Button,
  HStack,
  VStack,
  Text,
  Divider,
  Flex,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionIcon,
  Tooltip,
  Spinner,
  Grid,
  GridItem
} from '@chakra-ui/react';
import { AccordionButton } from '@chakra-ui/react';

// Import utility functions from chords.js for backward compatibility
import {
  applyVoiceLeading
} from '../utils/chords';

// Import Tonal.js utility functions
import {
  getKeys,
  getCommonProgressions,
  generateChordProgression,
  getChordNotes
} from '../utils/tonalUtils';

// Import SoundFont utility functions
import {
  loadInstrument,
  getAvailableInstruments,
  playChordProgressionWithSoundFont,
  stopAllSounds
} from '../utils/soundfontUtils';

// Define keys with their full names for Tonal.js compatibility
const keyOptions = [
  'C major', 'C# major', 'D major', 'Eb major', 'E major', 'F major',
  'F# major', 'G major', 'Ab major', 'A major', 'Bb major', 'B major',
  'A minor', 'Bb minor', 'B minor', 'C minor', 'C# minor', 'D minor',
  'Eb minor', 'E minor', 'F minor', 'F# minor', 'G minor', 'G# minor'
];

function ChordGenerator({ onChordGenerated }) {
  const [selectedKey, setSelectedKey] = useState('C major');
  const [selectedProgression, setSelectedProgression] = useState('Basic I-IV-V-I');
  const [tempo, setTempo] = useState(120);
  const [chordDuration, setChordDuration] = useState(1); // in bars
  const [progression, setProgression] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // New state variables for advanced features
  const [useVoiceLeading, setUseVoiceLeading] = useState(false);
  const [useInversions, setUseInversions] = useState(false);
  const [inversion, setInversion] = useState(0);
  const [useExtendedChords, setUseExtendedChords] = useState(false);
  const [autoRandomize, setAutoRandomize] = useState(true); // Auto-randomize is enabled by default

  // State for available progressions
  const [availableProgressions, setAvailableProgressions] = useState({});

  // State for SoundFont instruments
  const [useSoundFont, setUseSoundFont] = useState(true);
  const [selectedInstrument, setSelectedInstrument] = useState('acoustic_grand_piano');
  const [availableInstruments, setAvailableInstruments] = useState({});
  const [instrumentLoading, setInstrumentLoading] = useState(false);

  // Refs for audio context and instrument
  const audioContextRef = useRef(null);
  const instrumentRef = useRef(null);

  // Synth will be created lazily when needed
  const synthRef = useRef(null);

  // Load available progressions and instruments on component mount
  useEffect(() => {
    setAvailableProgressions(getCommonProgressions());
    setAvailableInstruments(getAvailableInstruments());

    // Store a reference to the current AudioContext if it exists
    const currentAudioContext = getAudioContext();
    if (currentAudioContext) {
      audioContextRef.current = currentAudioContext;
      // Load default instrument if we already have an AudioContext
      loadSoundFontInstrument('acoustic_grand_piano');
    }

    // Cleanup on unmount
    return () => {
      if (instrumentRef.current) {
        stopAllSounds(instrumentRef.current);
      }
    };
  }, []);

  // Load a SoundFont instrument
  const loadSoundFontInstrument = async (instrumentName) => {
    try {
      // Ensure AudioContext is initialized (this should be called in response to a user gesture)
      const ctx = await ensureAudioContext();
      if (!ctx) {
        console.error('Failed to initialize AudioContext');
        setUseSoundFont(false);
        return;
      }

      // Update our reference
      audioContextRef.current = ctx;

      setInstrumentLoading(true);
      const instrument = await loadInstrument(instrumentName, ctx);
      instrumentRef.current = instrument;
      setInstrumentLoading(false);
    } catch (error) {
      console.error('Error loading instrument:', error);
      setInstrumentLoading(false);
      setUseSoundFont(false); // Fall back to Tone.js
    }
  };

  // These functions are now imported from the utility file

  // Generate chord progression using Tonal.js
  const generateProgression = () => {
    // Get the progression pattern from available progressions
    const progressionPattern = availableProgressions[selectedProgression] || ['I', 'IV', 'V', 'I'];

    // Reset advanced options before applying new ones
    const resetOptions = () => {
      setUseExtendedChords(false);
      setUseVoiceLeading(false);
      setUseInversions(false);
      setInversion(0);
    };

    // Randomly apply advanced options for variety
    const randomizeOptions = () => {
      // Reset options first
      resetOptions();

      // 50% chance to use extended chords
      const shouldUseExtendedChords = Math.random() > 0.5;
      if (shouldUseExtendedChords) {
        setUseExtendedChords(true);
      }

      // 40% chance to use voice leading
      const shouldUseVoiceLeading = Math.random() > 0.6;
      if (shouldUseVoiceLeading) {
        setUseVoiceLeading(true);
      }

      // 30% chance to use inversions
      const shouldUseInversions = Math.random() > 0.7;
      if (shouldUseInversions) {
        setUseInversions(true);
        // Random inversion level (0-2)
        const randomInversion = Math.floor(Math.random() * 3);
        setInversion(randomInversion);
      }
    };

    // Apply random options if auto-randomize is enabled
    if (autoRandomize) {
      randomizeOptions();
    }

    // Generate the chord progression using Tonal.js
    let chords = generateChordProgression(selectedKey, progressionPattern, useExtendedChords);

    // Format the chords for our application
    chords = chords.map((chord, index) => {
      // Get the chord notes with octave information
      let notes = chord.notes;

      // Apply inversions if enabled
      if (useInversions && inversion > 0) {
        // Simple inversion implementation - move the first n notes up an octave
        for (let i = 0; i < inversion && i < notes.length; i++) {
          const note = notes[i];
          const noteName = note.slice(0, -1);
          const octave = parseInt(note.slice(-1));
          notes[i] = `${noteName}${octave + 1}`;
        }
      }

      return {
        root: chord.root,
        type: chord.type,
        notes: notes,
        duration: chordDuration,
        position: index * chordDuration,
        symbol: chord.symbol,
        degree: chord.degree
      };
    });

    // Apply voice leading if enabled
    if (useVoiceLeading) {
      chords = applyVoiceLeading(chords);
    }

    const progressionData = {
      key: selectedKey,
      progression: chords,
      useVoiceLeading,
      useInversions,
      inversion,
      useExtendedChords
    };

    setProgression(progressionData);

    // Call the callback function if provided
    if (onChordGenerated) {
      onChordGenerated(progressionData);
    }

    return chords;
  };

  // Play the generated chord progression
  const playProgression = async () => {
    if (isPlaying) {
      // Stop playing
      if (useSoundFont && instrumentRef.current) {
        stopAllSounds(instrumentRef.current);
      } else {
        Tone.Transport.stop();
        Tone.Transport.cancel();
      }
      setIsPlaying(false);
      return;
    }

    // Ensure AudioContext is initialized (this should be called in response to a user gesture)
    try {
      const ctx = await ensureAudioContext();
      if (ctx && audioContextRef.current !== ctx) {
        audioContextRef.current = ctx;
      }
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
      // Continue anyway, we can still try to play using Tone.js
    }

    // Generate progression if not already generated
    const chords = progression ? progression.progression : generateProgression();

    // Play using SoundFont if available, otherwise fall back to Tone.js
    if (useSoundFont && instrumentRef.current) {
      try {
        setIsPlaying(true);

        // Play the chord progression with SoundFont
        await playChordProgressionWithSoundFont(instrumentRef.current, chords, tempo);

        // Set isPlaying to false when done
        setIsPlaying(false);
      } catch (error) {
        console.error('Error playing with SoundFont:', error);
        // Fall back to Tone.js
        playWithToneJs(chords);
      }
    } else {
      // Use Tone.js as fallback
      playWithToneJs(chords);
    }
  };

  // Play using Tone.js (fallback method)
  const playWithToneJs = async (chords) => {
    try {
      // Initialize Tone.js on user interaction
      const success = await initializeTone();
      if (!success) {
        console.error('Failed to initialize Tone.js');
        return;
      }

      // Create synth lazily if it doesn't exist
      if (!synthRef.current) {
        synthRef.current = createSynth();
      }

      // Set the tempo
      Tone.Transport.bpm.value = tempo;

      // Schedule the chords
      const now = Tone.now();
      const secondsPerBar = 60 / tempo * 4; // 4 beats per bar

      chords.forEach((chord, index) => {
        const startTime = now + (index * chord.duration * secondsPerBar);
        const duration = chord.duration * secondsPerBar;

        synthRef.current.triggerAttackRelease(chord.notes, duration, startTime);
      });

      setIsPlaying(true);

      // Stop playing after the progression is complete
      const totalDuration = chords.reduce((sum, chord) => sum + chord.duration, 0) * secondsPerBar * 1000;
      setTimeout(() => {
        setIsPlaying(false);
      }, totalDuration + 500); // Add a small buffer
    } catch (error) {
      console.error('Error playing with Tone.js:', error);
      setIsPlaying(false);
    }
  };

  return (
    <Card p={6} variant="elevated" bg="rgba(30, 41, 59, 0.5)" backdropFilter="blur(12px)" border="1px solid rgba(255, 255, 255, 0.1)" boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.37)">
      <CardHeader pb={4}>
        <Heading size="lg" color="primary.400">Chord Generator</Heading>
      </CardHeader>

      <CardBody>
        <VStack spacing={6} align="stretch">
          {/* Basic Controls */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <FormControl>
              <FormLabel>Key</FormLabel>
              <Select
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                bg="rgba(255, 255, 255, 0.1)"
                borderColor="rgba(255, 255, 255, 0.15)"
                _hover={{ borderColor: "primary.400" }}
              >
                {keyOptions.map(key => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Progression</FormLabel>
              <Select
                value={selectedProgression}
                onChange={(e) => setSelectedProgression(e.target.value)}
                bg="rgba(255, 255, 255, 0.1)"
                borderColor="rgba(255, 255, 255, 0.15)"
                _hover={{ borderColor: "primary.400" }}
              >
                {Object.keys(availableProgressions).map(prog => (
                  <option key={prog} value={prog}>{prog}</option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Tempo (BPM): {tempo}</FormLabel>
              <Slider
                min={60}
                max={180}
                value={tempo}
                onChange={(val) => setTempo(val)}
                focusThumbOnChange={false}
              >
                <SliderTrack bg="rgba(255, 255, 255, 0.1)">
                  <SliderFilledTrack bg="primary.500" />
                </SliderTrack>
                <SliderThumb boxSize={6} />
              </Slider>
            </FormControl>

            <FormControl>
              <FormLabel>Chord Duration (bars)</FormLabel>
              <NumberInput
                min={0.5}
                max={4}
                step={0.5}
                value={chordDuration}
                onChange={(valueString) => setChordDuration(parseFloat(valueString))}
                bg="rgba(255, 255, 255, 0.1)"
                borderColor="rgba(255, 255, 255, 0.15)"
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </SimpleGrid>

          {/* Advanced Controls */}
          <Box mt={6}>
            <Accordion allowToggle defaultIndex={[]}>
              <AccordionItem border="none">
                <AccordionButton
                  bg="rgba(255, 255, 255, 0.05)"
                  borderRadius="md"
                  _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
                >
                  <Box flex="1" textAlign="left">
                    <Heading size="sm">Advanced Options</Heading>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mt={4}>
                    <FormControl>
                      <Flex align="center">
                        <FormLabel mb={0}>Use Voice Leading</FormLabel>
                        <Checkbox
                          isChecked={useVoiceLeading}
                          onChange={(e) => setUseVoiceLeading(e.target.checked)}
                          colorScheme="primary"
                        />
                      </Flex>
                    </FormControl>

                    <FormControl>
                      <Flex align="center">
                        <FormLabel mb={0}>Use Inversions</FormLabel>
                        <Checkbox
                          isChecked={useInversions}
                          onChange={(e) => setUseInversions(e.target.checked)}
                          colorScheme="primary"
                        />
                      </Flex>
                    </FormControl>

                    {useInversions && (
                      <FormControl>
                        <FormLabel>Inversion</FormLabel>
                        <Select
                          value={inversion}
                          onChange={(e) => setInversion(parseInt(e.target.value))}
                          bg="rgba(255, 255, 255, 0.1)"
                          borderColor="rgba(255, 255, 255, 0.15)"
                          _hover={{ borderColor: "primary.400" }}
                        >
                          <option value="0">Root Position</option>
                          <option value="1">First Inversion</option>
                          <option value="2">Second Inversion</option>
                          <option value="3">Third Inversion</option>
                        </Select>
                      </FormControl>
                    )}

                    <FormControl>
                      <Flex align="center">
                        <FormLabel mb={0}>Use Extended Chords</FormLabel>
                        <Checkbox
                          isChecked={useExtendedChords}
                          onChange={(e) => setUseExtendedChords(e.target.checked)}
                          colorScheme="primary"
                        />
                      </Flex>
                    </FormControl>

                    <FormControl>
                      <Flex align="center">
                        <FormLabel mb={0}>Auto-Randomize Options</FormLabel>
                        <Checkbox
                          isChecked={autoRandomize}
                          onChange={(e) => setAutoRandomize(e.target.checked)}
                          colorScheme="primary"
                        />
                        <Tooltip label="Automatically applies random advanced options for variety" hasArrow placement="top">
                          <Box as="span" ml={2} color="gray.300" fontSize="sm">ⓘ</Box>
                        </Tooltip>
                      </Flex>
                    </FormControl>
                  </SimpleGrid>

                  <Divider my={6} borderColor="rgba(255, 255, 255, 0.1)" />

                  <Heading size="sm" mb={4}>Sound Options</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <FormControl>
                      <Flex align="center">
                        <FormLabel mb={0}>Use Realistic Instrument Sounds</FormLabel>
                        <Checkbox
                          isChecked={useSoundFont}
                          onChange={(e) => setUseSoundFont(e.target.checked)}
                          colorScheme="primary"
                        />
                      </Flex>
                    </FormControl>

                    {useSoundFont && (
                      <FormControl>
                        <FormLabel>Instrument</FormLabel>
                        <Flex align="center">
                          <Select
                            value={selectedInstrument}
                            onChange={(e) => {
                              setSelectedInstrument(e.target.value);
                              loadSoundFontInstrument(e.target.value);
                            }}
                            isDisabled={instrumentLoading}
                            bg="rgba(255, 255, 255, 0.1)"
                            borderColor="rgba(255, 255, 255, 0.15)"
                            _hover={{ borderColor: "primary.400" }}
                            mr={2}
                          >
                            {Object.entries(availableInstruments).map(([value, name]) => (
                              <option key={value} value={value}>{name}</option>
                            ))}
                          </Select>
                          {instrumentLoading && <Spinner size="sm" color="primary.400" />}
                        </Flex>
                      </FormControl>
                    )}
                  </SimpleGrid>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </Box>

          {/* Action Buttons */}
          <HStack spacing={4} mt={6}>
            <Button
              onClick={generateProgression}
              colorScheme="primary"
              size="lg"
              leftIcon={<Box as="span" className="icon">🎹</Box>}
            >
              Generate Progression
            </Button>
            <Button
              onClick={playProgression}
              colorScheme={isPlaying ? "red" : "secondary"}
              variant={isPlaying ? "solid" : "outline"}
              size="lg"
              leftIcon={<Box as="span" className="icon">{isPlaying ? '⏹️' : '▶️'}</Box>}
            >
              {isPlaying ? 'Stop Playing' : 'Play Progression'}
            </Button>
          </HStack>

          {/* Progression Info */}
          {progression && (
            <Box
              mt={8}
              p={4}
              borderRadius="md"
              bg="rgba(255, 255, 255, 0.05)"
              borderLeft="4px solid"
              borderColor="primary.500"
            >
              <Heading size="md" mb={4}>Generated Chord Progression</Heading>
              <Text mb={4}><Badge colorScheme="primary" mr={2}>Key:</Badge> {progression.key}</Text>

              <Grid
                templateColumns={{ base: "1fr", md: "repeat(auto-fill, minmax(200px, 1fr))" }}
                gap={4}
              >
                {progression.progression.map((chord, index) => (
                  <GridItem
                    key={index}
                    p={3}
                    borderRadius="md"
                    bg="rgba(255, 255, 255, 0.05)"
                    _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
                    transition="background 0.2s"
                  >
                    <Flex direction="column" align="center">
                      <Heading size="md" color="primary.300">
                        {chord.symbol || `${chord.root.slice(0, -1)}${chord.type}`}
                      </Heading>
                      <Badge mb={2}>{chord.degree}</Badge>
                      <Text fontSize="sm" color="gray.300" textAlign="center">
                        {chord.notes.join(', ')}
                      </Text>
                    </Flex>
                  </GridItem>
                ))}
              </Grid>
            </Box>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
}

export default ChordGenerator;
