import { useState } from 'react'
import { 
  Box, 
  Flex, 
  Heading, 
  Text, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel,
  Container,
  VStack
} from '@chakra-ui/react'
import './App.css' // Keep for now, will clean up later
import MelodyGenerator from './components/MelodyGenerator'
import ChordGenerator from './components/ChordGenerator'
import CompositionGenerator from './components/CompositionGenerator'
import Visualization from './components/Visualization'
import MIDIExport from './components/MIDIExport'

function App() {
  const [melodyData, setMelodyData] = useState(null);
  const [chordData, setChordData] = useState(null);
  const [compositionData, setCompositionData] = useState(null);

  // Handle melody generation
  const handleMelodyGenerated = (data) => {
    setMelodyData(data);
  };

  // Handle chord progression generation
  const handleChordGenerated = (data) => {
    setChordData(data);
  };

  // Handle composition generation
  const handleCompositionGenerated = (data) => {
    setCompositionData(data);
  };

  return (
    <Container maxW="container.xl" px={6} py={8} minH="100vh" display="flex" flexDirection="column">

      <Box as="header" textAlign="center" mb={12} pb={6} position="relative" 
        _after={{
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: '25%',
          width: '50%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, primary.300, transparent)'
        }}
      >
        <Heading 
          as="h1" 
          mb={3} 
          fontSize="2.5rem" 
          fontWeight="700" 
          letterSpacing="-0.025em"
          color="primary.400"
          textShadow="0 0 15px rgba(99, 102, 241, 0.5)"
        >
          MIDI Melody & Chord Generator
        </Heading>
        <Text 
          color="gray.300" 
          fontSize="1.1rem" 
          maxW="600px" 
          mx="auto" 
          lineHeight="1.6"
        >
          Generate melodies and chord progressions, visualize them, and export as MIDI files.
        </Text>
      </Box>

      <Tabs 
        variant="enclosed" 
        isFitted 
        mx="auto" 
        mb={10}
        width="fit-content"
        onChange={() => {}}
      >
        <TabList 
          bg="rgba(255, 255, 255, 0.08)" 
          borderRadius="full" 
          p={2}
          boxShadow="md"
          backdropFilter="blur(10px)"
        >
          <Tab 
            borderRadius="full" 
            _selected={{ 
              color: "white", 
              bg: "rgba(255, 255, 255, 0.1)",
              boxShadow: "sm"
            }}
            _hover={{
              color: "white"
            }}
            transition="all 0.3s ease"
            fontWeight="500"
            px={6}
            py={3}
          >
            Melody Generator
          </Tab>
          <Tab 
            borderRadius="full" 
            _selected={{ 
              color: "white", 
              bg: "rgba(255, 255, 255, 0.1)",
              boxShadow: "sm"
            }}
            _hover={{
              color: "white"
            }}
            transition="all 0.3s ease"
            fontWeight="500"
            px={6}
            py={3}
          >
            Chord Generator
          </Tab>
          <Tab 
            borderRadius="full" 
            _selected={{ 
              color: "white", 
              bg: "rgba(255, 255, 255, 0.1)",
              boxShadow: "sm"
            }}
            _hover={{
              color: "white"
            }}
            transition="all 0.3s ease"
            fontWeight="500"
            px={6}
            py={3}
          >
            Composition Studio
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel p={0} mt={6}>
            <VStack spacing={8} align="stretch">
              <Box>
                <MelodyGenerator onMelodyGenerated={handleMelodyGenerated} />
              </Box>

              {melodyData && (
                <>
                  <Box>
                    <Visualization data={melodyData} type="melody" />
                  </Box>

                  <Box>
                    <MIDIExport data={melodyData} type="melody" />
                  </Box>
                </>
              )}
            </VStack>
          </TabPanel>

          <TabPanel p={0} mt={6}>
            <VStack spacing={8} align="stretch">
              <Box>
                <ChordGenerator onChordGenerated={handleChordGenerated} />
              </Box>

              {chordData && (
                <>
                  <Box>
                    <Visualization data={chordData} type="chord" />
                  </Box>

                  <Box>
                    <MIDIExport data={chordData} type="chord" />
                  </Box>
                </>
              )}
            </VStack>
          </TabPanel>

          <TabPanel p={0} mt={6}>
            <VStack spacing={8} align="stretch">
              <Box>
                <CompositionGenerator onCompositionGenerated={handleCompositionGenerated} />
              </Box>

              {compositionData && (
                <>
                  <Box>
                    <Visualization data={compositionData} type="composition" />
                  </Box>

                  <Box>
                    <MIDIExport data={compositionData} type="composition" />
                  </Box>
                </>
              )}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <Box 
        as="footer" 
        mt="auto" 
        textAlign="center" 
        py={4}
        color="gray.300"
      >
        <Text>MIDI Melody & Chord Generator</Text>
      </Box>
    </Container>
  )
}

export default App
