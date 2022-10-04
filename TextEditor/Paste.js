import {insertAtSelection} from "./Selection.js"

function sanitizePasteText(text) {
  let node = null;
  if (typeof text === "string" && text.length > 0) {
    let tlines = text.split("\n");
    if (tlines.length == 1) {
      node = document.createTextNode(text);
    } else {
      node = document.createDocumentFragment();
      for (let line of tlines) {
        console.log(line);
        if (node.childNodes.length > 0) {
          node.append(document.createElement('br'));
        }
        node.append(document.createTextNode(line));
      }
    }
  }
  return node;
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

export function handlePaste(e){
  let element = null;

  // check for clip board data
  let clip = e.clipboardData || window.clipboardData;
  if (clip) {
    let html = clip.getData("text/html");
    if (typeof html === "string" && html.length > 0) {
      element = sanitizePasteHTML(html);
    } else {
      let text = clip.getData("text/plain");
      element = sanitizePasteText(text);
    }
  }

  e.preventDefault();
  insertAtSelection(element);
}
