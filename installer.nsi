nsis
!include "MUI2.nsh"

Name "Shopkeeper App"
OutFile "ShopkeeperApp_Setup.exe"
InstallDir "$PROGRAMFILES\ShopkeeperApp"
InstallDirRegKey HKCU "Software\ShopkeeperApp" ""

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
  
  CreateDirectory "$SMPROGRAMS\ShopkeeperApp"
  CreateShortcut "$SMPROGRAMS\ShopkeeperApp\ShopkeeperApp.lnk" "$INSTDIR\ShopkeeperApp.exe"
  CreateShortcut "$DESKTOP\ShopkeeperApp.lnk" "$INSTDIR\ShopkeeperApp.exe"
  
  WriteRegStr HKCU "Software\ShopkeeperApp" "" "$INSTDIR"
  WriteUninstaller "$INSTDIR\uninstall.exe"
SectionEnd

Section "Uninstall"
  Delete "$SMPROGRAMS\ShopkeeperApp\ShopkeeperApp.lnk"
  Delete "$DESKTOP\ShopkeeperApp.lnk"
  RMDir "$SMPROGRAMS\ShopkeeperApp"
  
  RMDir /r "$INSTDIR"
  
  DeleteRegKey HKCU "Software\ShopkeeperApp"
SectionEnd



where to add this part