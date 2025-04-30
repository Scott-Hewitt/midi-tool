import { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Checkbox,
  FormControl,
  FormLabel,
  useToast,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner
} from '@chakra-ui/react';
import { useAuth } from '../../utils/firebase/AuthContext';
import { exportAllMidiFiles, exportUserData } from '../../utils/backupExport';
import { handleApiError } from '../../utils/errorHandling';
import { trackDataExport } from '../../services/analytics';

function BackupExport() {
  const [exportOptions, setExportOptions] = useState({
    includeProfile: true,
    includeMidiFiles: true,
    includeFavorites: true,
    includeMetadata: true
  });
  const [loading, setLoading] = useState({
    midiExport: false,
    dataExport: false
  });
  const [result, setResult] = useState(null);

  const { currentUser } = useAuth();
  const toast = useToast();

  // Handle option change
  const handleOptionChange = (option) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  // Handle MIDI files export
  const handleExportMidiFiles = async () => {
    if (!currentUser) {
      toast({
        title: 'Authentication required',
        description: 'You need to be logged in to export your MIDI files.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(prev => ({ ...prev, midiExport: true }));
      setResult(null);

      const exportResult = await exportAllMidiFiles(currentUser.uid, {
        includeMetadata: exportOptions.includeMetadata
      });

      setResult({
        type: 'success',
        message: exportResult.message
      });

      // Track the export event
      trackDataExport('all_midi', exportResult.fileCount || 0);

      toast({
        title: 'Export successful',
        description: exportResult.message,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      handleApiError(error, toast, 'exporting MIDI files');
      setResult({
        type: 'error',
        message: error.message
      });
    } finally {
      setLoading(prev => ({ ...prev, midiExport: false }));
    }
  };

  // Handle user data export
  const handleExportUserData = async () => {
    if (!currentUser) {
      toast({
        title: 'Authentication required',
        description: 'You need to be logged in to export your data.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(prev => ({ ...prev, dataExport: true }));
      setResult(null);

      const exportResult = await exportUserData(currentUser.uid, {
        includeProfile: exportOptions.includeProfile,
        includeMidiFiles: exportOptions.includeMidiFiles,
        includeFavorites: exportOptions.includeFavorites
      });

      setResult({
        type: 'success',
        message: exportResult.message
      });

      // Track the export event
      trackDataExport('user_data', 1);

      toast({
        title: 'Export successful',
        description: exportResult.message,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      handleApiError(error, toast, 'exporting user data');
      setResult({
        type: 'error',
        message: error.message
      });
    } finally {
      setLoading(prev => ({ ...prev, dataExport: false }));
    }
  };

  if (!currentUser) {
    return (
      <Box textAlign="center" py={10}>
        <Heading size="lg" mb={6} color="primary.400">Backup & Export</Heading>
        <Text>Please sign in to access backup and export features.</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Heading size="lg" mb={6} color="primary.400">Backup & Export</Heading>

      <VStack spacing={6} align="stretch">
        {/* MIDI Files Export */}
        <Card bg="rgba(30, 41, 59, 0.5)" backdropFilter="blur(12px)" borderRadius="md">
          <CardHeader>
            <Heading size="md" color="primary.300">Export MIDI Files</Heading>
          </CardHeader>
          <CardBody>
            <Text mb={4}>
              Export all your MIDI files as a zip archive. This includes melodies, chord progressions, and compositions.
            </Text>
            <FormControl display="flex" alignItems="center" mb={4}>
              <FormLabel htmlFor="include-metadata" mb="0">
                Include metadata (JSON files)
              </FormLabel>
              <Checkbox
                id="include-metadata"
                isChecked={exportOptions.includeMetadata}
                onChange={() => handleOptionChange('includeMetadata')}
                colorScheme="primary"
              />
            </FormControl>
          </CardBody>
          <CardFooter>
            <Button
              colorScheme="primary"
              onClick={handleExportMidiFiles}
              isLoading={loading.midiExport}
              loadingText="Exporting..."
              leftIcon={<Box as="span" className="icon">📦</Box>}
            >
              Export MIDI Files
            </Button>
          </CardFooter>
        </Card>

        {/* User Data Export */}
        <Card bg="rgba(30, 41, 59, 0.5)" backdropFilter="blur(12px)" borderRadius="md">
          <CardHeader>
            <Heading size="md" color="primary.300">Export User Data</Heading>
          </CardHeader>
          <CardBody>
            <Text mb={4}>
              Export your user data as a JSON file. This includes your profile information, MIDI file metadata, and favorites.
            </Text>
            <VStack align="start" spacing={2} mb={4}>
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="include-profile" mb="0">
                  Include profile information
                </FormLabel>
                <Checkbox
                  id="include-profile"
                  isChecked={exportOptions.includeProfile}
                  onChange={() => handleOptionChange('includeProfile')}
                  colorScheme="primary"
                />
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="include-midi-files" mb="0">
                  Include MIDI file metadata
                </FormLabel>
                <Checkbox
                  id="include-midi-files"
                  isChecked={exportOptions.includeMidiFiles}
                  onChange={() => handleOptionChange('includeMidiFiles')}
                  colorScheme="primary"
                />
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="include-favorites" mb="0">
                  Include favorites
                </FormLabel>
                <Checkbox
                  id="include-favorites"
                  isChecked={exportOptions.includeFavorites}
                  onChange={() => handleOptionChange('includeFavorites')}
                  colorScheme="primary"
                />
              </FormControl>
            </VStack>
          </CardBody>
          <CardFooter>
            <Button
              colorScheme="primary"
              onClick={handleExportUserData}
              isLoading={loading.dataExport}
              loadingText="Exporting..."
              leftIcon={<Box as="span" className="icon">💾</Box>}
            >
              Export User Data
            </Button>
          </CardFooter>
        </Card>

        {/* Result */}
        {result && (
          <Alert
            status={result.type === 'success' ? 'success' : 'error'}
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            borderRadius="md"
            p={4}
          >
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              {result.type === 'success' ? 'Export Successful' : 'Export Failed'}
            </AlertTitle>
            <AlertDescription maxWidth="sm">
              {result.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Information */}
        <Box
          p={4}
          borderRadius="md"
          bg="rgba(255, 255, 255, 0.05)"
          borderLeft="4px solid"
          borderColor="primary.500"
        >
          <Heading size="sm" mb={2} color="primary.300">About Backups</Heading>
          <Text mb={2}>
            Backups allow you to save your MIDI files and user data locally on your device.
            You can use these backups to restore your data if needed or transfer it to another account.
          </Text>
          <Text>
            <strong>Note:</strong> Exported data does not include your account credentials.
            Your Firebase authentication information is managed separately.
          </Text>
        </Box>
      </VStack>
    </Box>
  );
}

export default BackupExport;
