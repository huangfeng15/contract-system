@echo off
setlocal enabledelayedexpansion
REM Windows批处理版本的SessionID快速修改工具

echo 🔧 Windows SessionID快速修改工具
echo ================================

if "%1"=="" (
    echo ℹ️  未提供自定义SessionID，将自动生成一个随机UUID.
    for /f "tokens=*" %%a in ('powershell -Command "[guid]::NewGuid().ToString()"') do set "CUSTOM_SESSION_ID=%%a"
    echo 💎 生成的UUID: !CUSTOM_SESSION_ID!
) else (
    set "CUSTOM_SESSION_ID=%1"
)

REM 获取IntelliJ配置目录
set CONFIG_BASE=%APPDATA%\JetBrains

echo 检测到操作系统: Windows
echo 配置目录: %CONFIG_BASE%

if not exist "%CONFIG_BASE%" (
    echo ❌ 未找到IntelliJ配置目录: %CONFIG_BASE%
    echo 请确保IntelliJ IDEA已安装并至少运行过一次
    pause
    exit /b 1
)

echo.
echo 🔍 查找IntelliJ版本目录...

REM 查找所有IntelliJ版本目录
for /d %%i in ("%CONFIG_BASE%\IntelliJIdea*") do (
    echo.
    echo 🔄 处理版本: %%~ni
    
    set "OPTIONS_DIR=%%i\options"
    if not exist "!OPTIONS_DIR!" mkdir "!OPTIONS_DIR!"
    
    set "IDE_GENERAL_FILE=!OPTIONS_DIR!\ide.general.xml"
    
    set "OLD_SESSION_ID="
    if exist "!IDE_GENERAL_FILE!" (
        for /f "tokens=3" %%p in ('findstr /c:"name=\"augment.session.id\"" "!IDE_GENERAL_FILE!"') do (
            set "line=%%p"
            set "OLD_SESSION_ID=!line:~7,-4!"
        )
    )

    if defined OLD_SESSION_ID (
        echo 🔍 旧 SessionID: !OLD_SESSION_ID!
    ) else (
        echo ℹ️  未找到旧的 SessionID。
    )

    if exist "!IDE_GENERAL_FILE!" (
        echo 📝 修改现有配置文件: !IDE_GENERAL_FILE!
        
        REM 备份原文件
        copy "!IDE_GENERAL_FILE!" "!IDE_GENERAL_FILE!.backup.%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%" >nul
        
        REM 这里简化处理，直接重写文件
        echo ^<application^> > "!IDE_GENERAL_FILE!"
        echo   ^<component name="PropertiesComponent"^> >> "!IDE_GENERAL_FILE!"
        echo     ^<property name="augment.session.id" value="%CUSTOM_SESSION_ID%" /^> >> "!IDE_GENERAL_FILE!"
        echo   ^</component^> >> "!IDE_GENERAL_FILE!"
        echo ^</application^> >> "!IDE_GENERAL_FILE!"
    ) else (
        echo 📄 创建新配置文件: !IDE_GENERAL_FILE!
        
        echo ^<application^> > "!IDE_GENERAL_FILE!"
        echo   ^<component name="PropertiesComponent"^> >> "!IDE_GENERAL_FILE!"
        echo     ^<property name="augment.session.id" value="%CUSTOM_SESSION_ID%" /^> >> "!IDE_GENERAL_FILE!"
        echo   ^</component^> >> "!IDE_GENERAL_FILE!"
        echo ^</application^> >> "!IDE_GENERAL_FILE!"
    )
    
    echo ✅ 已设置SessionID: %CUSTOM_SESSION_ID%
)

echo.
echo 🎉 SessionID修改完成!
echo.
echo 📋 注意事项:
echo 1. 请重启IntelliJ IDEA以使配置生效
echo 2. 原配置文件已备份（如果存在）
echo 3. 如需恢复，可以删除相关配置或使用备份文件
echo.
echo 🔍 验证方法:
echo 重启IntelliJ后，新的SessionID将在下次API调用时生效

pause