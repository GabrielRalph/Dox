import {SvgPlus} from "../4.js"
import {initializeApp} from 'https://www.gstatic.com/firebasejs/9.2.0/firebase-app.js'
import {getAuth, signInWithRedirect, GoogleAuthProvider, onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/9.2.0/firebase-auth.js'
import {getDatabase, child, push, ref, update, get, onValue, onChildAdded, onChildChanged, onChildRemoved, set, off} from 'https://www.gstatic.com/firebasejs/9.2.0/firebase-database.js'
// 
// window.onerror = (e) => {
//   alert(e)
// }
let APP = null;
let DB = null;
let AUTH = null;

let fireUser = null;
class FireUser extends SvgPlus {
  _templates = {}
  _users_ref = "";
  _faded = false;
  constructor(el = "div"){
    if (fireUser !== null) throw "Only one fire user per document"
    super(el);
    fireUser = this;


    for (let el of this.children) {
      this._templates[el.getAttribute("name")] = el.innerHTML;
    }

    this.innerHTML = "";
    this.userFrame = this.createChild("div", {
      class: "user-frame",
    });
    this.loader = this.createChild("div", {
      class: "loader",
      content: this._templates.loader,
    })

    let config = this.getAttribute("config");
    config = JSON.parse(config);

    APP = initializeApp(config);
    DB = getDatabase(APP);
    AUTH = getAuth();

    onAuthStateChanged(AUTH, (userData) => {
      if (userData == null) {
        this._onleave(userData);
      } else {
        this._onuser(userData);
      }
    });
  }

  async fade(value, time = 300){
    this._faded = value;
    value = !value;
    let contains = this.contains(this.loader);
    await this.waveTransition((t) => {
      if (value && !contains) {
        this.appendChild(this.loader);
        contains = true;
      }
      this.loader.styles = {"--fade-factor": t}
    }, time, value);
    if (!value && this.contains(this.loader)){
      this.removeChild(this.loader);
    }
  }

  set loaded(value){
    if (this._faded != value) {
      this.fade(value);
    }
  }

  _onuser(user){
    this.user = user;
    this.userFrame.innerHTML = this._templates.user.replace(/{{([^}]*)}}/g, (a, b) => {
      return user[b];
    });
    let signouts = this.querySelectorAll('[signout=""]');
    for (let el of signouts) el.onclick = () => {this.signOut()};
    const event = new Event("user");
    this.dispatchEvent(event);
  }

  _onleave(){
    this.user = null;
    this.userFrame.innerHTML = this._templates["no-user"];
    let signins = this.querySelectorAll('[signin=""]');
    for (let el of signins) el.onclick = () => {this.signIn()};
    const event = new Event("leave");
    this.dispatchEvent(event);
  }

  signIn(){
    const provider = new GoogleAuthProvider();
    signInWithRedirect(AUTH, provider);

  }

  signOut(){
    AUTH.signOut();
  }

  set "users-ref"(value){
    this._users_ref = value;
  }

  get database(){
    return DB;
  }

  get uid(){
    return this.user.uid;
  }

  get userRef(){
    return ref(DB, this._users_ref + this.uid)
  }

  push(value) {
    return push(this.child(value));
  }

  child(value){
    return child(this.userRef, value)
  }

  get(value){
    return get(this.child(value));
  }
  update(value, data){
    return update(this.child(value), data)
  }
  set(value, data){
    console.log(`${value} set ${JSON.stringify(data, null, " ")}`);
    return set(this.child(value), data)
  }
  onChildChanged(value, callback){
    return onChildChanged(this.child(value), callback);
  }
  onChildAdded(value, callback){
    return onChildAdded(this.child(value), callback);
  }
  onChildRemoved(value, callback){
    return onChildRemoved(this.child(value), callback);
  }
  onValue(value, callback){
    return onValue(this.child(value), callback);
  }
  off(value, event_type, callback){
    return off(this.child(value), event_type, callback);
  }
}

SvgPlus.defineHTMLElement(FireUser);

export {DB, child, push, ref, update, get, onChildAdded, onChildChanged, onChildRemoved, set}
