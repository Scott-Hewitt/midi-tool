import { useState } from 'react';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Button,
  Avatar,
  Text,
  HStack,
  useDisclosure,
  Box,
  Icon
} from '@chakra-ui/react';
import { useAuth } from '../../utils/firebase/AuthContext';
import AuthModal from './AuthModal';

function UserMenu() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [authView, setAuthView] = useState('login');
  const { currentUser, userProfile, logout } = useAuth();

  const handleLogin = () => {
    setAuthView('login');
    onOpen();
  };

  const handleSignup = () => {
    setAuthView('signup');
    onOpen();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <>
      {currentUser ? (
        <Menu>
          <MenuButton
            as={Button}
            rounded="full"
            variant="link"
            cursor="pointer"
            minW={0}
          >
            <Avatar
              size="sm"
              name={userProfile?.displayName || currentUser.displayName}
              src={currentUser.photoURL}
              bg="primary.500"
            />
          </MenuButton>
          <MenuList
            bg="rgba(30, 41, 59, 0.9)"
            backdropFilter="blur(12px)"
            borderColor="rgba(255, 255, 255, 0.1)"
            boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.37)"
          >
            <Box px={3} py={2}>
              <Text fontWeight="bold">
                {userProfile?.displayName || currentUser.displayName}
              </Text>
              <Text fontSize="sm" color="gray.300">
                {currentUser.email}
              </Text>
            </Box>
            <MenuDivider />
            <MenuItem
              _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
              as="a"
              href="/my-compositions"
            >
              My Compositions
            </MenuItem>
            <MenuItem
              _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
              as="a"
              href="/favorites"
            >
              Favorites
            </MenuItem>
            <MenuItem
              _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
              as="a"
              href="/profile"
            >
              Profile Settings
            </MenuItem>
            <MenuDivider />
            <MenuItem
              _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
              onClick={handleLogout}
            >
              Sign Out
            </MenuItem>
          </MenuList>
        </Menu>
      ) : (
        <HStack spacing={4}>
          <Button
            variant="ghost"
            colorScheme="primary"
            onClick={handleLogin}
            size="sm"
          >
            Log In
          </Button>
          <Button
            colorScheme="primary"
            onClick={handleSignup}
            size="sm"
          >
            Sign Up
          </Button>
        </HStack>
      )}

      <AuthModal
        isOpen={isOpen}
        onClose={onClose}
        initialView={authView}
      />
    </>
  );
}

export default UserMenu;
