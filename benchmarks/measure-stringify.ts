
const largeConfig: any = {};
largeConfig.dummyData = 'x'.repeat(1024 * 1024 * 5); // 5MB string

console.log('Measuring JSON.stringify...');
const start = performance.now();
JSON.stringify(largeConfig, null, 2);
const end = performance.now();
console.log(`JSON.stringify time: ${(end - start).toFixed(4)} ms`);
