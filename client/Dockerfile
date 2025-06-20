FROM node:20

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npm run build

RUN npm install -g serve

#EXPOSE 8002

#CMD ["serve", "-s", "build", "-l", "8002"]

EXPOSE 5173

CMD ["npm", "run", "dev"]

