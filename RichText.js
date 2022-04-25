function getText(element){
  let text = "";
  if (element instanceof Text) {
    text = element.data;
  } else {
    for (let child of element.childNodes) {
      text += getText(child);
    }
  }
  return text;
}

function toMathText(el) {
  let text = getText(el);
  if (text) {
    let display = el.getAttribute("display");
    let dl = display ? " $$" : "$"
    let dr = display ? "$$ " : "$"
    text = `${dl}${text}${dr}`;
  }
  return text;
}

function applyProps(toEl, fromEl, filter) {
  let sets = 0;
  for (let key in filter) {
    if (key == "style") {
      for (let skey in filter.style) {
        let style = fromEl.style[skey];
        if (style) {
          toEl.style.setProperty(skey, style);
          sets++;
        }
      }
    } else {
      let prop = fromEl.getAttribute(key);
      if (prop) {
        toEl.setAttribute(key, prop);
        sets++;
      }
    }
  }
  return sets;
}


const RICH_LEAFS = {
  "MJX-CONTAINER": (element) => {
    let math = toMathText(element);
    return document.createTextNode(math);
  },
  "BR": (element) => {
    return document.createElement("BR");
  },

  "text": (element) => {
    return document.createTextNode(element.data);
  }
}
const RICH = {
  "B": (element) => {
    let b = document.createElement("b");
    applyProps(b, element, {
      style: {
        "font-style": true,
      }
    })
    return b;
  },
  "I": (element) => {
    let i = document.createElement("i");
    return i;
  },
  "S": (element) => {
    let s = document.createElement("S");
    let sets = applyProps(b, element, {
      style: {
        "font-style": true,
        "--font-size-pt": true,
        "color": true,
      }
    })
    if (sets == 0) {
      s = new DocumentFragment();
    }
    return s;
  },
  "SPAN": (element) => {
    let fragment = new DocumentFragment()
    return fragment
  }
}


function isRichLeaf(node) {
  return node instanceof Node && (node instanceof Text || node.tagName in RICH_LEAFS);
}

function isRich(node) {
  return node instanceof Node && (isRichLeaf(node) || node.tagName in RICH);
}

function getRich(element) {
  let rich = null;
  let name = element.tagName;
  if (element instanceof Text) {
    rich = RICH_LEAFS.text(element);
  } else if (name in RICH_LEAFS){
    rich = RICH_LEAFS[name](element);
  } else if (name in RICH) {
    rich = RICH[name](element);
    for (let child of element.childNodes) {
      let rchild = getRich(child);
      if (rchild) {
        rich.appendChild(rchild);
      }
    }
  } else {
    rich = RICH_LEAFS.text(element);
  }
  return rich;
}

function mergeLine(line){
  if (line instanceof Text) {
    return line;
  }

  let e1 = line.firstChild;
  while (e1 && e1.nextSibling) {
    let e2 = e1.nextSibling;
    if (e1 instanceof Text && e2 instanceof Text) {
      e1.data += e2.data;
      e2.remove();
      e2 = e1;
    } else if (e1.tagName == e2.tagName) {
      e1.innerHTML += e2.innerHTML;
      e2 = e1;
    } else {
      mergeLine(e1);
    }
    e1 = e2;
  }
}

function getRichLine(div) {
  let text = new DocumentFragment();
  for (let child of div.childNodes) {
    let rtext = getRich(child);
    text.appendChild(rtext);
  }
  return text;
}

function getRichLines(body){
  let lines = []
  let rline =  new DocumentFragment();
  for (let child of body.childNodes) {
    if (isRich(child)) {
      if (!rline) {
        rline = new DocumentFragment();
      }
      let rich = getRich(child);
      rline.append(rich);
    } else {
      if (rline) {
        lines.push(rline);
        rline = null;
      }
      lines.push(getRichLine(child));
    }
  }

  if (rline) {
    lines.push(rline);
  }

  for (let line of lines) {
    mergeLine(line);
  }

  return lines;
}

function getRichTextBox(element){
  let richText = new DocumentFragment();
  let lines = getRichLines(element);
  console.log(lines);
  let i = 0;
  for (let line of lines) {
    if (i > 0) {
      let div = document.createElement("DIV");
      div.appendChild(line);
      line = div;
    }
    richText.appendChild(line);
    i++;
  }
  return richText;
}

function getRichText(element) {
  console.log(element);
  if (typeof element === "string") {
    let parser = new DOMParser();
    element = parser.parseFromString(element, "text/html")
    element = element.body;
    console.log(element);
  }
  let frag = getRichTextBox(element);
  let div = document.createElement("DIV");
  div.appendChild(frag);
  return div.innerHTML;
}

function getRichTextAnchor(node) {
  while (node.parentNode && isRich(node.parentNode)) {
    node = node.parentNode;
  }
  return node;
}

export {getText, toMathText, isRich, getRich, getRichLine, getRichLines, getRichText, getRichTextAnchor}
