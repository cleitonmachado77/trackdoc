# Configuração do OnlyOffice Document Server

Este guia explica como configurar o OnlyOffice Document Server para habilitar a edição de documentos Word diretamente na plataforma.

## Visão Geral

O OnlyOffice é uma solução open-source que permite criar e editar documentos Office (Word, Excel, PowerPoint) diretamente no navegador. A integração foi implementada na página **Office**, acessível através do menu lateral.

## Pré-requisitos

- Docker instalado no sistema
- Porta 80 disponível (ou outra porta de sua escolha)

## Instalação Rápida com Docker

### 1. Instalar Docker

Se você ainda não tem o Docker instalado:

**Windows/Mac:**
- Baixe e instale o [Docker Desktop](https://www.docker.com/products/docker-desktop)

**Linux:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### 2. Executar OnlyOffice Document Server

Execute o seguinte comando para iniciar o servidor:

```bash
docker run -i -t -d -p 80:80 \
  -e JWT_ENABLED=false \
  -v ~/onlyoffice/logs:/var/log/onlyoffice \
  -v ~/onlyoffice/data:/var/www/onlyoffice/Data \
  onlyoffice/documentserver
```

**Parâmetros:**
- `-p 80:80`: Mapeia a porta 80 do container para a porta 80 do host
- `-e JWT_ENABLED=false`: Desabilita JWT para desenvolvimento (habilite em produção!)
- `-v`: Monta volumes para persistir logs e dados

### 3. Verificar Instalação

Abra o navegador e acesse: `http://localhost`

Você deverá ver a página de boas-vindas do OnlyOffice Document Server.

### 4. Configurar Variável de Ambiente

Adicione a seguinte variável ao arquivo `.env.local`:

```env
NEXT_PUBLIC_ONLYOFFICE_URL=http://localhost
```

### 5. Reiniciar a Aplicação

```bash
npm run dev
```

## Uso na Plataforma

1. Acesse a plataforma e faça login
2. No menu lateral, clique em **Office**
3. Você pode:
   - **Criar Novo Documento**: Cria um documento Word em branco
   - **Enviar Documento**: Faz upload de um documento Word existente (.doc, .docx, .odt)
   - **Editar**: Abre documentos existentes no editor

## Funcionalidades Disponíveis

- ✅ Criar documentos Word do zero
- ✅ Editar documentos Word existentes
- ✅ Upload de documentos (.doc, .docx, .odt)
- ✅ Download de documentos editados
- ✅ Formatação completa (negrito, itálico, fontes, cores, etc.)
- ✅ Inserir tabelas, imagens e outros elementos
- ✅ Salvar automaticamente
- ✅ Integração com storage do Supabase

## Configuração para Produção

### Habilitar JWT (Recomendado)

Para produção, é altamente recomendado habilitar JWT para segurança:

```bash
docker run -i -t -d -p 80:80 \
  -e JWT_ENABLED=true \
  -e JWT_SECRET=your_secret_key_here \
  -v ~/onlyoffice/logs:/var/log/onlyoffice \
  -v ~/onlyoffice/data:/var/www/onlyoffice/Data \
  onlyoffice/documentserver
```

Adicione ao `.env.local`:
```env
NEXT_PUBLIC_ONLYOFFICE_JWT_SECRET=your_secret_key_here
```

### Usar HTTPS

Para produção, configure um proxy reverso (Nginx/Apache) com SSL:

```nginx
server {
    listen 443 ssl;
    server_name docs.seudominio.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Alternativas de Hospedagem

### OnlyOffice Cloud

Se preferir não hospedar o servidor você mesmo, considere:
- [OnlyOffice Cloud](https://www.onlyoffice.com/pt/office-for-saas.aspx)
- [OnlyOffice Developer Edition](https://www.onlyoffice.com/pt/developer-edition.aspx)

### Docker Compose

Para facilitar o gerenciamento, use Docker Compose:

```yaml
version: '3'
services:
  onlyoffice:
    image: onlyoffice/documentserver
    ports:
      - "80:80"
    environment:
      - JWT_ENABLED=false
    volumes:
      - ./onlyoffice/logs:/var/log/onlyoffice
      - ./onlyoffice/data:/var/www/onlyoffice/Data
    restart: unless-stopped
```

Execute com:
```bash
docker-compose up -d
```

## Solução de Problemas

### Porta 80 já está em uso

Se a porta 80 já estiver em uso, mapeie para outra porta:

```bash
docker run -i -t -d -p 8080:80 \
  -e JWT_ENABLED=false \
  onlyoffice/documentserver
```

E configure:
```env
NEXT_PUBLIC_ONLYOFFICE_URL=http://localhost:8080
```

### Container não inicia

Verifique os logs:
```bash
docker logs <container_id>
```

### Editor não carrega

1. Verifique se o Document Server está rodando: `docker ps`
2. Teste o acesso direto: `http://localhost`
3. Verifique a variável de ambiente `NEXT_PUBLIC_ONLYOFFICE_URL`
4. Limpe o cache do navegador

## Recursos Adicionais

- [Documentação Oficial OnlyOffice](https://api.onlyoffice.com/editors/basic)
- [OnlyOffice GitHub](https://github.com/ONLYOFFICE/DocumentServer)
- [Fórum da Comunidade](https://forum.onlyoffice.com/)

## Suporte

Para problemas ou dúvidas sobre a integração, entre em contato com a equipe de desenvolvimento.
