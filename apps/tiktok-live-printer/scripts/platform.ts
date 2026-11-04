/** napi-rs names the spooler addon `printers.<platform>.node`; linux and windows carry an ABI suffix. */
export function napiPlatform(platform: string, arch: string): string {
  const os = platform === "windows" ? "win32" : platform;
  const abi = platform === "linux" ? "-gnu" : platform === "windows" ? "-msvc" : "";
  return `${os}-${arch}${abi}`;
}
