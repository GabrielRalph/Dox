const historyBuffSize = 10;
const historyTimeLimit = 20; //days
let historyBuffers = {};


export function loadHistory() {
  let history = localStorage.getItem("history");

  try {
    historyBuffers = JSON.parse(history);
    let tnow = (new Date()).getTime();
    let fileKeys = Object.keys(historyBuffers);
    for (let fileKey of fileKeys) {
      let days = (tnow - historyBuffers[fileKey].date) / (1000 * 60 * 60 * 24);
      if (days > historyTimeLimit) {
        delete historyBuffers[fileKey];
      }
    }
  } catch(e) {
    historyBuffer = {};
  }
}
loadHistory();

export function addHistory(fileKey, value){
  if (typeof fileKey === "string") {
    // create history buffer if it has not been created
    if (!(fileKey in historyBuffers)) {
      historyBuffers[fileKey] = {buffer: [], index: 0, date: 0};
    }

    // update history date
    historyBuffers[fileKey].date = (new Date()).getTime();

    // remove all versions infront of the current selected version
    let idx = historyBuffers[fileKey].index;
    while (idx > 0) {
      historyBuffers[fileKey].buffer.shift();
      idx--;
    }
    historyBuffers[fileKey].index = 0;

    // add new version
    historyBuffers[fileKey].buffer.unshift(value);

    // remove oldest version if buffer has exceeded limit
    if (historyBuffers[fileKey].length > historyBuffSize) {
      historyBuffers[fileKey].pop();
    }

    saveHistory();
  }
}

function saveHistory(){
  // save history to local storage
  localStorage.setItem("history", JSON.stringify(historyBuffers));
}

export function getHistoryVersion(fileKey, next){
  let version = null;
  if (fileKey in historyBuffers) {
    let {buffer, index} = historyBuffers[fileKey]
    index = next ? index - 1 : index + 1;
    if (index >= buffer.length) {
      index = buffer.length - 1;
    }

    historyBuffers[fileKey].index = index;
    version = buffer[index];
  }
  saveHistory();
  return version;
}

export function getHistoryIndex(fileKey) {
  let idx = null;
  if (fileKey in historyBuffers) {
    let {buffer, index} = historyBuffers[fileKey];
    idx = index;
  }
  return idx;
}
