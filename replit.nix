{ pkgs }: {
  deps = [
    pkgs.nodejs_20
    pkgs.postgresql
    pkgs.chromium
    pkgs.glib
    pkgs.nss
    pkgs.nspr
    pkgs.atk
    pkgs.at-spi2-atk
    pkgs.cups
    pkgs.drm
    pkgs.gtk3
    pkgs.gdk-pixbuf
    pkgs.libxss
    pkgs.alsaLib
  ];
}