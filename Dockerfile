# ============================
# Dockerfile para flyer-service
# ============================

# Base oficial Node.js (com suporte LTS)
FROM node:22-slim

# Instala dependências necessárias para o sharp funcionar
RUN apt-get update && apt-get install -y \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

# Define diretório de trabalho
WORKDIR /usr/src/app

# Copia os manifests primeiro (para cache eficiente)
COPY package*.json ./

# Instala dependências em produção
RUN npm install --production

# Copia todo o restante do projeto (inclui assets, server.js, gerar_flyer.js etc.)
COPY . .

# Garante que a pasta out exista
RUN mkdir -p /usr/src/app/out

# Verifica se os arquivos essenciais estão dentro do container
RUN test -f /usr/src/app/assets/fonts/Poppins-Bold.ttf && \
    test -f /usr/src/app/assets/fotos/flyer_base.png

# Expõe a porta usada pelo serviço
EXPOSE 3000

# Comando inicial
CMD ["npm", "start"]
