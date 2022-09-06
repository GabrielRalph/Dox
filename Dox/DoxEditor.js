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

const TOOLS = {
  trash: {
    method: (e) => e.trash(),
    validate: (e) => isDoxNode(e) && e.mainSection != e.selected,
  },

  up: {
    method: (e) => {
      e.move(-1)
    },
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
const TOOL_TEMPLATE = `<dox-tools>
  <!-- left tools -->
  <div>
    <!-- <div> -->
      <img name = "trash" />
      <img name = "up" />
      <img name = "down" />
    <!-- </div>
    <div> -->
      <img class = sp5 name = "section" />
      <img name = "row" />
      <img name = "text" />
      <img name = "image" />
    <!-- </div>
    <div> -->
      <div small class = "text-field sp5" name = "image_url">
        <span onclick="parentNode.toggleAttribute('small')">url</span>
        <input placeholder="https://"/>
      </div>

      <div small class = "text-field" name = "image_url">
        <span >upload</span>
      </div>
    <!-- </div>
    <div> -->
      <img class = sp5 name = "align_left" />
      <img name = "align_center" />
      <img name = "align_right" />
      <img name = "align_justify" />
      <div class = "text-field" name = "font_size">
        <span>P<span style = "font-size: 0.7em; padding-left:0.2em;">P</span></span>
        <input value = "12" style = 'width: 1.5em; text-align: center'/>
      </div>
    <!-- </div>
    <div> -->
      <img class = sp5 name = "expand" />
      <img class = sp5 name = "collapse" />
    <!-- </div> -->
  </div>

  <!-- right tools -->
  <div>
    <img name = "preview" />
    <img name = "edit" />
  </div>
</dox-tools>`

function iconFilename(icon) {
  return `icons/i_${icon}.svg`
}

class ToolIcon extends SvgPlus {
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
    if (name in TOOLS) {
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
    if (name in TOOLS) {
      let validate = TOOLS[name].validate;
      if (validate instanceof Function) {
        res = validate;
      }
    }
    return res;
  }
  get method(){
    let name = this.iname;
    let res = () => {}
    if (name in TOOLS) {
      let method = TOOLS[name].method;
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

class DoxEditor extends SvgPlus {
  constructor(el){
    super(el);
    window.addEventListener('beforeprint', (e) => {
      this.edit = false;
    });
    window.addEventListener('afterprint', (e) => {
      this.edit = true;
    });
    this._data = {type: "section", length: 0, class: null};
  }
  onconnect(){
    this.build();
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

  // User methods
  set edit(v){
    this.toggleAttribute("edit", v);
    this.update_tools();
  }
  get edit(){
    return this.getAttribute("edit") != null;
  }

  add(name, parent = this.selected) {
    let child = this.make_node(name);
    parent.appendChild(child);
    this._update_node(child);
    this._update_node(parent, "length");
  }
  trash(node = this.selected) {
    let parent = node.parentNode;
    parent.removeChild(node);
    this.selected = null;
    this._update_node(parent);
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
      this._update_node(child_a);
      this._update_node(child_b);
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
        this._update_node(parent);
      } else if (target.contains(parent)) {
        this._update_node(target);
      } else {
        this._update_node(parent);
        this._update_node(target);
      }

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
    this._update_node(node, "class");
  }
  setStyles(styles, node = this.selected){
    node.styles = styles;
    this.update_tools();
    this._update_node(node, "styles");
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
    } else if (typeof element === "string") {
      // console.log(element);
    } else {
      this._selected = null;
    }
    this.update_tools();
  }
  get selected(){
    return this._selected;
  }

  build(){
    this.build_tools();
    let rel = this.createChild("div", {class: "dox-container"});
    let main = this.make_node("section");
    rel.appendChild(main);
    this.mainSection = main;
  }
  build_tools(){
    this.innerHTML = "" + TOOL_TEMPLATE
    let icons = this.querySelectorAll("dox-tools img[name]");
    for (let icon of icons) {
      icon.src = "./icons/i_" + icon.getAttribute("name") + ".svg";
    }
    let text = this.querySelectorAll("dox-tools div.text-field[name]");
    let tools = [... icons].concat([... text]);
    for (let tool of tools){
      tool = new ToolIcon(tool);
      tool.update(this);
    }
    this._tools = tools;
  }
  update_tools(){
    if (Array.isArray(this._tools)) {
      for (let tool of this._tools) {
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

  _update_node(node, key) {
    let path = node.path;

    let value = node.json;
    if (key && key != "") {
      value = value[key];
      path = path + "/" + key;
    }

    if (this.onupdate instanceof Function) {
      this.onupdate(value, path);
    }
  }

  getDoxNodeByPath(path) {
    let node = this.mainSection;
    for (let key of path.split('/')) {
      if (key in node.children) {
        node = node.children[key];
      }
    }
    return node;
  }


  get value() {
    return this.mainSection.json;
  }

  set value(data) {
    // set value
    this._set_value(data);
  }

  async _set_value(data) {
    this._value = data;
    if (!this._updating) {
      this._updating = new Promise((resolve, reject) => {
        window.requestAnimationFrame(() => {
          let selectedPath = "";
          if (this.selected != null) {
            selectedPath = this.selected.path;
          }
          this._updating = false;
          this.mainSection.json = this._value;
          this.selected = this.getDoxNodeByPath(selectedPath);
          console.log('%ceditor updated', "color: #79c3ff");
        });
      });
    }
    return this._updating;
  }
}

SvgPlus.defineHTMLElement(DoxEditor);
export {DoxEditor}
