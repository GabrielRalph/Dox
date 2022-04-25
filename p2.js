function splitElementTo() {

}

function splitLine(){
  return [left_line, right_line, left_ta, right_ta];
}
function splitText(){
  return [left_ta, right_ta]
}

// removes everything within selection
// returns a new range, single point in a line
function removeSelection(range = window.getSelection().getRangeAt(0)){


  let newRange = "";

  return newRange;
}

// Assume insert is for one point in a single line
function insertSelection(lines, range = window.getSelection().getRangeAt(0)){
  let left_ta = null;
  let right_ta = null;
  let left_line = null;
  let right_line = null;

  let lineDiv = null;

  if (lines.length > 1) {
    let line = lines[0];
    // split text inside the line div.
    [left_ta, right_ta] = splitText();

    // no text anchors, hence empty line div.
    if (left_ta == null && right_ta == null) {
      lineDiv.appendChild()

    // insert at end
    } else if (left_ta == null) {

    } else {

    }

  } else {
    [left_line, right_line, left_ta, right_ta] = splitLine();
  }



}
