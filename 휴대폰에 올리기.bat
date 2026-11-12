@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  [1/2] GitHub에 사전을 올릴 공간을 준비합니다...
gh repo view Riencarna/tw-ko-dict >nul 2>&1
if errorlevel 1 gh repo create tw-ko-dict --public --description "Taiwanese Mandarin - Korean dictionary (web app)"
echo.
echo  [2/2] 사전 파일을 올립니다. 처음에는 1~2분쯤 걸립니다...
python -I tools\deploy.py Riencarna/tw-ko-dict
if errorlevel 1 goto fail
echo.
echo  끝났습니다. 몇 분 뒤 휴대폰 브라우저에서 아래 주소를 여세요.
echo  https://riencarna.github.io/tw-ko-dict/
echo.
pause
exit /b 0
:fail
echo.
echo  올리는 중 문제가 생겼습니다. 이 창에 나온 글을 Claude에게 그대로 알려 주세요.
echo.
pause
exit /b 1
