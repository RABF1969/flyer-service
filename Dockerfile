FROM node:18-alpine

# diretório de trabalho
WORKDIR /usr/src/app

# copia package.json e instala dependências
COPY package*.json ./
RUN npm install --production

# copia todo o código e assets (incluindo fontes!)
COPY . .

# cria pasta de saída (se precisar salvar flyers no disco)
RUN mkdir -p /usr/src/app/out

# expõe a porta
EXPOSE 3000

# inicia o servidor
CMD ["node", "server.js"]
