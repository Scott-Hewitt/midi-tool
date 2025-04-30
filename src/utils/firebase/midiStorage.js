import { db, storage } from '../../services/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  where, 
  deleteDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';

/**
 * Save a MIDI file to Firebase Storage and Firestore
 * @param {File} file - The MIDI file to save
 * @param {Object} metadata - Metadata about the MIDI file
 * @param {string} userId - The user's ID
 * @returns {Promise<string>} - A promise that resolves to the new document ID
 */
export const saveMidiFile = async (file, metadata, userId) => {
  try {
    // Create a reference to the file in Firebase Storage
    const storageRef = ref(storage, `users/${userId}/midi/${file.name}`);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Save the file metadata to Firestore
    const midiFilesRef = collection(db, 'midiFiles');
    const docRef = await addDoc(midiFilesRef, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      downloadURL,
      storagePath: snapshot.ref.fullPath,
      userId,
      isPublic: metadata.isPublic || false,
      type: metadata.type || 'unknown',
      key: metadata.key || '',
      tempo: metadata.tempo || 120,
      notes: metadata.notes || [],
      chords: metadata.chords || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error saving MIDI file:', error);
    throw error;
  }
};

/**
 * Get a user's MIDI files
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} - A promise that resolves to an array of MIDI file objects
 */
export const getUserMidiFiles = async (userId) => {
  try {
    const midiFilesRef = collection(db, 'midiFiles');
    const q = query(midiFilesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting user MIDI files:', error);
    throw error;
  }
};

/**
 * Get public MIDI files
 * @returns {Promise<Array>} - A promise that resolves to an array of public MIDI file objects
 */
export const getPublicMidiFiles = async () => {
  try {
    const midiFilesRef = collection(db, 'midiFiles');
    const q = query(midiFilesRef, where('isPublic', '==', true));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting public MIDI files:', error);
    throw error;
  }
};

/**
 * Get a MIDI file by ID
 * @param {string} fileId - The MIDI file ID
 * @returns {Promise<Object>} - A promise that resolves to the MIDI file object
 */
export const getMidiFile = async (fileId) => {
  try {
    const docRef = doc(db, 'midiFiles', fileId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      throw new Error('MIDI file not found');
    }
  } catch (error) {
    console.error('Error getting MIDI file:', error);
    throw error;
  }
};

/**
 * Update a MIDI file
 * @param {string} fileId - The MIDI file ID
 * @param {Object} updates - The updates to apply
 * @param {string} userId - The user's ID (for authorization)
 * @returns {Promise<void>}
 */
export const updateMidiFile = async (fileId, updates, userId) => {
  try {
    // Get the file to check ownership
    const file = await getMidiFile(fileId);
    
    if (file.userId !== userId) {
      throw new Error('You do not have permission to update this file');
    }
    
    // Update the file
    const docRef = doc(db, 'midiFiles', fileId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating MIDI file:', error);
    throw error;
  }
};

/**
 * Delete a MIDI file
 * @param {string} fileId - The MIDI file ID
 * @param {string} userId - The user's ID (for authorization)
 * @returns {Promise<void>}
 */
export const deleteMidiFile = async (fileId, userId) => {
  try {
    // Get the file to check ownership and get the storage path
    const file = await getMidiFile(fileId);
    
    if (file.userId !== userId) {
      throw new Error('You do not have permission to delete this file');
    }
    
    // Delete the file from Storage
    if (file.storagePath) {
      const storageRef = ref(storage, file.storagePath);
      await deleteObject(storageRef);
    }
    
    // Delete the file from Firestore
    const docRef = doc(db, 'midiFiles', fileId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting MIDI file:', error);
    throw error;
  }
};
