import React from 'react';
import { Project, Customer, InventoryItem } from '../types';

interface InvoiceProps {
  project: Project;
  customer?: Customer;
  inventoryItem?: InventoryItem;
}

export default function Invoice({ project, customer, inventoryItem }: InvoiceProps) {
  return (
    <div className="p-8 bg-white text-slate-900 max-w-2xl mx-auto border border-slate-200">
      <div className="flex justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif italic font-bold">{project.brand}</h1>
          <p className="text-sm text-slate-600">Invoice #{project.id?.slice(-6).toUpperCase()}</p>
        </div>
        <div className="text-right">
          <p className="font-bold">Date: {new Date(project.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-bold uppercase text-slate-500 mb-2">Bill To</h2>
        <p className="font-semibold">{customer?.name || 'N/A'}</p>
        <p className="text-sm">{customer?.contact || 'N/A'}</p>
      </div>

      <table className="w-full mb-8">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-2">Description</th>
            <th className="text-right py-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-2">{inventoryItem?.name || 'Custom Project'}</td>
            <td className="text-right py-2">${project.financials.actual_sale_price || project.financials.target_sale_price}</td>
          </tr>
        </tbody>
      </table>

      <div className="text-right">
        <p className="text-lg font-bold">Total: ${project.financials.actual_sale_price || project.financials.target_sale_price}</p>
      </div>
    </div>
  );
}
