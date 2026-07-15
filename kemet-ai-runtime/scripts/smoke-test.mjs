import assert from 'node:assert/strict';
import { EventBus, ConsoleLogger, Money } from '../dist/core/index.js';
import {
  PlanCatalog,
  InMemorySubscriptionStore,
  InMemoryInvoiceStore,
  InvoiceService,
  SubscriptionManager,
} from '../dist/billing/index.js';
import { InMemoryPaymentGateway, PaymentProcessor } from '../dist/payments/index.js';
import { RevenueLedger, InMemoryRevenueLedgerStore, RevenueShareCalculator, RevenueReportingService } from '../dist/revenue/index.js';
import {
  InMemoryListingRepository,
  SearchIndex,
  MarketplacePublishingService,
  MarketplacePurchaseService,
} from '../dist/marketplace/index.js';
import { InMemoryJobStore, JobScheduler } from '../dist/scheduler/index.js';
import { StepHandlerRegistry, WorkflowEngine, TriggerManager } from '../dist/automation/index.js';
import { InMemorySourceProvider, ExtractiveSynthesizer, ResearchPipeline, ResearchReportBuilder } from '../dist/research/index.js';

const logger = new ConsoleLogger({}, 'error');

async function testBillingAndPayments() {
  const billingEvents = new EventBus();
  const paymentEvents = new EventBus();

  const plans = new PlanCatalog([
    { id: 'pro', name: 'Pro Plan', price: Money.fromDecimal(29, 'USD'), interval: 'month', intervalCount: 1 },
  ]);
  const subs = new InMemorySubscriptionStore();
  const invoiceStore = new InMemoryInvoiceStore();
  const invoices = new InvoiceService(invoiceStore, billingEvents);
  const manager = new SubscriptionManager(subs, plans, invoices, billingEvents, logger);
  const gateway = new InMemoryPaymentGateway();
  const processor = new PaymentProcessor(gateway, invoices, billingEvents, paymentEvents, logger);

  const subscription = await manager.create({ customerId: 'cust_1', planId: 'pro' });
  assert.equal(subscription.status, 'active');

  const customerInvoices = await invoiceStore.findByCustomer('cust_1');
  assert.equal(customerInvoices.length, 1);
  assert.equal(customerInvoices[0].total.minorUnits, 2900);

  const paidIntent = await processor.payInvoice(customerInvoices[0], 'pm_visa_ok');
  assert.equal(paidIntent.status, 'succeeded');

  const paidInvoice = await invoiceStore.findById(customerInvoices[0].id);
  assert.equal(paidInvoice.status, 'paid');

  console.log('  billing + payments: OK (subscription created, invoiced $29.00, charged, marked paid)');
}

async function testRevenueSplit() {
  const ledgerEvents = new EventBus();
  const ledger = new RevenueLedger(new InMemoryRevenueLedgerStore(), ledgerEvents);
  const calculator = new RevenueShareCalculator(0.2);
  const reporting = new RevenueReportingService(ledger);

  const gross = Money.fromDecimal(100, 'USD');
  const split = calculator.split(gross);
  assert.equal(split.platformFee.minorUnits + split.sellerPayout.minorUnits, gross.minorUnits);
  assert.equal(split.platformFee.minorUnits, 2000);

  await ledger.record('sale', 'seller_1', gross, 'order_1', 'test sale');
  await ledger.record('commission', 'seller_1', split.platformFee, 'order_1', 'test commission');

  const summary = await reporting.summarizePeriod('seller_1', 'USD', new Date(0), new Date());
  assert.equal(summary.net.minorUnits, 8000);

  console.log('  revenue split + ledger: OK ($100 sale -> $20 fee / $80 payout, ledger balances)');
}

async function testMarketplace() {
  const events = new EventBus();
  const repo = new InMemoryListingRepository();
  const index = new SearchIndex();
  const publishing = new MarketplacePublishingService(repo, index, events, logger);

  const draft = await publishing.createDraft({
    sellerId: 'seller_1',
    title: 'Retrieval-Augmented Chatbot Template',
    description: 'A production-ready RAG chatbot starter kit with vector search built in.',
    price: Money.fromDecimal(49, 'USD'),
    tags: ['rag', 'chatbot'],
  });
  await publishing.submitForReview(draft.id);
  const published = await publishing.approve(draft.id);
  assert.equal(published.status, 'published');

  const results = index.search('chatbot rag');
  assert.equal(results.length, 1);
  assert.equal(results[0].listing.id, draft.id);

  const gateway = new InMemoryPaymentGateway();
  const ledger = new RevenueLedger(new InMemoryRevenueLedgerStore(), new EventBus());
  const calculator = new RevenueShareCalculator(0.15);
  const purchases = new MarketplacePurchaseService(repo, gateway, calculator, ledger, events);

  const purchase = await purchases.purchase(draft.id, 'buyer_1', 'pm_visa_ok');
  assert.equal(purchase.amount.minorUnits, 4900);
  assert.equal(purchase.platformFee.minorUnits, 735);

  console.log('  marketplace: OK (listing published, searchable, purchased with 15% commission split)');
}

async function testSchedulerAndAutomation() {
  const schedulerEvents = new EventBus();
  const automationEvents = new EventBus();
  const jobStore = new InMemoryJobStore();

  const registry = new StepHandlerRegistry();
  let executedWith;
  registry.register('recordSignal', async (_ctx, input) => {
    executedWith = input;
    return { received: true };
  });

  const engine = new WorkflowEngine(registry, automationEvents, logger);
  const definition = {
    id: 'wf_dunning_notice',
    name: 'Dunning Notice',
    triggerType: 'schedule',
    startStepId: 'notify',
    steps: {
      notify: {
        id: 'notify',
        handler: 'recordSignal',
        buildInput: (ctx) => ({ customerId: ctx.variables.customerId }),
      },
    },
  };

  const triggers = new TriggerManager(schedulerEvents, engine, logger);
  const executor = triggers.createScheduledExecutor(definition);
  const scheduler = new JobScheduler(jobStore, executor, schedulerEvents, logger);

  await scheduler.schedule({
    name: 'daily-dunning-check',
    schedule: { kind: 'once', at: new Date(Date.now() - 1000) },
    payload: { customerId: 'cust_42' },
  });

  const results = await scheduler.runDue();
  assert.equal(results.length, 1);
  assert.equal(results[0].success, true);
  assert.deepEqual(executedWith, { customerId: 'cust_42' });

  console.log('  scheduler + automation: OK (job ran, workflow engine executed step with correct payload)');
}

async function testResearch() {
  const events = new EventBus();
  const sourceProvider = new InMemorySourceProvider();
  sourceProvider.addDocument(
    'Kemet AI Router Design',
    'The router selects a provider based on model availability and load. ' +
      'Fallback chains retry against a secondary provider when the primary provider errors. ' +
      'Load balancing distributes requests across a pool using weighted round robin.',
  );
  sourceProvider.addDocument(
    'Unrelated Cooking Notes',
    'Simmer the sauce for twenty minutes and season with fresh basil.',
  );

  const pipeline = new ResearchPipeline(sourceProvider, new ExtractiveSynthesizer(3), events, logger);
  const report = await pipeline.run({ id: 'q1', question: 'How does the router handle provider fallback?' });

  assert.equal(report.findings.length >= 1, true);
  assert.equal(report.findings[0].claim.includes('Fallback'), true);

  const markdown = new ResearchReportBuilder().toMarkdown(report);
  assert.equal(markdown.startsWith('# Research:'), true);

  console.log('  research pipeline: OK (retrieved relevant source, extracted correct finding)');
}

async function main() {
  console.log('Running Kemet AI backend module smoke tests...\n');
  await testBillingAndPayments();
  await testRevenueSplit();
  await testMarketplace();
  await testSchedulerAndAutomation();
  await testResearch();
  console.log('\nAll smoke tests passed.');
}

main().catch((error) => {
  console.error('SMOKE TEST FAILED:', error);
  process.exit(1);
});
