import {SvgPlus} from "../SvgPlus/4.js";
import {Files, Path} from "../FileTree/file-tree.js";
import {fireUser} from "../FireUser/fire-user.js";
import {DoxEditor} from "./DoxEditor.js"
import {close, remove, create} from "./DoxFirebase.js"

const FILEROOT = "files/";


// class DoxFiles extends FireFiles {
// }

class DoxApp extends SvgPlus {
  constructor(el){
    super(el);
    window.onpopstate = () => {
      this.updateLocation();
    }
  }
  updateLocation(l = window.location) {
    let key = l.search.replace("?", "");
    this.openDoxFile(key)
  }

  onconnect(){
    let editor = SvgPlus.make('dox-editor');
    this.appendChild(editor);
    this.show(editor);
    this.editor = editor;
    this.updateLocation();
  }

  // dox editor
  async openDoxFile(key) {
    console.log("opening " + key + "...");
    this.show();
    if (fireUser != null) fireUser.loaded = false;

    let data = await this.editor.openFile(key);
    if (data != null) {
      this.show(this.editor);
      if (fireUser != null) {
        fireUser.loaded = true;
      }
      console.log("opened " + key);
    } else {
      this.show();
      console.log("failed to open " + key);
    }
  }
  closeDoxFile(){
    close();
    this.show(null);
  }

  // file tree
  async createDoxFile(path){

    let key = await create();
    console.log(key);
  }
  deleteDoxFile(path){

  }


  // setPath(path) {
  //   window.history.pushState(
  //     {},
  //     path,
  //     window.location.origin + "?" + path
  //   )
  // }
  //
  show(node) {
    for (let child of this.children) {
      if (child != node) child.removeAttribute("show");
      else child.setAttribute("show", "");
    }
  }
}

SvgPlus.defineHTMLElement(DoxApp)
