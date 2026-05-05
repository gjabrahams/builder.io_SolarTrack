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
  Query,
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
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Collection names
export const COLLECTIONS = {
  PROFILES: 'profiles',
  DAILY_ENTRIES: 'daily_entries',
  BILLING_CYCLES: 'billing_cycles',
  MUNICIPAL_RATES: 'municipal_rates',
};

// Helper functions for Firestore operations

export async function setDocument(collectionName: string, docId: string, data: any) {
  try {
    await setDoc(doc(db, collectionName, docId), data, { merge: true });
    return true;
  } catch (error) {
    console.error(`Error setting document in ${collectionName}:`, error);
    throw error;
  }
}

export async function getDocuments(collectionName: string) {
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
}

export async function deleteDocument(collectionName: string, docId: string) {
  try {
    await deleteDoc(doc(db, collectionName, docId));
    return true;
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
}

export function subscribeToCollection(
  collectionName: string, 
  callback: (data: any[]) => void
): Unsubscribe {
  try {
    const q = query(collection(db, collectionName));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(data);
    });
  } catch (error) {
    console.error(`Error subscribing to ${collectionName}:`, error);
    throw error;
  }
}

export async function batchWriteDocuments(
  collectionName: string,
  documents: Array<{ id: string; data: any }>
) {
  try {
    const batch = writeBatch(db);
    documents.forEach(({ id, data }) => {
      batch.set(doc(db, collectionName, id), data, { merge: true });
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error(`Error batch writing to ${collectionName}:`, error);
    throw error;
  }
}

export async function deleteAllDocuments(collectionName: string) {
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error(`Error deleting all documents from ${collectionName}:`, error);
    throw error;
  }
}
