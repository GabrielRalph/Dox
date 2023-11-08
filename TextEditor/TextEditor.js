import {SvgPlus, Vector} from "../SvgPlus/4.js"
import {addKeyCommands} from "./key-cmds.js"
import {handlePaste} from "./Paste.js"
import {insertAtSelection, insertBrackets, setSelectionRange, getRange} from "./Selection.js"

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
  'Meta+z': () => SelectedEditor !== null ? "stop" : false,
});

let overlay = {
  position: "fixed",
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  "pointer-events": "none",
}

let sHighlight = new SvgPlus("div");
let assets = new SvgPlus("div");
document.body.appendChild(assets);
assets.styles = overlay;
let cpe = assets.createChild("svg").createChild("defs").createChild("clipPath",{
  id: "selection-mask",
  clipPathUnits: "objectBoundingBox",
  content: `<path d="M0.5,1
      C 0.5,1,0,0.7,0,0.3
      A 0.25,0.25,1,1,1,0.5,0.3
      A 0.25,0.25,1,1,1,1,0.3
      C 1,0.7,0.5,1,0.5,1 Z" />`
});
sHighlight.styles = overlay;
sHighlight.styles = {
  background: "#00000011",
  // opacity: 0.3,
  "clip-path": "url(#selection-mask)",
}

function updateClip(el = SelectedEditor){
  let bbox = el.getBoundingClientRect();
  let ssize = new Vector(window.innerWidth, window.innerHeight);
  let s = new Vector(bbox);
  let size = new Vector(bbox.width, bbox.height);
  [s, size] = [s, size].map(v => v.div(ssize));
  let r = parseFloat(window.getComputedStyle(el).getPropertyValue("border-radius"));
  r = (new Vector(r)).div(ssize);
  let p = [
    s.add(0, r.y),
    s.add(0, size.y - r.y),
    s.add(r.x, size.y),
    s.add(size.x - r.x, size.y),
    s.add(size.x, size.y - r.y),
    s.add(size.x, r.y),
    s.add(size.x - r.x, 0),
    s.add(r.x, 0)
  ]
  cpe.innerHTML = `<path
  d = "M0,0L1,0L1,1L0,1ZM${p[0]}L${p[1]}A${r},0,0,0,${p[2]}L${p[3]}A${r},0,0,0,${p[4]}L${p[5]}A${r},0,0,0,${p[6]}L${p[7]}A${r},0,0,0,${p[0]}" ><\path>`
}
function highlight(){
  let next = () => {
    if (SelectedEditor != null) {
      updateClip();
      window.requestAnimationFrame(next);
    } else {
      sHighlight.remove();
    }
  }
  window.requestAnimationFrame(next);
  document.body.appendChild(sHighlight);
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

let selectTime = 0;
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

  selectTime = window.performance.now();
  // document.body.style.setProperty("pointer-events", "none");
  element.toggleAttribute("edit", true);
  element.setAttribute("contenteditable", true);
  if (!element.focused) {
    element.focus();
  }

  highlight(element);
  console.log("text mode");

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
    parseInputHTML(element);
    MathJax.typeset([element]);
  }
}
function isSelected(element = null) {
  if (element === null) return SelectedEditor !== null;
  return element.isSameNode(SelectedEditor);
}

function paste(e){
  if (isSelected()) {
    handlePaste(e);
  }
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

function parseInputHTML(root) {
  for (let child of root.childNodes) {
    parseInputHTML(child);
  }
  if (root instanceof Element) {
    root.style.setProperty("font-size", null);
    if (root.tagName.toLowerCase() == "span")  {
      let frag = new DocumentFragment();
      for (let child of root.childNodes) {
        frag.append(child);
      }
      root.parentNode.replaceChild(frag, root);
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
    let dt = window.performance.now() - selectTime;
    if (dt > 100) {
      unselect();
    } else {
      console.log("block event");
      element.focus();
      e.preventDefault()
    }
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
      parseInputHTML(element);
      textValue = element.innerHTML;
    }
  });

  // element.addEventListener("dblclick", (e) => {
  //   select(element);
  //   e.preventDefault();
  // });

  element.addEventListener("paste", (e) => {
    paste(e);
  });

  element.select = () => select(element);
}

let editorTAGS = {
  "INPUT": true,
  "TEXTAREA": true,
}
window.isEditingText = () => {
  let inputedit = false;
  if (document.activeElement) inputedit = document.activeElement.tagName in editorTAGS;
  return SelectedEditor != null || inputedit;
}

export {makeEditor}
