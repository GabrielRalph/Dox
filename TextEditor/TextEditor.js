import {SvgPlus} from "../SvgPlus/4.js"
import {addKeyCommands} from "./key-cmds.js"

let x, y = 0;
window.addEventListener("mousemove", (e) => {
  x = e.x;
  y = e.y;
})
window.addEventListener("click", (e) => {
  x = e.x;
  y = e.y;
})

addKeyCommands({
  "Enter": (e) => {
    if (isSelected()) {
      e.preventDefault();
      let range = getRange();
      let end = range.endContainer;
      let dend = 1;
      if (end instanceof Text) {
        let offset = range.endOffset;
        dend = end.data.length - offset;
        while (end) {
          end = end.nextSibling;
          if (end != null && !(end instanceof Text && end.data.length == 0)) {
            break;
          }
        }
      }
      // console.log("%cdelta end, next sibling", "color: red");
      // console.log(dend, end);

      let frag = new DocumentFragment();
      frag.append(document.createElement("br"));
      let text = document.createTextNode("");
      frag.append(text);

      if (dend === 0 && end === null) {
        frag.append(document.createElement("br"));
      }

      insertAtSelection(frag);
      setSelectionRange(text, 0);
      return true;
    }
  },
  "Shift+{": () => {
    if (isSelected()){
      return insertBrackets("{","}");
    }
  },
  "Shift+$": () => {
    if (isSelected()){
      return insertBrackets("$","$");
    }
  },
  'Shift+"': () => {
    if (isSelected()){
      return insertBrackets('"','"');
    }
  },
  'Shift+(': () => {
    if (isSelected()){
      return insertBrackets('(',')');
    }
  },
  'Meta+z': () => SelectedEditor !== null ? "stop" : false
});


function insertBrackets(startBracket, endBracket) {
  let sel = window.getSelection();
  let range = sel.getRangeAt(0);
  let s = range.startOffset;
  let e = range.endOffset;
  let end = range.endContainer;
  let start = range.startContainer;

  if (end != start || e > s) {
    end.data = end.data.slice(0, e) + endBracket + end.data.slice(e);
    start.data = start.data.slice(0, s) + startBracket + start.data.slice(s);

    // update selection
    setSelectionRange(start, s + 1, end, e + startBracket.length);

    return true;
  } else {
    return false;
  }
}

function getSPath(node, root) {
  let path = [];
  while (node != root) {
    let n = node;
    let index = 0;
    while (n.previousSibling) {
      n = n.previousSibling;
      index ++;
    }
    path.unshift(index);
    node = node.parentNode;
  }


  let vpath = [];
  let offset = 0;
  let stop = false;
  for (let index of path) {
    if (stop) {
      for (let i = 0; i < index; i++) {
        let child = node.childNodes[index];
        offset += node.textContent.length;
      }
    } else {
      vpath.push(index);
    }
    node = node.childNodes[index];
    stop = !(node instanceof Text) && !(node.tagName.toLowerCase() in AllowedTags);
  }

  // for (let i = path.length)
  console.log(vpath, offset);
  // console.log(path);
  // if (node == root) return [];
  //
  // let index = 0;
  //
  // let path = getSPath(node.parent, root);
  //
  // if (node in AllowedTags) {
  //   path.push(index);
  // } else {
  //   path[path.length - 1] += sIndx;
  // }
  //
  // return path;
}


let SelectedEditor = null;
function select(element){
  // reselection
  if (SelectedEditor !== null && SelectedEditor.isSameNode(element)) {
    return;
  }

  unselect();
  SelectedEditor = element;

  element.value = element.value;
  // console.log(x, y);
  // let carrot = document.caretPositionFromPoint(x, y);
  // console.log(carrot);

  element.toggleAttribute("edit", true);
  element.setAttribute("contenteditable", true);
  if (!element.focused) {
    element.focus();
  }

  const event = new Event("select");
  element.dispatchEvent(event);
}
function unselect(){
  let element = SelectedEditor
  if (element) {
    SelectedEditor = null;
    element.toggleAttribute("edit", false);
    element.removeAttribute("contenteditable");
    typeset(element);
    if (element.focused) {
      element.blur();
    }
    const event = new Event("unselect");
    element.dispatchEvent(event);
  }
}
function typeset(element){
  if (MathJax) {
    MathJax.typeset([element]);
  }
}
function isSelected(element = null) {
  if (element === null) return SelectedEditor !== null;
  return element.isSameNode(SelectedEditor);
}

const AllowedTags = {"br": true, "b": true, "i": true,}
const AllowedStyles = {
  color: (colorIn) => {
    let color = null;
    // if (typeof colorIn === "string") {
    //   if(!colorIn.match(/((rgb\(\s*0\s*,\s*0\s*,\s*0\s*\))|(#000000)|(#000))/)) {
    //     color = colorIn;
    //   }
    // }
    // console.log(color);
    return color;
  }
};

function getRange() {
  const selection = window.getSelection();
  return selection.getRangeAt(0)
}

function setRange(range) {
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function insertAtSelection(element) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  selection.deleteFromDocument();
  selection.getRangeAt(0).insertNode(element);
}

function setSelectionRange(start, startIndex = 0, end = start, endIndex = 0) {
  let r = document.createRange();
  r.setStart(start, startIndex)
  r.setEnd(end, endIndex);
  setRange(r);
}


function sanitizePasteHTML(html) {
  var parser = new DOMParser();
  let doc = parser.parseFromString(html, 'text/html');
  let init = true;
  let sanitizeNode = (node) => {
    let items = MathJax.startup.document.getMathItemsWithin(node);
    let sanitized = new Text(node.data);
    // console.log(node);
    if (!(node instanceof Text)) {
      let children = [...node.childNodes]
      if (node.tagName.toLowerCase() in AllowedTags) {
        sanitized = document.createElement(node.tagName);
        for (let styleKey in AllowedStyles) {
          let value = AllowedStyles[styleKey](node.style[styleKey]);
          if (value != null) {
            sanitized.style.setProperty(styleKey, value);
          }
        }
        for (let child of children) {
          sanitized.appendChild(sanitizeNode(child));
        }
      } else {
        sanitized = new DocumentFragment();
        for (let child of children) {
          sanitized.append(sanitizeNode(child));
        }
      }
    }

    return sanitized;
  }

  let body = doc.body;
  let parsed = sanitizeNode(body);

  return parsed;
}
function paste(e){
  if (isSelected()) {
    var clip = e.clipboardData || window.clipboardData;
    if (clip) {
      let html = clip.getData("text/html");
      if (html !== null) {
        e.preventDefault();
        let element = sanitizePasteHTML(html);
        if (element != null) {
          insertAtSelection(element);
        }
      } else {
        let text = clip.getData("text/plain");
        let node = document.createTextNode(text);
        insertAtSelection(node);
      }
    }
  }
}

function makeEditor(element) {
  // watch for focus
  let focused = false;
  Object.defineProperty(element, "focused", {
    get: () => focused
  })
  element.addEventListener("focusin", (e) => {
    focused = true;
  });
  element.addEventListener("focusout", (e) => {
    focused = false;
    unselect();
  });

  // select unselect
  Object.defineProperty(element, "selected", {
    get: () => isSelected(element),
    set: (v) => {
      let oldv = isSelected(element);
      if (oldv && !v) unselect();
      else if (!oldv && v) select(element);
    }
  });

  // value
  let textValue = "";
  Object.defineProperty(element, "value", {
    get: () => textValue,
    set: (v) => {
      textValue = v;
      element.innerHTML = v;
      if (!isSelected(element)) {
        typeset(element);
      }
    }
  });
  element.addEventListener("keyup", (e) => {
    if (isSelected(element)) {
      textValue = element.innerHTML;
    }
  });

  element.addEventListener("dblclick", (e) => {
    select(element);
    e.preventDefault();
  });

  element.addEventListener("paste", (e) => {
    paste(e);
  });
}


export {makeEditor}
