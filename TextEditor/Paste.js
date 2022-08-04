import {getRichLines, isRich, getRichTextAnchor} from './RichText.js'
import {log} from "./Log.js"

function splitElement(leftNode, index, end) {
  let res = [null, null, null];

  let endnode = leftNode;

  // node exactly right of the split
  let nodeb = null;

  let split = (node, i) => {
    if (node == end) return;
    if (node == document.body) return;

    if (node instanceof Text && typeof i === "number"){
      let texta = node.data.slice(0, index)
      let textb = node.data.slice(index);
      node.data = texta;
      nodeb = document.createTextNode(textb);
      node.after(nodeb);
    } else if (i instanceof Node && node.contains(i)) {
      let children = [... node.childNodes];

      if (children[children.length - 1] != i) {
        let other = document.createElement(node.tagName);

        let child = children.pop();
        while (child != i) {
          other.prepend(child);
          child = children.pop();
        }
        node.after(other);
        endnode = node;
      }

      split(node.parentNode, node);
    }
  }

  split(leftNode, index);

  res = [endnode, nodeb]
  return res;
}

function getLineDiv(node) {
  return getRichTextAnchor(node).parentNode;
}

function splitLine(node, i) {
  let lineDiv = getLineDiv(node);
  return splitElement(node, i, lineDiv)
}

function setSelection(sanc, eanc) {
  while (!(sanc instanceof Text)) sanc = sanc.lastChild;
  let sel = window.getSelection();
  sel.removeAllRanges();
  let range = document.createRange();

  range.setStart(sanc, sanc.data.length);
  range.setEnd(eanc, 0);

  sel.addRange(range);
}

function split_line(node, range, line) {
  let enode = range.endContainer;
  let snode = range.startContainer;

  let s = range.startOffset;
  let e = range.endOffset;

  let left_text_anchor = null;
  let right_text_anchor = null;
  let left_line_anchor = null;
  let right_line_anchor = null;

  //single point
  if (s == e && snode == enode) {
    // in text node
    if (snode instanceof Text) {
      [right_line_anchor, right_text_anchor] = splitElement(snode, s);


    // in root line
    } else if (snode == line) {

    // some rich text element
    } else {

    }
  } else {

  }

}

function insert(lines, root, range = window.getSelection().getRangeAt(0)) {
  let enode = range.endContainer;
  let snode = range.startContainer;

  let s = range.startOffset;
  let e = range.endOffset;

  let sameNode = enode == snode;
  let onePoint = sameNode && s == e;

  console.log(sameNode && onePoint);

  // one point selection in the root
  if (onePoint && enode == root) {
    //add new lines
    while (lines.length > 0) {
      let div = document.createElement("DIV");
      div.appendChild(lines.shift());
      root.appendChild(div);
    }

    return;
  }


  //split up
  let [stn, nodeb] = splitElement(snode, s, root);
  if (sameNode) {
    enode = nodeb;
    if (!onePoint) {
      e -= s;
    }
  }

  let etn = stn.nextSibling;
  if (!onePoint) {
    [etn, enode] = splitElement(enode, e, root);
    etn = etn.nextSibling;

    // remove text elements right of start text node
    while (stn.nextSibling && stn.nextSibling != etn) {
      stn.nextSibling.remove();
    }
  }

  let sanc = getRichTextAnchor(snode);
  let eanc = getRichTextAnchor(enode);

  if (sanc == stn) {
    let div = document.createElement("DIV");
    while (sanc.previousSibling) {
      div.prepend(sanc.previousSibling);
    }
    etn.parentNode.replaceChild(div, stn);
    div.appendChild(sanc);
    stn = div;
  }
  if (eanc == etn) {
    let div = document.createElement("DIV");
    while (eanc.nextSibling) {
      div.appendChild(eanc.nextSibling);
    }
    etn.parentNode.replaceChild(div, etn);
    div.prepend(eanc)
    etn = div;
  }


  // single line then move text from end to start and remove end line
  let l0 = lines.shift();
  if (lines.length == 0){
    let next = eanc;
    while (isRich(next)) {
      let nn = next.nextSibling;
      sanc.after(next);
      next = nn;
    }
    etn.remove();

  // multiple lines put line elements into end line
  } else {
    let ln = lines.pop();
    eanc.before(ln);
  }
  sanc.after(l0);

  //add new lines
  while (lines.length > 0) {
    let div = document.createElement("DIV");
    div.appendChild(lines.pop());
    stn.after(div);
  }


  setSelection(sanc, eanc);
  // }
}

function insert_one_line(line, root){

  let [left_ta, right_a] = split_line()

  left_ta.after(el)
}

function insertHTML(html, element){
  log("insert html");
  let parser = new DOMParser();
  try {
    let doc = parser.parseFromString(html, "text/html");
    let body = doc.body;

    let lines = getRichLines(body);
    insert(lines, element);
  } catch(e) {
    console.log(e);
  }
}

function insertText(text, element) {
  let lines = text.split("\n");
  let nLines = [];
  for (let line of lines) {
    nLines.push(document.createTextNode(line));
  }

  insert(nLines, element);
}

function pasteInputParser(clip, element){
  // let types = clip.types;
  let range = window.getSelection().getRangeAt(0);

  let html = clip.getData("text/html");
  let text = clip.getData("text");

  if (html) {
    insertHTML(html, element);
  } else if (text && text.length > 0) {
    insertText(text, element);
  }
}

export {pasteInputParser}
