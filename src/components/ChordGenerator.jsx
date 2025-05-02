import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { initializeTone, createSynth } from '../utils/toneContext';
import { getAudioContext } from '../utils/audioContext';
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
  GridItem,
} from '@chakra-ui/react';
import { AccordionButton } from '@chakra-ui/react';

import { applyVoiceLeading } from '../utils/chords';
import { getCommonProgressions, generateChordProgression } from '../utils/tonalUtils';

// Define keys with their full names for Tonal.js compatibility
const keyOptions = [
  'C major',
  'C# major',
  'D major',
  'Eb major',
  'E major',
  'F major',
  'F# major',
  'G major',
  'Ab major',
  'A major',
  'Bb major',
  'B major',
  'A minor',
  'Bb minor',
  'B minor',
  'C minor',
  'C# minor',
  'D minor',
  'Eb minor',
  'E minor',
  'F minor',
  'F# minor',
  'G minor',
  'G# minor',
];

function ChordGenerator({ onChordGenerated }) {
  const [selectedKey, setSelectedKey] = useState('C major');
  const [selectedProgression, setSelectedProgression] = useState('Basic I-IV-V-I');
  const [tempo, setTempo] = useState(120);
  const [chordDuration, setChordDuration] = useState(1); // in bars
  const [progression, setProgression] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [useVoiceLeading, setUseVoiceLeading] = useState(false);
  const [useInversions, setUseInversions] = useState(false);
  const [inversion, setInversion] = useState(0);
  const [useExtendedChords, setUseExtendedChords] = useState(false);
  const [autoRandomize, setAutoRandomize] = useState(true);

  const [availableProgressions, setAvailableProgressions] = useState({});

  const audioContextRef = useRef(null);

  const synthRef = useRef(null);

  useEffect(() => {
    setAvailableProgressions(getCommonProgressions());

    const currentAudioContext = getAudioContext();
    if (currentAudioContext) {
      audioContextRef.current = currentAudioContext;
    }
  }, []);

  const generateProgression = () => {
    const progressionPattern = availableProgressions[selectedProgression] || ['I', 'IV', 'V', 'I'];

    const resetOptions = () => {
      setUseExtendedChords(false);
      setUseVoiceLeading(false);
      setUseInversions(false);
      setInversion(0);
    };

    const randomizeOptions = () => {
      resetOptions();

      const shouldUseExtendedChords = Math.random() > 0.5;
      if (shouldUseExtendedChords) {
        setUseExtendedChords(true);
      }

      const shouldUseVoiceLeading = Math.random() > 0.6;
      if (shouldUseVoiceLeading) {
        setUseVoiceLeading(true);
      }

      const shouldUseInversions = Math.random() > 0.7;
      if (shouldUseInversions) {
        setUseInversions(true);
        const randomInversion = Math.floor(Math.random() * 3);
        setInversion(randomInversion);
      }
    };

    if (autoRandomize) {
      randomizeOptions();
    }

    let chords = generateChordProgression(selectedKey, progressionPattern, useExtendedChords);

    chords = chords.map((chord, index) => {
      let notes = chord.notes;

      if (useInversions && inversion > 0) {
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
        degree: chord.degree,
      };
    });

    if (useVoiceLeading) {
      chords = applyVoiceLeading(chords);
    }

    const progressionData = {
      key: selectedKey,
      progression: chords,
      useVoiceLeading,
      useInversions,
      inversion,
      useExtendedChords,
    };

    setProgression(progressionData);

    // Call the callback function if provided
    if (onChordGenerated) {
      onChordGenerated(progressionData);
    }

    return chords;
  };

  // This function is not currently used in the UI as playback has been moved to the PlaybackContext
  // Keeping it for reference or future use
  const _playProgressionLegacy = async () => {
    if (isPlaying) {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      setIsPlaying(false);
      return;
    }

    const chords = progression ? progression.progression : generateProgression();

    playWithToneJs(chords);
  };

  const playWithToneJs = async chords => {
    try {
      const success = await initializeTone();
      if (!success) {
        console.error('Failed to initialize Tone.js');
        return;
      }

      if (!synthRef.current) {
        synthRef.current = createSynth();
      }

      Tone.Transport.bpm.value = tempo;

      const now = Tone.now();
      const secondsPerBar = (60 / tempo) * 4;

      chords.forEach((chord, index) => {
        const startTime = now + index * chord.duration * secondsPerBar;
        const duration = chord.duration * secondsPerBar;

        synthRef.current.triggerAttackRelease(chord.notes, duration, startTime);
      });

      setIsPlaying(true);

      const totalDuration =
        chords.reduce((sum, chord) => sum + chord.duration, 0) * secondsPerBar * 1000;
      setTimeout(() => {
        setIsPlaying(false);
      }, totalDuration + 500);
    } catch (error) {
      console.error('Error playing with Tone.js:', error);
      setIsPlaying(false);
    }
  };

  return (
    <Card
      p={6}
      variant="elevated"
      bg="rgba(30, 41, 59, 0.5)"
      backdropFilter="blur(12px)"
      border="1px solid rgba(255, 255, 255, 0.1)"
      boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.37)"
    >
      <CardHeader pb={4}>
        <Heading size="lg" color="primary.400">
          Chord Generator
        </Heading>
      </CardHeader>

      <CardBody>
        <VStack spacing={6} align="stretch">
          {/* Basic Controls */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <FormControl>
              <FormLabel>Key</FormLabel>
              <Select
                value={selectedKey}
                onChange={e => setSelectedKey(e.target.value)}
                bg="rgba(255, 255, 255, 0.1)"
                borderColor="rgba(255, 255, 255, 0.15)"
                _hover={{ borderColor: 'primary.400' }}
              >
                {keyOptions.map(key => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Progression</FormLabel>
              <Select
                value={selectedProgression}
                onChange={e => setSelectedProgression(e.target.value)}
                bg="rgba(255, 255, 255, 0.1)"
                borderColor="rgba(255, 255, 255, 0.15)"
                _hover={{ borderColor: 'primary.400' }}
              >
                {Object.keys(availableProgressions).map(prog => (
                  <option key={prog} value={prog}>
                    {prog}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Tempo (BPM): {tempo}</FormLabel>
              <Slider
                min={60}
                max={180}
                value={tempo}
                onChange={val => setTempo(val)}
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
                onChange={valueString => setChordDuration(parseFloat(valueString))}
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
                  _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
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
                          onChange={e => setUseVoiceLeading(e.target.checked)}
                          colorScheme="primary"
                        />
                      </Flex>
                    </FormControl>

                    <FormControl>
                      <Flex align="center">
                        <FormLabel mb={0}>Use Inversions</FormLabel>
                        <Checkbox
                          isChecked={useInversions}
                          onChange={e => setUseInversions(e.target.checked)}
                          colorScheme="primary"
                        />
                      </Flex>
                    </FormControl>

                    {useInversions && (
                      <FormControl>
                        <FormLabel>Inversion</FormLabel>
                        <Select
                          value={inversion}
                          onChange={e => setInversion(parseInt(e.target.value))}
                          bg="rgba(255, 255, 255, 0.1)"
                          borderColor="rgba(255, 255, 255, 0.15)"
                          _hover={{ borderColor: 'primary.400' }}
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
                          onChange={e => setUseExtendedChords(e.target.checked)}
                          colorScheme="primary"
                        />
                      </Flex>
                    </FormControl>

                    <FormControl>
                      <Flex align="center">
                        <FormLabel mb={0}>Auto-Randomize Options</FormLabel>
                        <Checkbox
                          isChecked={autoRandomize}
                          onChange={e => setAutoRandomize(e.target.checked)}
                          colorScheme="primary"
                        />
                        <Tooltip
                          label="Automatically applies random advanced options for variety"
                          hasArrow
                          placement="top"
                        >
                          <Box as="span" ml={2} color="gray.300" fontSize="sm">
                            ⓘ
                          </Box>
                        </Tooltip>
                      </Flex>
                    </FormControl>
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
              leftIcon={
                <Box as="span" className="icon">
                  🎹
                </Box>
              }
            >
              Generate Progression
            </Button>
          </HStack>

          {/* Progression Info */}
          {progression && (
            <Box
              mt={8}
              p={4}
              borderRadius="md"
              bg="rgba(255, 255, 255, 0.08)"
              borderLeft="4px solid"
              borderColor="primary.500"
              boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
            >
              <Heading size="md" mb={4} textShadow="0 1px 2px rgba(0, 0, 0, 0.3)">
                Generated Chord Progression
              </Heading>
              <Text mb={4} fontWeight="medium">
                <Badge colorScheme="primary" mr={2} textShadow="0 1px 2px rgba(0, 0, 0, 0.3)">
                  Key:
                </Badge>{' '}
                {progression.key}
              </Text>

              <Grid
                templateColumns={{ base: '1fr', md: 'repeat(auto-fill, minmax(200px, 1fr))' }}
                gap={4}
              >
                {progression.progression.map((chord, index) => (
                  <GridItem
                    key={index}
                    p={3}
                    borderRadius="md"
                    bg="rgba(255, 255, 255, 0.08)"
                    _hover={{ bg: 'rgba(255, 255, 255, 0.12)' }}
                    transition="background 0.2s"
                    boxShadow="0 2px 4px rgba(0, 0, 0, 0.1)"
                  >
                    <Flex direction="column" align="center">
                      <Heading
                        size="md"
                        color="primary.300"
                        textShadow="0 1px 2px rgba(0, 0, 0, 0.3)"
                      >
                        {chord.symbol || `${chord.root.slice(0, -1)}${chord.type}`}
                      </Heading>
                      <Badge mb={2} textShadow="0 1px 2px rgba(0, 0, 0, 0.3)">
                        {chord.degree}
                      </Badge>
                      <Text fontSize="sm" color="gray.200" textAlign="center" fontWeight="medium">
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
