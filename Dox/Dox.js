import {SvgPlus} from "./4.js";
import {makeEditor} from "./TextEditor.js";


const isDoxContainer = (e) => SvgPlus.is(e.selected, DoxContainer);
const isDoxNode = (e) => SvgPlus.is(e.selected, DoxNode);
const notOnly = (e) => isDoxNode(e) && e.selected.parentNode.children.length > 1;
const alignValidate = (e, name) => {
  if (SvgPlus.is(e.selected, RichText)) {
    let align = window.getComputedStyle(e.selected).textAlign;
    if (align == "start") align = "left";
    if (align == "end") align = "right";
    if (align == name) {
      return "highlight"
    }
    return true;
  }
  return false;
}


const ICONS = {
  trash: {
    method: (e) => e.trash("text"),
    validate: isDoxNode,
  },

  up: {
    method: (e) => e.move(1),
    validate: notOnly,
  },
  down: {
    method: (e) => e.move(-1),
    validate: notOnly,
  },

  section: {
    method: (e) => e.add("section"),
    validate: isDoxContainer,
  },
  row: {
    method: (e) => e.add("row"),
    validate: isDoxContainer,
  },
  text: {
    method: (e) => e.add("text"),
    validate: isDoxContainer,
  },
  image: {
    method: (e) => e.add("image"),
    validate: isDoxContainer,
  },

  align_left: {
    method: (e) => {
      e.selectedStyles = {
        "text-align": "left",
      }
    },
    validate: (e) => alignValidate(e, "left")
  },
  align_center: {
    method: (e) => {
      e.selectedStyles = {
        "text-align": "center",
      }
    },
    validate: (e) => alignValidate(e, "center")
  },
  align_right: {
    method: (e) => {
      e.selectedStyles = {
        "text-align": "right",
      }
    },
    validate: (e) => alignValidate(e, "right")
  },
  align_justify: {
    method: (e) => {
      e.selectedStyles = {
        "text-align": "justify",
      }
    },
    validate: (e) => alignValidate(e, "justify")
  },
  expand: {
    method: (e) => {
      e.selectedStyles = {
        "width": "100%",
      }
    },
    validate: (e) => {
      if (SvgPlus.is(e.selected.parentNode, SectionRow)) {
        if (e.selected.styles) {
          return e.selected.styles.width != "100%";
        }
        return true;
      }
      return false;
    }
  },
  collapse: {
    method: (e) => {
      e.selectedStyles = {
        "width": "",
      }
    },
    validate: (e) => {
      if (SvgPlus.is(e.selected.parentNode, SectionRow)) {
        if (e.selected.styles) {
          return e.selected.styles.width == "100%";
        }
      }
      return false;
    }
  },
}

function iconFilename(icon) {
  return `icons/i_${icon}.svg`
}

class Icon extends SvgPlus {
  constructor(el){
    super(el);
    this.show = false;
    this.name = this.getAttribute("name");
  }

  set show(show) {
    icon.removeAttribute("valid")
    this.styles = {
      display: show ? null : "none"
    }
    this._shown = val;
    if (show & show !== true) {
      icon.props = {valid: show};
    }
  }
  get show() {
    return this._show;
  }

  set name(name){
    if (name in ICONS) {
      this.props = {
        src: iconFilename(name)
      }
      this._name = name;
    }
  }
  get name(){
    return this._name;
  }

  get validate(){
    let name = this.name;
    let res = () => {}
    if (name in ICONS) {
      let validate = ICONS[name].validate;
      if (validate instanceof Function) {
        res = validate;
      }
    }
    return res;
  }
  get method(){
    let name = this.name;
    let res = () => {}
    if (name in ICONS) {
      let method = ICONS[name].method;
      if (method instanceof Function) {
        res = method;
      }
    }
    return res;
  }

  update(editor){
    this.show = this.validate(editor);
    this.onclick = () => {
      this.method(editor);
    }
  }
}


class DoxTools extends SvgPlus {
  constructor(editor) {
    super("dox-tools");
    this.icons = {};
    for (let name in ICONS) {
      let icon = new SvgPlus("img");
      icon.props = {
        src: iconFilename(name),
        style: {
          display: "none"
        }
      }
      icon.onclick = () => {
        let method = ICONS[name].method;
        if (method instanceof Function) method(editor);
      }
      this.icons[name] = icon;
      this.appendChild(icon);
    }

    editor.addEventListener("change", () => {
      for (let name in this.icons) {
        if (name in ICONS) {
          let validate = ICONS[name].validate;
          if (validate instanceof Function) {
            validate = validate(editor);
          }
          this.showIcon(name, validate);
        }
      }
    })
  }

  showIcon(name, show = true) {
    if (name in this.icons){
      let icon = this.icons[name];
      icon.removeAttribute("valid")
      if (!show) {
        icon.styles = {display: "none"};
      } else {
        icon.styles = {display: "inherit"};
        if (show !== true) {
          icon.props = {valid: show};
        }
      }
    }
  }
}



class DoxNode extends SvgPlus {
  constructor(el){
    super(el);

    let cssObj = {
      "dox-node": true
    };

    let updateCssClass = () => {
      let cssString = "";
      for (let key in cssObj) {
        if (cssString != "") cssString += " ";
        cssString += key
      }
      this.class = cssString;
    }

    this.addCssClass = (name) => {
      cssObj[name] = true;
      updateCssClass();
    }

    this.removeCssClass = (name) => {
      delete cssObj[name];
      updateCssClass();
    }

    this.updateCssClass = updateCssClass;
    updateCssClass();
  }

  trash(){
    let parent = this.parentNode;
    if (parent) {
      parent.removeChild(this);
    }
  }

  serialize(){
    let data = {
      type: this.tagName.toLowerCase().replace("_", "-"),
    }
    if (this.styles) data.styles = this.styles;
    if (this.class) data.class = this.class;

    return data;
  }
  deserialize(data) {
    if ("styles" in data) this.styles = data.styles;
    if ("class" in data) this.class = this.class;
  }

  get json(){return this.serialize();}
  set json(data){this.deserialize(data);}

  get path(){
    let parent = this.parentNode;
    let path = "";
    if (parent) {
      path = ([... parent.children]).indexOf(this);
      if (SvgPlus.is(parent, DoxNode)) {
        path = `${parent.path}/${path}`
      } else {
        while (parent && !SvgPlus.is(parent, DoxEditor)) {
          parent = parent.parentNode;
        }
        if (parent) {
          let filename = parent.getAttribute("key");
          path = `${filename}`
        }
      }
    }

    return path;
  }


}


class DoxContainer extends DoxNode {
  constructor(el){
    super(el);
    this.addCssClass("dox-element");
    this.props = {contenteditable: false}
  }

  add(name) {
    let el = null;
    if (name in DOX_NODES) {
      el = new DOX_NODES[name]();
      this.appendChild(el)
    }
    return el;
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
    super.deserialize(data);
    this.innerHTML = "";
    for (let i = 0; i < data.length; i++) {
      let el = this.add(data[i].type);
      el.json = data[i];
    }
  }
}

class DoxTextNode extends DoxNode {
  constructor(el, props){
    super(el);
    makeEditor(this, props);
    this.addEventListener("change", () => {
      this.fireSet("content");
    })
  }

  serialize() {
    let data = super.serialize();
    data.content = this.value;
    return data;
  }

  deserialize(data){
    super.deserialize(data);
    if ("content" in data) this.value = data.content;
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
    this.createChild("img");
    this.createChild("figcaption", {contenteditable: true})
  }
}


const DOX_NODES = {
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

class DoxEditorControls {
  constructor(dox){
    this._selected = null;
    this.doxEditor = dox;


  }

  get doxEditor() {
    return this._doxEditor;
  }

  set doxEditor(dox){
    this._doxEditor = dox;
    dox.main_section.onclick = () => {
      this.selected = e.target;
    }
  }



  oncontextmenu(e) {
    let target = e.target;
    while (target != this && !SvgPlus.is(target, DoxNode)){
      target = target.parentNode;
    }

    if (this.place(target)) {
      e.preventDefault();
    }
  }
}

class DoxEditorXX extends SvgPlus {
  constructor(el){
    super(el);
    let dox = this.createChild("div", {class: "dox-container"});
    this.tools = new DoxTools(this);
    this.main_section = new Section("section");
    this.appendChild(this.tools);
    dox.appendChild(this.main_section);
    this.main_section.onclick = (e) => {
      let target = e.target;
      while (target != this && !SvgPlus.is(target, DoxNode)){
        target = target.parentNode;
      }
      this.selected = target;
    }
    this.load();
  }

  async load(){
    let user = document.querySelector("fire-user");
    this.main_section.json = (await user.get(this.main_section.path)).val();
  }

  onclick(e){
    if (e.target == this) {
      this.selected = null;
    }
  }


  set selectedStyles(value){
    let selected = this.selected;
    if (SvgPlus.is(selected, DoxNode)) {
      selected.styles = value;
      this.callChange();
      selected.fireSet("styles");
    }
  }

  callChange(){
    // this.selected.update
    const event = new Event("change");
    this.dispatchEvent(event);
  }

// ------------------------ dox editor funcs -----------------

  addClass(name) {
    this.selected.addCssClass(name);
  }

  trash(){
    let parent = this.selected.parentNode;
    this.selected.trash();
    this.selected = null;
    console.log(parent.json);
    parent.fireSet();
  }

  add(name){
    let element = this.selected;
    let el = element.add(name);
    if (SvgPlus.is(el, DoxContainer)) {
      this.selected = el;
    }

    element.fireSet();
    return el;
  }

  move(v){
    let element = this.selected;
    let children = [];
    let parent = null;
    if (element) {
      parent = element.parentNode;
      for (let child of parent.children) {
        children.push(child);
      }
    }
    let i = children.indexOf(element);
    if (i != -1) {
      let n = children.length;
      let i2 = (i + v + n) % (n);
      let temp = children[i];
      children[i] = children[i2];
      children[i2] = temp;
    }
    if (parent) {
      for (let child of children) {
        parent.appendChild(child);
      }
    }

    parent.fireSet();
  }

  place(target) {
    let selected = this.selected;
    let parent = selected ? selected.parentNode : null;
    let valid = (parent && selected && target) && (selected != target) && (selected != this.main_section);
    if (valid) {
      parent.removeChild(selected);
      target.appendChild(selected);
    }

    parent.fireSet();
    target.fireSet();

    return valid;
  }

// -------------- firebase --------------------


  get key(){
    return this.getAttribute("key");
  }

  sync(){
    let res = false;
    let user = document.querySelector("fire-user");
    if (user && user.user != null) {
      this._sync = user.onValue(this.key, (e) => {
        this.fireUpdate(e.val());
      });
    }
  }

  stopSync(){
    if (this._sync instanceof Function) {
      this._sync();
      this._sync = null;
    }
  }

  async fireSet(el, key = null) {
    let user = document.querySelector("fire-user");
    if (user && user.user != null) {
      let data = this.json;
      if (key == null) {
        await user.set(el.path, data);
      } else {
        await user.set(el.path + "/" + key, data[key]);
      }
    }
  }

  async fireUpdate(data){
    console.log(data);
  }
}

class DoxEditor extends SvgPlus {
  constructor(el){
    super(el);
    this.build_tools()

  }
  set selected(element){
    let selected = this.selected;
    if (SvgPlus.is(selected, DoxNode)) {
      selected.removeAttribute("selected");
    }

    if (SvgPlus.is(element, DoxNode)) {
      element.props = {selected: ""};
      this._selected = element;
    } else {
      this._selected = null;
    }
    this.updateTools();
  }

  get selected(){
    return this._selected;
  }

  build_tools(){
    let tools = this.querySelector("dox-tools");
    let icons = this.querySelectorAll("img[name]");
    for (let icon of icons){
      icon = new Icon(icon);
    }
    this.update_tools = () => {
      for (let icon of icons) {
        icon.update(this);
      }
    }
  }
}

SvgPlus.defineHTMLElement(DoxEditor)
