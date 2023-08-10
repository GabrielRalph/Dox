import {SvgPlus} from "../SvgPlus/4.js";
import {makeEditor} from "../TextEditor/TextEditor.js";

let FILES = {

}

async function getText(url){
  let text = null;
  if (url in FILES) {
    text = FILES[url];
    if (text instanceof Promise) {
      await text;
    }
  } else {
    let load = async () => {
      try {
        let res = await fetch(url);
        let text = await res.text();
        if (text) {
          FILES[url] = text;
        }
      } catch(e){}
    }
    FILES[url] = load();
    await FILES[url];
  }
  if (url in FILES) text = FILES[url];
  return text;
}

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
      let node = makeNode(data[i]);
      if (node !== null) this.appendChild(node);
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

class URLSourceNode extends DoxNode {
  constructor(el){
    super(el)
    this._url = "";
  }

  get url() {
    return this._url;
  }
  set url(url){
    if (typeof url !== "string") url = "";
    this._url = url;
    this.setURL(url);
    this.update("url");
  }

 setURL(url) {

 }

  serialize() {
    let data = super.serialize();
    data.url = this.url;
    // console.log(this.url);
    return data;
  }

  deserialize(data) {
    super.deserialize(data);
    this.url = data.url;
  }
}

class SectionImage extends URLSourceNode {
  constructor(){
    super("section-image");
    this.img = this.createChild("img");
    this._width = "100%"
  }

  set width(width){
    if (!width || width + "" === "undefined" || typeof width !== "string") width = "100%"
    this._width = width;
    this.setAttribute("style", "--img-width: " + width);
    this.update("width");
  }


  get width(){
    return this._width;
  }

  serialize() {
    let data = super.serialize();
    data.width = this.width;
    return data;
  }

  deserialize(data) {
    super.deserialize(data);
    this.width = data.width;
  }

  setURL(url){
    this.img.props = {
      src: url,
    }
  }
}

class CodeInsert extends URLSourceNode {
  constructor(){
    super("code-insert");
    this.code = this.createChild("pre");
    this._codelang = "cpp";
    this.lines = [];
    // console.log(this.codelang);
    // console.log();
  }

  set codelang(lang){
    if (!lang || lang === "undefined" || typeof lang !== "string") lang = "cpp"
    // console.log(lang);
    // this.code.class = "language-" + lang;
    // console.log(hljs);
    this._codelang = lang;
    this.update("codelang");
    this.highlight();
  }


  get codelang(){
    return this._codelang;
  }

  set cstart(value){
    this._cstart = parseInt(value);
    this.update("cstart");
    this.highlight();
  }
  set cend(value){
    this._cend = parseInt(value);
    this.update("cend");
    this.highlight();
  }

  get cstart(){
    let start = this._cstart;
    if (typeof start !== 'number' || Number.isNaN(start))start = 0;
    return start;
  }
  get cend(){
    let end = this._cend;
    if (typeof end !== 'number' || Number.isNaN(end))end = this.lines.length - 1;
    return end;
  }

  async setURL(url) {
    if (url) {
      try{
        let code = await getText(url);
        this.lines = code.split('\n');
        this.highlight();
      } catch (e) {
        console.log(e);
      }
    }
  }

  highlight(){
    let code = "";
    // let y = window.scrollY;
    try {
      let splice = this.lines.slice(this.cstart, this.cend);
      code = splice.join('\n');
      if (this._lastcode !== code) {
        this.code.innerHTML = code;
        if (hljs){
          let html = hljs.highlight(code, {language: this.codelang}).value;
          this.code.innerHTML = html;
        }
      }
      this._lastcode = code;

    } catch(e){
      // console.log(e);
    }
  }

  serialize() {
    let data = super.serialize();
    data.codelang = this.codelang;
    return data;
  }

  deserialize(data) {
    super.deserialize(data);
    this.codelang = data.codelang;
  }

}

class DoxTable extends URLSourceNode {
  constructor(){
    super("dox-table");
  }

  async setURL(url) {
    if (url) {
      try{
        let csv = await getText(url);
        this.csv = csv
        this.render();
      } catch (e) {
        console.log(e);
      }
    }
  }

  render(){
    // console.log(this.csv);
    let lines = this.csv.split('\n');
    let rows = lines.map(l => l.split(","));
    let frows = [];
    for (let row of rows) {
      let rowinfo = [];
      for (let cell of row) {
        if (cell.match(/^[\r\t]*$/)) {
          if (rowinfo.length > 0) {
            rowinfo[rowinfo.length - 1].colspan++;
          }
        } else {
          rowinfo.push({
            colspan: 1,
            content: cell.replace(/^\s*/, "")
          })
        }
      }
      frows.push(rowinfo);
    }

    let table = new SvgPlus("table");
    let tbody = table.createChild("tbody");
    for (let row of frows) {
      let tr = tbody.createChild("tr");
      for (let cell of row) {
        tr.createChild("td", cell);
      }
    }
    this.innerHTML = "";
    this.appendChild(table);
    if (MathJax && MathJax.typeset instanceof Function) MathJax.typeset([this]);
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
  "code-insert": CodeInsert,
  "table": DoxTable,
  "dox-table": DoxTable,
}

function makeNode(input) {
  let node = null;
  let type = null;
  let json = null;

  if (input) {
    if (input in DOX_NODE_NAMES)
      type = input;
    else if (typeof input === "object" && input.type in DOX_NODE_NAMES){
      type = input.type;
      json = input;
    }
  }

  if (type != null) {
    node = new DOX_NODE_NAMES[type]();
    if (json != null) {
      node.json = json;
    }
  }

  return node;
}

export {DOX_NODE_NAMES, URLSourceNode, CodeInsert, DoxNode, DoxContainer, DoxTextNode, Section, SectionRow, RichText, SectionHeader, SectionImage, makeNode}
