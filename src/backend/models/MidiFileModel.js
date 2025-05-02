import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
  updateDoc,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../services/firebase';

export const saveMidiFile = async (midiData, fileName, metadata, userId, isPublic = false) => {
  try {
    const midiBlob = new Blob([midiData], { type: 'audio/midi' });

    const storageRef = ref(storage, `midiFiles/${userId}/${fileName}.mid`);

    const snapshot = await uploadBytes(storageRef, midiBlob, {
      customMetadata: {
        isPublic: isPublic.toString(),
        type: metadata.type || 'unknown',
      },
    });

    const downloadURL = await getDownloadURL(snapshot.ref);
    const docRef = await addDoc(collection(db, 'midiFiles'), {
      fileName,
      filePath: snapshot.ref.fullPath,
      downloadURL,
      userId,
      isPublic,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...metadata,
    });

    return docRef.id;
  } catch (error) {
    console.error('Error saving MIDI file:', error);
    throw error;
  }
};

export const getMidiFileById = async (fileId, userId = null) => {
  try {
    const fileRef = doc(db, 'midiFiles', fileId);
    const fileDoc = await getDoc(fileRef);

    if (!fileDoc.exists()) {
      return null;
    }

    const fileData = fileDoc.data();

    if (!fileData.isPublic && fileData.userId !== userId) {
      return null;
    }

    return {
      id: fileDoc.id,
      ...fileData,
    };
  } catch (error) {
    console.error('Error getting MIDI file:', error);
    throw error;
  }
};

export const getUserMidiFiles = async (userId, options = {}) => {
  try {
    const { sortBy = 'createdAt', sortDirection = 'desc', fileType = null } = options;

    let q = query(collection(db, 'midiFiles'), where('userId', '==', userId));

    if (fileType) {
      q = query(q, where('type', '==', fileType));
    }
    q = query(q, orderBy(sortBy, sortDirection));

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString(),
    }));
  } catch (error) {
    console.error('Error getting user MIDI files:', error);
    throw error;
  }
};

export const getPublicMidiFiles = async (options = {}) => {
  try {
    const {
      maxResults = 20,
      sortBy = 'createdAt',
      sortDirection = 'desc',
      fileType = null,
    } = options;

    let q = query(collection(db, 'midiFiles'), where('isPublic', '==', true));

    if (fileType) {
      q = query(q, where('type', '==', fileType));
    }
    q = query(q, orderBy(sortBy, sortDirection), limit(maxResults));

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString(),
    }));
  } catch (error) {
    console.error('Error getting public MIDI files:', error);
    throw error;
  }
};

export const updateMidiFile = async (fileId, updates, userId) => {
  try {
    const fileRef = doc(db, 'midiFiles', fileId);
    const fileDoc = await getDoc(fileRef);

    if (!fileDoc.exists()) {
      return false;
    }

    const fileData = fileDoc.data();

    if (fileData.userId !== userId) {
      return false;
    }
    await updateDoc(fileRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error('Error updating MIDI file:', error);
    throw error;
  }
};

export const deleteMidiFile = async (fileId, userId) => {
  try {
    const fileRef = doc(db, 'midiFiles', fileId);
    const fileDoc = await getDoc(fileRef);

    if (!fileDoc.exists()) {
      return false;
    }

    const fileData = fileDoc.data();

    if (fileData.userId !== userId) {
      return false;
    }

    const storageRef = ref(storage, fileData.filePath);
    await deleteObject(storageRef);
    await deleteDoc(fileRef);

    return true;
  } catch (error) {
    console.error('Error deleting MIDI file:', error);
    throw error;
  }
};
