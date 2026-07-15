import type { Invoice } from './types.js';

export interface InvoiceStore {
  save(invoice: Invoice): Promise<void>;
  findById(id: string): Promise<Invoice | undefined>;
  findByCustomer(customerId: string): Promise<readonly Invoice[]>;
}

export class InMemoryInvoiceStore implements InvoiceStore {
  private readonly byId = new Map<string, Invoice>();

  public async save(invoice: Invoice): Promise<void> {
    this.byId.set(invoice.id, { ...invoice, lineItems: [...invoice.lineItems] });
  }

  public async findById(id: string): Promise<Invoice | undefined> {
    const found = this.byId.get(id);
    return found ? { ...found, lineItems: [...found.lineItems] } : undefined;
  }

  public async findByCustomer(customerId: string): Promise<readonly Invoice[]> {
    return Array.from(this.byId.values())
      .filter((inv) => inv.customerId === customerId)
      .map((inv) => ({ ...inv, lineItems: [...inv.lineItems] }));
  }
}
