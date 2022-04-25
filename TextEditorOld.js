import {SvgPlus} from "./4.js"

let defaultMetaCmds =  {
  "b": () => false,
  "i": () => false,
  "v": () => true,
}

let defaultKeyBlocks = {
  "Enter": () => false,
  "{": () => {
    return insertDelim("{","}")
  },
  "(": () => {
    return insertDelim("(",")");
  },
  "$": () => {
    return insertDelim("$","$")
  },
  '"': () => {
    return insertDelim('"','"')
  },

}

function insertDelim(startDelim, endDelim) {
  let sel = window.getSelection();
  let range = sel.getRangeAt(0);
  let s = range.startOffset;
  let e = range.endOffset;
  if (e > s) {
    let end = range.endContainer;
    end.data = end.data.slice(0, e) + endDelim + end.data.slice(e);

    let start = range.startContainer;
    start.data = start.data.slice(0, s) + startDelim + start.data.slice(s);

    let r = document.createRange();
    r.setStart(start, s + 1)
    r.setEnd(end, e + startDelim.length);
    sel.removeAllRanges();
    sel.addRange(r);

    // console.log(nl, ne);
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

function removeMath(element){
  let items = MathJax.startup.document.getMathItemsWithin(element);
  for (let item of items) {
    let textNode = document.createTextNode(`${item.start.delim}${item.math}${item.end.delim}`);
    let root = item.typesetRoot;
    let parent = root.parentNode;
    if (parent){
      parent.replaceChild(textNode, root);
    }
  }
}

function makeEditor(element, metaCmds = defaultMetaCmds, keyBlocks = defaultKeyBlocks) {
  let textValue = "";
  let meta = false;
  let setting = false;
  let focus = false;

  let change = () => {
    const event = new Event("change");
    element.dispatchEvent(event);
  }
  let typeset = () => {
    setting = true;
    textValue = element.innerHTML;
    change();
    MathJax.typeset([element]);
    setMath(element);
    setting = false;
  }

  // element.setAttribute("contenteditable", true);
  Object.defineProperty(element, "edit", {
    set: (v) => {
      if (!v) element.removeAttribute("contenteditable");
      else element.setAttribute("contenteditable", true)
    }
  })
  Object.defineProperty(element, "value", {
    get: (v) => textValue,
    set: (v) => {
      element.innerHTML = v;
      element.blur();
      typeset();
    }
  })

  element.addEventListener("contextmenu", (e) => {
    if (!focus) {
      if (!setting) {
        removeMath(element);
        element.edit = true;
        const el = new Event("select");
        element.dispatchEvent(el);
        element.focus();
        e.preventDefault();
      }
    }
  });


  element.addEventListener("focusin", (e) => {
    focus = true;
    if (!setting) {
      removeMath(element);
    }
  });

  element.addEventListener("focusout", (e) => {
    focus = false;
    element.edit = false;
    typeset();
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
    console.log(e);
    textValue = element.innerHTML
  })
  element.addEventListener("keyup", (e) => {
    if (e.key == "Meta") {
      meta = false;
    }
    textValue = element.innerHTML
  });

}

export {makeEditor}
