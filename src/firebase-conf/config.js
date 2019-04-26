import * as firebase from 'firebase';

// Initialize Firebase
var config = {
  apiKey: "AIzaSyC4oED2Lh6_oKitdtKWCkBY3M7RIXdzM9g",
  authDomain: "book-here-7e554.firebaseapp.com",
  databaseURL: "https://book-here-7e554.firebaseio.com",
  projectId: "book-here-7e554",
  storageBucket: "book-here-7e554.appspot.com",
  messagingSenderId: "127358307657"
};

firebase.initializeApp(config);
const storage = firebase.storage();
export { storage, firebase as default };