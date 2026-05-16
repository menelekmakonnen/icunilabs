/**
 * Image optimization script — converts PNG cover images to WebP.
 * Run with: node scripts/optimize-images.mjs
 */
import { readdir, stat } from 'fs/promises'
import { join, basename, extname } from 'path'
import sharp from 'sharp'

const DIRS = ['public/images/covers', 'public']
const QUALITY = 80

async function main() {
  let totalOriginal = 0
  let totalWebp = 0
  let count = 0

  for (const dir of DIRS) {
    const files = await readdir(dir)
    const pngs = files.filter(f => extname(f).toLowerCase() === '.png')
    
    console.log(`\n${dir}: ${pngs.length} PNG files`)
    
    for (const file of pngs) {
      const inputPath = join(dir, file)
      const outputPath = join(dir, basename(file, '.png') + '.webp')
      
      const original = await stat(inputPath)
      totalOriginal += original.size
      
      await sharp(inputPath)
        .webp({ quality: QUALITY })
        .toFile(outputPath)
      
      const optimized = await stat(outputPath)
      totalWebp += optimized.size
      count++
      
      const reduction = ((1 - optimized.size / original.size) * 100).toFixed(1)
      console.log(`  ${file} → ${basename(outputPath)}: ${(original.size/1024).toFixed(0)}KB → ${(optimized.size/1024).toFixed(0)}KB (-${reduction}%)`)
    }
  }
  
  const totalReduction = ((1 - totalWebp / totalOriginal) * 100).toFixed(1)
  console.log(`\nTotal: ${count} files, ${(totalOriginal/1024/1024).toFixed(1)}MB → ${(totalWebp/1024/1024).toFixed(1)}MB (-${totalReduction}%)`)
}

main().catch(console.error)
