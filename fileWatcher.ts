import * as chokidar from 'chokidar';
import { exec } from 'child_process';

const log = console.log.bind(console);

const modelWatcher = chokidar.watch('src/app/models/shared.ts', {
  persistent: true,
  usePolling: true,
  interval: 4000,
});

modelWatcher.on('change', (path) => {
  log(`File ${path} has been changed`);
  exec('npm run copy-models', (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return;
    }
    log({ stdout, stderr });
  });
});

const watcherWatcher = chokidar.watch('./fileWatcher.ts', {
  persistent: true,
  usePolling: true,
  interval: 4000,
});

watcherWatcher.on('change', (path) => {
  log(`File ${path} has been changed`);
  log('This shit is so meta...');
  exec('tsc fileWatcher.ts', (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return;
    }
    log({ stdout, stderr });
  });
});
