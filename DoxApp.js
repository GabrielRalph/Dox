import {SvgPlus} from "./4.js";
const FILEROOT = "files/"

class DoxApp extends SvgPlus {
  constructor(el){
    super(el);
    window.onpopstate = () => {
      this.updateLocation();
    }
    this.updateLocation();

    let files = document.querySelector("fire-files");
    files.ondblclick = (e) => {
      let target = files.getTarget(e);
      if (files.isLeaf(target)) {
        let key = files.get(target);
        this.gotoEditor(key);
      }
    }

  }

  onconnect(){
    let files = document.querySelector("fire-files");
    files.addEventListener("open", (e) => {
      this.gotoEditor(e.key)
    })
  }

  get user() {return document.querySelector("fire-user");}
  get editor() {return this.querySelector("dox-editor");}
  get files() {return this.querySelector("div[files]");}
  get pages() {return this.querySelector("dox-pages");}

  set preview(v) {
    if (v) {
      this.pages.content = this.editor.mainSection.outerHTML;
      this.show(this.pages);
    } else {
      this.show(this.editor);
    }
  }

  updateLocation(l = window.location) {
    let s = l.search.replace("?", "");
    if (s) {
      this._showEditor(s)
    }
    else {
      this.show(this.files)
    }
  }

  _showEditor(key) {
    if (this.user) this.user.loaded = false;
    setTimeout(() => {
      let fileRoot = FILEROOT + key;
      this.editor.setAttribute("root", fileRoot);
      this.show(this.editor);
    }, 500)
  }

  gotoEditor(key) {
    this._showEditor(key);
    this.setPath(key);
  }

  setPath(path) {
    window.history.pushState(
      {},
      path,
      window.location.origin + "?" + path
    )
  }

  show(node) {
    console.log(node);
    for (let child of this.children) {
      if (child != node) child.removeAttribute("show");
      else child.setAttribute("show", "");
    }
  }
}

SvgPlus.defineHTMLElement(DoxApp)
