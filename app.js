require('dotenv').config()

// tests
if (!!process.env.TEST) {
    require('./tests/admin-flow')();
    // require('./tests/producer-flow')();
};


// main
async function run() {
    console.log('started');




    // Error handling

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

    signalTraps.forEach(type => {
        process.once(type, async () => { // Adds a one-timelistener function for the event. 
            try {
                console.log(type);
                await producer.disconnect()
            } finally {
                process.kill(process.pid, type)
            }
        })
    })
};

// Buffer.from()