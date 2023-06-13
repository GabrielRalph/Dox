import {SvgPlus} from "../SvgPlus/4.js";
import {DOX_NODE_NAMES,
        DoxNode,
        DoxContainer,
        DoxTextNode,
        Section,
        SectionRow,
        RichText,
        SectionHeader,
        SectionImage,
        CodeInsert,
        URLSourceNode,
        makeNode,
} from "./DoxNodes.js";
import {getHistoryVersion, addHistory} from "./history.js";
import {addKeyCommands} from "../TextEditor/key-cmds.js";

function is (o, c) {
  return SvgPlus.is(o, c);
}
const isDoxContainer = (e) => is(e.selected, DoxContainer);
const isDoxNode = (e) => is(e.selected, DoxNode);
const isSectionRow = (e) => is(e.selected, SectionRow);
const isText = (e) => is(e.selected, DoxTextNode);
const notOnly = (e) => isDoxNode(e) && e.selected.parentNode.children.length > 1;
const alignValidate = (e, name) => {
  if (isDoxContainer(e) || isText(e)) {
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
const alignItemsValidate = (e, name) => {
  if (isSectionRow(e)) {
    let align = window.getComputedStyle(e.selected).alignItems;
    switch (align) {
      case "center": return name === "middle" ? "highlight" : true;
      case "flex-start": return name === "top" ? "highlight" : true;
      case "flex-end": return name === "bottom" ? "highlight" : true;
      default: return name === "fill" ? "highlight" : true;
    }
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
  code: {
    method: (e) => e.add("code-insert"),
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

  align_middle: {
    method: (e) => {
      e.setStyles({
        "align-items": "center",
       })
    },
    validate: (e) => alignItemsValidate(e, "middle")
  },
  align_top: {
    method: (e) => {
      e.setStyles({
        "align-items": "flex-start",
      })
    },
    validate: (e) => alignItemsValidate(e, "top")
  },
  align_bottom: {
    method: (e) => {
      e.setStyles({
        "align-items": "flex-end",
      })
    },
    validate: (e) => alignItemsValidate(e, "bottom")
  },
  align_fill: {
    method: (e) => {
      e.setStyles({
        "align-items": "stretch",
      })
    },
    validate: (e) => alignItemsValidate(e, "fill")
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
    validate: (e, icon) => {
      if (SvgPlus.is(e.selected, URLSourceNode)) {
        let input = icon.querySelector("input");

        if (input != null) {
          input.value = e.selected.url;
        }
        return true;
      }
      return false;
    }
  },
  width: {
    method: (e, value) => {
      if (value) {
        e.selected.width = value;
      }
    },
    validate: (e, icon) => {
      if (SvgPlus.is(e.selected, SectionImage)) {
        let input = icon.querySelector("input");
        if (input != null) {
          input.value = e.selected.width;
        }
        return true;
      }
      return false;
    }
  },
  code_language: {
    method: (e, value) => {
      if (value) {
        e.selected.codelang = value;
      }
    },
    validate: (e, icon) => {
      if (SvgPlus.is(e.selected, CodeInsert)) {
        let input = icon.querySelector("input");
        if (input != null) {
          input.value = e.selected.codelang;
        }
        return true;
      }
      return false;
    }
  },
  code_start: {
    method: (e, value) => {
      if (value) {
        e.selected.cstart = value;
      }
    },
    validate: (e, icon) => {
      if (SvgPlus.is(e.selected, CodeInsert)) {
        let input = icon.querySelector("input");
        if (input != null) {
          input.value = e.selected.cstart;
        }
        return true;
      }
      return false;
    }
  },
  code_end: {
    method: (e, value) => {
      if (value) {
        e.selected.cend = value;
      }
    },
    validate: (e, icon) => {
      if (SvgPlus.is(e.selected, CodeInsert)) {
        let input = icon.querySelector("input");
        if (input != null) {
          input.value = e.selected.cend;
        }
        return true;
      }
      return false;
    }
  },
  font_size: {
    method: (e, value) => {
      console.log(value);
      if (value) {
        e.setStyles({
          "--font-size-pt": parseFloat(value)
        });
      }
    },
    validate: (e, icon) => {
      if (isText(e) || isDoxContainer(e)) {
        let styles = e.selected.styles;
        let val = 12;
        if (styles && "--font-size-pt" in styles) {
          val = e.selected.styles["--font-size-pt"];
          icon.value = val;
        }else {
          icon.value = "";
          icon.input.setAttribute("placeholder", "...")
        }
        return true;
      }
      return false;
    }
  },
  color: {
    method: (e, value) => {
      if (!value || value == "") value = null;
      e.setStyles({
        "color": value
      });
    },
    validate: (e, icon) => {
      if (isText(e) || isDoxContainer(e)) {
        let styles = e.selected.styles;
        let val = null;
        if (styles && "color" in styles) {
          val = e.selected.styles["color"];
        }else {
          icon.input.setAttribute("placeholder", "...")
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
      <img name = "trash" />
      <img class = sp5 name = "up" />
      <img name = "down" />

      <img class = sp5 name = "section" />
      <img name = "row" />
      <img name = "text" />
      <img name = "image" />
      <img name = "code">


      <div small class = "text-field sp5" name = "image_url">
        <span onclick="parentNode.toggleAttribute('small')">URL</span>
        <input placeholder="https://"/>
      </div>
      <div class = "text-field" name = "width">
        <span onclick="parentNode.toggleAttribute('small')">Width</span>
        <input placeholder="100%" style = "width: 3em"/>
      </div>
      <div small class = "text-field" name = "code_language">
        <span onclick="parentNode.toggleAttribute('small')">Language</span>
        <input placeholder="cpp"/>
      </div>
      <div small class = "text-field" name = "code_start">
        <span onclick="parentNode.toggleAttribute('small')">Start Line</span>
        <input placeholder="0"/>
      </div>
      <div small class = "text-field" name = "code_end">
        <span onclick="parentNode.toggleAttribute('small')">End Line</span>
        <input placeholder="1"/>
      </div>

      <img class = sp5 name = "align_left" />
      <img name = "align_center" />
      <img name = "align_right" />
      <img name = "align_justify" />

      <img class = sp5 name = "align_middle" />
      <img name = "align_top" />
      <img name = "align_bottom" />
      <img name = "align_fill" />

      <div class = "text-field" name = "font_size">
        <span>P<span style = "font-size: 0.7em; padding-left:0.2em;">P</span></span>
        <input value = "12" style = 'width: 1.5em; text-align: center'/>
      </div>
      <div class = "text-field" name = "color">
        <span style = "color: aqua;">C</span>
        <input value = "" style = 'width: 3em; text-align: center'/>
      </div>

      <img class = sp5 name = "expand" />
      <img class = sp5 name = "collapse" />
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

function checkObjDiff(obj1, obj2) {
  let different = true;
  if (typeof obj1 === typeof obj2) {
    different = false;
    if (obj1 !== obj2 && (obj1 === null || obj2 === null)) {
      different = true;
    } else if (typeof obj1 === "object" && obj1 !== null) {
      let keys1 = Object.keys(obj1);
      let keys2 = Object.keys(obj2);
      let keySet1 = new Set(keys1)
      let keySet2 = new Set(keys2);
      let int1 =  keys1.filter((key => !keySet2.has(key)));
      let int2 =  keys2.filter((key => !keySet1.has(key)));
      let exclusion = int1.concat(int2);

      if (exclusion.length == 0) {
        for (let key of keys1) {
          different ||= checkObjDiff(obj1[key], obj2[key]);
        }
      } else {
        different = true;
      }
    } else {
      different = obj1 !== obj2;
      if (different) {
      }
    }
  }

  return different;
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

  get input(){
    return this.querySelector("input");
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
    let input = this.querySelector("input");
    if (input) {
      input.onchange = () => {
        this.method(editor, input.value)
      }
    } else {
      this.onclick = () => {
        this.method(editor);
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
    let edit = false;
    this.pageStyles =  new SvgPlus("style");
    document.body.appendChild(this.pageStyles);

    window.addEventListener('beforeprint', (e) => {

      edit = this.edit;
      this.edit = false;
    });
    window.addEventListener('afterprint', (e) => {
      this.edit = edit;
    });
    this._data = {type: "section", length: 0, class: null};
    let cmds = {
      "Meta+z": (e) => {
        this.getHistory();
        return true;
      },
      "Meta+y": (e) => {
        this.getHistory(true);
        return true;
      },
      "Shift+click": (e) => this.swapEvent(e),
      "Meta+c": (e) => {
        if(!window.isEditingText()) {
          this._copy_buffer = this.selected.json;
        }
      },
      "Meta+v": (e) => {
        if(!window.isEditingText()) {
          let {selected} = this;
          if (isDoxContainer(this)) {
            let node = makeNode(this._copy_buffer);
            console.log(node);
            if (node != null) {
              selected.appendChild(node);
              this._update_node(selected);
            }
          }
        }
      },
      "Meta+e": (e) => {
        // console.log("eeeeeeeeeeee");
        this.empty();
      },
      "Backspace": (e) => {
        if (!window.isEditingText()) {
          this.trash();
        }
      }
    }
    for (let name of ["section", "row", "text", "image", "code"]){
      cmds[name[0]] = (e) => {
        if (!window.isEditingText()) {
          this.addBefore(name);
        }
      }
    }
    addKeyCommands(cmds);
  }

  setPageMargins(value) {
    let values = value.split(" ");
    let keys = ["--margin-top-mm",
    "--margin-right-mm",
    "--margin-bottom-mm",
    "--margin-left-mm"];
    let root = document.querySelector(":root");
    console.log(root.style);
    for (let i = 0; i < 4; i++) root.style.setProperty(keys[i],values[i]);
    this.updatePageMargins();
  }
  updatePageMargins(){
    const styles = window.getComputedStyle(this);
    let keys = ["--margin-top-mm",
    "--margin-right-mm",
    "--margin-bottom-mm",
    "--margin-left-mm"];
    let margins = keys.map((x) => styles.getPropertyValue(x) + "mm").join(" ");
    this.pageStyles.innerHTML = `
      @media print{
        @page{
          margin: ${margins};
          size: A4;
        }
      }`
  }

  onconnect(){
    this.build();
    this.updatePageMargins();
  }
  onmousedown(e) {
    let target = getTarget(e);
    if (target !== "tools") {
      this.selected = target;
    }
  }
  oncontextmenu(e){
    if (this.swapEvent(e)) {
      e.preventDefault();
    }
  }

  swapEvent(e){
    let target = getTarget(e);
    let prevent = false;
    if (target !== null && target !== "tools") {
      if (this.place()) {
        prevent = true;
      } else if (this.swapImage()) {
        prevent = true;
      } else if (this.swap()) {
        prevent = true;
      }
    }
    return prevent;
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
    let child = makeNode(name);
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
  swapImage(target = this.selected, node = this.lastSelected) {
    let valid = target && node &&
                (target != node) &&
                SvgPlus.is(target, SectionImage) &&
                SvgPlus.is(node, SectionImage);
    if (valid) {
      let urlt = target.url;
      target.url = node.url;
      node.url = urlt;
    }
    return valid;
  }
  swap(target = this.selected, node = this.lastSelected) {
    let valid = target && node &&
                (target != node) &&
                !SvgPlus.is(target, DoxContainer) &&
                !SvgPlus.is(node, DoxContainer);
    if (valid) {
      let nparent = node.parentNode;
      let tparent = target.parentNode;
      let parent = nparent;
      while (!(parent && parent.contains(target) && parent.contains(node))) {
        parent = parent.parentNode;
      }

      let temp = new SvgPlus("div");
      nparent.replaceChild(temp, node);
      tparent.replaceChild(node, target)
      nparent.replaceChild(target, temp);
      this._update_node(parent);
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

    let recurse_clear = (n, keys) => {
      for (let child of n.children) {
        let styles = child.styles;
        if (styles) {
          let nstyles = {}
          for (let key in keys) {
            if (key in styles) nstyles[key] = null;
          }

          child.styles = nstyles;
          this._update_node(child, "styles");
        }
        recurse_clear(child, keys);
      }
    }
    console.log(styles);
    recurse_clear(node, styles);
    this.update_tools();
    this._update_node(node, "styles");
  }
  empty(node = this.selected){
    let section = node;
    while (section && !SvgPlus.is(section, DoxContainer))
      section = section.parentNode;
    let valid = section && section != this.mainSection;

    if (valid) {
      let children = [...section.children];
      let sparent = section.parentNode;
      let child = children.pop();
      sparent.replaceChild(child, section);
      while (children.length) {
        let child2 = children.pop();
        sparent.insertBefore(child2, child);
        child = child2;
      }
      this._update_node(sparent);
    }
    return valid;
  }
  addBefore(name = "section"){
    let {selected, mainSection} = this;
    if (!selected.isSameNode(mainSection)) {
      let newNode = makeNode(name);
      if (newNode != null) {
        selected.parentNode.insertBefore(newNode, selected);
      }
      this._update_node(parent);
    }
  }

  async getHistory(next){
    let fileKey = this.openFileKey;
    let version = getHistoryVersion(fileKey, next);
    if (version != null) {
      await this._set_value(version);
      this._call_update();
    }
  }

  set selected(element){
    let selected = this.selected;
    let edittext = false;
    if (SvgPlus.is(selected, DoxNode)) {
      selected.removeAttribute("selected");
      this.lastSelected = selected;

      edittext = !window.isEditingText() && (SvgPlus.is(selected, RichText) && selected.isSameNode(element));
    }

    if (SvgPlus.is(element, DoxNode)) {
      element.props = {selected: ""};
      this._selected = element;
      if (edittext) element.select();
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
    let main = makeNode("section");
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


  _update_node(node, key) {
    let path = node.path;

    let value = node.json;
    if (key && key != "") {
      value = value[key];
      path = path + "/" + key;
    }

    // save history (move index history to front)
    addHistory(this.openFileKey, this.value);
    console.log('%ceditor updated at ' + path, "color: #79c3ff");
    this._call_update(value, path)
  }
  _call_update(value = this.value, path = "") {
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
    if (checkObjDiff(data, this.mainSection.json)) {
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
            resolve(true);
          });
        });
      }
      return this._updating;
    }
    return null;
  }
}

SvgPlus.defineHTMLElement(DoxEditor);
export {DoxEditor}
