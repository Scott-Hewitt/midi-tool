/**
 * Backend Index
 * 
 * This file exports all controllers and utilities from the backend.
 * It serves as a single entry point for the frontend to access backend functionality.
 */

// Export controllers
export * from './controllers/AuthController';
export * from './controllers/MidiFileController';
export * from './controllers/FavoriteController';

// Export utilities
export * from './utils/midiExport';

// Export services
export { auth, db, storage } from './services/firebase';
