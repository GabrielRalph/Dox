import {SvgPlus} from "../SvgPlus/4.js";
import {DOX_NODE_NAMES,
        DoxNode,
        DoxContainer,
        DoxTextNode,
        Section,
        SectionRow,
        RichText,
        SectionHeader,
        SectionImage
} from "./DoxNodes.js"


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
    method: (e) => e.trash(),
    validate: (e) => isDoxNode(e) && e.mainSection != e.selected,
  },

  up: {
    method: (e) => e.move(-1),
    validate: notOnly,
  },
  down: {
    method: (e) => e.move(1),
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
      e.setStyles({
        "text-align": "left",
      })
    },
    validate: (e) => alignValidate(e, "left")
  },
  align_center: {
    method: (e) => {
      e.setStyles({
        "text-align": "center",
      })
    },
    validate: (e) => alignValidate(e, "center")
  },
  align_right: {
    method: (e) => {
      e.setStyles({
        "text-align": "right",
      })
    },
    validate: (e) => alignValidate(e, "right")
  },
  align_justify: {
    method: (e) => {
      e.setStyles({
        "text-align": "justify",
      })
    },
    validate: (e) => alignValidate(e, "justify")
  },
  expand: {
    method: (e) => {
      e.setWide(true)
    },
    validate: (e) => {
      let node = e.selected;
      if (SvgPlus.is(node, DoxNode)) {
        if (SvgPlus.is(node.parentNode, SectionRow)) {
          return !node.hasClass("wide");
        }
      }
      return false;
    }
  },
  collapse: {
    method: (e) => {
      e.setWide(false)
    },
    validate: (e) => {
      let node = e.selected;
      if (SvgPlus.is(node, DoxNode)) {
        if (SvgPlus.is(node.parentNode, SectionRow)) {
          return node.hasClass("wide")
        }
      }
      return false;
    }
  },
  preview: {
    method: (e) => {
      e.edit = false;
    },
    validate: (e) => {
      return e.edit;
    }
  },
  edit: {
    method: (e) => {
      e.edit = true;
    },
    validate: (e) => {
      return !e.edit;
    }
  },
  image_url: {
    method: (e, value) => {
      if (value) {
        e.selected.url = value;
      }
    },
    validate: (e) => {
      return SvgPlus.is(e.selected, SectionImage);
    }
  },
  font_size: {
    method: (e, value) => {
      if (value) {
        e.setStyles({
          "--font-size-pt": parseFloat(value)
        });
      }
    },
    validate: (e, icon) => {
      if (SvgPlus.is(e.selected, RichText)) {
        let styles = e.selected.styles;
        let val = 12;
        if (styles && "--font-size-pt" in styles) {
          val = e.selected.styles["--font-size-pt"];
        }
        icon.value = val;
        return true;
      }
      return false;
    }
  }
}

function iconFilename(icon) {
  return `icons/i_${icon}.svg`
}

class Icon extends SvgPlus {
  constructor(el){
    super(el);
    this.show = false;
    this.iname = this.getAttribute("name");
  }

  set show(show) {
    this.removeAttribute("valid")
    this.toggleAttribute("hidden", !show);
    this._shown = show;
    if (show && show !== true) {
      this.props = {valid: show};
    }
  }
  get show() {
    return this._show;
  }

  set iname(name){
    if (name in ICONS) {
      if (this.tagName == "IMG") {
        this.props = {
          src: iconFilename(name)
        }
      }
      this._name = name;
    }
  }
  get iname(){
    return this._name;
  }

  get validate(){
    let name = this.iname;
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
    let name = this.iname;
    let res = () => {}
    if (name in ICONS) {
      let method = ICONS[name].method;
      if (method instanceof Function) {
        res = method;
      }
    }
    return res;
  }

  set value(v){
    let input = this.querySelector("input");
    if (input) {
      input.value = v;
    }
  }
  get value(){
    let input = this.querySelector("input");
    if (input) {
      return input.value;
    }
  }

  update(editor){
    this.show = this.validate(editor, this);
    this.onclick = () => {
      this.method(editor);
    }
    let input = this.querySelector("input");
    if (input) {
      input.onchange = () => {
        this.method(editor, input.value)
      }
    }
  }
}

function getTarget(e) {
  let target = e.target;
  while (target && !SvgPlus.is(target, DoxNode)) {
    if (target.tagName === "DOX-TOOLS") {
      return "tools";
    }
    target = target.parentNode;
  }
  return target;
}

class DoxEditorBase extends SvgPlus {
  constructor(el){
    super(el);
    this.build_tools();
    let rel = this.createChild("div", {class: "dox-container"});
    let main = this.make_node("section");
    rel.appendChild(main);
    this.mainSection = main;
    window.addEventListener('beforeprint', (e) => {
      this.edit = false;
    })
    window.addEventListener('afterprint', (e) => {
      this.edit = true;
    })
  }
  set edit(v){
    this.toggleAttribute("edit", v);
    this.update_tools();
  }
  get edit(){
    return this.getAttribute("edit") != null
  }
  onmousedown(e) {
    let target = getTarget(e);
    if (target !== "tools") {
      this.selected = target;
    }
  }

  oncontextmenu(e){
    let target = getTarget(e);
    if (target !== null && target !== "tools") {
      if (this.place()) {
        e.preventDefault();
      }
    }
  }

  add(name, parent = this.selected) {
    let child = this.make_node(name);
    parent.appendChild(child);
    this.update_node(child);
    this.update_node(parent, "length");
    this.push_update();
  }

  trash(node = this.selected) {
    let parent = node.parentNode;
    parent.removeChild(node);
    this.selected = null;
    this.update_node(parent);
    this.push_update();
  }

  move(dir, node = this.selected) {
    let parent = node.parentNode;
    let children = [... parent.children];
    let i = children.indexOf(node);

    let child_a = null;
    let child_b = null;
    if (i != -1) {
      let n = children.length;
      let i2 = (i + dir + n) % (n);
      child_a = children[i];
      child_b = children[i2];
      children[i] = child_b;
      children[i2] = child_a;
      for (let child of children) {
        parent.appendChild(child);
      }
    }

    if (child_a != null && child_b != null) {
      this.update_node(child_a);
      this.update_node(child_b);
      this.push_update();
    }
  }

  place(target = this.selected, node = this.lastSelected){
    let valid = target && node &&
                (target != node) &&
                (node != this.mainSection) &&
                SvgPlus.is(target, DoxContainer);
    if (valid) {
      let parent = node.parentNode;
      target.appendChild(node);
      if (parent.contains(target)) {
        this.update_node(parent);
      } else if (target.contains(parent)) {
        this.update_node(target);
      } else {
        this.update_node(parent);
        this.update_node(target);
      }
      this.push_update();
    }

    return valid;
  }

  setWide(value, node = this.selected) {
    if (value) {
      node.addClassCat("wide");
    } else {
      node.removeClassCat("wide");
    }
    this.update_tools();
    this.update_node(node, "class");
    this.push_update();
  }

  setStyles(styles, node = this.selected){
    node.styles = styles;
    this.update_tools();
    this.update_node(node, "styles");
    this.push_update();
  }

  set selected(element){
    let selected = this.selected;
    if (SvgPlus.is(selected, DoxNode)) {
      selected.removeAttribute("selected");
      this.lastSelected = selected;
    }

    if (SvgPlus.is(element, DoxNode)) {
      element.props = {selected: ""};
      this._selected = element;
    } else {
      this._selected = null;
    }
    this.update_tools();
  }

  get selected(){
    return this._selected;
  }

  build_tools(){
    let icons = this.querySelectorAll("dox-tools img[name]");
    let text = this.querySelectorAll("dox-tools div.text-field[name]");
    let tools = [... icons].concat([... text]);
    for (let tool of tools){
      tool = new Icon(tool);
      tool.update(this);
    }
    this.update_tools = () => {
      for (let tool of tools) {
        tool.update(this);
      }
    }
  }

  make_node(name){
    let node = null;
    if (name in DOX_NODE_NAMES) {
      node = new DOX_NODE_NAMES[name]();
    }
    return node;
  }

  update_node(node, key) {
    console.log(node.path, key);
  }

  push_update(){
  }
}

class DoxEditor extends DoxEditorBase {
  constructor(el) {
    super(el);
    let buffer = [];
    this.update_node = (node, key) => {
      let path = this.root + node.path;
      let data = node.json;
      if (key != null){
        path += "/" + key;
        data = data[key];
      }
      buffer.push([path, data]);
    }

    this.update_firebase = async () => {
      let user = this.user;
      if (user) {
        this._sync_pause = true;
        while (buffer.length > 0) {
          let [path, data] = buffer.shift()
          await user.set(path, data);
        }
        this._sync_pause = false;
      }
    }

    this.push_update = this.update_firebase;
  }

  get sync_pause(){
    return !!this._sync_pause;
  }

  get user() {
    let user = document.querySelector("fire-user")
    if (user.user == null) user = null;
    return user;
  }

  set root(root) {
    console.log(root);
    this.sync(root);
  }

  get root(){
    return this._root;
  }

  async sync(root = this.root){
    this.stopSync();
    // console.log("dox-editor synced to " + root);
    this._root = root;
    let user = this.user;
    if (user) {
      // this._sync = user.onValue(root, (e) => {
      //   this.sync_update(e)
      //   user.loaded = true;
      // })
      this.sync_update(await user.get(root))
      user.loaded = true;
    } else {
      this._sync = null;
    }
  }

  async sync_update(e){
    // console.log('sync update');
    if (!this.sync_pause) {
      if (e.val() == null) {
        this.update_node(this.mainSection);
        this.push_update();
      } else {
        // console.log('setting update');
        this.mainSection.json = e.val();
      }
    }
  }

  stopSync(){
    if (this._sync instanceof Function) {
      this._sync();
      console.log("sync stoped");
    }
    this._sync = null;
  }
}


SvgPlus.defineHTMLElement(DoxEditor);
export {DoxEditor}
