import {SvgPlus} from "./4.js";
const FILEINFO = "fileInfo/"
const FILEROOT = "files/"

class DoxFiles extends SvgPlus {
  constructor(el) {
    super(el);
    this.files = this.createChild("div");
    let button = this.querySelector("div.tools img");
    let input = this.querySelector("div.tools input");
    button.onclick = () => {
      this.addFile(input.value);
      input.value = "";
    }
    this.sync();
  }

  get user() {
    let user = document.querySelector("fire-user")
    if (user.user == null) user = null;
    return user;
  }

  get app() {
    let app = document.querySelector("dox-app");
    return app;
  }

  update(data) {
    let dox = document.querySelector("dox-editor");
    this.files.innerHTML = "";
    for (let key in data) {
      let root = FILEROOT + key
      let d = this.files.createChild("div", {
        'file-root': root,
        class: "file"
      })
      d.createChild("span", {content: data[key].name}).onclick = () => {
        this.app.gotoEditor(key);
      }
      d.createChild("img", {
        src: "./icons/i_trash.svg",
      }).onclick = () => {
        this.deleteFile(key);
      }
    }
  }

  async addFile(name){
    let user = this.user;
    if (user) {
      let fileKey = user.push(FILEINFO).key;
      await user.set(FILEINFO + fileKey, {
        name: name,
      });
    }
  }

  async deleteFile(key) {
    let user = this.user;
    if (user) {
      await user.set(FILEROOT + key, null);
      await user.set(FILEINFO + key, null);
    }
  }

  get synced(){
    return this._sync instanceof Function;
  }

  sync(){
    if (!this.synced) {
      let user = this.user;
      if (user) {
        this._sync = user.onValue(FILEINFO, (e) => {
          this.update(e.val());
          user.loaded = true;
        })
      }
    }
  }
}

SvgPlus.defineHTMLElement(DoxFiles)
