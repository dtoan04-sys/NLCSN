@echo off
set "JAVA_HOME=E:\Program Files\Android\Android Studio\jbr"
set "PATH=%JAVA_HOME%\bin;%PATH%"
cd /d "E:\CNTT\NLCNHTTT\frontend-kieng-la\android"
call gradlew.bat assembleDebug
