FROM node:18.16.0-slim
# Create app directory
WORKDIR /usr/src/kafkajs
# Bundle app source and Install dependencies
COPY . .
RUN npm install
# Open a port to outside of container
EXPOSE 3000
ENTRYPOINT ["./scripts/root.sh"]
# Another form of entrypoint
# CMD ["sleep 10 ; npm run start"]
