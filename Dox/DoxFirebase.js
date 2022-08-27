import {initializeApp} from 'https://www.gstatic.com/firebasejs/9.2.0/firebase-app.js'
import {getDatabase, child, push, ref, update, get, onValue, onChildAdded, onChildChanged, onChildRemoved, set, off} from 'https://www.gstatic.com/firebasejs/9.2.0/firebase-database.js'
import {getAuth, signInWithRedirect, GoogleAuthProvider, onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/9.2.0/firebase-auth.js'

const CONFIG = {
    "apiKey": "AIzaSyAwKRqxNdoO05hLlGZwb5AgWugSBzruw6A",
    "authDomain": "myaccounts-4a6c7.firebaseapp.com",
    "databaseURL": "https://myaccounts-4a6c7-default-rtdb.asia-southeast1.firebasedatabase.app",
    "projectId": "myaccounts-4a6c7",
    "storageBucket": "myaccounts-4a6c7.appspot.com",
    "messagingSenderId": "678570989696",
    "appId": "1:678570989696:web:ca70c09476d4c5f627ee65"
}

const FILES_REF = "doxs/files/";

const App = initializeApp(CONFIG);
const Database = getDatabase(App);
const Auth = getAuth();

let UserUID = null;
let openFileKey = null;
let cancelUpdateListener = null;

onAuthStateChanged(Auth, (userData) => {
  UserUID = null;
  if (userData != null) {
    UserUID = userData.uid;
  }
});

function emptyFile(){
  return {
    users: {
    },
    public: false,
    content: null,
  }
}

function parseFileKey(text) {
  if (typeof text !== "string") {
    text = null;
  } else if (text.length < 1) {
    text = null;
  }
  return text;
}

function getNewFileKey(type = "dox"){
  let fileRef = push(ref(Database, FILES_REF));

  return fileRef.key + "_" + type;
}

async function isPublic(fileKey) {
  let data = await get(ref(Database, FILES_REF + fileKey + "/public"));
  return data.val();
}

async function getAdminStatus(fileKey) {
  let value = null;
  if (UserUID != null) {
    let path = FILES_REF + fileKey + "/users/" + UserUID;
    console.log(path);
    let data = await get(ref(Database, path));
    value = data.val();
  }
  return value;
}

async function exists(fileKey) {
  let res = false;
  try {
    res = await isPublic(fileKey) !== null;
  } catch (e) {
    console.log(e);
  }

  return res;
}

// Owner
async function create(type = "dox") {
  if (UserUID == null) {
    throw "Only users can create new files."
  }

  let fileKey = getNewFileKey("dox");
  if (!(await exists(fileKey))) {
    let file = emptyFile();
    file.users[UserUID] = "owner";

    await set(ref(Database, FILES_REF + fileKey), file);
  } else {
    throw "File already exists.";
  }

  return fileKey
}

async function remove(fileKey) {
  fileKey = parseFileKey(fileKey);

  if (UserUID != null) {
    await set(ref(Database, FILES_REF + fileKey), null);
    if (fileKey == openFileKey) close();
  }
}

// Public
async function open(fileKey, updateCallback) {
  fileKey = parseFileKey(fileKey);

  if (openFileKey != fileKey) {
    if (openFileKey != null) {
      close();
    }

    if (!(await exists(fileKey))) {
      throw "non existant";
    }
    openFileKey = fileKey;

    let adminStatus = await getAdminStatus(fileKey);
    let ispb = await isPublic(fileKey);

    if (ispb == true || (adminStatus != null && adminStatus.match(/^(spectator|contributor|owner)$/))) {
      return new Promise((resolve, reject) => {
        let path = FILES_REF + fileKey + "/content";

        cancelUpdateListener = onValue(ref(Database, path),
        (e) => {
          let data = e.val();
          // console.log("data  ",data);
          if (data == null) {
            data = {};
          } else {
            if (updateCallback instanceof Function) {
              updateCallback(data);
            } else {
              close();
            }
          }
          resolve(true);
        });
      });
    } else {
      if (UserUID != null) {
        await set(ref(Database, FILES_REF + fileKey + "/users/" + UserUID), "inquiry");
      }
      throw "permission denied"
    }
  }
  return true;
}

function close(){
  if (cancelUpdateListener != null) {
    cancelUpdateListener();
    openFileKey = null;
  }
}

// Owner + Contributor
async function save(content, path = "") {
  if (openFileKey != null) {
    let filePath = FILES_REF + openFileKey + "/content" + path;
    console.log("set " + filePath, content);
    // console.log(filePath, content);
    await set(ref(Database, filePath), content);
  }
}

export {create, open, close, remove, save}
