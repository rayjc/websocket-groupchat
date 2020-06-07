/** Functionality related to chatting. */

const axios = require("axios");

// Room is an abstraction of a chat channel
const Room = require('./Room');

/** ChatUser is a individual connection from client -> server to chat. */

class ChatUser {
  /** make chat: store connection-device, rooom */

  constructor(send, roomName) {
    this._send = send; // "send" function for this user
    this.room = Room.get(roomName); // room user will be in
    this.name = null; // becomes the username of the visitor

    console.log(`created chat in ${this.room.name}`);
  }

  /** send msgs to this client using underlying connection-send-function */

  send(data) {
    try {
      this._send(data);
    } catch {
      // If trying to send to a user fails, ignore it
    }
  }

  /** handle joining: add to room members, announce join */

  handleJoin(name) {
    this.name = (!!name) ? name : `user-${new Date().getTime()}`;
    // overwrite name
    this.name = this.room.join(this);
    this.room.broadcast({
      type: 'note',
      text: `${this.name} joined "${this.room.name}".`
    });
  }

  /** handle a chat: broadcast to room. */

  handleChat(text) {
    this.room.broadcast({
      name: this.name,
      type: 'chat',
      text: text
    });
  }

  /** handle a joke command: request joke and send back to client */

  handleJoke() {
    axios.get("https://icanhazdadjoke.com", { headers: { accept: 'application/json' } })
      .then(res => {
        this.send(JSON.stringify({
          name: 'Joke',
          type: 'command',
          text: res.data.joke,
        }));
      })
      .catch(() => {
        this.send(JSON.stringify({
          name: 'Joke',
          type: 'command',
          text: "Cannot come up with a joke at the moment; please try again later."
        }));
      });
  }

  /** handle members command: return list of members to client */

  handleMembers() {
    this.send(JSON.stringify({
      name: 'Members',
      type: 'command',
      text: `${[...this.room.getMemberNames()].join(', ')}`
    }));
  }

  /** handle private message command: send message to client and target client */

  handleWhisper(target, text) {
    if (!this.room.getMemberNames().has(target)) {
      this.send(JSON.stringify({
        name: 'ERROR',
        type: 'error',
        text: `${target} is not in the room`
      }));
      return;
    }
    // send message to origin
    this.send(JSON.stringify({
      name: `To ${target}`,
      type: 'command',
      text: text
    }));
    // send message to target
    const toMember = this.room.getMember(target);
    toMember.send(JSON.stringify({
      name: `From ${this.name}`,
      type: 'command',
      text: text
    }));
  }

  /** handle name-update command: broadcast name change */

  handleNameUpdate(newName) {
    const oldName = this.name;
    this.room.leave(this);
    this.name = newName;  // try to set the name to new name
    this.name = this.room.join(this);   // overwrite name if exists
    if (this.name !== newName) {
      this.send(JSON.stringify({
        name: 'Warning',
        type: 'command',
        text: `'${newName}' has been taken...`
      }));
    }
    this.room.broadcast({
      type: 'note',
      text: `${oldName} has been renamed to ${this.name}`
    });
  }

  /** Handle messages from client:
   *
   * - {type: "join", name: username} : join
   * - {type: "chat", text: msg }     : chat
   */

  handleMessage(jsonData) {
    const msg = JSON.parse(jsonData);

    switch (msg.type) {
      case "join":
        this.handleJoin(msg.name);
        break;

      case "chat":
        this.handleChat(msg.text);
        break;

      case "joke":
        this.handleJoke();
        break;

      case "members":
        this.handleMembers();
        break;

      case "private":
        this.handleWhisper(msg.target, msg.text);
        break;

      case "update-name":
        this.handleNameUpdate(msg.name);
        break;

      default:
        throw new Error(`bad message: ${msg.type}`);
    }
  }

  /** Connection was closed: leave room, announce exit to others */

  handleClose() {
    this.room.leave(this);
    this.room.broadcast({
      type: 'note',
      text: `${this.name} left ${this.room.name}.`
    });
  }
}

module.exports = ChatUser;
