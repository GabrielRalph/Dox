export function getRange() {
  const selection = window.getSelection();
  return selection.getRangeAt(0)
}

export function insertBrackets(startBracket, endBracket) {
  let range = getRange();
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

export function setRange(range) {
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

export function insertAtSelection(element) {
  if (element != null) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    selection.deleteFromDocument();
    selection.getRangeAt(0).insertNode(element);
  }
}

export function setSelectionRange(start, startIndex = 0, end = start, endIndex = 0) {
  let r = document.createRange();
  r.setStart(start, startIndex)
  r.setEnd(end, endIndex);
  setRange(r);
}
