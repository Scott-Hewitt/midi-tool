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
  Flex,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { useAuth } from '../../utils/firebase/AuthContext';
import { getUserFavorites, removeFromFavorites } from '../../utils/firebase/favorites';

function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const { currentUser } = useAuth();
  const toast = useToast();

  // Fetch user's favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!currentUser) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userFavorites = await getUserFavorites(currentUser.uid);
        setFavorites(userFavorites);
      } catch (error) {
        console.error('Error fetching favorites:', error);
        toast({
          title: 'Error fetching favorites',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [currentUser, toast]);

  // Handle remove from favorites
  const handleRemoveFromFavorites = async fileId => {
    if (!currentUser) return;

    try {
      await removeFromFavorites(currentUser.uid, fileId);

      // Update the state
      setFavorites(favorites.filter(fav => fav.fileId !== fileId));

      toast({
        title: 'Removed from favorites',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error removing from favorites:', error);
      toast({
        title: 'Error removing from favorites',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Filter and sort favorites
  const filteredFavorites = favorites
    .filter(fav => {
      // Apply type filter
      if (filter !== 'all' && fav.file.type !== filter) {
        return false;
      }

      // Apply search filter
      if (searchTerm && !fav.file.fileName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Apply sorting
      switch (sortBy) {
        case 'newest':
          return new Date(b.favoritedAt?.toDate()) - new Date(a.favoritedAt?.toDate());
        case 'oldest':
          return new Date(a.favoritedAt?.toDate()) - new Date(b.favoritedAt?.toDate());
        case 'name':
          return a.file.fileName.localeCompare(b.file.fileName);
        default:
          return 0;
      }
    });

  if (!currentUser) {
    return (
      <Box textAlign="center" py={10}>
        <Heading size="lg" mb={6} color="primary.400">
          My Favorites
        </Heading>
        <Text>Please sign in to view your favorites.</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Heading size="lg" mb={6} color="primary.400">
        My Favorites
      </Heading>

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
          onChange={e => setFilter(e.target.value)}
          maxW={{ base: 'full', md: '200px' }}
          bg="rgba(255, 255, 255, 0.1)"
          borderColor="rgba(255, 255, 255, 0.15)"
          _hover={{ borderColor: 'primary.400' }}
        >
          <option value="all">All Types</option>
          <option value="melody">Melodies</option>
          <option value="chord">Chord Progressions</option>
          <option value="composition">Compositions</option>
        </Select>

        <Select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          maxW={{ base: 'full', md: '200px' }}
          bg="rgba(255, 255, 255, 0.1)"
          borderColor="rgba(255, 255, 255, 0.15)"
          _hover={{ borderColor: 'primary.400' }}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name">Name</option>
        </Select>

        <InputGroup maxW={{ base: 'full', md: '300px' }}>
          <InputLeftElement pointerEvents="none">🔍</InputLeftElement>
          <Input
            placeholder="Search favorites..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            bg="rgba(255, 255, 255, 0.1)"
            borderColor="rgba(255, 255, 255, 0.15)"
            _hover={{ borderColor: 'primary.400' }}
          />
        </InputGroup>
      </Flex>

      {loading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="xl" color="primary.500" />
        </Flex>
      ) : filteredFavorites.length === 0 ? (
        <Box
          textAlign="center"
          py={10}
          bg="rgba(30, 41, 59, 0.7)"
          backdropFilter="blur(12px)"
          borderRadius="md"
          borderLeft="4px solid"
          borderColor="primary.500"
        >
          <Text fontWeight="medium" color="white" textShadow="0 1px 2px rgba(0, 0, 0, 0.3)">
            No favorites found.
          </Text>
          {filter !== 'all' && (
            <Button mt={4} onClick={() => setFilter('all')} variant="outline" colorScheme="primary">
              Show All Favorites
            </Button>
          )}
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {filteredFavorites.map(favorite => (
            <Card
              key={favorite.id}
              bg="rgba(30, 41, 59, 0.5)"
              backdropFilter="blur(12px)"
              borderRadius="md"
              borderLeft="4px solid"
              borderColor={
                favorite.file.type === 'melody'
                  ? 'blue.400'
                  : favorite.file.type === 'chord'
                    ? 'purple.400'
                    : 'primary.400'
              }
              overflow="hidden"
              transition="transform 0.2s"
              _hover={{ transform: 'translateY(-4px)' }}
            >
              <CardHeader pb={2}>
                <Flex justify="space-between" align="center">
                  <Heading size="md" color="white" noOfLines={1} title={favorite.file.fileName}>
                    {favorite.file.fileName}
                  </Heading>
                  <HStack>
                    <Badge
                      colorScheme={
                        favorite.file.type === 'melody'
                          ? 'blue'
                          : favorite.file.type === 'chord'
                            ? 'purple'
                            : 'primary'
                      }
                    >
                      {favorite.file.type === 'melody'
                        ? 'Melody'
                        : favorite.file.type === 'chord'
                          ? 'Chord'
                          : 'Composition'}
                    </Badge>
                  </HStack>
                </Flex>
              </CardHeader>

              <CardBody py={2}>
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm">
                    <strong>Key:</strong> {favorite.file.key || 'N/A'}
                  </Text>
                  <Text fontSize="sm">
                    <strong>Tempo:</strong> {favorite.file.tempo || 'N/A'} BPM
                  </Text>
                  <Text fontSize="sm">
                    <strong>Created by:</strong>{' '}
                    {favorite.file.userId === currentUser.uid
                      ? 'You'
                      : favorite.file.createdBy || 'Unknown'}
                  </Text>
                  <Text fontSize="sm">
                    <strong>Favorited:</strong>{' '}
                    {favorite.favoritedAt
                      ? new Date(favorite.favoritedAt.toDate()).toLocaleDateString()
                      : 'Unknown'}
                  </Text>
                </VStack>
              </CardBody>

              <CardFooter pt={2}>
                <Flex justify="space-between" w="100%">
                  <Button
                    as="a"
                    href={favorite.file.downloadURL}
                    target="_blank"
                    size="sm"
                    colorScheme="primary"
                    variant="solid"
                  >
                    Download
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => handleRemoveFromFavorites(favorite.fileId)}
                  >
                    Remove
                  </Button>
                </Flex>
              </CardFooter>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}

export default Favorites;
