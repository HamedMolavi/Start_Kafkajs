const { CompressionTypes } = require('kafkajs');
const { getRandomNumber, createMessage } = require('../utils/tools');

const run = async () => {
  const { sendMessage, disconnect, sendBatch } = await require('../utils/producer');

  console.log(await sendMessage({
    topic: process.env.PRODUCER_TOPIC,
    compression: CompressionTypes.GZIP,
    messages: Array(getRandomNumber()) // random length for message array 
      .fill() // fill with undefined
      .map(_ => createMessage(getRandomNumber())), // map each el return {key, value}
  }));


  console.log(await sendBatch([
    {
      topic: 'topic-a', // use an orderId as the key
      messages: [{ key: 'key', value: 'hello topic-a' }], // value can be a Buffer, a string or null.
      /*
       The value will always be encoded as bytes when sent to Kafka. When consumed,
       the consumer will need to interpret the value according to your schema.
       */
    },
    {
      topic: 'topic-c',
      messages: [
        {
          key: 'key',
          value: 'hello topic-c',
          timestamp: new Date(),
          headers: {
            'correlation-id': '2bfb68bb-893a-423b-a7fa-7b568cad5b67',
          },
        }
      ],
    }
  ]));


  console.log(disconnect() ? 'disconnected' : 'fail to disconnect');
};



if (require.main === module) {
  require('dotenv').config()
  run().catch(e => console.error(`[test/producer] ${e.message}`, e));
};



module.exports = run;