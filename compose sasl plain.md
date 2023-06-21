In my ansible on AWS i use this for SASL and it works. Hope it helps others as several of this required several attempts to find the correct setup due to the lack of a working setup example. Notice that i use --net=host, to avoid the docker network, as i don't really need it, so it binds directly to the host IP:port. For use with the internal docker network and external host, finetune using the examples in the wiki. 
For now i do not need SSL nor zookeeper security

```
  env:
    - "BROKER_ID_COMMAND='hostname | cut -b 20'"
    - "KAFKA_ADVERTISED_HOST_NAME={{ ansible_hostname }}.node.consul.{{internalDNS}}."
    - "RACK_COMMAND='curl http://169.254.169.254/latest/meta-data/placement/availability-zone'"
    - "KAFKA_ZOOKEEPER_CONNECT={{ec2_tag_cluster}}.zookeeper.service.consul.{{internalDNS}}.:2181"
    - "KAFKA_DEFAULT_REPLICATION_FACTOR=3"
    - "KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=3"
    # probably the __consumer_offsets is not needed by the above config, but at least allow a empty queues list
    - "KAFKA_CREATE_TOPICS={% for queue in queues %}{{ queue }}.topic:10:2,{% endfor %}__consumer_offsets:50:3"
    - "KAFKA_MESSAGE_MAX_BYTES=256000"
    - "KAFKA_AUTO_CREATE_TOPICS_ENABLE=false"
    - "KAFKA_LOG_DIRS=/logs/kafka"
    - "KAFKA_SASL_ENABLED_MECHANISMS=SCRAM-SHA-256,SCRAM-SHA-512"
    - "KAFKA_LISTENERS=SASL_PLAINTEXT://:9092"
    - "KAFKA_ADVERTISED_LISTENERS=SASL_PLAINTEXT://{{ ansible_hostname }}.node.consul.{{internalDNS}}.:9092"
    - "KAFKA_LISTENER_SECURITY_PROTOCOL_MAP=SASL_PLAINTEXT:SASL_PLAINTEXT"
    - "KAFKA_INTER_BROKER_LISTENER_NAME=SASL_PLAINTEXT"
    - "KAFKA_SASL_MECHANISM_INTER_BROKER_PROTOCOL=SCRAM-SHA-256"
    - "KAFKA_AUTHORIZER_CLASS_NAME=kafka.security.authorizer.AclAuthorizer"
    # for older kafka versions use this instead
    # "KAFKA_AUTHORIZER_CLASS_NAME=kafka.security.auth.SimpleAclAuthorizer"
    - "KAFKA_ALLOW_EVERYONE_IF_NO_ACL_FOUND=true"
    - "KAFKA_SUPER_USERS=User:admin"
    - "KAFKA_OPTS=-Djava.security.auth.login.config=/app/config/jaas.conf"
```

The jaas.conf is placed in a volume mapped to idocker /app/config (a similar one may be needed by some clients)
```
KafkaServer {
  org.apache.kafka.common.security.scram.ScramLoginModule required
  username="admin"
  password="{{ lookup('vault', 'secret/kafka/admin', 'value') }}";
};
KafkaClient {
  org.apache.kafka.common.security.scram.ScramLoginModule required
  username="admin"
  password="{{ lookup('vault', 'secret/kafka/admin', 'value') }}";
};
Client {};

```

And this to create a basic auth user and acl.  /usr/local/sbin/kafka-cmd  is just a script to execute the commands inside the docker ( calls `bash -c "unset JMX_PORT; $*"` )

```
- name: "Create admin authentication credentials in ZooKeeper"
  command: >
    /usr/local/sbin/kafka-cmd kafka-configs.sh \
    --zookeeper {{kafka.config.zookeeper.address}} \
    --alter \
    --add-config 'SCRAM-SHA-256=[password={{ lookup('vault', 'secret/kafka/admin', 'value') }}],SCRAM-SHA-512=[password={{ lookup('vault', 'secret/kafka/admin', 'value') }}]' \
    --entity-type users \
    --entity-name admin
  register: command_result
  failed_when:
    - '"Completed Updating config for entity: user-principal" not in command_result.stdout'
  tags:
    - kafka
    - auth

- name: "Deny anonymous acl"
  command: >
    /usr/local/sbin/kafka-cmd kafka-acls.sh \
    --authorizer-properties zookeeper.connect={{kafka.config.zookeeper.address}} \
    --add \
    --cluster \
    --operation Alter \
    --deny-principal User:ANONYMOUS
  register: command_result
  failed_when:
    - '"User:ANONYMOUS has Deny permission for operations: Alter" not in command_result.stdout'
  tags:
    - kafka
    - auth
    - acl
```

and then a user list in the format

```
    kafka_users:
      - name: user
        password:  pass
        topic: topic
        group: consumer_group
        type: (both|consumer|producer)
```

and iterate to create the auth and acls

```
- name: "Create {{user.name}} authentication credentials in ZooKeeper"
  command: >
    /usr/local/sbin/kafka-cmd kafka-configs.sh \
    --zookeeper {{kafka.config.zookeeper.address}} \
    --alter \
    --add-config 'SCRAM-SHA-256=[password={{ user.password }}],SCRAM-SHA-512=[password={{ user.password }}]' \
    --entity-type users \
    --entity-name {{ user.name }}
  register: command_result
  failed_when:
    - '"Completed Updating config for entity: user-principal ''" ~ user.name ~ "''." not in command_result.stdout'
  tags:
    - kafka
    - auth

- name: "Create {{user.name}} producer acl for {{user.topic}}"
  command: >
    /usr/local/sbin/kafka-cmd kafka-acls.sh \
    --authorizer-properties zookeeper.connect={{kafka.config.zookeeper.address}} \
    --add \
    --allow-principal 'User:{{ user.name }}' \
    --producer \
    --group '{{ user.group }}' \
    --topic '{{ user.topic }}'
  register: command_result
  when: 'user.type == "producer" or user.type =="both" '
  failed_when:
    - 'user.name ~ " has Allow permission for operations: Create from hosts:" not in command_result.stdout'
  tags:
    - kafka
    - acl
    - producer

- name: "Create {{user.name}} consumer acl for {{user.topic}}"
  command: >
    /usr/local/sbin/kafka-cmd kafka-acls.sh \
    --authorizer-properties zookeeper.connect={{kafka.config.zookeeper.address}} \
    --add \
    --allow-principal 'User:{{ user.name }}' \
    --consumer \
    --group '{{ user.group }}' \
    --topic '{{ user.topic }}'
  register: command_result
  when: 'user.type == "consumer" or user.type =="both" '
  failed_when:
    - 'user.name ~ " has Allow permission for operations: Create from hosts:" not in command_result.stdout'
  tags:
    - kafka
    - acl
    - consumer
```


with this, i can produce and consume messages:

`docker run --rm -it solsson/kafkacat -C   -b localhost:9092  -X security.protocol=SASL_PLAINTEXT -X sasl.mechanism=SCRAM-SHA-256  -X sasl.username=user -X sasl.password=password   -t topic  -o beginning -J`