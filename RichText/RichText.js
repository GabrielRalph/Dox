import {SvgPlus} from "../4.js"

function addSelection(s, e, snode, enode) {
  let sel = window.getSelection();
  let range = document.createRange();

  range.setStart(snode, s);
  range.setEnd(enode, e);

  sel.addRange(range);
}

function setSelection(s, e, snode, enode) {
  let sel = window.getSelection();
  sel.removeAllRanges();
  addSelection(s, e, snode, enode);
}

function select(range) {
  let s = window.getSelection();
  s.removeAllRanges();
  s.addRange(range);
}

function getSelection(range = window.getSelection().getRangeAt(0)){
    let enode = range.endContainer;
    let snode = range.startContainer;

    let s = range.startOffset;
    let e = range.endOffset;
    return [s, e, snode, enode, range];
}

function removeRightOf(element, to) {
  console.log(element, to);
  while (element.nextSibling && element.nextSibling != to) {
    element.nextSibling.remove();
  }
}
function removeLeftOf(element, to) {
  while (element.previousSibling && element.previousSibling != to) {
    element.previousSibling.remove();
  }
}

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

function sameFormat(e1, e2) {
  return false;
}

function isChar(key) {
  return key.length == 1;
}
function isMeta(key) {
  return key === "Meta"
}

class RichText extends SvgPlus {
  constructor(el) {
    super(el);

    this.addEventListener("paste", (e) => false)
    this.addEventListener("cut", (e) => false)
    this.addEventListener("drag", (e) => false)
    this.addEventListener("dragover", (e) => false)
    this.addEventListener("dragleave", (e) => false)

    let meta = false;
    this.addEventListener("keydown", (e) => {
      let key = e.key;

      if (isMeta(key)) meta = true;
      else {
        if (meta) {

        } else if(isChar(key)) {

          if (this.childNodes.length == 1 &&
              (this.firstChild instanceof Text ||
               this.firstChild.tagName == "BR")
             ) {
            let text = this.innerHTML;
            this.innerHTML = "";
            let line = this.addLine();
            line.innerHTML = text;

            let range = new Range();
            range.setStartAfter(line);
            select(range);
          }
        }
      }

    })

    this.addEventListener("keyup", (e) => {
      if (isMeta(e.key)) meta = false;
    })
  }

  addLine(){
    let div = new SvgPlus("div");
    div.createChild("br");

    this.appendChild(div);

    return div;
  }

  onconnect(){
    this.innerHTML = "";
    this.addLine(false);
  }

  isFormatNode(node) {
    return node instanceof HTMLElement && node.tagName == "I" && node.parentNode == this;
  }
  isRootText(node) {
    return node instanceof Text && this == node.parentNode;
  }
  isFormatText(node) {
    return node instanceof Text && this == node.parentNode.parentNode;
  }
  isOwnText(node) {
    return this.isRootText(node) || this.isFormatText(node);
  }
  sameFormat(node) {
    return this.isFormatNode(node)
  }

  nextText(node) {
    if (this.isRootText(node)) {

    }
  }
  prevText(node) {
    if (this.isRootText(node)) {
      if (node.previousSibling) {
        node = node.previousSibling;
        if (this.isFormatNode(node)) {
          node = node.lastChild;
        }
      }
    } else if (this.isFormatText(node)) {
      if (node.previousSibling) {
        node = node.previousSibling;
      } else {
        node = node.parentNode;
        if (node.previousSibling) {
          node = node.previousSibling;
          if (this.isFormatNode(node)) {
            node = node.lastChild;
          }
        }
      }
    }
  }

  get format(){

  }

  split(node, i) {
    splitElement(node, i, this)
  }


  removeSelection(forward) {
    let [s, e, snode, enode, range] = getSelection();

    if (s == e && snode == enode) {
      if (this.isOwnText(snode)) {
        if (s == 0) {

        } else {
          if (forward) {
            snode.data = snode.data.slice(0, s) + snode.data.slice(e + 1);
          } else {
            s -= 1;
            snode.data = snode.data.slice(0, s) + snode.data.slice(e);
            e = s;
          }
        }
      }
      setSelection(s, e, snode, enode);
    } else {
      console.log('cccc');
      range.extractContents(false);
    }

  }

  // insert only text
  insertText(str){
    let [s, e, snode, enode] = getSelection();

    //one point selection in same node
    if (snode == enode && s == e) {

        // one point selection in a text node
        if (this.isOwnText(snode)) {
            let oldText = snode.data
            snode.data = oldText.slice(0, s) + str + oldText.slice(s)
            s += str.length;
            e = s;

        // one point selection in empty root
      } else if (this == snode || this.isFormatNode(snode)) {
            let newNode = document.createTextNode(str)
            snode.appendChild(newNode);
            snode = newNode;
            enode = newNode;
            s = str.length;
            e = s;
        } else {
          throw "inside another empty node"
        }


    // same node selection range in text
    } else if (snode == enode && this.isOwnText(snode)) {
        snode.data = snode.data.slice(0, s) + str + snode.data.slice(e);
        e = s + str.length;

    // selection from text node into another text node
    } else if (this.isRootText(snode) && this.isRootText(enode)) {
        snode.data = snode.data.slice(0, s) + str + enode.data.slice(e);

        removeRightOf(snode, enode);
        snode.nextSibling.remove();

        enode = snode;
        e = s + str.length;

    // selection between a text node and a format text node
    } else if (this.isRootText(snode) && this.isFormatText(enode)) {
      console.log('text formate');
        enode.data = enode.data.slice(e);

        removeLeftOf(enode);
        let eformat = enode.parentNode;

        snode.data = snode.data.slice(0, s) + str;
        removeRightOf(snode, eformat);

        enode = snode;
        e = s + str.length;

    // from format text node into a text node
    } else if (this.isFormatText(snode) && this.isRootText(enode)) {
      snode.data = snode.data.slice(0, s);
      enode.data = str + enode.data.slice(e);

      removeRightOf(snode);
      let sformat = snode.parentNode;
      removeRightOf(sformat, enode);

      snode = enode;
      s = 0;
      e = str.length;

    // from format text node to another format text node
    } else if (this.isFormatText(snode) && this.isFormatText(enode)) {
      snode.data = data.slice(0, s);
      removeRightOf(snode);

      enode.data = data.slice(e);
      removeLeftOf(enode);

      let eformat = enode.parent;
      let sformat = snode.parentNode;

      if (sameFormat(snode.parentNode, enode.parentNode))  {
        snode.data += str;
        enode = snode;
        e = s + str.length;

        removeRightOf(sformat, eformat);
        while (eformat.childNodes.length > 0) {
          sformat.appendChild(eformat.firstChild);
        }
        eformat.remove();
      } else {
        removeLeftOf(sformat, eformat);
        let newNode = document.createTextNode(str);
        sformat.after(newNode);
        snode = newNode;
        enode = snode;
        s = 0;
        e = str.length;
      }
    }

    setSelection(s, e, snode, enode);
  }


  addSelection(s, e, snode, enode) {
    addSelection(s, e, snode, enode);
  }


  static parse(value){
    if (typeof value === "string") {

    }
  }
}

SvgPlus.defineHTMLElement(RichText);
