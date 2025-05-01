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
  Spinner,
  Tooltip,
} from '@chakra-ui/react';
import { AccordionButton } from '@chakra-ui/react';

// Import utility functions
import { defaultScales } from '../utils/scales';
import {
  rhythmPatterns,
  contourTypes,
  generateMotif,
  applyMotifVariation,
} from '../utils/patterns';
import { humanizeNotes, applyArticulation, applyDynamics } from '../utils/humanize';

// Import SoundFont utility functions
import {
  // These functions are not currently used as playback has been moved to PlaybackContext
  // loadInstrument,
  getAvailableInstruments,
  // playMelodyWithSoundFont,
  // stopAllSounds,
} from '../utils/soundfontUtils';

// Define available instruments
const availableInstruments = getAvailableInstruments();

const scales = defaultScales;

function MelodyGenerator({ onMelodyGenerated }) {
  const [selectedScale, setSelectedScale] = useState('C Major');
  const [tempo, setTempo] = useState(120);
  const [bars, setBars] = useState(4);
  const [complexity, setComplexity] = useState(5);
  const [melody, setMelody] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [rhythmPattern, setRhythmPattern] = useState('basic');
  const [contourType, setContourType] = useState('random');
  const [useMotif, setUseMotif] = useState(false);
  const [motifVariation, setMotifVariation] = useState('transpose');
  const [articulation, setArticulation] = useState('legato');
  const [dynamics, setDynamics] = useState('none');
  const [humanize, setHumanize] = useState(true);
  const [autoRandomize, setAutoRandomize] = useState(false);

  const audioContextRef = useRef(null);

  const synthRef = useRef(null);

  useEffect(() => {
    const currentAudioContext = getAudioContext();
    if (currentAudioContext) {
      audioContextRef.current = currentAudioContext;
    }
  }, []);

  const randomizeOptions = () => {
    const rhythmPatternKeys = Object.keys(rhythmPatterns);
    const randomRhythmPattern =
      rhythmPatternKeys[Math.floor(Math.random() * rhythmPatternKeys.length)];
    setRhythmPattern(randomRhythmPattern);

    const contourTypeKeys = Object.keys(contourTypes);
    const randomContourType = contourTypeKeys[Math.floor(Math.random() * contourTypeKeys.length)];
    setContourType(randomContourType);

    const shouldUseMotif = Math.random() > 0.5;
    setUseMotif(shouldUseMotif);

    if (shouldUseMotif) {
      const motifVariations = ['transpose', 'invert', 'retrograde', 'rhythmic'];
      const randomMotifVariation =
        motifVariations[Math.floor(Math.random() * motifVariations.length)];
      setMotifVariation(randomMotifVariation);
    }

    const articulations = ['legato', 'staccato', 'accent', 'none'];
    const randomArticulation = articulations[Math.floor(Math.random() * articulations.length)];
    setArticulation(randomArticulation);

    const dynamicsOptions = ['crescendo', 'diminuendo', 'random', 'none'];
    const randomDynamics = dynamicsOptions[Math.floor(Math.random() * dynamicsOptions.length)];
    setDynamics(randomDynamics);

    setHumanize(Math.random() > 0.3);
  };

  const generateMelody = () => {
    if (autoRandomize) {
      randomizeOptions();
    }

    const scale = scales[selectedScale];
    let notes = [];
    let currentTime = 0;

    const selectedPattern = rhythmPatterns[rhythmPattern] || rhythmPatterns.basic;

    const contourFn = contourTypes[contourType] || contourTypes.random;

    const motif = useMotif ? generateMotif(scale, 4) : null;

    const patternTotalDuration = selectedPattern.reduce((sum, duration) => sum + duration, 0);
    const patternsPerBar = 4 / patternTotalDuration; // Assuming 4/4 time
    const totalPatterns = Math.ceil(bars * patternsPerBar);

    if (useMotif && motif) {
      for (let bar = 0; bar < bars; bar++) {
        const useVariation = bar % 2 === 1 || (bar > 0 && Math.random() < 0.3);
        const currentMotif = useVariation
          ? applyMotifVariation(motif, scale.length, motifVariation)
          : motif;

        currentMotif.forEach(motifNote => {
          const scaleIndex = Math.min(scale.length - 1, Math.max(0, motifNote.scaleIndex));
          notes.push({
            pitch: scale[scaleIndex],
            duration: motifNote.duration,
            velocity: 0.7 + Math.random() * 0.3,
            startTime: currentTime,
          });
          currentTime += motifNote.duration;
        });
      }
    } else {
      let patternIndex = 0;

      for (let i = 0; i < totalPatterns; i++) {
        for (let j = 0; j < selectedPattern.length; j++) {
          const duration = selectedPattern[j];

          const contourPosition = contourFn(
            patternIndex / (totalPatterns * selectedPattern.length)
          );

          const scalePosition = Math.floor(
            contourPosition * scale.length + ((Math.random() * complexity) / 5 - complexity / 10)
          );

          const clampedPosition = Math.min(scale.length - 1, Math.max(0, scalePosition));
          const note = scale[clampedPosition];

          const velocity = 0.7 + Math.random() * 0.3;

          notes.push({
            pitch: note,
            duration: duration,
            velocity: velocity,
            startTime: currentTime,
          });

          currentTime += duration;
          patternIndex++;
        }
      }
    }

    const totalDuration = bars * 4; // 4 beats per bar
    notes = notes.filter(note => note.startTime < totalDuration);

    if (articulation !== 'none') {
      notes = applyArticulation(notes, articulation);
    }

    if (dynamics !== 'none') {
      notes = applyDynamics(notes, dynamics);
    }

    if (humanize) {
      notes = humanizeNotes(notes, {
        timingVariation: 0.02,
        velocityVariation: 0.1,
        durationVariation: 0.05,
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
      useSoundFont: false,
      instrument: 'acoustic_grand_piano',
      notes: notes,
    };

    setMelody(melodyData);

    if (onMelodyGenerated) {
      onMelodyGenerated(melodyData);
    }

    return notes;
  };

  // This function is not currently used in the UI as playback has been moved to the PlaybackContext
  // Keeping it for reference or future use
  const _playMelodyLegacy = async () => {
    if (isPlaying) {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      setIsPlaying(false);
      return;
    }

    const notes = melody ? melody.notes : generateMelody();

    playWithToneJs(notes);
  };

  const playWithToneJs = async notes => {
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
      notes.forEach(note => {
        const durationSeconds = (note.duration * 60) / tempo;

        const startTime = now + (note.startTime * 60) / tempo;

        synthRef.current.triggerAttackRelease(
          note.pitch,
          durationSeconds,
          startTime,
          note.velocity
        );
      });

      setIsPlaying(true);

      const totalDuration = notes.reduce(
        (max, note) => Math.max(max, note.startTime + note.duration),
        0
      );

      setTimeout(
        () => {
          setIsPlaying(false);
        },
        ((totalDuration * 60) / tempo) * 1000 + 500
      );
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
          Melody Generator
        </Heading>
      </CardHeader>

      <CardBody>
        <VStack spacing={6} align="stretch">
          {/* Basic Controls */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <FormControl>
              <FormLabel>Scale</FormLabel>
              <Select
                value={selectedScale}
                onChange={e => setSelectedScale(e.target.value)}
                bg="rgba(255, 255, 255, 0.1)"
                borderColor="rgba(255, 255, 255, 0.15)"
                _hover={{ borderColor: 'primary.400' }}
              >
                {Object.keys(scales).map(scale => (
                  <option key={scale} value={scale}>
                    {scale}
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
              <FormLabel>Bars</FormLabel>
              <NumberInput
                min={1}
                max={16}
                value={bars}
                onChange={valueString => setBars(parseInt(valueString))}
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
                onChange={val => setComplexity(val)}
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
                  _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                >
                  <Box flex="1" textAlign="left">
                    <Heading size="sm">Advanced Options</Heading>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <FormControl mb={4}>
                    <Flex align="center">
                      <FormLabel mb={0}>Auto-Randomize Options</FormLabel>
                      <Checkbox
                        isChecked={autoRandomize}
                        onChange={e => setAutoRandomize(e.target.checked)}
                        colorScheme="primary"
                      />
                      <Tooltip
                        label="Automatically randomize advanced options when generating a melody"
                        hasArrow
                        placement="top"
                      >
                        <Box as="span" ml={2} color="gray.300" fontSize="sm">
                          ⓘ
                        </Box>
                      </Tooltip>
                    </Flex>
                  </FormControl>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mt={4}>
                    <FormControl>
                      <FormLabel>Rhythm Pattern</FormLabel>
                      <Select
                        value={rhythmPattern}
                        onChange={e => setRhythmPattern(e.target.value)}
                        bg="rgba(255, 255, 255, 0.1)"
                        borderColor="rgba(255, 255, 255, 0.15)"
                        _hover={{ borderColor: 'primary.400' }}
                      >
                        {Object.keys(rhythmPatterns).map(pattern => (
                          <option key={pattern} value={pattern}>
                            {pattern}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Melodic Contour</FormLabel>
                      <Select
                        value={contourType}
                        onChange={e => setContourType(e.target.value)}
                        bg="rgba(255, 255, 255, 0.1)"
                        borderColor="rgba(255, 255, 255, 0.15)"
                        _hover={{ borderColor: 'primary.400' }}
                      >
                        {Object.keys(contourTypes).map(contour => (
                          <option key={contour} value={contour}>
                            {contour}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <Flex align="center">
                        <FormLabel mb={0}>Use Motif</FormLabel>
                        <Checkbox
                          isChecked={useMotif}
                          onChange={e => setUseMotif(e.target.checked)}
                          colorScheme="primary"
                        />
                      </Flex>
                    </FormControl>

                    {useMotif && (
                      <FormControl>
                        <FormLabel>Motif Variation</FormLabel>
                        <Select
                          value={motifVariation}
                          onChange={e => setMotifVariation(e.target.value)}
                          bg="rgba(255, 255, 255, 0.1)"
                          borderColor="rgba(255, 255, 255, 0.15)"
                          _hover={{ borderColor: 'primary.400' }}
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
                        onChange={e => setArticulation(e.target.value)}
                        bg="rgba(255, 255, 255, 0.1)"
                        borderColor="rgba(255, 255, 255, 0.15)"
                        _hover={{ borderColor: 'primary.400' }}
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
                        onChange={e => setDynamics(e.target.value)}
                        bg="rgba(255, 255, 255, 0.1)"
                        borderColor="rgba(255, 255, 255, 0.15)"
                        _hover={{ borderColor: 'primary.400' }}
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
                          onChange={e => setHumanize(e.target.checked)}
                          colorScheme="primary"
                        />
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
              onClick={generateMelody}
              colorScheme="primary"
              size="lg"
              leftIcon={
                <Box as="span" className="icon">
                  🎵
                </Box>
              }
            >
              Generate Melody
            </Button>
          </HStack>

          {/* Melody Info */}
          {melody && (
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
                Generated Melody
              </Heading>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3}>
                <Text fontWeight="medium">
                  <Badge colorScheme="primary" mr={2} textShadow="0 1px 2px rgba(0, 0, 0, 0.3)">
                    Scale:
                  </Badge>{' '}
                  {melody.scale}
                </Text>
                <Text fontWeight="medium">
                  <Badge colorScheme="primary" mr={2} textShadow="0 1px 2px rgba(0, 0, 0, 0.3)">
                    Tempo:
                  </Badge>{' '}
                  {melody.tempo} BPM
                </Text>
                <Text fontWeight="medium">
                  <Badge colorScheme="primary" mr={2} textShadow="0 1px 2px rgba(0, 0, 0, 0.3)">
                    Length:
                  </Badge>{' '}
                  {melody.length} bars
                </Text>
                <Text fontWeight="medium">
                  <Badge colorScheme="primary" mr={2} textShadow="0 1px 2px rgba(0, 0, 0, 0.3)">
                    Notes:
                  </Badge>{' '}
                  {melody.notes.length}
                </Text>
                <Text fontWeight="medium">
                  <Badge colorScheme="primary" mr={2} textShadow="0 1px 2px rgba(0, 0, 0, 0.3)">
                    Rhythm:
                  </Badge>{' '}
                  {melody.rhythmPattern}
                </Text>
                <Text fontWeight="medium">
                  <Badge colorScheme="primary" mr={2} textShadow="0 1px 2px rgba(0, 0, 0, 0.3)">
                    Contour:
                  </Badge>{' '}
                  {melody.contourType}
                </Text>
                {melody.useMotif && (
                  <Text fontWeight="medium">
                    <Badge colorScheme="primary" mr={2} textShadow="0 1px 2px rgba(0, 0, 0, 0.3)">
                      Motif:
                    </Badge>{' '}
                    {melody.motifVariation}
                  </Text>
                )}
                {melody.articulation !== 'none' && (
                  <Text fontWeight="medium">
                    <Badge colorScheme="primary" mr={2} textShadow="0 1px 2px rgba(0, 0, 0, 0.3)">
                      Articulation:
                    </Badge>{' '}
                    {melody.articulation}
                  </Text>
                )}
                {melody.dynamics !== 'none' && (
                  <Text fontWeight="medium">
                    <Badge colorScheme="primary" mr={2} textShadow="0 1px 2px rgba(0, 0, 0, 0.3)">
                      Dynamics:
                    </Badge>{' '}
                    {melody.dynamics}
                  </Text>
                )}
                <Text fontWeight="medium">
                  <Badge colorScheme="primary" mr={2} textShadow="0 1px 2px rgba(0, 0, 0, 0.3)">
                    Humanized:
                  </Badge>{' '}
                  {melody.humanize ? 'Yes' : 'No'}
                </Text>
                {melody.useSoundFont && (
                  <Text fontWeight="medium">
                    <Badge colorScheme="primary" mr={2} textShadow="0 1px 2px rgba(0, 0, 0, 0.3)">
                      Instrument:
                    </Badge>{' '}
                    {availableInstruments[melody.instrument] || melody.instrument}
                  </Text>
                )}
              </SimpleGrid>
            </Box>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
}

export default MelodyGenerator;
