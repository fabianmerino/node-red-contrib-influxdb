const { isArray, isPlainObject } = require('lodash')

// biome-ignore lint/complexity/useArrowFunction: <explanation>
module.exports = function (RED) {
  const { Sender } = require('@questdb/nodejs-client')

  /**
   * Config node. Currently we only connect to one host.
   */
  function QuestDbConfigNode(nodeConfig) {
    RED.nodes.createNode(this, nodeConfig)
    // const CLIENT_ID = 'admin'
    // const PRIVATE_KEY = 'ZRxmCOQBpZoj2fZ-lEtqzVDkCre_ouF3ePpaQNDwoQk'

    this.protocol = nodeConfig.protocol
    this.hostname = nodeConfig.hostname
    this.port = nodeConfig.port
    this.name = nodeConfig.name

    // this.usetls = n.usetls;
    // Authentication options
    // const AUTH = {
    //     keyId: CLIENT_ID,
    //     token: PRIVATE_KEY,
    // }
    const configOptions = {
      protocol: this.protocol,
      host: this.hostname,
      port: this.port,
      // auth: AUTH,
    }

    this.sender = new Sender(configOptions)
  }

  RED.nodes.registerType(
    'questdb',
    QuestDbConfigNode /* , {
        credentials: {
            username: { type: "text" },
            password: { type: "password" },
            token: { type: "password" }
        }
    } */
  )

  function isIntegerString(value) {
    return /^-?\d+i$/.test(value)
  }

  function setFieldIntegers(fields) {
    for (const prop in fields) {
      const value = fields[prop]
      if (isIntegerString(value)) {
        fields[prop] = Number.parseInt(value.substring(0, value.length - 1))
      }
    }
  }

  function addFieldToSender(sender, name, value) {
    if (typeof value === 'number') {
      sender.floatColumn(name, value)
    } else if (typeof value === 'string') {
      // string values with numbers ending with 'i' are considered integers
      if (isIntegerString(value)) {
        const intValue = Number.parseInt(value.substring(0, value.length - 1))
        sender.intColumn(name, intValue)
      } else {
        sender.stringColumn(name, value)
      }
    } else if (typeof value === 'boolean') {
      sender.booleanColumn(name, value)
    }
  }

  function addFieldsToSender(sender, fields) {
    for (const prop in fields) {
      const value = fields[prop]
      addFieldToSender(sender, prop, value)
    }
  }

  // write using @questdb/nodejs-client
  async function writePoints(msg, node, done) {
    try {
      const table = Object.prototype.hasOwnProperty.call(msg, 'table') ? msg.table : node.table
      const unit = Object.prototype.hasOwnProperty.call(msg, 'precision')
        ? msg.precision
        : node.precision
      if (!table) {
        return done(RED._('questdb.errors.notable'))
      }
      const questdbConfig = node.questdbConfig
      if (questdbConfig.protocol === 'tcp' || questdbConfig.protocol === 'tcps') {
        await node.sender.connect()
      }

      const sender = node.sender.table(table)
      if (isArray(msg.payload) && msg.payload.length > 0) {
        // array of arrays: multiple points with fields and tags
        if (isArray(msg.payload[0]) && msg.payload[0].length > 0) {
          for (const element of msg.payload) {
            const tags = element[1]
            for (const prop in tags) {
              sender.symbol(prop, tags[prop])
            }

            const { time, ...fields } = element[0]
            addFieldsToSender.bind(node)(sender, fields)
            if (time) {
              await sender.at(time, unit)
            } else {
              await sender.atNow()
            }
          }
        } else {
          // array of non-arrays: one point with both fields and tags
          const tags = msg.payload[1]
          for (const prop in tags) {
            sender.symbol(prop, tags[prop])
          }

          const { time, ...fields } = msg.payload[0]
          addFieldsToSender.bind(node)(sender, fields)
          if (time) {
            await sender.at(time, unit)
          } else {
            await sender.atNow()
          }
        }
      } else {
        // single object: fields only
        if (isPlainObject(msg.payload)) {
          const { time, ...fields } = msg.payload
          addFieldsToSender.bind(node)(sender, fields)
          if (time) {
            await sender.at(time, unit)
          } else {
            await sender.atNow()
          }
        } else {
          // just a value
          const value = msg.payload
          addFieldsToSender.bind(node)(sender, 'value', value)
          await sender.atNow()
        }
      }

      await sender.flush()
      await sender.close()
      node.log(`done, sent a row to ${table}`)
      done()
    } catch (error) {
      msg.questdb_error = {
        errorMessage: error,
      }
      done(error)
    }
  }

  /**
   * Output node to write to a single questdb table
   */
  function QuestDBOutNode(n) {
    RED.nodes.createNode(this, n)
    this.table = n.table
    this.questdb = n.questdb
    this.questdbConfig = RED.nodes.getNode(this.questdb)
    this.precision = n.precision

    if (!this.questdbConfig) {
      this.error(RED._('questdb.errors.missingconfig'))
      return
    }
    this.sender = this.questdbConfig.sender

    const node = this
    // biome-ignore lint/complexity/useArrowFunction: <explanation>
    node.on('input', function (msg, send, done) {
      writePoints(msg, node, done)
    })
  }

  RED.nodes.registerType('questdb out', QuestDBOutNode)

  /**
   * Output node to write to multiple questdb tables
   */
  function QuestDBBatchNode(n) {
    RED.nodes.createNode(this, n)
    this.questdb = n.questdb
    this.questdbConfig = RED.nodes.getNode(this.questdb)
    this.precision = n.precision

    if (!this.questdbConfig) {
      this.error(RED._('questdb.errors.missingconfig'))
      return
    }

    this.sender = this.questdbConfig.sender

    const node = this

    // biome-ignore lint/complexity/useArrowFunction: <explanation>
    node.on('input', async function (msg, send, done) {
      if (node.questdbConfig.protocol === 'tcp' || node.questdbConfig.protocol === 'tcps') {
        await node.sender.connect()
      }

      for (const element of msg.payload) {
        const sender = node.sender.table(element.table)

        const symbols = element.symbols
        if (symbols) {
          for (const prop in symbols) {
            sender.symbol(prop, symbols[prop])
          }
        }

        addFieldsToSender(sender, element.columns)

        if (element.timestamp) {
          await sender.at(element.timestamp, node.precision)
        } else {
          await sender.atNow()
        }

        await sender.flush()
      }

      // ensure we write everything including scheduled retries
      await node.questdbConfig.sender.close()
      done()
    })
  }

  RED.nodes.registerType('questdb batch', QuestDBBatchNode)
}
