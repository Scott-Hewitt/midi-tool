import { useState } from 'react';
import { exportAndDownloadMIDI } from '../utils/firebase/midiExport';
import {
  Box,
  Heading,
  Text,
  Input,
  Select,
  Checkbox,
  Button,
  VStack,
  HStack,
  SimpleGrid,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionIcon,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import { AccordionButton } from '@chakra-ui/react';

function MIDIExport({ data, type }) {
  const [fileName, setFileName] = useState('my-music');
  const [exportStatus, setExportStatus] = useState('');
  const [exportOptions, setExportOptions] = useState({
    includeMelody: true,
    includeChords: true,
    includeBass: true,
    melodyInstrument: 0, // Piano
    chordInstrument: 4, // Electric Piano
    bassInstrument: 32, // Acoustic Bass
    applyExpression: true,
    humanize: true,
  });

  // Handle option changes
  const handleOptionChange = (option, value) => {
    setExportOptions({
      ...exportOptions,
      [option]: value,
    });
  };

  // Export MIDI file using JZZ
  const handleExport = async () => {
    // Determine which data to use
    let melodyData = null;
    let chordData = null;

    if (type === 'melody') {
      melodyData = data;
    } else if (type === 'chord') {
      chordData = data;
    } else if (type === 'composition') {
      // For composition type, we have both melody and chord data
      melodyData = data.melody;
      chordData = data.chord;
    }

    if (!melodyData && !chordData) {
      setExportStatus('No data to export');
      return;
    }

    try {
      // Set export options based on data type
      const options = {
        ...exportOptions,
        includeMelody: (type === 'melody' || type === 'composition') && exportOptions.includeMelody,
        includeChords: (type === 'chord' || type === 'composition') && exportOptions.includeChords,
        includeBass: type === 'composition' && exportOptions.includeBass,
      };

      // Export the MIDI file
      const success = await exportAndDownloadMIDI(
        melodyData,
        chordData,
        `${fileName}-${type}`,
        options
      );

      if (success) {
        let successMessage = '';
        if (type === 'melody') {
          successMessage = 'Melody exported successfully!';
        } else if (type === 'chord') {
          successMessage = 'Chord progression exported successfully!';
        } else if (type === 'composition') {
          successMessage = 'Composition exported successfully!';
        }
        setExportStatus(successMessage);
      } else {
        setExportStatus(`Error exporting ${type}`);
      }

      // Clear the status message after 3 seconds
      setTimeout(() => {
        setExportStatus('');
      }, 3000);
    } catch (error) {
      console.error(`Error exporting ${type}:`, error);
      setExportStatus(`Error exporting ${type}: ${error.message}`);
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
          MIDI Export
        </Heading>
      </CardHeader>

      <CardBody>
        <VStack spacing={6} align="stretch">
          {/* File Name Input */}
          <FormControl>
            <FormLabel>File Name</FormLabel>
            <Input
              value={fileName}
              onChange={e => setFileName(e.target.value)}
              placeholder="Enter file name"
              bg="rgba(255, 255, 255, 0.1)"
              borderColor="rgba(255, 255, 255, 0.15)"
              _hover={{ borderColor: 'primary.400' }}
            />
          </FormControl>

          {/* Export Options */}
          <Box>
            <Accordion allowToggle defaultIndex={[]}>
              <AccordionItem border="none">
                <AccordionButton
                  bg="rgba(255, 255, 255, 0.05)"
                  borderRadius="md"
                  _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                >
                  <Box flex="1" textAlign="left">
                    <Heading size="sm">Export Options</Heading>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mt={4}>
                    {/* Track Options */}
                    <Box>
                      <Heading size="xs" mb={3}>
                        Tracks
                      </Heading>

                      {(type === 'melody' || type === 'composition') && (
                        <FormControl display="flex" alignItems="center" mb={2}>
                          <Checkbox
                            isChecked={exportOptions.includeMelody}
                            onChange={e => handleOptionChange('includeMelody', e.target.checked)}
                            colorScheme="primary"
                            mr={2}
                          />
                          <FormLabel mb={0}>Include Melody Track</FormLabel>
                        </FormControl>
                      )}

                      {(type === 'chord' || type === 'composition') && (
                        <FormControl display="flex" alignItems="center" mb={2}>
                          <Checkbox
                            isChecked={exportOptions.includeChords}
                            onChange={e => handleOptionChange('includeChords', e.target.checked)}
                            colorScheme="primary"
                            mr={2}
                          />
                          <FormLabel mb={0}>Include Chord Track</FormLabel>
                        </FormControl>
                      )}

                      <FormControl display="flex" alignItems="center" mb={2}>
                        <Checkbox
                          isChecked={exportOptions.includeBass}
                          onChange={e => handleOptionChange('includeBass', e.target.checked)}
                          colorScheme="primary"
                          mr={2}
                        />
                        <FormLabel mb={0}>Include Bass Track</FormLabel>
                      </FormControl>
                    </Box>

                    {/* Processing Options */}
                    <Box>
                      <Heading size="xs" mb={3}>
                        Processing
                      </Heading>

                      <FormControl display="flex" alignItems="center" mb={2}>
                        <Checkbox
                          isChecked={exportOptions.applyExpression}
                          onChange={e => handleOptionChange('applyExpression', e.target.checked)}
                          colorScheme="primary"
                          mr={2}
                        />
                        <FormLabel mb={0}>Apply Expression</FormLabel>
                        <Tooltip label="Adds dynamics and volume changes" hasArrow placement="top">
                          <Box as="span" ml={1} color="gray.300" fontSize="sm">
                            ⓘ
                          </Box>
                        </Tooltip>
                      </FormControl>

                      <FormControl display="flex" alignItems="center" mb={2}>
                        <Checkbox
                          isChecked={exportOptions.humanize}
                          onChange={e => handleOptionChange('humanize', e.target.checked)}
                          colorScheme="primary"
                          mr={2}
                        />
                        <FormLabel mb={0}>Humanize</FormLabel>
                        <Tooltip
                          label="Adds slight timing and velocity variations"
                          hasArrow
                          placement="top"
                        >
                          <Box as="span" ml={1} color="gray.300" fontSize="sm">
                            ⓘ
                          </Box>
                        </Tooltip>
                      </FormControl>
                    </Box>

                    {/* Instrument Selection */}
                    <FormControl>
                      <FormLabel>Melody Instrument</FormLabel>
                      <Select
                        value={exportOptions.melodyInstrument}
                        onChange={e =>
                          handleOptionChange('melodyInstrument', parseInt(e.target.value))
                        }
                        bg="rgba(255, 255, 255, 0.1)"
                        borderColor="rgba(255, 255, 255, 0.15)"
                        _hover={{ borderColor: 'primary.400' }}
                      >
                        <option value="0">Piano</option>
                        <option value="4">Electric Piano</option>
                        <option value="24">Acoustic Guitar</option>
                        <option value="73">Flute</option>
                        <option value="66">Saxophone</option>
                        <option value="40">Violin</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Chord Instrument</FormLabel>
                      <Select
                        value={exportOptions.chordInstrument}
                        onChange={e =>
                          handleOptionChange('chordInstrument', parseInt(e.target.value))
                        }
                        bg="rgba(255, 255, 255, 0.1)"
                        borderColor="rgba(255, 255, 255, 0.15)"
                        _hover={{ borderColor: 'primary.400' }}
                      >
                        <option value="0">Piano</option>
                        <option value="4">Electric Piano</option>
                        <option value="24">Acoustic Guitar</option>
                        <option value="48">String Ensemble</option>
                        <option value="19">Church Organ</option>
                        <option value="5">Electric Piano 2</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Bass Instrument</FormLabel>
                      <Select
                        value={exportOptions.bassInstrument}
                        onChange={e =>
                          handleOptionChange('bassInstrument', parseInt(e.target.value))
                        }
                        bg="rgba(255, 255, 255, 0.1)"
                        borderColor="rgba(255, 255, 255, 0.15)"
                        _hover={{ borderColor: 'primary.400' }}
                      >
                        <option value="32">Acoustic Bass</option>
                        <option value="33">Electric Bass</option>
                        <option value="34">Electric Bass (pick)</option>
                        <option value="35">Fretless Bass</option>
                        <option value="36">Slap Bass 1</option>
                        <option value="42">Cello</option>
                      </Select>
                    </FormControl>
                  </SimpleGrid>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </Box>

          {/* Export Button */}
          <Button
            onClick={handleExport}
            isDisabled={!data}
            colorScheme="primary"
            size="lg"
            leftIcon={
              <Box as="span" className="icon">
                💾
              </Box>
            }
            alignSelf="flex-start"
            mt={4}
          >
            Export as MIDI
          </Button>

          {/* Export Status */}
          {exportStatus && (
            <Alert
              status={exportStatus.includes('Error') ? 'error' : 'success'}
              variant="solid"
              borderRadius="md"
            >
              <AlertIcon />
              {exportStatus}
            </Alert>
          )}

          {/* Export Info */}
          <Box
            mt={4}
            p={4}
            borderRadius="md"
            bg="rgba(255, 255, 255, 0.08)"
            borderLeft="4px solid"
            borderColor="primary.500"
            boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
          >
            <Text mb={3} fontWeight="medium" textShadow="0 1px 2px rgba(0, 0, 0, 0.3)">
              Export your{' '}
              {type === 'melody'
                ? 'melody'
                : type === 'chord'
                  ? 'chord progression'
                  : 'composition'}{' '}
              as a standard MIDI file that can be imported into any Digital Audio Workstation (DAW)
              like Ableton Live, Logic Pro, FL Studio, etc.
            </Text>
            <Text fontWeight="bold" color="primary.300" textShadow="0 1px 2px rgba(0, 0, 0, 0.3)">
              Pro Tip:{' '}
              <Text as="span" fontWeight="medium" display="inline">
                Customize your export with the options above to create more professional and
                complete MIDI files with multiple tracks and instruments.
              </Text>
            </Text>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );
}

export default MIDIExport;
