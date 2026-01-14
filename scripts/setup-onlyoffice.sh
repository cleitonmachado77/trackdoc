#!/bin/bash

# Script para configurar OnlyOffice Document Server
# Uso: ./scripts/setup-onlyoffice.sh

echo "🚀 Configurando OnlyOffice Document Server..."
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado!"
    echo "Por favor, instale o Docker primeiro:"
    echo "  - Windows/Mac: https://www.docker.com/products/docker-desktop"
    echo "  - Linux: curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh"
    exit 1
fi

echo "✅ Docker encontrado"
echo ""

# Verificar se a porta 80 está disponível
if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Porta 80 já está em uso!"
    echo "Você pode:"
    echo "  1. Parar o serviço que está usando a porta 80"
    echo "  2. Usar outra porta (ex: 8080)"
    read -p "Deseja usar a porta 8080? (s/n): " use_alt_port
    
    if [ "$use_alt_port" = "s" ] || [ "$use_alt_port" = "S" ]; then
        PORT=8080
        ONLYOFFICE_URL="http://localhost:8080"
    else
        echo "❌ Abortando instalação"
        exit 1
    fi
else
    PORT=80
    ONLYOFFICE_URL="http://localhost"
fi

echo ""
echo "📦 Baixando e iniciando OnlyOffice Document Server..."
echo "   Isso pode levar alguns minutos na primeira vez..."
echo ""

# Criar diretórios para volumes
mkdir -p ~/onlyoffice/logs
mkdir -p ~/onlyoffice/data

# Executar container
docker run -i -t -d \
  -p $PORT:80 \
  -e JWT_ENABLED=false \
  -v ~/onlyoffice/logs:/var/log/onlyoffice \
  -v ~/onlyoffice/data:/var/www/onlyoffice/Data \
  --name onlyoffice-documentserver \
  onlyoffice/documentserver

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ OnlyOffice Document Server iniciado com sucesso!"
    echo ""
    echo "📝 Configurando variável de ambiente..."
    
    # Adicionar ao .env.local se não existir
    if ! grep -q "NEXT_PUBLIC_ONLYOFFICE_URL" .env.local 2>/dev/null; then
        echo "NEXT_PUBLIC_ONLYOFFICE_URL=$ONLYOFFICE_URL" >> .env.local
        echo "✅ Variável adicionada ao .env.local"
    else
        echo "⚠️  Variável já existe no .env.local"
        echo "   Certifique-se de que está configurada como: NEXT_PUBLIC_ONLYOFFICE_URL=$ONLYOFFICE_URL"
    fi
    
    echo ""
    echo "🎉 Configuração concluída!"
    echo ""
    echo "📋 Próximos passos:"
    echo "   1. Aguarde ~30 segundos para o servidor inicializar"
    echo "   2. Teste o acesso: $ONLYOFFICE_URL"
    echo "   3. Reinicie a aplicação: npm run dev"
    echo "   4. Acesse a página Office no menu lateral"
    echo ""
    echo "🛠️  Comandos úteis:"
    echo "   - Ver logs: docker logs onlyoffice-documentserver"
    echo "   - Parar: docker stop onlyoffice-documentserver"
    echo "   - Iniciar: docker start onlyoffice-documentserver"
    echo "   - Remover: docker rm -f onlyoffice-documentserver"
    echo ""
else
    echo ""
    echo "❌ Erro ao iniciar OnlyOffice Document Server"
    echo "   Verifique os logs: docker logs onlyoffice-documentserver"
    exit 1
fi
