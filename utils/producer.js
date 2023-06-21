const { Kafka, logLevel, Partitioners } = require('kafkajs');
// vars
// const settings = {};
const { brokers } = (function setConfigs() {
    if (!!process.env.PRODUCER_BROKERS) return { brokers: process.env.PRODUCER_BROKERS.split(',') }; // probably all brokers or just one in the main cluster to be connected.
    else throw new Error("admin brokers needed! add PRODUCER_BROKERS=['name']");
})();
const errorTypes = ['unhandledRejection', 'uncaughtException'];
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

// instance
const kafka = new Kafka({
    logLevel: logLevel[process.env.LOGLEVEL],
    brokers,
    clientId: 'producer',
});
const producer = kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner });

async function main() {
    try {
        await producer.connect();
    } catch (err) {
        console.log("!!!!! Connecting to producer:\n", err);
    };
    return {
        sendMessage: async (msgObj, sync = false) => {
            return await producer.send(msgObj).catch(error => console.error(`[example/producer]`, error));
        },
        disconnect: async () => {
            try {
                await producer.disconnect();
                return true;
            } catch (error) {
                console.log(error);
                return false;
            }
        },
        sendBatch: async (msgObj, sync = false) => {
            return await producer.sendBatch(msgObj).catch(error => console.error(`[example/producer]`, error));
        },
    };
};

module.exports = main();



