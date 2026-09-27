@echo off
rem anibar launcher for PowerShell / cmd.exe: runs the anibar shell script through Git Bash.
rem Keep it next to the script, e.g. %USERPROFILE%\.local\bin\anibar.cmd
setlocal EnableExtensions
set "ANIBAR_SCRIPT=%~dp0anibar"
set "ANIBAR_SCRIPT=%ANIBAR_SCRIPT:\=/%"
set "GIT_BASH="
for %%D in ("%ProgramFiles%\Git" "%LocalAppData%\Programs\Git" "%ProgramFiles(x86)%\Git" "%ProgramW6432%\Git") do (
    if not defined GIT_BASH if exist "%%~D\bin\bash.exe" set "GIT_BASH=%%~D\bin\bash.exe"
)
if not defined GIT_BASH for /f "delims=" %%G in ('where git.exe 2^>nul') do (
    if not defined GIT_BASH if exist "%%~dpG..\bin\bash.exe" set "GIT_BASH=%%~dpG..\bin\bash.exe"
)
if not defined GIT_BASH (
    echo anibar: Git for Windows not found. Install it with: winget install --id Git.Git -e 1>&2
    exit /b 1
)
"%GIT_BASH%" "%ANIBAR_SCRIPT%" %*
exit /b %ERRORLEVEL%
