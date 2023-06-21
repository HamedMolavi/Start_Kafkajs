const { ConfigResourceTypes } = require('kafkajs');
const fs = require('fs');

async function run() {
    const {
        listTopics,
        createTopics,
        deleteTopics,
        createPartitions,
        fetchTopicMetadata,
        fetchAllTopicsMetadata,
        describeCluster,
        describeConfigs,
        alterConfigs,
        listGroups,
        describeGroups,
        deleteGroups,
        deleteTopicRecords,
        disconnect,
    } = await require('../utils/admin');
    fs.writeFileSync('hello.txt', JSON.stringify(await listTopics()));

    // console.log('Created topics: ', await createTopics([{
    //     topic: "topic1",
    //     numPartitions: 2,       // default: -1 (uses broker num.partitions configuration)
    //     replicationFactor: 1,   // default: -1 (uses broker `default.replication.factor` configuration)
    //     // replicaAssignment: [],  // Example: [{ partition: 0, replicas: [0,1,2] }]
    //     configEntries: []       // Example: [{ name: 'cleanup.policy', value: 'compact' }]
    // },
    // {
    //     topic: "topic2",
    //     numPartitions: 1,
    //     replicationFactor: 1,
    //     // replicaAssignment: [{ partition: 0, replicas: [0, 1, 2] }],
    //     configEntries: []
    // }]))

    // console.log('Deleted topics: ', await deleteTopics(['topic2']));

    // console.log('Created partitions: ', await createPartitions([{
    //     topic: "topic1",
    //     count: 2,     // partition count
    //     assignments: null // example: [[0,1],[1,2],[2,0]]
    // }]));

    // console.log('Topic metadata : ', await fetchTopicMetadata(["topic1"]));

    // console.log('All topic metadata: ', await fetchAllTopicsMetadata());

    console.log('Describe cluster: ', await describeCluster());

    // console.log(describeConfigs([{
    //     type: ConfigResourceTypes.TOPIC, //  UNKNOWN: 0, TOPIC: 2, BROKER: 4, BROKER_LOGGER: 8,
    //     name: 'topic1',
    //     configNames: ['cleanup.policy']
    // }, {
    //     type: ConfigResourceTypes.TOPIC,
    //     name: 'topic1', // all configs
    // }]));

    // console.log(await alterConfigs([{
    //     type: ConfigResourceTypes[2],
    //     name: 'topic1',
    //     configEntries: [{ name: 'cleanup.policy', value: 'compact' }]
    // }]));

    // console.log(await listGroups());
    // console.log(await describeGroups());
    // // console.log(deleteGroups());
    // console.log(await deleteTopicRecords('topic1', [
    //     // { partition: 0, offset: '30' }, // delete up to and including offset 29
    //     { partition: 3, offset: '-1' }, // delete all available records on this partition
    // ]));

    console.log(await disconnect() ? 'disconnected' : 'failed to disconnect');
};

if (require.main === module) {
    require('dotenv').config()
    run().catch(e => console.error(`[test/admin] ${e.message}`, e));
};



module.exports = run;