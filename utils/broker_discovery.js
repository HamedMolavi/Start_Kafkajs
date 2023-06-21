module.exports = async (restProxyURL) => { // 'https://kafka-rest:8082/v3/clusters'
    // Example getting brokers from Confluent REST Proxy
    return fetch(restProxyURL, {
        headers: 'application/vnd.api+json',
    }).then(response => response.json())
        .then(clusterResponse => clusterResponse.data[0].links.self)
        .then(clusterUrl => fetch(`${clusterUrl}/brokers`, {
            headers: 'application/vnd.api+json',
        }))
        .then(response => response.json())
        .then(brokersResponse => brokersResponse.data.map(broker => {
            const { host, port } = broker.attributes
            return `${host}:${port}`
        }))
        .catch(console.error) // do something (try again)
};