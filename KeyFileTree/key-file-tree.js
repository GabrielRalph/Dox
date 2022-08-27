import {SvgPlus} from "../SvgPlus/4.js"
import {FireFiles, Path} from "../FileTree/file-tree.js";

class KeyFiles extends FireFiles {
  constructor(fireUser, root, fileRoot, ftree) {
    console.log(root);
    super(fireUser, root, ftree);
  }

  typeOf(node, path) {
    let type = null;

    if (path.isRoot) {
      type = "folder";
    } else if (node === "empty" ||
               typeof node === "object" && node != null) {
      type = "folder"
    } else if (typeof node === "string") {
      type = "file"
    }

    return type;
  }
}

class KeyFileTree extends SvgPlus {
  onconnect(){
    console.log(this.root, this.fileRoot);
    this.updateRoot();
  }

  async updateRoot(){
    this.innerHTML = "";
    let fuser = document.querySelector("fire-user");
    let ftree = SvgPlus.make("file-tree");
    this.fileTree = ftree;
    let files = new KeyFiles(fuser, this.root, this.fileRoot, ftree);
    this.files = files;

    ftree.files = files;
    await files.watchFirebaseRoot();
    this.appendChild(ftree);
    fuser.loaded = true;
  }

  get selectedPath(){
    return this.fileTree.selectedPath;
  }

  addFolder(path) {
    this.files.set(path, "empty");
  }

  addFile(path) {

  }

  get root(){
    return this.getAttribute("tree-root");
  }

  get fileRoot(){
    return this.getAttribute("file-root");
  }

  // set ["root"](val) {
  //   console.log(val, "xx");
  //   this.root = val;
  // }
  //
  // set ["file-root"](val) {
  //   this.fileRoot = val;
  // }

  static get observedAttributes() {"tree-root", "root"}
}

SvgPlus.defineHTMLElement(KeyFileTree);
