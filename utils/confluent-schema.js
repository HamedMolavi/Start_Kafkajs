const { SchemaRegistry, SchemaType } = require('@kafkajs/confluent-schema-registry');
const fs = require('fs').promises;
// env vars -> use process.ENV
const host = 'http://localhost:8081';
const pathToSchema = './schemas/test.json';
const schemaType = 'json';
const options = {
    [SchemaType.JSON]: {
        strict: false
    }
};
const userOpts = {
    subject: "someSubject"
};


const registry = new SchemaRegistry({ host }, options);
const schema = { type: schemaType === 'json' ? SchemaType.JSON : schemaType === 'avro' ? SchemaType.AVRO : schemaType === 'protobuf' ? SchemaType.PROTOBUF : SchemaType.UNKNOWN };


module.exports = async function () {
    return await fs.readFile(pathToSchema, 'utf-8')
        .then(s => schema['schema'] = s)
        .then(() => registry.register(schema, { subject: "someSubject" }))
        .then(res => res['id'])
        .then(schemaId => schemaId) // do something with it
        .catch(console.error) // error handling needed
};


// const decodedKey = await registry.decode(message.key)
// const decodedValue = await registry.decode(message.value)
