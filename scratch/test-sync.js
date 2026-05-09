const { runSync } = require('../services/cronService');

async function test() {
  console.log('Testing sync process manually...');
  await runSync();
  console.log('Sync process test finished.');
}

test();
