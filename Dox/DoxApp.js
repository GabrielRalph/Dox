import {SvgPlus} from "../SvgPlus/4.js";
import {Files, Path} from "../FileTree/file-tree.js";
import {fireUser} from "../FireUser/fire-user.js";
import {DoxEditor} from "./DoxEditor.js"
import {save, open, close, remove, create, addUserListener, signout} from "./DoxFirebase.js"

const FILEROOT = "files/";


// class DoxFiles extends FireFiles {
// }

class DoxApp extends SvgPlus {
  constructor(el){
    super(el);
    this.user = "awaiting";

    window.onpopstate = () => {
      if (this.user != "awaiting") {
        this.updateLocation();
      }
    }

    addUserListener((user) => {
      console.log(`%c${user == null ? "no user" : "user " + user.displayName}`, "color: #ffd585");
      this.user = user;
      this.updateLocation();
    })
  }

  updateLocation(l = window.location) {
    let key = l.search.replace("?", "");
    key = key.replace(/&.*/g, "")
    if (key == "signout") {
      signout();
    } else {
      this.openDoxFile(key)
    }
  }

  onconnect(){
    this.build();
    if (this.user != "awaiting") {
      this.updateLocation();
    }
  }

  build(){
    this.innerHTML = "";
    let editor = SvgPlus.make('dox-editor');
    this.appendChild(editor);
    this.editor = editor;
    this.privacy = this.createChild("div", {class: "privacy", content: "This document is locked."});
    this.nofile = this.createChild("div", {class: "privacy"});
    this.nofile.show = (key) => {
      this.nofile.innerHTML = `No document with the file key "${key}" exists.`
      this.show(this.nofile);
    }
  }

  //
  // closeDoxFile(){
  //   close();
  //   this.show(null);
  // }

  // dox editor
  async openDoxFile(key) {
    console.log("%copening " + key + "...", "color: #c4ff90");
    this.show();
    this.editor.onupdate = null;
    if (fireUser != null) fireUser.loaded = false;
    try {
      await open(key, (data) => {
        this.editor.value = data;
      });
      this.editor.openFileKey = key;
      this.show(this.editor);
      this.editor.onupdate = save;
      console.log("%copened and synced to " + key, "color: #c4ff90");
    } catch (e) {
      console.log("%cfailed to open " + key, "color: red");
      switch (e) {
        case "non existant":
          this.nofile.show(key);
          break;
        default:
          this.show(this.privacy);
          break;
      }
    }
  }
  // file tree
  async createDoxFile(path){

    let key = await create();
    console.log(key);
  }

  deleteDoxFile(path){

  }


  show(node) {
    for (let child of this.children) {
      if (child != node) child.removeAttribute("show");
      else child.setAttribute("show", "");
    }

    if (fireUser != null) {
      fireUser.loaded = !!node;
    }
  }

  set user(v){
    this.toggleAttribute("user", v !== null && v !== "awaiting");
    this._user = v;
  }
  get user() {
    return this._user;
  }
}

SvgPlus.defineHTMLElement(DoxApp)
