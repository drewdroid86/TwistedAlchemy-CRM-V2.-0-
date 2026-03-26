import { performance } from 'perf_hooks';

const numCustomers = 5000;
const numProjects = 20000;

const customers = Array.from({ length: numCustomers }, (_, i) => ({
  id: `customer-${i}`,
  name: `Customer ${i}`
}));

const projects = Array.from({ length: numProjects }, (_, i) => ({
  client_id: `customer-${Math.floor(Math.random() * numCustomers)}`,
  financials: { actual_sale_price: Math.random() * 1000 }
}));

console.log(`Benchmarking with ${numCustomers} customers and ${numProjects} projects...`);

const start1 = performance.now();
const customerSpend1 = projects.reduce((acc: any, p) => {
  if (!p.client_id) return acc;
  const customer = customers.find(c => c.id === p.client_id);
  const name = customer?.name || 'Unknown';
  acc[name] = (acc[name] || 0) + (p.financials.actual_sale_price || 0);
  return acc;
}, {});
const end1 = performance.now();
console.log(`Original: ${(end1 - start1).toFixed(2)} ms`);

const start2 = performance.now();
const customerMap = new Map();
for (let i = 0; i < customers.length; i++) {
  customerMap.set(customers[i].id, customers[i].name);
}
const customerSpend2 = projects.reduce((acc: any, p) => {
  if (!p.client_id) return acc;
  const name = customerMap.get(p.client_id) || 'Unknown';
  acc[name] = (acc[name] || 0) + (p.financials.actual_sale_price || 0);
  return acc;
}, {});
const end2 = performance.now();
console.log(`Optimized: ${(end2 - start2).toFixed(2)} ms`);
console.log(`Speedup: ${((end1 - start1) / (end2 - start2)).toFixed(2)}x`);
