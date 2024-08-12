# node-red-contrib-questdb

<a href="http://nodered.org" target="_new">Node-RED</a> nodes to write and query data from an QuestDB time series database.

These nodes only support the HTTP API of QuestDB. It uses the NodeJs Client library to interact with the QuestDB server. The library documentation is available at <a href="https://questdb.io/docs/clients/ingest-node/" target="_new">https://questdb.io/docs/clients/ingest-node/</a>.

## Prerequisites

To run this you'll need access to an QuestDB database. See the <a href="https://questdb.io/docs/quick-start/" target="_new">QuestDB site</a> for more information. The latest release of this node has been tested with questDB v8.1.0. This node supports Node.js 16.x or newer LTS releases. This node does not support Node-RED before version 1.0.

## Install

You can use the Node-RED _Manage Palette_ feature, or run the following command in the root directory of your Node-RED install. Usually this is `~/.node-red` .

    npm install node-red-contrib-questdb

## Usage

Nodes to write and query data from an questdb time series database. Supports questDb versions 1.x to 2.0.

### Input Node

Queries one or more measurements in an questdb database. The query is specified in the node configuration or in the **_msg.query_** property. Setting it in the node will override the **_msg.query_**. The result is returned in **_msg.payload_**.

With a v1.x questDb configuration, use the [questQL query syntax](https://docs.questdata.com/questdb/v1.8/query_language/). With a v1.8-Flux or 2.0 configuration, use the [Flux query syntax](https://docs.questdata.com/questdb/v2.0/query-data/get-started/).

For example, here is a simple flow to query all of the points in the `test` measurement of the `test` database. The query is in the configuration of the questdb input node (copy and paste to your Node-RED editor). We are using a v1.x questDb here, so an questQL query is used.

    [{"id":"39aa2ca9.804da4","type":"debug","z":"6256f76b.e596d8","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":530,"y":100,"wires":[]},{"id":"262a3923.e7b216","type":"questdb in","z":"6256f76b.e596d8","questdb":"eeb221fb.ab27f","name":"","query":"SELECT * from test","rawOutput":false,"precision":"","retentionPolicy":"","org":"my-org","x":310,"y":100,"wires":[["39aa2ca9.804da4"]]},{"id":"803d82f.ff80f8","type":"inject","z":"6256f76b.e596d8","name":"","repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":100,"y":100,"wires":[["262a3923.e7b216"]]},{"id":"eeb221fb.ab27f","type":"questdb","hostname":"127.0.0.1","port":"8086","protocol":"http","database":"test","name":"test","usetls":true,"tls":"d50d0c9f.31e858","questdbVersion":"1.x","url":"http://localhost:8086","rejectUnauthorized":true},{"id":"d50d0c9f.31e858","type":"tls-config","name":"","cert":"","key":"","ca":"","certname":"","keyname":"","caname":"","servername":"","verifyservercert":false}]

In this example, we query the same database for all points from a day ago using a **1.8-flux** configuration using the Flux query language:

    [{"id":"dd32f825.863798","type":"questdb in","z":"6256f76b.e596d8","questdb":"2ff2a476.a6d2ec","name":"","query":"from(bucket: \"test/autogen\") |> range(start: -1d, stop: now())","rawOutput":false,"precision":"","retentionPolicy":"","org":"my-org","x":410,"y":220,"wires":[["17314806.c732c8"]]},{"id":"17314806.c732c8","type":"debug","z":"6256f76b.e596d8","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":670,"y":280,"wires":[]},{"id":"eadef241.cf6fd","type":"inject","z":"6256f76b.e596d8","name":"","repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":100,"y":160,"wires":[["dd32f825.863798"]]},{"id":"2ff2a476.a6d2ec","type":"questdb","hostname":"127.0.0.1","port":"8086","protocol":"http","database":"database","name":"test 1.8 flux","usetls":false,"tls":"d50d0c9f.31e858","questdbVersion":"1.8-flux","url":"https://localhost:8086","rejectUnauthorized":false},{"id":"d50d0c9f.31e858","type":"tls-config","name":"","cert":"","key":"","ca":"","certname":"","keyname":"","caname":"","servername":"","verifyservercert":false}]

This flow performs the same, but using the **_msg.query_** property:

    [{"id":"2d5d7690.e5e77a","type":"questdb in","z":"6256f76b.e596d8","questdb":"2ff2a476.a6d2ec","name":"","query":"","rawOutput":false,"precision":"","retentionPolicy":"","org":"my-org","x":300,"y":380,"wires":[["6ab91739.fa71b8"]]},{"id":"6ab91739.fa71b8","type":"debug","z":"6256f76b.e596d8","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":490,"y":380,"wires":[]},{"id":"daff744d.5538c8","type":"function","z":"6256f76b.e596d8","name":"set query","func":"msg.query = 'from(bucket: \"test/autogen\") |> range(start: -1d, stop: now())'\nreturn msg;","outputs":1,"noerr":0,"initialize":"","finalize":"","x":240,"y":300,"wires":[["2d5d7690.e5e77a"]]},{"id":"3e65472c.652658","type":"inject","z":"6256f76b.e596d8","name":"","props":[{"p":"payload"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":100,"y":300,"wires":[["daff744d.5538c8"]]},{"id":"2ff2a476.a6d2ec","type":"questdb","hostname":"127.0.0.1","port":"8086","protocol":"http","database":"database","name":"test 1.8 flux","usetls":false,"tls":"d50d0c9f.31e858","questdbVersion":"1.8-flux","url":"https://localhost:8086","rejectUnauthorized":false},{"id":"d50d0c9f.31e858","type":"tls-config","name":"","cert":"","key":"","ca":"","certname":"","keyname":"","caname":"","servername":"","verifyservercert":false}]

The function node in this flow sets the `msg.query` property as follows:

    msg.query = 'from(bucket: "test/autogen") |> range(start: -1d, stop: now())'
    return msg;

### Output Node

Writes one or more points (fields and tags) to a measurement.

The fields and tags to write are in **_msg.payload_**. If the message is a string, number, or boolean, it will be written as a single field to the specified measurement called _value_.

> Note: Javascript numbers are _always_ written as a float. When using the 1.8-flux or 2.0 configuration, you can explicitly write an integer using a number in a string with an 'i' suffix, for example, to write the integer `1234` use the string `'1234i'`. This is _not_ supported using 1.x configurations; all numbers are written as float values.

For example, the following flow injects a single random field called `value` into the measurement `test` in the database `test` with the current timestamp.

    [{"id":"17bd4566.e842bb","type":"questdb out","z":"6256f76b.e596d8","questdb":"eeb221fb.ab27f","name":"","measurement":"test","precision":"","retentionPolicy":"","database":"","retentionPolicyV18Flux":"","org":"","bucket":"","x":440,"y":460,"wires":[]},{"id":"be93bfeb.416c4","type":"function","z":"6256f76b.e596d8","name":"single value","func":"msg.payload = Math.random()*10;\nreturn msg;","outputs":1,"noerr":0,"x":270,"y":460,"wires":[["17bd4566.e842bb"]]},{"id":"31f9f174.ce060e","type":"inject","z":"6256f76b.e596d8","name":"","repeat":"","crontab":"","once":false,"topic":"","payload":"","payloadType":"date","x":120,"y":460,"wires":[["be93bfeb.416c4"]]},{"id":"eeb221fb.ab27f","type":"questdb","hostname":"127.0.0.1","port":"8086","protocol":"http","database":"test","name":"test","usetls":true,"tls":"d50d0c9f.31e858","questdbVersion":"1.x","url":"http://localhost:8086","rejectUnauthorized":true},{"id":"d50d0c9f.31e858","type":"tls-config","name":"","cert":"","key":"","ca":"","certname":"","keyname":"","caname":"","servername":"","verifyservercert":false}]

The function node consists of the following:

    msg.payload = Math.random()*10;
    return msg;

If **_msg.payload_** is an object containing multiple properties, all of the the fields will be written to the measurement.

For example, the following flow injects four fields, `intValue`, `numValue`, `randomValue` and `strValue` into the `test2` measurement with the current timestamp using a 1.8-Flux configuration.

    [{"id":"6849966e.e53528","type":"inject","z":"6256f76b.e596d8","name":"","repeat":"","crontab":"","once":false,"topic":"","payload":"","payloadType":"date","x":120,"y":520,"wires":[["c8865cec.261cd"]]},{"id":"c8865cec.261cd","type":"function","z":"6256f76b.e596d8","name":"Fields","func":"msg.payload = {\n    intValue: '12i',\n    numValue: 123.0,\n    strValue: \"message\",\n    randomValue: Math.random()*10\n}\nreturn msg;","outputs":1,"noerr":0,"initialize":"","finalize":"","x":268,"y":520,"wires":[["72bf0ba5.6e63d4"]]},{"id":"72bf0ba5.6e63d4","type":"questdb out","z":"6256f76b.e596d8","questdb":"2ff2a476.a6d2ec","name":"","measurement":"test2","precision":"","retentionPolicy":"","database":"test","precisionV18FluxV20":"ms","retentionPolicyV18Flux":"","org":"","bucket":"","x":458,"y":520,"wires":[]},{"id":"2ff2a476.a6d2ec","type":"questdb","hostname":"127.0.0.1","port":"8086","protocol":"http","database":"database","name":"test 1.8 flux","usetls":false,"tls":"d50d0c9f.31e858","questdbVersion":"1.8-flux","url":"https://localhost:8086","rejectUnauthorized":false},{"id":"d50d0c9f.31e858","type":"tls-config","name":"","cert":"","key":"","ca":"","certname":"","keyname":"","caname":"","servername":"","verifyservercert":false}]

The function node in the flow above consists of the following:

    msg.payload = {
        intValue: '10i',
        numValue: 123.0,
        strValue: "message",
        randomValue: Math.random()*10
    }
    return msg;

If **_msg.payload_** is an array containing two objects, the first object will be written as the set of named fields, the second is the set of named tags.

For example, the following simple flow uses an questDb 2.0 database and injects four fields as above, along with two tags, `tag1` and `tag2`:

    [{"id":"15c79e62.9294c2","type":"inject","z":"6256f76b.e596d8","name":"","repeat":"","crontab":"","once":false,"topic":"","payload":"","payloadType":"date","x":120,"y":560,"wires":[["a97b005f.7f22e"]]},{"id":"a97b005f.7f22e","type":"function","z":"6256f76b.e596d8","name":"Fields and Tags","func":"msg.payload = [{\n    intValue: '10i',\n    numValue: 12,\n    randomValue: Math.random()*10,\n    strValue: \"message2\"\n},\n{\n    tag1:\"sensor1\",\n    tag2:\"device2\"\n}];\nreturn msg;","outputs":1,"noerr":0,"initialize":"","finalize":"","x":280,"y":560,"wires":[["a91d522b.9a077"]]},{"id":"a91d522b.9a077","type":"questdb out","z":"6256f76b.e596d8","questdb":"5d7e54ca.019d44","name":"","measurement":"test","precision":"ms","retentionPolicy":"","database":"test","precisionV18FluxV20":"ms","retentionPolicyV18Flux":"","org":"my-org","bucket":"test","x":510,"y":560,"wires":[]},{"id":"5d7e54ca.019d44","type":"questdb","hostname":"127.0.0.1","port":"8086","protocol":"http","database":"database","name":"","usetls":false,"tls":"d50d0c9f.31e858","questdbVersion":"2.0","url":"https://localhost:9999","rejectUnauthorized":false},{"id":"d50d0c9f.31e858","type":"tls-config","name":"","cert":"","key":"","ca":"","certname":"","keyname":"","caname":"","servername":"","verifyservercert":false}]

The function node consists of the following code:

    msg.payload = [{
        intValue: '10i',
        numValue: 12,
        randomValue: Math.random()*10,
        strValue: "message2"
    },
    {
        tag1:"sensor1",
        tag2:"device2"
    }];
    return msg;

Finally, if **_msg.payload_** is an array of arrays, it will be written as a series of points containing fields and tags.

For example, the following flow injects two points into an questDb 2.0 database with timestamps specified.

    [{"id":"a67139c7.15ec68","type":"inject","z":"6256f76b.e596d8","name":"","repeat":"","crontab":"","once":false,"topic":"","payload":"","payloadType":"date","x":120,"y":620,"wires":[["15047e0e.e613f2"]]},{"id":"15047e0e.e613f2","type":"function","z":"6256f76b.e596d8","name":"multiple readings","func":"msg.payload = [\n    [{\n        numValue: 10,\n        randomValue: Math.random()*10,\n        strValue: \"message1\",\n        time: new Date().getTime()-1\n    },\n    {\n        tag1:\"sensor1\",\n        tag2:\"device2\"\n    }],\n    [{\n        numValue: 20,\n        randomValue: Math.random()*10,\n        strValue: \"message2\",\n        time: new Date().getTime()\n    },\n    {\n        tag1:\"sensor1\",\n        tag2:\"device2\"\n    }]\n];\nreturn msg;","outputs":1,"noerr":0,"initialize":"","finalize":"","x":320,"y":620,"wires":[["8caaee80.33352"]]},{"id":"8caaee80.33352","type":"questdb out","z":"6256f76b.e596d8","questdb":"5d7e54ca.019d44","name":"","measurement":"test","precision":"ms","retentionPolicy":"","database":"test","precisionV18FluxV20":"ms","retentionPolicyV18Flux":"","org":"my-org","bucket":"test","x":590,"y":620,"wires":[]},{"id":"5d7e54ca.019d44","type":"questdb","hostname":"127.0.0.1","port":"8086","protocol":"http","database":"database","name":"","usetls":false,"tls":"d50d0c9f.31e858","questdbVersion":"2.0","url":"https://localhost:9999","rejectUnauthorized":false},{"id":"d50d0c9f.31e858","type":"tls-config","name":"","cert":"","key":"","ca":"","certname":"","keyname":"","caname":"","servername":"","verifyservercert":false}]

The function node in the above flow looks as follows:

    msg.payload = [
        [{
            intValue: '9i',
            numValue: 10,
            randomValue: Math.random()*10,
            strValue: "message1",
            time: new Date().getTime()-1
        },
        {
            tag1:"sensor1",
            tag2:"device2"
        }],
        [{
            intValue: '11i',
            numValue: 20,
            randomValue: Math.random()*10,
            strValue: "message2",
            time: new Date().getTime()
        },
        {
            tag1:"sensor1",
            tag2:"device2"
        }]
    ];
    return msg;

Note how timestamps are specified here - the number of milliseconds since 1 January 1970 00:00:00 UTC. In this case do not forget to set the precision to "ms" in "Time Precision" of the "quest Out Node". We make sure the timestamps are a different so the first element doesn't get overwritten by the second.

### The Batch Output Node

The batch output node (quest batch) sends a list of _points_ together in a batch to questDB in a slightly different format from the output node. Using the batch node you must specify the measurement name to write into as well as a list of tag and field values. Optionally, you can specify the timestamp for the point, defaulting to the current time.

> Note: Javascript numbers are _always_ written as a float. As in the output node, when using the 1.8-flux or 2.0 configuration, you can explicitly write an integer using a number in a string with an 'i' suffix, for example, to write the integer `1234` use the string `'1234i'`. This is _not_ supported using 1.x configurations; all numbers are written as float values.

By default the node will write timestamps using ms precision since that's what JavaScript gives us. if you specify the timestamp as a Date object, we'll convert it to milliseconds.

If you provide a string or number as the timestamp, we'll pass it straight into quest to parse using the specified precision, or the default precision in nanoseconds if it is left unspecified.

> **Note** that the default precision is _nanoseconds_, so if you pass in a number such as date.getTime(), and do not specify millisecond precision, your timestamp will be orders of magnitude incorrect.

The following example flow writes two points to two measurements, setting the timestamp to the current date.

    [{"id":"4a271a88.499184","type":"function","z":"87205ed6.329bc","name":"multiple measurement points","func":"msg.payload = [\n    {\n        measurement: \"weather_sensor\",\n        fields: {\n            temp: 5.5,\n            light: 678,\n            humidity: 51\n        },\n        tags:{\n            location:\"garden\"\n        },\n        timestamp: new Date()\n    },\n    {\n        measurement: \"alarm_sensor\",\n        fields: {\n            proximity: 999,\n            temp: 19.5\n        },\n        tags:{\n            location:\"home\"\n        },\n        timestamp: new Date()\n    }\n];\nreturn msg;","outputs":1,"noerr":0,"x":400,"y":280,"wires":[["748a06bd.675ed8"]]},{"id":"6493a442.1cdcbc","type":"inject","z":"87205ed6.329bc","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"x":140,"y":220,"wires":[["4a271a88.499184"]]},{"id":"748a06bd.675ed8","type":"questdb batch","z":"87205ed6.329bc","questdb":"6ca8bde.9eb2f44","name":"","x":670,"y":220,"wires":[]},{"id":"6ca8bde.9eb2f44","type":"questdb","z":"","hostname":"localhost","port":"8086","protocol":"https","database":"new_db","name":"","usetls":true,"tls":"f7f39f4e.896ae"},{"id":"f7f39f4e.896ae","type":"tls-config","z":"","name":"local-tls","cert":"","key":"","ca":"","certname":"","keyname":"","caname":"","verifyservercert":false}]

The function node generates sample points as follows:

    msg.payload = [
        {
            measurement: "weather_sensor",
            fields: {
                temp: 5.5,
                light: 678,
                humidity: 51
            },
            tags:{
                location:"garden"
            },
            timestamp: new Date()
        },
        {
            measurement: "alarm_sensor",
            fields: {
                proximity: 999,
                temp: 19.5
            },
            tags:{
                location:"home"
            },
            timestamp: new Date()
        }
    ];
    return msg;

### Catching Failed Reads and Writes

Errors in reads and writes can be caught using the node-red `catch` node as usual.
Standard error information is availlable in the default `msg.error` field; additional
information about the underlying error is in the `msg.quest_error` field. Currently,
this includes the HTTP status code returned from the questdb server. The `quest-read`
node will always throw a `503`, whereas the write nodes will include other status codes
as detailed in the
[quest API documentation](https://docs.questdata.com/questdb/v1.8/tools/api/#status-codes-and-responses-2).

### Support for Complete Node

All of the nodes make the required `done()` call to support the `complete` node as described in the [related blog post](https://nodered.org/blog/2019/09/20/node-done). When an error is logged, `catch` nodes will receive a message, but an associated `complete` node will not.
