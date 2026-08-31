/**
 * Regenerates all app icons from the master SVG (app/icon.svg):
 *   - app/favicon.ico          (16 + 32 + 48, PNG-compressed ICO)
 *   - app/apple-icon.png       (180x180)
 *   - public/icons/icon-192.png, icon-512.png (PWA manifest)
 *
 * Run: node scripts/generate-icons.mjs
 */
import sharp from 'sharp'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const svg = await readFile(path.join(root, 'app', 'icon.svg'))

const png = (size) => sharp(svg, { density: 300 }).resize(size, size).png().toBuffer()

/** Wrap PNG buffers into a single .ico (PNG-in-ICO, supported by all modern browsers). */
function toIco(pngs, sizes) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(pngs.length, 4)

  const entries = []
  let offset = 6 + 16 * pngs.length
  pngs.forEach((buf, i) => {
    const e = Buffer.alloc(16)
    e.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], 0) // width
    e.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], 1) // height
    e.writeUInt8(0, 2) // palette
    e.writeUInt8(0, 3) // reserved
    e.writeUInt16LE(1, 4) // planes
    e.writeUInt16LE(32, 6) // bpp
    e.writeUInt32LE(buf.length, 8)
    e.writeUInt32LE(offset, 12)
    offset += buf.length
    entries.push(e)
  })
  return Buffer.concat([header, ...entries, ...pngs])
}

const icoSizes = [16, 32, 48]
const icoPngs = await Promise.all(icoSizes.map(png))
await writeFile(path.join(root, 'app', 'favicon.ico'), toIco(icoPngs, icoSizes))

await writeFile(path.join(root, 'app', 'apple-icon.png'), await png(180))
await writeFile(path.join(root, 'public', 'icons', 'icon-192.png'), await png(192))
await writeFile(path.join(root, 'public', 'icons', 'icon-512.png'), await png(512))

console.log('Icons regenerated: favicon.ico (16/32/48), apple-icon.png, icon-192.png, icon-512.png')
