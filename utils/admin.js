const { Kafka, logLevel } = require("kafkajs");
// vars
const settings = {};
const { brokers } = (function setConfigs() {
    if (!!process.env.ADMIN_BROKERS) return { brokers: process.env.ADMIN_BROKERS.split(',') }; // probably all brokers or just one in the main cluster to be connected.
    else throw new Error("admin brokers needed! add ADMIN_BROKERS=['name']");
})();
const errorTypes = ['unhandledRejection', 'uncaughtException'];

const kafka = new Kafka({
    logLevel: logLevel[process.env.LOGLEVEL],
    brokers,
    clientId: 'admin',
    // ssl: {
    //   servername: 'localhost',
    //   rejectUnauthorized: false,
    //   ca: [fs.readFileSync('./testHelpers/certs/cert-signed', 'utf-8')],
    // },
    // sasl: {
    //   mechanism: 'plain',
    //   username: 'test',
    //   password: 'testtest',
    // },
});


const admin = kafka.admin();

async function main() {
    try {
        await admin.connect();

        errorTypes.forEach(type => {
            process.on(type, async () => {
                try {
                    console.log(`process.on ${type}`)
                    await producer.disconnect()
                    process.exit(0)
                } catch (_) {
                    process.exit(1)
                }
            })
        });
    } catch (error) {
        console.log('error admin connection');
        console.log(error);
    };
    return {
        listTopics: async () => {
            return await admin.listTopics()
                .then(res => {
                    // alter and return results
                    return res
                })
                .catch(console.error) // error handling
        },
        createTopics: async (topics,
            opts = {
                validateOnly: false,
                waitForLeaders: true,
                timeout: 5000
            }) => {
            opts['topics'] = topics;
            return await admin.createTopics(opts)
                .then(res => { // true if the topic was created successfully or false if it already exists.
                    // alter and return results
                    if (res) return topics.map((el) => el.topic);
                    return [];
                })
                .catch(console.error) // error handling
        },
        deleteTopics: async (topics, opts = { timeout: 5000 }) => {
            // To enable it set the server config -> delete.topic.enable=true
            opts['topics'] = topics;
            return await admin.deleteTopics(opts)
                .then(() => topics)
                .catch(console.error) // error handling
        },
        createPartitions: async (TopicPartition,
            opts = {
                timeout: 5000,
                validateOnly: false
            }) => {
            opts['TopicPartition'] = TopicPartition;
            return await admin.createPartitions(opts)
                .then(() => { // will resolve in case of success. The method will throw exceptions in case of errors.
                    // alter and return results
                    return TopicPartition.map((el) => `${el.topic} - ${el.count}`);
                })
                .catch(console.error) // error handling
        },
        fetchTopicMetadata: async (topics) => {
            return await admin.fetchTopicMetadata({ topics })
                .then(res => { // The admin client will throw an exception if any of the provided topics do not already exist.
                    // alter and return results
                    return res;
                })
                .catch(console.error) // error handling
        },
        fetchAllTopicsMetadata: async () => {
            return await admin.fetchTopicMetadata()
                .then(res => { // The admin client will throw an exception if any of the provided topics do not already exist.
                    // alter and return results
                    return res;
                })
                .catch(console.error) // error handling
        },
        describeCluster: async () => {
            return await admin.describeCluster()
                .then(res => {
                    // alter and return results
                    return res;
                })
                .catch(console.error) // error handling
        },
        describeConfigs: async (resources,
            opts = {
                includeSynonyms: false
            }) => {
            opts['resources'] = resources;
            return await admin.describeConfigs(opts)
                .then(res => {
                    // alter and return results
                    return res;
                    /*
                    {
                        resources: [
                            {
                                configEntries: [{
                                    configName: 'cleanup.policy',
                                    configValue: 'delete',
                                    isDefault: true,
                                    configSource: 5,
                                    isSensitive: false,
                                    readOnly: false
                                }],
                                errorCode: 0,
                                errorMessage: null,
                                resourceName: 'topic-name',
                                resourceType: 2
                            }
                        ],
                        throttleTime: 0
                    }
                    */
                })
                .catch(console.error) // error handling
        },
        alterConfigs: async (resources, opts = { validateOnly: false, resources }) => {
            opts['resources'] = resources;
            return await admin.alterConfigs(opts)
                .then(res => {
                    // alter and return results
                    return res;
                    /*
                    {
                        resources: [{
                            errorCode: 0,
                            errorMessage: null,
                            resourceName: 'topic-name',
                            resourceType: 2,
                        }],
                        throttleTime: 0,
                    }
    */
                })
                .catch(console.error) // error handling
        },
        listGroups: async () => {
            return await admin.listGroups()
                .then(res => {
                    // alter and return results
                    return res;
                    /*
                    {   
                        groups: [
                            {groupId: 'testgroup', protocolType: 'consumer'}
                        ]
                    } 
                    */
                })
                .catch(console.error) // error handling
        },
        describeGroups: async (groups) => {
            return await admin.describeGroups(groups)
                .then(res => {
                    // alter and return results
                    return res;
                    /*
                    {
                    groups: [{
                        errorCode: 0,
                        groupId: 'testgroup',
                        members: [
                        {
                            clientHost: '/172.19.0.1',
                            clientId: 'test-3e93246fe1f4efa7380a',
                            memberAssignment: Buffer,
                            memberId: 'test-3e93246fe1f4efa7380a-ff87d06d-5c87-49b8-a1f1-c4f8e3ffe7eb',
                            memberMetadata: Buffer,
                        },
                        ],
                        protocol: 'RoundRobinAssigner',
                        protocolType: 'consumer',
                        state: 'Stable',
                    }]
                    }
                    */
                })
                .catch(console.error) // error handling
        },
        deleteGroups: async (groups) => {
            return await admin.deleteGroups(groups)
                .then(res => {
                    // alter and return results
                    return res;
                    /*
                       [
                            {groupId: 'testgroup', errorCode: 'consumer'}
                        ]
                    */
                })
                .catch(console.error) // error handling
        },
        deleteTopicRecords: async (topic, partitions) => {
            return await admin.deleteTopicRecords({
                topic,
                partitions
            })
                .then(res => {
                    // alter and return results
                    return res;
                })
                .catch(console.error) // error handling
        },
        disconnect: async () => {
            return await admin.disconnect().then(() => true).catch(console.error)
        }
        // Create ACL
        //Fetch topic offsets, Fetch topic offsets by timestamp, Fetch consumer group offsets, Reset consumer group offsets, Set consumer group offsets
        //Reset consumer group offsets by timestamp
    };
};

module.exports = main();