// scripts/makeAdmin.js
const admin = require('firebase-admin');

// Download your service account key from Firebase Console > Project Settings > Service Accounts > Generate new private key
const serviceAccount = require('../paperless-events-firebase-adminsdk-fbsvc-a7b6d0c19a.json'); // Put the JSON file here

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const uid = '2tMYrTv9WHdMbcJCmZ0EuRR83ID3'; // Find your UID in Firebase Console > Authentication > Users

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log('You are now admin! Sign out and sign back in.');
  })
  .catch(error => {
    console.error('Error:', error);
  });