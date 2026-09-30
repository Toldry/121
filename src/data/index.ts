import factionData from './factions.json';
import type { Bill, FactionData } from './types';

const billModules = import.meta.glob<Bill>('./bills/*.json', { eager: true, import: 'default' });

export const FACTIONS = factionData as FactionData;
export const BILLS: Bill[] = Object.values(billModules).sort((a, b) => a.id.localeCompare(b.id));
export const BILLS_BY_ID: Record<string, Bill> = Object.fromEntries(BILLS.map((b) => [b.id, b]));
