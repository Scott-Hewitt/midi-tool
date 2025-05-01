/**
 * Firebase Configuration
 *
 * This file exports the Firebase services initialized in the main Firebase service file.
 * It serves as a bridge to maintain compatibility with existing code.
 */

import { auth, db, storage } from '../services/firebase';

export { auth, db, storage };
