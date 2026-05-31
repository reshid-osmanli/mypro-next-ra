type ZipFile = {
  name: string;
  data: Buffer;
};

const crcTable = new Uint32Array(256);

for (let i = 0; i < 256; i += 1) {
  let value = i;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  crcTable[i] = value >>> 0;
}

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(date.getFullYear(), 1980);
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosDate, dosTime };
}

function writeUInt16(value: number) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value);
  return buffer;
}

function writeUInt32(value: number) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value >>> 0);
  return buffer;
}

function uniqueZipName(name: string, usedNames: Set<string>) {
  const safeName = name.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim() || "kutubi-file";
  if (!usedNames.has(safeName)) {
    usedNames.add(safeName);
    return safeName;
  }

  const dotIndex = safeName.lastIndexOf(".");
  const stem = dotIndex > 0 ? safeName.slice(0, dotIndex) : safeName;
  const extension = dotIndex > 0 ? safeName.slice(dotIndex) : "";
  let index = 2;
  let candidate = `${stem}-${index}${extension}`;

  while (usedNames.has(candidate)) {
    index += 1;
    candidate = `${stem}-${index}${extension}`;
  }

  usedNames.add(candidate);
  return candidate;
}

export function createZipArchive(files: ZipFile[]) {
  const now = dosDateTime();
  const usedNames = new Set<string>();
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuffer = Buffer.from(uniqueZipName(file.name, usedNames), "utf8");
    const checksum = crc32(file.data);
    const common = Buffer.concat([
      writeUInt16(20),
      writeUInt16(0x0800),
      writeUInt16(0),
      writeUInt16(now.dosTime),
      writeUInt16(now.dosDate),
      writeUInt32(checksum),
      writeUInt32(file.data.length),
      writeUInt32(file.data.length),
      writeUInt16(nameBuffer.length),
      writeUInt16(0)
    ]);

    const localHeader = Buffer.concat([writeUInt32(0x04034b50), common, nameBuffer]);
    localParts.push(localHeader, file.data);

    centralParts.push(
      Buffer.concat([
        writeUInt32(0x02014b50),
        writeUInt16(20),
        common,
        writeUInt16(0),
        writeUInt16(0),
        writeUInt16(0),
        writeUInt16(0),
        writeUInt32(0),
        writeUInt32(offset),
        nameBuffer
      ])
    );

    offset += localHeader.length + file.data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const endOfCentralDirectory = Buffer.concat([
    writeUInt32(0x06054b50),
    writeUInt16(0),
    writeUInt16(0),
    writeUInt16(files.length),
    writeUInt16(files.length),
    writeUInt32(centralDirectory.length),
    writeUInt32(offset),
    writeUInt16(0)
  ]);

  return Buffer.concat([...localParts, centralDirectory, endOfCentralDirectory]);
}
