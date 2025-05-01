import { useState, useEffect } from 'react';
import { useAuth } from '../hooks';
import { exportAndDownloadMIDI, exportAndSaveMIDI } from '../utils';
import { checkFavoriteStatus, toggleFavorite } from '../../backend';
import {
  Box,
  Heading,
  Text,
  Input,
  Select,
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
  Divider,
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionIcon,
  Tooltip,
  Switch,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useToast,
} from '@chakra-ui/react';
import { AccordionButton } from '@chakra-ui/react';

function MIDIExportWithSave({ data, type }) {
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
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedFileId, setSavedFileId] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { currentUser } = useAuth();
  const toast = useToast();

  // Handle option changes
  const handleOptionChange = (option, value) => {
    setExportOptions({
      ...exportOptions,
      [option]: value,
    });
  };

  // Check if the file is favorited when the component loads
  useEffect(() => {
    const checkFavoriteStatusAsync = async () => {
      if (currentUser && savedFileId) {
        try {
          const favorited = await checkFavoriteStatus(currentUser.uid, savedFileId);
          setIsFavorited(favorited);
        } catch (error) {
          console.error('Error checking favorite status:', error);
        }
      }
    };

    checkFavoriteStatusAsync();
  }, [currentUser, savedFileId]);

  // Export MIDI file
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
        setExportStatus('MIDI file exported successfully!');
      } else {
        setExportStatus('Failed to export MIDI file');
      }
    } catch (error) {
      console.error('Error exporting MIDI:', error);
      setExportStatus('Error exporting MIDI file');
    }
  };

  // Save MIDI file to Firebase
  const handleSave = async () => {
    if (!currentUser) {
      onOpen(); // Open login modal
      return;
    }

    // Determine which data to use
    let melodyData = null;
    let chordData = null;

    if (type === 'melody') {
      melodyData = data;
    } else if (type === 'chord') {
      chordData = data;
    } else if (type === 'composition') {
      melodyData = data.melody;
      chordData = data.chord;
    }

    if (!melodyData && !chordData) {
      toast({
        title: 'No data to save',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsSaving(true);

      // Set export options based on data type
      const options = {
        ...exportOptions,
        includeMelody: (type === 'melody' || type === 'composition') && exportOptions.includeMelody,
        includeChords: (type === 'chord' || type === 'composition') && exportOptions.includeChords,
        includeBass: type === 'composition' && exportOptions.includeBass,
      };

      // Save to Firebase
      const fileId = await exportAndSaveMIDI(
        melodyData,
        chordData,
        `${fileName}-${type}`,
        options,
        currentUser.uid,
        isPublic
      );

      if (fileId) {
        setSavedFileId(fileId);

        toast({
          title: 'MIDI file saved successfully!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('Failed to save MIDI file');
      }
    } catch (error) {
      console.error('Error saving MIDI file:', error);
      toast({
        title: 'Error saving MIDI file',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle favorite status
  const handleToggleFavorite = async () => {
    if (!currentUser) {
      onOpen(); // Open login modal
      return;
    }

    if (!savedFileId) {
      toast({
        title: 'Save the file first',
        description: 'You need to save the file before you can favorite it',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const newStatus = await toggleFavorite(currentUser.uid, savedFileId, isFavorited);
      setIsFavorited(newStatus);

      toast({
        title: newStatus ? 'Added to favorites' : 'Removed from favorites',
        status: newStatus ? 'success' : 'info',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: 'Error updating favorites',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
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

          {/* Basic Export Options */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="include-melody" mb="0">
                Include Melody
              </FormLabel>
              <Switch
                id="include-melody"
                isChecked={exportOptions.includeMelody}
                onChange={e => handleOptionChange('includeMelody', e.target.checked)}
                colorScheme="primary"
                isDisabled={type === 'chord'}
              />
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="include-chords" mb="0">
                Include Chords
              </FormLabel>
              <Switch
                id="include-chords"
                isChecked={exportOptions.includeChords}
                onChange={e => handleOptionChange('includeChords', e.target.checked)}
                colorScheme="primary"
                isDisabled={type === 'melody'}
              />
            </FormControl>

            {type === 'composition' && (
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="include-bass" mb="0">
                  Include Bass
                </FormLabel>
                <Switch
                  id="include-bass"
                  isChecked={exportOptions.includeBass}
                  onChange={e => handleOptionChange('includeBass', e.target.checked)}
                  colorScheme="primary"
                />
              </FormControl>
            )}
          </SimpleGrid>

          {/* Advanced Export Options */}
          <Accordion allowToggle>
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
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {exportOptions.includeMelody && (
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
                        <option value="24">Acoustic Guitar</option>
                        <option value="73">Flute</option>
                        <option value="66">Saxophone</option>
                        <option value="19">Church Organ</option>
                        <option value="4">Electric Piano</option>
                      </Select>
                    </FormControl>
                  )}

                  {exportOptions.includeChords && (
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
                        <option value="25">Electric Guitar</option>
                        <option value="48">String Ensemble</option>
                        <option value="19">Church Organ</option>
                      </Select>
                    </FormControl>
                  )}

                  {exportOptions.includeBass && (
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
                        <option value="42">Cello</option>
                        <option value="43">Contrabass</option>
                      </Select>
                    </FormControl>
                  )}

                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="apply-expression" mb="0">
                      Apply Expression
                    </FormLabel>
                    <Switch
                      id="apply-expression"
                      isChecked={exportOptions.applyExpression}
                      onChange={e => handleOptionChange('applyExpression', e.target.checked)}
                      colorScheme="primary"
                    />
                  </FormControl>

                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="humanize" mb="0">
                      Humanize
                    </FormLabel>
                    <Switch
                      id="humanize"
                      isChecked={exportOptions.humanize}
                      onChange={e => handleOptionChange('humanize', e.target.checked)}
                      colorScheme="primary"
                    />
                  </FormControl>
                </SimpleGrid>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>

          {/* Save Options (only shown when user is logged in) */}
          {currentUser && (
            <Box>
              <Divider my={4} />
              <Heading size="sm" mb={4}>
                Save Options
              </Heading>
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="is-public" mb="0">
                  Make Public
                </FormLabel>
                <Tooltip label="Public MIDI files can be viewed and downloaded by other users">
                  <Switch
                    id="is-public"
                    isChecked={isPublic}
                    onChange={e => setIsPublic(e.target.checked)}
                    colorScheme="primary"
                  />
                </Tooltip>
              </FormControl>
            </Box>
          )}

          {/* Status Message */}
          {exportStatus && (
            <Alert
              status={exportStatus.includes('success') ? 'success' : 'error'}
              borderRadius="md"
            >
              <AlertIcon />
              {exportStatus}
            </Alert>
          )}

          {/* Action Buttons */}
          <HStack spacing={4} mt={2}>
            <Button
              onClick={handleExport}
              colorScheme="primary"
              leftIcon={
                <Box as="span" className="icon">
                  💾
                </Box>
              }
            >
              Download MIDI
            </Button>

            {currentUser ? (
              <>
                <Button
                  onClick={handleSave}
                  variant="outline"
                  colorScheme="primary"
                  leftIcon={
                    <Box as="span" className="icon">
                      ☁️
                    </Box>
                  }
                  isLoading={isSaving}
                  loadingText="Saving..."
                >
                  Save to Account
                </Button>

                {savedFileId && (
                  <Button
                    onClick={handleToggleFavorite}
                    variant="ghost"
                    colorScheme={isFavorited ? 'yellow' : 'gray'}
                    leftIcon={
                      <Box as="span" className="icon">
                        {isFavorited ? '⭐' : '☆'}
                      </Box>
                    }
                  >
                    {isFavorited ? 'Favorited' : 'Favorite'}
                  </Button>
                )}
              </>
            ) : (
              <Button
                onClick={onOpen}
                variant="outline"
                colorScheme="primary"
                leftIcon={
                  <Box as="span" className="icon">
                    👤
                  </Box>
                }
              >
                Sign In to Save
              </Button>
            )}
          </HStack>

          {/* Export Info */}
          <Box
            mt={4}
            p={4}
            borderRadius="md"
            bg="rgba(255, 255, 255, 0.05)"
            borderLeft="4px solid"
            borderColor="primary.500"
          >
            <Text mb={3}>
              Export your{' '}
              {type === 'melody'
                ? 'melody'
                : type === 'chord'
                  ? 'chord progression'
                  : 'composition'}{' '}
              as a standard MIDI file that can be imported into any Digital Audio Workstation (DAW)
              like Ableton Live, Logic Pro, FL Studio, etc.
            </Text>
            <Text fontWeight="bold" color="primary.300">
              Pro Tip:{' '}
              <Text as="span" fontWeight="normal">
                Sign in to save your compositions to your account and access them later.
              </Text>
            </Text>
          </Box>
        </VStack>
      </CardBody>

      {/* Login Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent bg="rgba(30, 41, 59, 0.9)" backdropFilter="blur(12px)">
          <ModalHeader color="primary.400">Sign In Required</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              You need to be signed in to save compositions to your account or add them to
              favorites.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="primary" mr={3} onClick={onClose}>
              Close
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                onClose();
                // Redirect to login page or open login modal
                // This would depend on your app's routing/navigation
              }}
            >
              Sign In
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
}

export default MIDIExportWithSave;
