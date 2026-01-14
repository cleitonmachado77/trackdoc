@echo off
REM Script para configurar OnlyOffice Document Server no Windows
REM Uso: scripts\setup-onlyoffice.bat

echo.
echo ========================================
echo  Configurando OnlyOffice Document Server
echo ========================================
echo.

REM Verificar se Docker está instalado
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Docker nao esta instalado!
    echo.
    echo Por favor, instale o Docker Desktop:
    echo https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)

echo [OK] Docker encontrado
echo.

REM Verificar se a porta 80 está disponível
netstat -ano | findstr :80 >nul 2>&1
if %errorlevel% equ 0 (
    echo [AVISO] Porta 80 ja esta em uso!
    echo.
    set /p use_alt_port="Deseja usar a porta 8080? (s/n): "
    
    if /i "%use_alt_port%"=="s" (
        set PORT=8080
        set ONLYOFFICE_URL=http://localhost:8080
    ) else (
        echo [ERRO] Abortando instalacao
        pause
        exit /b 1
    )
) else (
    set PORT=80
    set ONLYOFFICE_URL=http://localhost
)

echo.
echo Baixando e iniciando OnlyOffice Document Server...
echo Isso pode levar alguns minutos na primeira vez...
echo.

REM Criar diretórios para volumes
if not exist "%USERPROFILE%\onlyoffice\logs" mkdir "%USERPROFILE%\onlyoffice\logs"
if not exist "%USERPROFILE%\onlyoffice\data" mkdir "%USERPROFILE%\onlyoffice\data"

REM Executar container
docker run -i -t -d ^
  -p %PORT%:80 ^
  -e JWT_ENABLED=false ^
  -v "%USERPROFILE%\onlyoffice\logs:/var/log/onlyoffice" ^
  -v "%USERPROFILE%\onlyoffice\data:/var/www/onlyoffice/Data" ^
  --name onlyoffice-documentserver ^
  onlyoffice/documentserver

if %errorlevel% equ 0 (
    echo.
    echo [OK] OnlyOffice Document Server iniciado com sucesso!
    echo.
    echo Configurando variavel de ambiente...
    
    REM Adicionar ao .env.local se não existir
    findstr /C:"NEXT_PUBLIC_ONLYOFFICE_URL" .env.local >nul 2>&1
    if %errorlevel% neq 0 (
        echo NEXT_PUBLIC_ONLYOFFICE_URL=%ONLYOFFICE_URL%>> .env.local
        echo [OK] Variavel adicionada ao .env.local
    ) else (
        echo [AVISO] Variavel ja existe no .env.local
        echo Certifique-se de que esta configurada como: NEXT_PUBLIC_ONLYOFFICE_URL=%ONLYOFFICE_URL%
    )
    
    echo.
    echo ========================================
    echo  Configuracao concluida!
    echo ========================================
    echo.
    echo Proximos passos:
    echo   1. Aguarde ~30 segundos para o servidor inicializar
    echo   2. Teste o acesso: %ONLYOFFICE_URL%
    echo   3. Reinicie a aplicacao: npm run dev
    echo   4. Acesse a pagina Office no menu lateral
    echo.
    echo Comandos uteis:
    echo   - Ver logs: docker logs onlyoffice-documentserver
    echo   - Parar: docker stop onlyoffice-documentserver
    echo   - Iniciar: docker start onlyoffice-documentserver
    echo   - Remover: docker rm -f onlyoffice-documentserver
    echo.
) else (
    echo.
    echo [ERRO] Erro ao iniciar OnlyOffice Document Server
    echo Verifique os logs: docker logs onlyoffice-documentserver
    pause
    exit /b 1
)

pause
