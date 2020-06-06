/** Client-side of groupchat. */

const urlParts = document.URL.split("/");
const roomName = urlParts[urlParts.length - 1];
const ws = new WebSocket(`ws://localhost:3000/chat/${roomName}`);


const name = prompt("Username?");


/** called when connection opens, sends join info to server. */

ws.onopen = function(evt) {
  console.log("open", evt);

  let data = { type: "join", name: name };
  ws.send(JSON.stringify(data));
};


/** called when msg received from server; displays it. */

ws.onmessage = function(evt) {
  console.log("message", evt);

  const msg = JSON.parse(evt.data);
  displayMessage(msg);

};


/** called on error; logs it. */

ws.onerror = function(evt) {
  console.error(`err ${evt}`);
};


/** called on connection-closed; logs it. */

ws.onclose = function(evt) {
  console.log("close", evt);
};


function displayMessage(msg) {
  let item;

  if (msg.type === "note") {
    item = $(`<li><i>${msg.text}</i></li>`);
  }

  else if (msg.type === "chat") {
    item = $(`<li><b>${msg.name}: </b>${msg.text}</li>`);
  }

  else if (msg.type === "command") {
    item = $(`<li><b>${msg.name}: </b>${msg.text}</li>`).css('color', 'grey');
  }

  else if (msg.type === "error") {
    item = $(`<li><b>${msg.name}: </b>${msg.text}</li>`).css('color', 'red');
  }

  else {
    return console.error(`bad message: ${msg}`);
  }

  $('#messages').append(item);
}


function processMessage(input) {
  if (!input.startsWith("/")) {
    return { type: "chat", text: input };
  }

  const command = input.split(' ')[0];
  switch (command) {
    case "/joke":
      return { type: "joke" };

    default:
      console.error(`No such command, ${command}.`);
      displayMessage({
        type: "error",
        name: "ERROR",
        text: `No such command, ${command}.`
      });
      return null;
  }
}


/** send message when button pushed. */

$('form').submit(function(evt) {
  evt.preventDefault();

  // let data = { type: "chat", text: $("#m").val() };
  const data = processMessage($("#m").val());
  if (data) {
    ws.send(JSON.stringify(data));
  }

  $('#m').val('');
});

