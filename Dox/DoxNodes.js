import {SvgPlus} from "../SvgPlus/4.js";
import {makeEditor} from "../TextEditor/TextEditor.js";

class DoxNode extends SvgPlus {
  constructor(el){
    super(el);

    let obj = {};
    let string = (data = obj) => {
      let cssString = "";
      for (let cat in data) {
        let value = data[cat];
        if (typeof value === "object")
          value = string(value);
        else
          value = cat;
        if (cssString != "") cssString += " ";
        cssString += value;
      }
      return cssString;
    }
    let update = () => {
      this.class = string();
    }

    const def = "default"

    this.addClassCat = (name, cat = def) => {
      if (!(cat in obj)) obj[cat] = {};
      obj[cat][name] = true;
      update();
    }

    this.setClassCat = (ccat, cat = def) => {
      obj[cat] = ccat;
      update();
    }

    this.removeClassCat = (name, cat = def) => {
      if (cat in obj) {
        delete obj[cat][name];
        update();
      }
    }

    this.hasClass = (name) => {
      for (let cat in obj) {
        if (name in obj[cat]) {
          return true;
        }
      }
      return false;
    }

    this.getClassCat = (cat = def) => {
      let cobj = null;
      if (cat in obj) {
        cobj = obj[cat];
      }
      return cobj;
    }

    this.addClassCat("dox-node", "nodes");
  }

  // OVERWRITTABLE methods
  serialize(){
    let data = {
      type: this.tagName.toLowerCase().replace("_", "-"),
    }
    if (this.styles) data.styles = this.styles;
    if (this.class) data.class = this.getClassCat();

    return data;
  }
  deserialize(data) {
    if (data != null) {
      if ("styles" in data) {
        this.styles = data.styles;
      } else {
        this.removeAttribute("style")
      }
      if ("class" in data) {
        this.setClassCat(data.class);
      } else {
        this.setClassCat({});
      }
    }
  }

  get json(){return this.serialize();}
  set json(data){this.deserialize(data);}
  get path(){
    let parent = this.parentNode;
    let path = "";
    if (SvgPlus.is(parent, DoxNode)) {
      let i = ([... parent.children]).indexOf(this);
      path = `${parent.path}/${i}`
    }
    return path;
  }
  get editor(){
    let node = this;
    while (node && node.tagName != "DOX-EDITOR") node = node.parentNode;
    return node;
  }

  update(key) {
    let {editor} = this;
    if (editor) {
      editor._update_node(this, key);
    }
  }
}


class DoxContainer extends DoxNode {
  constructor(el){
    super(el);
    this.props = {contenteditable: false}
    this.addClassCat("dox-element", "nodes");
  }

  serialize(){
    let data = super.serialize();
    let i = 0;
    for (let child of this.children) {
      if (SvgPlus.is(child, DoxNode)) {
        data[i] = child.json;
        i++;
      }
    }
    data.length = i;
    return data;
  }
  deserialize(data){
    this.innerHTML = "";
    super.deserialize(data);
    for (let i = 0; i < data.length; i++) {
      let ne = data[i];
      if (ne && ne.type in DOX_NODE_NAMES) {
        let node = new DOX_NODE_NAMES[ne.type]();
        node.json = ne;
        this.appendChild(node);
      }
    }
  }
}

class DoxTextNode extends DoxNode {
  constructor(el, props){
    super(el);
    makeEditor(this, props);
    this.addEventListener("unselect", () => {
      this.update("content")
    })
  }

  serialize() {
    let data = super.serialize();
    data.content = this.value;
    return data;
  }
  deserialize(data){
    super.deserialize(data);
    if ("content" in data) {
      this.value = data.content;
    }
  }
}


class Section extends DoxContainer {
  constructor() {
    super("section");
  }
}

class SectionRow extends DoxContainer {
  constructor(){
    super("section-row");
  }
}


class RichText extends DoxTextNode {
  constructor(){
    super("rich-text");
  }
}

class SectionHeader extends DoxTextNode{
  constructor(n) {
    super("section-header");
  }
}


class SectionImage extends DoxNode {
  constructor(){
    super("section-image");
    this._url = "";
    this.img = this.createChild("img");
    this.figure = this.createChild("figcaption")
  }

  get url() {
    return this._url;
  }
  set url(url){
    if (typeof url !== "string") url = "";
    this._url = url;
    this.img.props = {
      src: url,
    }
    this.update("url");
  }

  serialize() {
    let data = super.serialize();
    data.url = this.url;
    console.log(this.url);
    return data;
  }

  deserialize(data) {
    super.deserialize(data);
    this.url = data.url;
  }
}

const DOX_NODE_NAMES = {
  Section: Section,
  section: Section,
  SectionRow: SectionRow,
  row: SectionRow,
  "section-row": SectionRow,
  "text": RichText,
  RichText: RichText,
  "rich-text": RichText,
  "section-image": SectionImage,
  "image": SectionImage,
  "header": SectionHeader,
}

export {DOX_NODE_NAMES, DoxNode, DoxContainer, DoxTextNode, Section, SectionRow, RichText, SectionHeader, SectionImage}
