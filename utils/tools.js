module.exports = {
    getRandomNumber: (max = 10) => Math.round(Math.random() * max),
    createMessage: num => ({
        key: `key-${num}`,
        value: `value-${num}-${new Date().toISOString()}`,
    })
}