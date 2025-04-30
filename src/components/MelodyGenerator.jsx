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
  Spinner,
  Tooltip
} from '@chakra-ui/react';
import { AccordionButton } from '@chakra-ui/react';

// Import utility functions
import { defaultScales } from '../utils/scales';
import { rhythmPatterns, contourTypes, generateMotif, applyMotifVariation } from '../utils/patterns';
import { humanizeNotes, applyArticulation, applyDynamics } from '../utils/humanize';

// Import SoundFont utility functions
import {
  loadInstrument,
  getAvailableInstruments,
  playMelodyWithSoundFont,
  stopAllSounds
} from '../utils/soundfontUtils';

// Use the default scales from the scales utility
const scales = defaultScales;

function MelodyGenerator({ onMelodyGenerated }) {
  const [selectedScale, setSelectedScale] = useState('C Major');
  const [tempo, setTempo] = useState(120);
  const [bars, setBars] = useState(4);
  const [complexity, setComplexity] = useState(5);
  const [melody, setMelody] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // New state variables for advanced features
  const [rhythmPattern, setRhythmPattern] = useState('basic');
  const [contourType, setContourType] = useState('random');
  const [useMotif, setUseMotif] = useState(false);
  const [motifVariation, setMotifVariation] = useState('transpose');
  const [articulation, setArticulation] = useState('legato');
  const [dynamics, setDynamics] = useState('none');
  const [humanize, setHumanize] = useState(true);

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

  // Load available instruments and initialize audio context on component mount
  useEffect(() => {
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

  // Generate a melody based on the selected parameters
  const generateMelody = () => {
    const scale = scales[selectedScale];
    let notes = [];
    let currentTime = 0;

    // Get the selected rhythm pattern
    const selectedPattern = rhythmPatterns[rhythmPattern] || rhythmPatterns.basic;

    // Get the selected contour function
    const contourFn = contourTypes[contourType] || contourTypes.random;

    // Generate a motif if enabled
    const motif = useMotif ? generateMotif(scale, 4) : null;

    // Calculate total notes based on rhythm pattern and bars
    const patternTotalDuration = selectedPattern.reduce((sum, duration) => sum + duration, 0);
    const patternsPerBar = 4 / patternTotalDuration; // Assuming 4/4 time
    const totalPatterns = Math.ceil(bars * patternsPerBar);

    // Generate notes based on whether we're using motifs or not
    if (useMotif && motif) {
      // Generate melody using motifs
      for (let bar = 0; bar < bars; bar++) {
        // Decide whether to use the motif directly or with variation
        const useVariation = bar % 2 === 1 || (bar > 0 && Math.random() < 0.3);
        const currentMotif = useVariation
          ? applyMotifVariation(motif, scale.length, motifVariation)
          : motif;

        // Add the motif notes to the melody
        currentMotif.forEach(motifNote => {
          const scaleIndex = Math.min(scale.length - 1, Math.max(0, motifNote.scaleIndex));
          notes.push({
            pitch: scale[scaleIndex],
            duration: motifNote.duration,
            velocity: 0.7 + (Math.random() * 0.3),
            startTime: currentTime
          });
          currentTime += motifNote.duration;
        });
      }
    } else {
      // Generate melody using rhythm patterns and contour
      let patternIndex = 0;

      for (let i = 0; i < totalPatterns; i++) {
        for (let j = 0; j < selectedPattern.length; j++) {
          // Get duration from pattern
          const duration = selectedPattern[j];

          // Use contour to influence note selection
          const contourPosition = contourFn(patternIndex / (totalPatterns * selectedPattern.length));

          // Calculate scale position based on contour and complexity
          const scalePosition = Math.floor(
            contourPosition * scale.length +
            (Math.random() * complexity / 5 - complexity / 10)
          );

          // Clamp to valid scale indices
          const clampedPosition = Math.min(scale.length - 1, Math.max(0, scalePosition));
          const note = scale[clampedPosition];

          // Velocity (0-127 in MIDI, but normalized to 0-1 for Tone.js)
          const velocity = 0.7 + (Math.random() * 0.3); // Between 0.7 and 1.0

          notes.push({
            pitch: note,
            duration: duration,
            velocity: velocity,
            startTime: currentTime
          });

          currentTime += duration;
          patternIndex++;
        }
      }
    }

    // Trim notes to fit within the specified number of bars
    const totalDuration = bars * 4; // 4 beats per bar
    notes = notes.filter(note => note.startTime < totalDuration);

    // Apply articulation if selected
    if (articulation !== 'none') {
      notes = applyArticulation(notes, articulation);
    }

    // Apply dynamics if selected
    if (dynamics !== 'none') {
      notes = applyDynamics(notes, dynamics);
    }

    // Apply humanization if enabled
    if (humanize) {
      notes = humanizeNotes(notes, {
        timingVariation: 0.02,
        velocityVariation: 0.1,
        durationVariation: 0.05
      });
    }

    const melodyData = {
      scale: selectedScale,
      tempo: tempo,
      length: bars,
      complexity: complexity,
      rhythmPattern: rhythmPattern,
      contourType: contourType,
      useMotif: useMotif,
      motifVariation: motifVariation,
      articulation: articulation,
      dynamics: dynamics,
      humanize: humanize,
      useSoundFont: useSoundFont,
      instrument: selectedInstrument,
      notes: notes
    };

    setMelody(melodyData);

    // Call the callback function if provided
    if (onMelodyGenerated) {
      onMelodyGenerated(melodyData);
    }

    return notes;
  };

  // Play the generated melody
  const playMelody = async () => {
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

    // Generate melody if not already generated
    const notes = melody ? melody.notes : generateMelody();

    // Play using SoundFont if available, otherwise fall back to Tone.js
    if (useSoundFont && instrumentRef.current) {
      try {
        setIsPlaying(true);

        // Play the melody with SoundFont
        await playMelodyWithSoundFont(instrumentRef.current, notes, tempo);

        // Set isPlaying to false when done
        setIsPlaying(false);
      } catch (error) {
        console.error('Error playing with SoundFont:', error);
        // Fall back to Tone.js
        playWithToneJs(notes);
      }
    } else {
      // Use Tone.js as fallback
      playWithToneJs(notes);
    }
  };

  // Play using Tone.js (fallback method)
  const playWithToneJs = async (notes) => {
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

      // Schedule the notes
      const now = Tone.now();
      notes.forEach(note => {
        // Convert duration from beats to seconds
        const durationSeconds = note.duration * 60 / tempo;

        // Schedule the note at its start time
        const startTime = now + (note.startTime * 60 / tempo);

        synthRef.current.triggerAttackRelease(
          note.pitch,
          durationSeconds,
          startTime,
          note.velocity
        );
      });

      setIsPlaying(true);

      // Calculate total duration of the melody
      const totalDuration = notes.reduce(
        (max, note) => Math.max(max, note.startTime + note.duration),
        0
      );

      // Stop playing after the melody is complete
      setTimeout(() => {
        setIsPlaying(false);
      }, (totalDuration * 60 / tempo * 1000) + 500); // Add a small buffer
    } catch (error) {
      console.error('Error playing with Tone.js:', error);
      setIsPlaying(false);
    }
  };

  return (
    <Card p={6} variant="elevated" bg="rgba(30, 41, 59, 0.5)" backdropFilter="blur(12px)" border="1px solid rgba(255, 255, 255, 0.1)" boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.37)">
      <CardHeader pb={4}>
        <Heading size="lg" color="primary.400">Melody Generator</Heading>
      </CardHeader>

      <CardBody>
        <VStack spacing={6} align="stretch">
          {/* Basic Controls */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <FormControl>
              <FormLabel>Scale</FormLabel>
              <Select
                value={selectedScale}
                onChange={(e) => setSelectedScale(e.target.value)}
                bg="rgba(255, 255, 255, 0.1)"
                borderColor="rgba(255, 255, 255, 0.15)"
                _hover={{ borderColor: "primary.400" }}
              >
                {Object.keys(scales).map(scale => (
                  <option key={scale} value={scale}>{scale}</option>
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
              <FormLabel>Bars</FormLabel>
              <NumberInput
                min={1}
                max={16}
                value={bars}
                onChange={(valueString) => setBars(parseInt(valueString))}
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

            <FormControl>
              <FormLabel>Complexity: {complexity}</FormLabel>
              <Slider
                min={1}
                max={10}
                value={complexity}
                onChange={(val) => setComplexity(val)}
                focusThumbOnChange={false}
              >
                <SliderTrack bg="rgba(255, 255, 255, 0.1)">
                  <SliderFilledTrack bg="primary.500" />
                </SliderTrack>
                <SliderThumb boxSize={6} />
              </Slider>
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
                      <FormLabel>Rhythm Pattern</FormLabel>
                      <Select
                        value={rhythmPattern}
                        onChange={(e) => setRhythmPattern(e.target.value)}
                        bg="rgba(255, 255, 255, 0.1)"
                        borderColor="rgba(255, 255, 255, 0.15)"
                        _hover={{ borderColor: "primary.400" }}
                      >
                        {Object.keys(rhythmPatterns).map(pattern => (
                          <option key={pattern} value={pattern}>{pattern}</option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Melodic Contour</FormLabel>
                      <Select
                        value={contourType}
                        onChange={(e) => setContourType(e.target.value)}
                        bg="rgba(255, 255, 255, 0.1)"
                        borderColor="rgba(255, 255, 255, 0.15)"
                        _hover={{ borderColor: "primary.400" }}
                      >
                        {Object.keys(contourTypes).map(contour => (
                          <option key={contour} value={contour}>{contour}</option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <Flex align="center">
                        <FormLabel mb={0}>Use Motif</FormLabel>
                        <Checkbox
                          isChecked={useMotif}
                          onChange={(e) => setUseMotif(e.target.checked)}
                          colorScheme="primary"
                        />
                      </Flex>
                    </FormControl>

                    {useMotif && (
                      <FormControl>
                        <FormLabel>Motif Variation</FormLabel>
                        <Select
                          value={motifVariation}
                          onChange={(e) => setMotifVariation(e.target.value)}
                          bg="rgba(255, 255, 255, 0.1)"
                          borderColor="rgba(255, 255, 255, 0.15)"
                          _hover={{ borderColor: "primary.400" }}
                        >
                          <option value="transpose">Transpose</option>
                          <option value="invert">Invert</option>
                          <option value="retrograde">Retrograde</option>
                          <option value="augment">Augment</option>
                          <option value="diminish">Diminish</option>
                        </Select>
                      </FormControl>
                    )}

                    <FormControl>
                      <FormLabel>Articulation</FormLabel>
                      <Select
                        value={articulation}
                        onChange={(e) => setArticulation(e.target.value)}
                        bg="rgba(255, 255, 255, 0.1)"
                        borderColor="rgba(255, 255, 255, 0.15)"
                        _hover={{ borderColor: "primary.400" }}
                      >
                        <option value="none">None</option>
                        <option value="legato">Legato</option>
                        <option value="staccato">Staccato</option>
                        <option value="marcato">Marcato</option>
                        <option value="tenuto">Tenuto</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Dynamics</FormLabel>
                      <Select
                        value={dynamics}
                        onChange={(e) => setDynamics(e.target.value)}
                        bg="rgba(255, 255, 255, 0.1)"
                        borderColor="rgba(255, 255, 255, 0.15)"
                        _hover={{ borderColor: "primary.400" }}
                      >
                        <option value="none">None</option>
                        <option value="crescendo">Crescendo</option>
                        <option value="diminuendo">Diminuendo</option>
                        <option value="swell">Swell</option>
                        <option value="fade">Fade</option>
                        <option value="accent">Accent</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <Flex align="center">
                        <FormLabel mb={0}>Humanize</FormLabel>
                        <Checkbox
                          isChecked={humanize}
                          onChange={(e) => setHumanize(e.target.checked)}
                          colorScheme="primary"
                        />
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
                        <Tooltip label="Uses high-quality sampled instruments instead of synthesized sounds" hasArrow placement="top">
                          <Box as="span" ml={2} color="gray.300" fontSize="sm">ⓘ</Box>
                        </Tooltip>
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
              onClick={generateMelody}
              colorScheme="primary"
              size="lg"
              leftIcon={<Box as="span" className="icon">🎵</Box>}
            >
              Generate Melody
            </Button>
            <Button
              onClick={playMelody}
              colorScheme={isPlaying ? "red" : "secondary"}
              variant={isPlaying ? "solid" : "outline"}
              size="lg"
              leftIcon={<Box as="span" className="icon">{isPlaying ? '⏹️' : '▶️'}</Box>}
            >
              {isPlaying ? 'Stop Playing' : 'Play Melody'}
            </Button>
          </HStack>

          {/* Melody Info */}
          {melody && (
            <Box
              mt={8}
              p={4}
              borderRadius="md"
              bg="rgba(255, 255, 255, 0.05)"
              borderLeft="4px solid"
              borderColor="primary.500"
            >
              <Heading size="md" mb={4}>Generated Melody</Heading>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3}>
                <Text><Badge colorScheme="primary" mr={2}>Scale:</Badge> {melody.scale}</Text>
                <Text><Badge colorScheme="primary" mr={2}>Tempo:</Badge> {melody.tempo} BPM</Text>
                <Text><Badge colorScheme="primary" mr={2}>Length:</Badge> {melody.length} bars</Text>
                <Text><Badge colorScheme="primary" mr={2}>Notes:</Badge> {melody.notes.length}</Text>
                <Text><Badge colorScheme="primary" mr={2}>Rhythm:</Badge> {melody.rhythmPattern}</Text>
                <Text><Badge colorScheme="primary" mr={2}>Contour:</Badge> {melody.contourType}</Text>
                {melody.useMotif && <Text><Badge colorScheme="primary" mr={2}>Motif:</Badge> {melody.motifVariation}</Text>}
                {melody.articulation !== 'none' && <Text><Badge colorScheme="primary" mr={2}>Articulation:</Badge> {melody.articulation}</Text>}
                {melody.dynamics !== 'none' && <Text><Badge colorScheme="primary" mr={2}>Dynamics:</Badge> {melody.dynamics}</Text>}
                <Text><Badge colorScheme="primary" mr={2}>Humanized:</Badge> {melody.humanize ? 'Yes' : 'No'}</Text>
                {melody.useSoundFont && <Text><Badge colorScheme="primary" mr={2}>Instrument:</Badge> {availableInstruments[melody.instrument] || melody.instrument}</Text>}
              </SimpleGrid>
            </Box>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
}

export default MelodyGenerator;
