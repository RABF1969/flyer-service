# Usa Node 18 (LTS)
FROM node:18-alpine

# Define diretório de trabalho
WORKDIR /app

# Copia package.json e package-lock.json primeiro (cache otimizado)
COPY package*.json ./

# Instala dependências de produção
RUN npm install --only=production

# Copia o restante do código
COPY . .

# Expõe a porta do servidor
EXPOSE 3000

# Comando de inicialização
CMD ["node", "server.js"]
