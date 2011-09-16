@echo off
echo Packages the gadget using 7zip
if exist AlertCamera.gadget del AlertCamera.gadget
C:\Tools\7zip\7za.exe a -tzip AlertCamera.gadget * -r -x!.svn -x!.komodotools -x!*.komodoproject -x!package.bat -x!readme.txt