import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  HStack,
  VStack,
  Badge,
  Spinner,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Flex,
  Select,
  Input,
  InputGroup,
  InputLeftElement
} from '@chakra-ui/react';
import { useAuth } from '../../utils/firebase/AuthContext';
import { getUserMidiFiles, deleteMidiFile, updateMidiFile } from '../../firebase/midiStorage';
import { isFileFavorited, addToFavorites, removeFromFavorites } from '../../firebase/favorites';

function MyCompositions() {
  const [compositions, setCompositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const { currentUser } = useAuth();
  const toast = useToast();

  // Fetch user's compositions
  useEffect(() => {
    const fetchCompositions = async () => {
      if (!currentUser) {
        setCompositions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const files = await getUserMidiFiles(currentUser.uid);

        // Check favorite status for each file
        const filesWithFavoriteStatus = await Promise.all(
          files.map(async (file) => {
            const isFavorited = await isFileFavorited(currentUser.uid, file.id);
            return { ...file, isFavorited };
          })
        );

        setCompositions(filesWithFavoriteStatus);
      } catch (error) {
        console.error('Error fetching compositions:', error);
        toast({
          title: 'Error fetching compositions',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCompositions();
  }, [currentUser, toast]);

  // Handle delete composition
  const handleDelete = async (fileId) => {
    if (!currentUser) return;

    try {
      await deleteMidiFile(fileId, currentUser.uid);

      // Update the state
      setCompositions(compositions.filter(comp => comp.id !== fileId));

      toast({
        title: 'Composition deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting composition:', error);
      toast({
        title: 'Error deleting composition',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle toggle public/private
  const handleTogglePublic = async (fileId, isCurrentlyPublic) => {
    if (!currentUser) return;

    try {
      await updateMidiFile(fileId, { isPublic: !isCurrentlyPublic }, currentUser.uid);

      // Update the state
      setCompositions(compositions.map(comp =>
        comp.id === fileId
          ? { ...comp, isPublic: !isCurrentlyPublic }
          : comp
      ));

      toast({
        title: `Composition is now ${!isCurrentlyPublic ? 'public' : 'private'}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating composition:', error);
      toast({
        title: 'Error updating composition',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle toggle favorite
  const handleToggleFavorite = async (fileId, isCurrentlyFavorited) => {
    if (!currentUser) return;

    try {
      if (isCurrentlyFavorited) {
        await removeFromFavorites(currentUser.uid, fileId);
      } else {
        await addToFavorites(currentUser.uid, fileId);
      }

      // Update the state
      setCompositions(compositions.map(comp =>
        comp.id === fileId
          ? { ...comp, isFavorited: !isCurrentlyFavorited }
          : comp
      ));
    } catch (error) {
      console.error('Error updating favorite status:', error);
      toast({
        title: 'Error updating favorite status',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Filter and sort compositions
  const filteredCompositions = compositions
    .filter(comp => {
      // Apply type filter
      if (filter !== 'all' && comp.type !== filter) {
        return false;
      }

      // Apply search filter
      if (searchTerm && !comp.fileName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Apply sorting
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'name':
          return a.fileName.localeCompare(b.fileName);
        default:
          return 0;
      }
    });

  if (!currentUser) {
    return (
      <Box textAlign="center" py={10}>
        <Heading size="lg" mb={6} color="primary.400">My Compositions</Heading>
        <Text>Please sign in to view your compositions.</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Heading size="lg" mb={6} color="primary.400">My Compositions</Heading>

      {/* Filters and Search */}
      <Flex
        direction={{ base: 'column', md: 'row' }}
        gap={4}
        mb={6}
        p={4}
        bg="rgba(30, 41, 59, 0.5)"
        backdropFilter="blur(12px)"
        borderRadius="md"
      >
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          maxW={{ base: 'full', md: '200px' }}
          bg="rgba(255, 255, 255, 0.1)"
          borderColor="rgba(255, 255, 255, 0.15)"
          _hover={{ borderColor: "primary.400" }}
        >
          <option value="all">All Types</option>
          <option value="melody">Melodies</option>
          <option value="chord">Chord Progressions</option>
          <option value="composition">Compositions</option>
        </Select>

        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          maxW={{ base: 'full', md: '200px' }}
          bg="rgba(255, 255, 255, 0.1)"
          borderColor="rgba(255, 255, 255, 0.15)"
          _hover={{ borderColor: "primary.400" }}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name">Name</option>
        </Select>

        <InputGroup maxW={{ base: 'full', md: '300px' }}>
          <InputLeftElement pointerEvents="none">
            🔍
          </InputLeftElement>
          <Input
            placeholder="Search compositions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            bg="rgba(255, 255, 255, 0.1)"
            borderColor="rgba(255, 255, 255, 0.15)"
            _hover={{ borderColor: "primary.400" }}
          />
        </InputGroup>
      </Flex>

      {loading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="xl" color="primary.500" />
        </Flex>
      ) : filteredCompositions.length === 0 ? (
        <Box textAlign="center" py={10} bg="rgba(30, 41, 59, 0.5)" backdropFilter="blur(12px)" borderRadius="md">
          <Text>No compositions found.</Text>
          {filter !== 'all' && (
            <Button mt={4} onClick={() => setFilter('all')} variant="outline" colorScheme="primary">
              Show All Compositions
            </Button>
          )}
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {filteredCompositions.map((composition) => (
            <Card
              key={composition.id}
              bg="rgba(30, 41, 59, 0.5)"
              backdropFilter="blur(12px)"
              borderRadius="md"
              borderLeft="4px solid"
              borderColor={
                composition.type === 'melody'
                  ? 'blue.400'
                  : composition.type === 'chord'
                    ? 'purple.400'
                    : 'primary.400'
              }
              overflow="hidden"
              transition="transform 0.2s"
              _hover={{ transform: 'translateY(-4px)' }}
            >
              <CardHeader pb={2}>
                <Flex justify="space-between" align="center">
                  <Heading size="md" color="white" noOfLines={1} title={composition.fileName}>
                    {composition.fileName}
                  </Heading>
                  <HStack>
                    <Badge
                      colorScheme={composition.isPublic ? 'green' : 'gray'}
                      variant="subtle"
                    >
                      {composition.isPublic ? 'Public' : 'Private'}
                    </Badge>
                    <Badge
                      colorScheme={
                        composition.type === 'melody'
                          ? 'blue'
                          : composition.type === 'chord'
                            ? 'purple'
                            : 'primary'
                      }
                    >
                      {composition.type === 'melody'
                        ? 'Melody'
                        : composition.type === 'chord'
                          ? 'Chord'
                          : 'Composition'
                      }
                    </Badge>
                  </HStack>
                </Flex>
              </CardHeader>

              <CardBody py={2}>
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm">
                    <strong>Key:</strong> {composition.key || 'N/A'}
                  </Text>
                  <Text fontSize="sm">
                    <strong>Tempo:</strong> {composition.tempo || 'N/A'} BPM
                  </Text>
                  <Text fontSize="sm">
                    <strong>Created:</strong> {new Date(composition.createdAt?.toDate()).toLocaleDateString()}
                  </Text>
                </VStack>
              </CardBody>

              <CardFooter pt={2}>
                <Flex justify="space-between" w="100%">
                  <Button
                    as="a"
                    href={composition.downloadURL}
                    target="_blank"
                    size="sm"
                    colorScheme="primary"
                    variant="solid"
                  >
                    Download
                  </Button>

                  <HStack>
                    <Button
                      size="sm"
                      variant="ghost"
                      colorScheme={composition.isFavorited ? 'yellow' : 'gray'}
                      onClick={() => handleToggleFavorite(composition.id, composition.isFavorited)}
                    >
                      {composition.isFavorited ? '⭐' : '☆'}
                    </Button>

                    <Menu>
                      <MenuButton
                        as={Button}
                        size="sm"
                        variant="ghost"
                      >
                        •••
                      </MenuButton>
                      <MenuList
                        bg="rgba(30, 41, 59, 0.9)"
                        backdropFilter="blur(12px)"
                        borderColor="rgba(255, 255, 255, 0.1)"
                      >
                        <MenuItem
                          _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                          onClick={() => handleTogglePublic(composition.id, composition.isPublic)}
                        >
                          Make {composition.isPublic ? 'Private' : 'Public'}
                        </MenuItem>
                        <MenuItem
                          _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                          color="red.400"
                          onClick={() => handleDelete(composition.id)}
                        >
                          Delete
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </HStack>
                </Flex>
              </CardFooter>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}

export default MyCompositions;
