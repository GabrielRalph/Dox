import {SvgPlus} from "../SvgPlus/4.js"
import {pasteInputParser} from "./Paste.js"
import {getRichText, getRichLines} from "./RichText.js"

let defaultMetaCmds =  {
  "b": () => true,
  "i": () => true,
  "v": () => true,
}
let defaultKeyBlocks = {
  "Enter": () => false,
  "{": () => {
    return insertDelim("{","}")
  },
  "$": () => {
    return insertDelim("$","$")
  },
  '"': () => {
    return insertDelim('"','"')
  },
  '(': () => {
    return insertDelim('(',')')
  }
}

class Line extends SvgPlus {
  constructor(line) {
    super("div");
    if (line) {
      this.innerHTML = line;
    } else {
      this.innerHTML = "<br>"
    }
  }
}

function insertDelim(startDelim, endDelim) {
  let sel = window.getSelection();
  let range = sel.getRangeAt(0);
  let s = range.startOffset;
  let e = range.endOffset;
  let end = range.endContainer;
  let start = range.startContainer;

  if (end != start || e > s) {
    end.data = end.data.slice(0, e) + endDelim + end.data.slice(e);
    start.data = start.data.slice(0, s) + startDelim + start.data.slice(s);

    // update selection
    let r = document.createRange();
    r.setStart(start, s + 1)
    r.setEnd(end, e + startDelim.length);
    sel.removeAllRanges();
    sel.addRange(r);

    return true;
  } else {
    return false;
  }
}

function validate(key, element, metaCmds, keyBlocks){
  let res = true;
  if (key in keyBlocks) {
    res = !keyBlocks[key]();
  }

  return res;
}

function setMath(element){
  let items = MathJax.startup.document.getMathItemsWithin(element);
  for (let item of items) {
    let root = item.typesetRoot;
    root.setAttribute("contenteditable", false);
  }
}

function removeMath(element, doc = document){
  if (MathJax) {
    let items = MathJax.startup.document.getMathItemsWithin(element);
    for (let item of items) {
      // console.log(item);
      let textNode = doc.createTextNode(`${item.start.delim}${item.math}${item.end.delim}`);
      let root = item.typesetRoot;
      let parent = root.parentNode;
      if (parent){
        parent.replaceChild(textNode, root);
      }
    }
  }
}

document.removeMath = (e) => {
  removeMath(e);
}

let selected_editor = null;
let selectEditor = (editor) => {
  if (selected_editor) {
    selected_editor.unselect();
  }
  selectEditor = editor;
}

function makeEditor(element, metaCmds = defaultMetaCmds, keyBlocks = defaultKeyBlocks) {
  let textValue = "";
  let meta = false;
  let setting = false;

  let selected = false;
  let focused = false;


  let updateValue = (value) => {
    textValue = value;
    const event = new Event("change");
    element.dispatchEvent(event);
  }

  let edit = (v) => {
    element.toggleAttribute("contenteditable", v);
  }

  let select = () => {
    if (!setting & !selected) {
      if (selected_editor && selected_editor.selected) {
        selected_editor.unselect();
      }
      selected_editor = element;
      setting = true;
      removeMath(element);
      edit(true);
      if (!focused) {
        element.focus();
      }
      setting = false;
      selected = true;
      const event = new Event("select");
      element.dispatchEvent(event);
    }
  }

  let typeset = () => {
    if (MathJax) {
      MathJax.typeset([element]);
    }
  }

  let unselect = () => {
    if (!setting) {
      setting = true;
      edit(false);
      typeset();
      if (focused) {
        element.blur();
      }
      setting = false;
      selected = false;
      const event = new Event("unselect");
      element.dispatchEvent(event);
    }
  }


  Object.defineProperty(element, "selected", {
    get: () => selected
  })
  Object.defineProperty(element, "value", {
    get: () => textValue,
    set: (v) => {
      textValue = v;
      element.innerHTML = v;
      unselect();
    }
  });
  Object.defineProperty(element, "rich", {
    get: () => {
      return getRichText(textValue);
    },
  });

  //
  // element.addEventListener("contextmenu", (e) => {
  //   select();
  //   e.preventDefault()
  // });
  element.addEventListener("dblclick", (e) => {
    select()
  });

  element.addEventListener("focusin", (e) => {
    focused = true;
  });
  element.addEventListener("focusout", (e) => {
    focused = false;
    if (selected) {
      unselect()
    }
  });


  element.addEventListener("keydown", (e) => {
    let key = e.key;
    if (key == "Meta") {
      meta = true;
    }
    if (meta) {
      if (key in metaCmds) {
        let cmd = metaCmds[key]();
        if (!cmd) {
          e.preventDefault();
        }
      }
    } else if (!validate(key, element, metaCmds, keyBlocks)){
      e.preventDefault();
    }
  });

  element.addEventListener("paste", (e) => {
    let clip = (event.clipboardData || window.clipboardData);
    pasteInputParser(clip, element);
    e.preventDefault();
  });

  element.addEventListener("keyup", (e) => {
    if (e.key == "Meta") {
      meta = false;
    }
    textValue = element.innerHTML
  });

  element.select = select;
  element.unselect = select;

}


export {makeEditor}
