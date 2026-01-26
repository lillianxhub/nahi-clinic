import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createVisitWithTreatment, StockNotEnoughError } from '../src/services/visit';
import { prisma } from '../src/lib/prisma';
import { mockDeep, mockReset } from 'vitest-mock-extended';

// Mock the prisma client module
vi.mock('../src/lib/prisma', async () => {
    const { mockDeep } = await import('vitest-mock-extended');
    return {
        prisma: mockDeep(),
    };
});

describe('visit', () => {
    beforeEach(() => {
        mockReset(prisma);

        // Setup default transaction mock implementation
        // This allows the transaction callback to run immediately with the mocked prisma client
        (prisma.$transaction as any).mockImplementation((callback: any) => callback(prisma));
    });

    it('should create a visit with treatment successfully', async () => {
        // Arrange
        const input = {
            patient_id: 'patient-1',
            symptom: 'Fever',
            diagnosis: 'Flu',
            services: [{ description: 'Consultation', price: 500 }],
            drugs: [{ lot_id: 'lot-1', quantity: 2, sell_price: 100 }],
            payment_method: 'cash' as const,
        };

        const mockVisit = { visit_id: 'visit-1', ...input };
        const mockLot = { lot_id: 'lot-1', qty_remaining: 10 };

        // Expect create to be called without diagnosis (undefined) logic
        (prisma.visit.create as any).mockResolvedValue({ ...mockVisit, diagnosis: undefined });
        (prisma.visit.update as any).mockResolvedValue(mockVisit);
        (prisma.drug_Lot.findUnique as any).mockResolvedValue(mockLot);
        (prisma.drug_Lot.update as any).mockResolvedValue({ ...mockLot, qty_remaining: 8 });

        // Act
        const result = await createVisitWithTreatment(input);

        console.log('Test Result:', JSON.stringify(result, null, 2));

        // Assert
        expect(result).toEqual(mockVisit);

        // Verify steps
        // 1. Create visit WITHOUT diagnosis
        expect(prisma.visit.create).toHaveBeenCalledWith({
            data: {
                patient_id: input.patient_id,
                visit_date: expect.any(Date),
                symptom: input.symptom,
                diagnosis: input.diagnosis,
            },
        });


        expect(prisma.visit_Detail.create).toHaveBeenCalledWith({
            data: {
                visit_id: 'visit-1',
                item_type: 'service',
                description: 'Consultation',
                quantity: 1,
                unit_price: 500,
            },
        });

        expect(prisma.drug_Lot.findUnique).toHaveBeenCalledWith({
            where: { lot_id: 'lot-1' },
        });

        expect(prisma.drug_Usage.create).toHaveBeenCalledWith({
            data: {
                visit_id: 'visit-1',
                lot_id: 'lot-1',
                quantity: 2,
                used_at: expect.any(Date),
            },
        });

        expect(prisma.drug_Lot.update).toHaveBeenCalledWith({
            where: { lot_id: 'lot-1' },
            data: {
                qty_remaining: {
                    decrement: 2,
                },
            },
        });

        expect(prisma.income.create).toHaveBeenCalledWith({
            data: {
                visit_id: 'visit-1',
                income_date: expect.any(Date),
                amount: 700, // 500 + (2 * 100)
                payment_method: 'cash',
            },
        });
    });

    it('should throw StockNotEnoughError when drug stock is insufficient', async () => {
        // Arrange
        const input = {
            patient_id: 'patient-1',
            services: [],
            drugs: [{ lot_id: 'lot-1', quantity: 20, sell_price: 100 }],
            payment_method: 'cash' as const,
        };

        const mockVisit = { visit_id: 'visit-1' };
        const mockLot = { lot_id: 'lot-1', qty_remaining: 10 }; // Only 10 remaining

        (prisma.visit.create as any).mockResolvedValue(mockVisit);
        (prisma.drug_Lot.findUnique as any).mockResolvedValue(mockLot);

        // Act & Assert
        await expect(createVisitWithTreatment(input)).rejects.toThrow(StockNotEnoughError);
    });
});
