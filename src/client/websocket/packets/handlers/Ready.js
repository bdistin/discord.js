const AbstractHandler = require('./AbstractHandler');
const { Events } = require('../../../../util/Constants');
let ClientUser;

class ReadyHandler extends AbstractHandler {
  handle(packet) {
    const client = this.packetManager.client;
    const data = packet.d;

    packet.shard.heartbeat();

    client.presence.userID = data.user.id;
    if (!ClientUser) ClientUser = require('../../../../structures/ClientUser');
    const clientUser = new ClientUser(client, data.user);
    client.user = clientUser;
    client.readyAt = new Date();
    client.users.set(clientUser.id, clientUser);

    for (const guild of data.guilds) {
      guild.shardID = packet.shard.id;
      client.guilds.add(guild);
    }

    const t = client.setTimeout(() => {
      packet.shard.triggerReady();
    }, 1200 * data.guilds.length);

    client.setMaxListeners(data.guilds.length + 10);

    client.once('ready', () => {
      client.setMaxListeners(10);
      client.clearTimeout(t);
    });

    const shard = packet.shard;

    shard.sessionID = data.session_id;
    shard._trace = data._trace;
    client.emit(Events.DEBUG, `SHARD ${shard.id} READY ${shard._trace.join(' -> ')} ${shard.sessionID}`);
    shard.checkIfReady();
  }
}

module.exports = ReadyHandler;
