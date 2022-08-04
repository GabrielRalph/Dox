function toLocation(str){
  let domain = "";
  let path = "";
  let file = "";
  let line = 0;
  let lineIndex = 0;
  let url = str;

  if (typeof str === "string") {
    let match = str.match(/^http[s]?:\/\/([^\/]+)\//);
    if (match) {
      domain = match[0];
      str = str.slice(domain.length);
    }

    let paths = str.split("/");
    if (paths.length > 0) {
      let fileInfo = paths.pop();
      while (paths.length > 0) {
        path += paths.shift() + "/";
      }

      fileInfo = fileInfo.split(":");
      if (fileInfo.length > 0) file = fileInfo[0];
      if (fileInfo.length > 1) line = parseInt(fileInfo[1]);
      if (fileInfo.length > 2) lineIndex = parseInt(fileInfo[2]);
    }
  }

  return {
    domain: domain,
    path: path,
    file: file,
    line: line,
    url: url,
    lineIndex: lineIndex,
  };
}

function getCallerList(){
  let calls = []
  try {
    throw new Error();
  } catch(e) {
    let elines = e.stack.split("\n");

    // parse stack lines
    for (let line of elines) {
      const match = line.match(/\s+at\s+([^\s]+)\s+\(([^)]+)\)/);
      if (match) {
        let cname = match[1];
        let location = toLocation(match[2]);

        let call = {
          name: cname,
          location: location,
        }
        calls.push(call);
      }
    }

    //remove log function calls
    calls.shift(); // remove getCallerList call
    calls.shift(); // remove log call
  }


  return calls;
}

function myFormat(callers, delim = " ") {
  let str = "";
  let d = "";
  console.log(d);
  while (callers.length > 0) {
    let call = callers.pop();
    let f = `${call.name} (${call.location.file} : ${call.location.line})`
    str += d + f + "\n";
    d += delim;
  }
  return str
}

let lastStackA = []
function log(c, del = " |", pdel = " "){
  let callers = getCallerList();
  let str = myFormat(callers);
  str = "%c" + str + "\n%c" + c;
  console.log(str, "color: grey", "color: inherit");
}

export {log}
