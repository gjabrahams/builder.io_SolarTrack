import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot,
  query,
  deleteDoc,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBkpGRtmi2C8ENe8laueLN5UvZ887nMldk",
  authDomain: "solartrack-89d95.firebaseapp.com",
  projectId: "solartrack-89d95",
  storageBucket: "solartrack-89d95.firebasestorage.app",
  messagingSenderId: "888256360885",
  appId: "1:888256360885:web:6525b653e3dd174d6469fc",
  measurementId: "G-J1M8JQ1DYR"
};

// Initialize Firebase
let app;
let db;
let isInitialized = false;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  isInitialized = true;
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Failed to initialize Firebase:", error);
  isInitialized = false;
}

// Collection names
export const COLLECTIONS = {
  PROFILES: 'profiles',
  DAILY_ENTRIES: 'daily_entries',
  BILLING_CYCLES: 'billing_cycles',
  MUNICIPAL_RATES: 'municipal_rates',
};

// Export db instance
export { db, isInitialized };

// Helper functions for Firestore operations

export async function setDocument(collectionPath: string, docId: string, data: any) {
  if (!isInitialized || !db) {
    console.warn("Firebase not initialized");
    return false;
  }
  
  try {
    const parts = collectionPath.split('/');
    if (parts.length === 2) {
      // Nested collection path: "collectionName/parentDocId"
      const [collectionName, parentDocId] = parts;
      await setDoc(doc(db, collectionName, parentDocId, collectionName, docId), data, { merge: true });
    } else {
      // Simple collection path
      await setDoc(doc(db, collectionPath, docId), data, { merge: true });
    }
    return true;
  } catch (error) {
    console.error(`Error setting document in ${collectionPath}:`, error);
    throw error;
  }
}

export async function getDocuments(collectionPath: string) {
  if (!isInitialized || !db) {
    console.warn("Firebase not initialized");
    return [];
  }
  
  try {
    const parts = collectionPath.split('/');
    let collRef;
    
    if (parts.length === 2) {
      // Nested collection path: "collectionName/parentDocId"
      const [collectionName, parentDocId] = parts;
      collRef = collection(db, collectionName, parentDocId, collectionName);
    } else {
      // Simple collection path
      collRef = collection(db, collectionPath);
    }
    
    const snapshot = await getDocs(collRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Error getting documents from ${collectionPath}:`, error);
    return [];
  }
}

export async function deleteDocument(collectionPath: string, docId: string) {
  if (!isInitialized || !db) {
    console.warn("Firebase not initialized");
    return false;
  }
  
  try {
    const parts = collectionPath.split('/');
    if (parts.length === 2) {
      // Nested collection path: "collectionName/parentDocId"
      const [collectionName, parentDocId] = parts;
      await deleteDoc(doc(db, collectionName, parentDocId, collectionName, docId));
    } else {
      // Simple collection path
      await deleteDoc(doc(db, collectionPath, docId));
    }
    return true;
  } catch (error) {
    console.error(`Error deleting document from ${collectionPath}:`, error);
    throw error;
  }
}

export function subscribeToCollection(
  collectionPath: string, 
  callback: (data: any[]) => void
): Unsubscribe | null {
  if (!isInitialized || !db) {
    console.warn("Firebase not initialized");
    return null;
  }
  
  try {
    const parts = collectionPath.split('/');
    let collRef;
    
    if (parts.length === 2) {
      // Nested collection path
      const [collectionName, parentDocId] = parts;
      collRef = collection(db, collectionName, parentDocId, collectionName);
    } else {
      // Simple collection path
      collRef = collection(db, collectionPath);
    }
    
    const q = query(collRef);
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(data);
    });
  } catch (error) {
    console.error(`Error subscribing to ${collectionPath}:`, error);
    return null;
  }
}

export async function batchWriteDocuments(
  collectionPath: string,
  documents: Array<{ id: string; data: any }>
) {
  if (!isInitialized || !db) {
    console.warn("Firebase not initialized");
    return false;
  }
  
  try {
    const batch = writeBatch(db);
    const parts = collectionPath.split('/');
    
    documents.forEach(({ id, data }) => {
      if (parts.length === 2) {
        // Nested collection path
        const [collectionName, parentDocId] = parts;
        batch.set(doc(db, collectionName, parentDocId, collectionName, id), data, { merge: true });
      } else {
        // Simple collection path
        batch.set(doc(db, collectionPath, id), data, { merge: true });
      }
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error(`Error batch writing to ${collectionPath}:`, error);
    throw error;
  }
}

export async function deleteAllDocuments(collectionPath: string) {
  if (!isInitialized || !db) {
    console.warn("Firebase not initialized");
    return false;
  }
  
  try {
    const parts = collectionPath.split('/');
    let collRef;
    
    if (parts.length === 2) {
      const [collectionName, parentDocId] = parts;
      collRef = collection(db, collectionName, parentDocId, collectionName);
    } else {
      collRef = collection(db, collectionPath);
    }
    
    const snapshot = await getDocs(collRef);
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error(`Error deleting all documents from ${collectionPath}:`, error);
    throw error;
  }
}
