import { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  Flex,
} from '@chakra-ui/react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

function AuthModal({ isOpen, onClose, initialView = 'login' }) {
  const [view, setView] = useState(initialView);

  const toggleView = () => {
    setView(view === 'login' ? 'signup' : 'login');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay backdropFilter="blur(10px)" bg="rgba(0, 0, 0, 0.4)" />
      <ModalContent bg="transparent" boxShadow="none">
        <ModalCloseButton color="white" />
        <ModalBody p={0}>
          <Flex justify="center" align="center">
            {view === 'login' ? (
              <LoginForm onToggleForm={toggleView} />
            ) : (
              <SignupForm onToggleForm={toggleView} />
            )}
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default AuthModal;
