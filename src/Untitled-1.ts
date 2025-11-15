import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

const getCarData = async () => {
  const querySnapshot = await getDocs(collection(db, 'cars'));
  querySnapshot.forEach((doc) => {
    console.log(doc.id, doc.data());
  });
};