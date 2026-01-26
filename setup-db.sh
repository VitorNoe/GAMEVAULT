#!/bin/bash

set -e

echo "🔄 Parando containers..."
cd /workspaces/GAMEVAULT
docker-compose down -v 2>/dev/null || true

echo "⏳ Aguardando 5 segundos..."
sleep 5

echo "🚀 Iniciando PostgreSQL e PGAdmin..."
docker-compose up -d postgres pgadmin

echo "⏳ Aguardando banco de dados ficar pronto..."
sleep 10

echo "✅ Banco de dados iniciado!"
echo ""
echo "🌐 Você pode acessar:"
echo "  - PostgreSQL: localhost:5432"
echo "  - PGAdmin: http://localhost:5050"
echo ""
echo "📊 Verificando tabelas..."
docker exec gamevault_postgres psql -U postgres -d gamevault -c "\dt" 2>/dev/null || echo "Ainda não há tabelas"

echo ""
echo "✅ Setup concluído!"
