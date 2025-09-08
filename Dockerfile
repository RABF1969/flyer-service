# Etapa base
FROM node:18-slim

# Diretório de trabalho
WORKDIR /usr/src/app

# Copia apenas arquivos essenciais primeiro (para aproveitar cache)
COPY package*.json ./

# Instala dependências de produção
RUN npm install --production

# Copia o restante do código
COPY . .

# Cria pasta de saída (mesmo que o código crie dinamicamente, garantimos no build)
RUN mkdir -p /usr/src/app/out

# Porta interna do serviço
EXPOSE 3000

# Comando inicial
CMD ["npm", "start"]
