import { access, copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

async function main() {
  const projectRoot = process.cwd();
  const source = path.join(projectRoot, '.htaccess');
  const outDir = process.env.BUILD_OUT_DIR ?? 'dist';
  const distDir = path.join(projectRoot, outDir);
  const destination = path.join(distDir, '.htaccess');

  try {
    await access(source);
  } catch {
    console.warn('postbuild: skipped copying .htaccess (source file not found)');
    return;
  }

  await mkdir(distDir, { recursive: true });

  try {
    await copyFile(source, destination);
    console.log(`postbuild: copied .htaccess into ${outDir}/`);
  } catch (error) {
    console.error('postbuild: failed to copy .htaccess', error);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('postbuild: unexpected error', error);
  process.exitCode = 1;
});
