# ===========================
#  Etapa 1 - Build
# ===========================
FROM node:18-alpine AS build

# Criar diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências (sem dev se quiser mais leve: npm ci --omit=dev)
RUN npm install --production

# Copiar todos os arquivos do projeto
COPY . .

# ===========================
#  Etapa 2 - Produção
# ===========================
FROM node:18-alpine

WORKDIR /app

# Copiar apenas node_modules e o código do build
COPY --from=build /app /app

# Expor a porta usada pelo server.js
EXPOSE 3000

# Comando para iniciar
CMD ["node", "server.js"]
