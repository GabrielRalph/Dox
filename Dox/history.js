const historyBuffSize = 10;
const historyTimeLimit = 20; //days
let historyBuffers = {};

class HistoryBuffer {
  constructor(data) {
    this.buffer = [];
    this.index = 0;
    this.data = data;
  }

  set buffer(value){
    if (Array.isArray(value)) {
      this._buffer = value;
    } else {
      this._buffer = [];
    }
  }
  get buffer() {return this._buffer;}

  get length() {
    return this.buffer.length;
  }

  set index(i){
    i = parseInt(i);
    let {length} = this;
    if (i >= length) {
      i = length - 1;
    }
    if (Number.isNaN(i) || i < 0) {
      i = 0;
    }
    this._index = i;
  }
  get index(){return this._index;}

  set date(value){
    let time = (new Date(value)).getTime();
    if (Number.isNaN(time)) {
      time = (new Date()).getTime();
    }
    this._date = time;
  }
  get date() {
    return this._date;
  }

  get version(){
    let {buffer, length, index} = this;
    let version = null;
    if (length > 0) {
      version = buffer[index];
    }
    return version;
  }

  add(version){
    this.date = "now"
    let {index, buffer} = this;

    // remove all versions infront of the current selected version
    for (index; index > 0; index--)
      buffer.shift();
    this.index = 0;

    // add version
    buffer.unshift(version);

    // remove oldest versions if buffer has exceeded limit
    while (buffer.length > historyBuffSize)
      buffer.pop();
  }

  get keys(){return ["buffer", "index", "date"]}

  set data(data){
    if (typeof data === "object" && data !== null) {
      for (let key of this.keys) {
        // console.lwog(key);
        if (key in data) {
          this[key] = data[key];
        }
      }
    }
  }
  get data(){
    let data = {};
    for (let key of this.keys) {
      data[key] = this[key];
    }
    return data;
  }
}

class FileHistories {
  constructor() {
    this.histories = {};
  }

  set histories(data) {
    let newData = {};
    if (typeof data === "object" && data !== null) {
      for (let file in data) {
        newData[file] = new HistoryBuffer(data[file]);
      }
    }
    this._histories = newData;
  }
  get histories() {return this._histories;}
  get data(){
    let data = {};
    let {histories} = this;
    for (let key in histories) {
      data[key] = histories[key].data;
    }
    return data;
  }

  addToFileHistory(fileKey, version) {
    let {histories} = this;
    if (!(fileKey in histories)) {
      histories[fileKey] = new HistoryBuffer();
    }
    histories[fileKey].add(version);
  }

  getFileHistory(fileKey) {
    let {histories} = this;
    let buffer = null;
    if (fileKey in histories) {
      buffer = histories[fileKey];
    }
    return buffer;
  }

  getFileHistoryVersion(fileKey, forward) {
    let buffer = this.getFileHistory(fileKey);
    let version = null;
    if (buffer) {
      buffer.index += forward ? -1 : 1;
      version = buffer.version;
    }
    return version;
  }

  save(key = "history") {
    localStorage.setItem(key, JSON.stringify(this.data));
  }
  open(key = "history") {
    let history = localStorage.getItem(key);
    try {
      this.histories = JSON.parse(history);
    } catch (e) {
      console.log(e);
    }
  }
}

const GlobalHistory = new FileHistories();
export function loadHistory() {
  GlobalHistory.open();
}
loadHistory();

export function addHistory(fileKey, value){
  GlobalHistory.addToFileHistory(fileKey, value);

  GlobalHistory.save();
}


export function getHistoryVersion(fileKey, next){
  let version = GlobalHistory.getFileHistoryVersion(fileKey, next);
  GlobalHistory.save();
  return version;
}
