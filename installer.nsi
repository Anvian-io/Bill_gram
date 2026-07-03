nsis
!include "MUI2.nsh"

Name "Bill Gram"
OutFile "BillGram_Setup.exe"
InstallDir "$PROGRAMFILES\BillGram"
InstallDirRegKey HKCU "Software\BillGram" ""

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Section
  SetOutPath "$INSTDIR"
  
  File /r "dist\win-unpacked\*"
  
  CreateDirectory "$SMPROGRAMS\BillGram"
  CreateShortcut "$SMPROGRAMS\BillGram\BillGram.lnk" "$INSTDIR\BillGram.exe"
  CreateShortcut "$DESKTOP\BillGram.lnk" "$INSTDIR\BillGram.exe"

  WriteRegStr HKCU "Software\BillGram" "" "$INSTDIR"
  WriteUninstaller "$INSTDIR\uninstall.exe"
SectionEnd

Section "Uninstall"
  Delete "$SMPROGRAMS\BillGram\BillGram.lnk"
  Delete "$DESKTOP\BillGram.lnk"
  RMDir "$SMPROGRAMS\BillGram"
  
  RMDir /r "$INSTDIR"
  
  DeleteRegKey HKCU "Software\BillGram"
SectionEnd



where to add this part