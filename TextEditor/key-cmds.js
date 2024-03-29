let KeyCmds = {

}

let HeldKeys = {

};

function addKey(key) {
  HeldKeys[key] = keyOrder;
  keyOrder += 1;
}
function removeKey(key) {
  delete HeldKeys[key];
  keyOrder -= 1;
}

let lastFocus = document.hasFocus();
let next = () => {
  let focus = document.hasFocus();
  if (focus && !lastFocus) {
    focusIn()
  } else if (!focus && lastFocus) {
    focusOut();
  }
  lastFocus = focus;
  window.requestAnimationFrame(next);
}
window.requestAnimationFrame(next);



document.addEventListener("visibilitychange", () => {
  console.log(document.visibilityState);
});

let keyOrder = 0;
window.addEventListener("keydown", keyDown);

window.addEventListener("keyup", keyUp)

window.addEventListener("mousedown", (e) => {
  addKey("click");
  runKeyCommand(e);
});
window.addEventListener("mousedown", (e) => {
  removeKey("click");
  runKeyCommand(e);
})
window.addEventListener("contextmenu", (e) => {
  addKey("ctx");
  runKeyCommand(e);
  removeKey("ctx");
})


function keyDown(e){
  if (!(e.key in HeldKeys)) {
    addKey(e.key);
    runKeyCommand(e);
  }
}

function releaseAllKeys(){
  HeldKeys = {};
  keyOrder = 0;
}

function focusIn(){
  releaseAllKeys();
  // console.log("in");
}

function focusOut() {
  releaseAllKeys();
  // console.log("out");
}

function keyUp(e){
  if (e.key === "Meta") {
    releaseAllKeys();
  } else {
    removeKey(e.key);
  }
  runKeyCommand(e);
}

function getKeyPhrase() {
  let phrase = "";
  let keys = Object.keys(HeldKeys);
  keys.sort((a, b) => {
    return HeldKeys[a] > HeldKeys[b] ? 1 : -1;
  })
  for (let key of keys) {
    if (phrase != "") {
      phrase += "+"
    }
    phrase += key;
  }
  return phrase;
}

function runKeyCommand(e) {
  let phrase = getKeyPhrase();
  if (phrase in KeyCmds) {
    console.log("%c"+phrase, "color: beige");
    for (let cmd of KeyCmds[phrase]) {
      let prevent = cmd(e);
      if (prevent === "stop") break;
      else if (prevent === "prevent") e.preventDefault();
      else if (prevent) {
        e.preventDefault();
        break;
      }
    }
  }
}



function addKeyCommand(keyPhrase, callback) {
  if (typeof keyPhrase === "string" && callback instanceof Function) {
    if (!(keyPhrase in KeyCmds)) {
      KeyCmds[keyPhrase] = [];
    }
    KeyCmds[keyPhrase].push(callback);
  }
}

function addKeyCommands(keyCmds) {
  for (let phrase in keyCmds) {
    addKeyCommand(phrase, keyCmds[phrase]);
  }
}


export {addKeyCommand, addKeyCommands}
