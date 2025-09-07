FROM node:20-alpine

# define diretório de trabalho
WORKDIR /usr/src/app

# copia package.json e instala dependências
COPY package*.json ./
RUN npm install --production

# copia o restante do código
COPY . .

# cria pastas de saída
RUN mkdir -p /usr/src/app/out

# expõe porta do servidor
EXPOSE 3000

CMD ["node", "server.js"]
