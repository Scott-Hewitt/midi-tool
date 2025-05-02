
import {
  Box,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  FormControl,
  FormLabel,
  Select,
  Checkbox,
  VStack,
  Spinner,
  Flex,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { getAvailableInstruments } from '../utils/soundfontUtils';

function InstrumentSelector({
  type,
  useSoundFont,
  setUseSoundFont,
  melodyInstrument,
  chordInstrument,
  bassInstrument,
  onInstrumentChange,
  isLoading,
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const availableInstruments = getAvailableInstruments();

  return (
    <>
      <Button
        size="md"
        variant="outline"
        colorScheme="primary"
        leftIcon={
          <span role="img" aria-label="Instrument">
            🎹
          </span>
        }
        onClick={onOpen}
      >
        Instruments
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent
          bg="rgba(30, 41, 59, 0.95)"
          borderColor="rgba(255, 255, 255, 0.1)"
          boxShadow="0 4px 12px rgba(0, 0, 0, 0.5)"
        >
          <ModalHeader borderColor="rgba(255, 255, 255, 0.1)" fontWeight="bold" color="primary.300">
            Sound Options
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="use-soundfont" mb="0" color="white">
                  Use Realistic Sounds
                </FormLabel>
                <Checkbox
                  id="use-soundfont"
                  isChecked={useSoundFont}
                  onChange={e => setUseSoundFont(e.target.checked)}
                  colorScheme="primary"
                />
              </FormControl>

              {useSoundFont && (
                <>
                  {type === 'melody' && (
                    <FormControl>
                      <FormLabel color="white">Melody Instrument</FormLabel>
                      <Flex align="center">
                        <Select
                          value={melodyInstrument}
                          onChange={e => onInstrumentChange('melody', e.target.value)}
                          isDisabled={isLoading}
                          bg="rgba(255, 255, 255, 0.1)"
                          borderColor="rgba(255, 255, 255, 0.15)"
                          _hover={{ borderColor: 'primary.400' }}
                          color="white"
                          mr={2}
                        >
                          {Object.entries(availableInstruments).map(([value, name]) => (
                            <option key={value} value={value}>
                              {name}
                            </option>
                          ))}
                        </Select>
                        {isLoading && <Spinner size="sm" color="primary.400" />}
                      </Flex>
                    </FormControl>
                  )}

                  {type === 'chord' && (
                    <FormControl>
                      <FormLabel color="white">Chord Instrument</FormLabel>
                      <Flex align="center">
                        <Select
                          value={chordInstrument}
                          onChange={e => onInstrumentChange('chord', e.target.value)}
                          isDisabled={isLoading}
                          bg="rgba(255, 255, 255, 0.1)"
                          borderColor="rgba(255, 255, 255, 0.15)"
                          _hover={{ borderColor: 'primary.400' }}
                          color="white"
                          mr={2}
                        >
                          {Object.entries(availableInstruments).map(([value, name]) => (
                            <option key={value} value={value}>
                              {name}
                            </option>
                          ))}
                        </Select>
                        {isLoading && <Spinner size="sm" color="primary.400" />}
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
                            onChange={e => onInstrumentChange('melody', e.target.value)}
                            isDisabled={isLoading}
                            bg="rgba(255, 255, 255, 0.1)"
                            borderColor="rgba(255, 255, 255, 0.15)"
                            _hover={{ borderColor: 'primary.400' }}
                            color="white"
                            mr={2}
                          >
                            {Object.entries(availableInstruments).map(([value, name]) => (
                              <option key={value} value={value}>
                                {name}
                              </option>
                            ))}
                          </Select>
                          {isLoading && <Spinner size="sm" color="primary.400" />}
                        </Flex>
                      </FormControl>

                      <FormControl>
                        <FormLabel color="white">Chord Instrument</FormLabel>
                        <Flex align="center">
                          <Select
                            value={chordInstrument}
                            onChange={e => onInstrumentChange('chord', e.target.value)}
                            isDisabled={isLoading}
                            bg="rgba(255, 255, 255, 0.1)"
                            borderColor="rgba(255, 255, 255, 0.15)"
                            _hover={{ borderColor: 'primary.400' }}
                            color="white"
                            mr={2}
                          >
                            {Object.entries(availableInstruments).map(([value, name]) => (
                              <option key={value} value={value}>
                                {name}
                              </option>
                            ))}
                          </Select>
                          {isLoading && <Spinner size="sm" color="primary.400" />}
                        </Flex>
                      </FormControl>

                      <FormControl>
                        <FormLabel color="white">Bass Instrument</FormLabel>
                        <Flex align="center">
                          <Select
                            value={bassInstrument}
                            onChange={e => onInstrumentChange('bass', e.target.value)}
                            isDisabled={isLoading}
                            bg="rgba(255, 255, 255, 0.1)"
                            borderColor="rgba(255, 255, 255, 0.15)"
                            _hover={{ borderColor: 'primary.400' }}
                            color="white"
                            mr={2}
                          >
                            {Object.entries(availableInstruments).map(([value, name]) => (
                              <option key={value} value={value}>
                                {name}
                              </option>
                            ))}
                          </Select>
                          {isLoading && <Spinner size="sm" color="primary.400" />}
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
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="primary" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default InstrumentSelector;
