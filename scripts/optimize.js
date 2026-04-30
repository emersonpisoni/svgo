import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { optimize } from 'svgo';

const iconsDir = join(import.meta.dirname, '../src/assets/icons');
const files = readdirSync(iconsDir).filter((f) => f.endsWith('.svg'));

let totalBefore = 0;
let totalAfter = 0;

console.log('\n🔍 SVGO — Node.js API Demo\n');
console.log('-'.repeat(50));

for (const file of files) {
  const raw = readFileSync(join(iconsDir, file), 'utf-8');
  const result = optimize(raw, {
    multipass: true,
    plugins: ['preset-default'],
  });

  const before = Buffer.byteLength(raw);
  const after = Buffer.byteLength(result.data);
  const reduction = ((1 - after / before) * 100).toFixed(0);

  totalBefore += before;
  totalAfter += after;

  console.log(
    `${file.padEnd(16)} ${String(before).padStart(5)} B → ${String(after).padStart(4)} B  (${('-' + reduction + '%').padStart(5)})`,
  );
}

console.log('-'.repeat(50));
console.log(
  `${'TOTAL'.padEnd(16)} ${String(totalBefore).padStart(5)} B → ${String(totalAfter).padStart(4)} B  (${('-' + ((1 - totalAfter / totalBefore) * 100).toFixed(0) + '%').padStart(5)})`,
);
console.log();