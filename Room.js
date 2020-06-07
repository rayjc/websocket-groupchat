/** Chat rooms that can be joined/left/broadcast to. */

// in-memory storage of roomNames -> room

const ROOMS = new Map();

/** Room is a collection of listening members; this becomes a "chat room"
 *   where individual users can join/leave/broadcast to.
 */

class Room {
  /** get room by that name, creating if nonexistent
   *
   * This uses a programming pattern often called a "registry" ---
   * users of this class only need to .get to find a room; they don't
   * need to know about the ROOMS variable that holds the rooms. To
   * them, the Room class manages all of this stuff for them.
   **/

  static get(roomName) {
    if (!ROOMS.has(roomName)) {
      ROOMS.set(roomName, new Room(roomName));
    }

    return ROOMS.get(roomName);
  }

  /** make a new room, starting with empty set of listeners */

  constructor(roomName) {
    this.name = roomName;
    this.members = {};
  }

  /** member joining a room. */

  join(member) {
    if (this.getMemberNames().has(member.name)) {
      const name = `${member.name}-${new Date().getTime()}`;
      this.members[name] = member;
      return name;
    } else {
      this.members[member.name] = member;
      return member.name;
    }
  }

  /** member leaving a room. */

  leave(member) {
    delete this.members[member.name];
  }

  /* return a set of member names */
  getMemberNames() {
    return new Set(Object.keys(this.members));
  }

  /* return the specified member */
  getMember(name) {
    return this.members[name];
  }

  /** send message to all members in a room. */

  broadcast(data) {
    for (let member of Object.values(this.members)) {
      member.send(JSON.stringify(data));
    }
  }
}

module.exports = Room;
