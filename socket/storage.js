const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();


module.exports.registerBeerTap = async function (address) {

  const docRef = db.collection('beerTaps').doc(address);

  const beerTap = {
    address: address,
    date: Date.now(),
  }

  await docRef.get().then((snapshotDoc)=> {
    if (!snapshotDoc.exists)
      docRef.set(beerTap);
    else
      docRef.update(beerTap);
  })
}

module.exports.registerSample = async function (address, sample) {

  const docRef = db.collection("beerTaps").doc(address).collection("samples").doc(Date.now().toString());

  const data = {
    value: sample,
    date: Date.now(),
  }
  await docRef.set(data);

}

module.exports.listBeerTaps = function () {

  const docRef = db.collection('beerTaps');

  return docRef.get()

}
