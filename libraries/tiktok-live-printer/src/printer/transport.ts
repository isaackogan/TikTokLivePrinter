/** Where encoded ESC/POS bytes go. One transport per printer. */
export interface Transport {
  write(bytes: Uint8Array): Promise<void>;
  close(): Promise<void>;
}
