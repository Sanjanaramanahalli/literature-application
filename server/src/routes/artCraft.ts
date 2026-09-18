import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js';

export const artCraftRouter = Router();

// 1. Get all published Art & Crafts with optional filtering
// Query params: state, region, place, type, search
artCraftRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { state, region, place, type, search, status } = req.query;

    const conditions: any[] = [];

    // Filter by status (default to PUBLISHED for public, unless ADMIN requests otherwise)
    if (status && String(status).trim()) {
      conditions.push({ status: String(status).trim() });
    } else {
      conditions.push({ status: 'PUBLISHED' });
    }

    if (state && String(state).trim() && String(state).trim() !== 'ALL') {
      conditions.push({
        state: { equals: String(state).trim() },
      });
    }

    if (region && String(region).trim()) {
      conditions.push({
        region: { contains: String(region).trim() },
      });
    }

    if (place && String(place).trim()) {
      conditions.push({
        place: { contains: String(place).trim() },
      });
    }

    if (type && String(type).trim()) {
      conditions.push({
        type: { contains: String(type).trim() },
      });
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      conditions.push({
        OR: [
          { name: { contains: q } },
          { localName: { contains: q } },
          { state: { contains: q } },
          { region: { contains: q } },
          { district: { contains: q } },
          { place: { contains: q } },
          { type: { contains: q } },
          { materials: { contains: q } },
          { traditionalProducts: { contains: q } },
        ],
      });
    }

    const crafts = await prisma.artCraft.findMany({
      where: conditions.length > 0 ? { AND: conditions } : undefined,
      orderBy: [{ state: 'asc' }, { name: 'asc' }],
    });

    res.json({
      total: crafts.length,
      artCrafts: crafts,
    });
  } catch (err) {
    console.error('Error fetching art & craft entries:', err);
    res.status(500).json({ error: 'Failed to retrieve art & craft entries.' });
  }
});

// 2. Get All Available States with count of crafts
artCraftRouter.get('/states', async (req: Request, res: Response): Promise<void> => {
  try {
    const crafts = await prisma.artCraft.findMany({
      where: { status: 'PUBLISHED' },
      select: { state: true },
    });

    const stateCountMap: Record<string, number> = {};
    for (const c of crafts) {
      stateCountMap[c.state] = (stateCountMap[c.state] || 0) + 1;
    }

    // 28 Indian States canonical list
    const canonicalStates = [
      'Andhra Pradesh',
      'Arunachal Pradesh',
      'Assam',
      'Bihar',
      'Chhattisgarh',
      'Goa',
      'Gujarat',
      'Haryana',
      'Himachal Pradesh',
      'Jharkhand',
      'Karnataka',
      'Kerala',
      'Madhya Pradesh',
      'Maharashtra',
      'Manipur',
      'Meghalaya',
      'Mizoram',
      'Nagaland',
      'Odisha',
      'Punjab',
      'Rajasthan',
      'Sikkim',
      'Tamil Nadu',
      'Telangana',
      'Tripura',
      'Uttar Pradesh',
      'Uttarakhand',
      'West Bengal',
    ];

    const stateList = canonicalStates.map((st) => ({
      name: st,
      count: stateCountMap[st] || 0,
    }));

    res.json({
      totalStates: canonicalStates.length,
      states: stateList,
    });
  } catch (err) {
    console.error('Error fetching states list:', err);
    res.status(500).json({ error: 'Failed to retrieve states summary.' });
  }
});

// 3. Get single Art & Craft entry by ID
artCraftRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const craft = await prisma.artCraft.findUnique({
      where: { id },
    });

    if (!craft) {
      res.status(404).json({ error: 'Art & Craft entry not found.' });
      return;
    }

    res.json({ artCraft: craft });
  } catch (err) {
    console.error('Error retrieving art & craft detail:', err);
    res.status(500).json({ error: 'Failed to retrieve art & craft entry.' });
  }
});

// 4. Create new Art & Craft entry (Admin Only)
artCraftRouter.post(
  '/',
  authenticateToken,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        name,
        localName,
        state,
        region,
        district,
        place,
        type,
        originPeriod,
        history,
        culturalSignificance,
        culturalBackground,
        materials,
        makingProcess,
        traditionalProducts,
        modernContext,
        coverImage,
        status,
      } = req.body;

      if (!name || !state || !place || !type || !originPeriod || !history) {
        res.status(400).json({
          error: 'Required fields missing: name, state, place, type, originPeriod, and history are required.',
        });
        return;
      }

      const created = await prisma.artCraft.create({
        data: {
          name: name.trim(),
          localName: localName?.trim() || null,
          state: state.trim(),
          region: region?.trim() || null,
          district: district?.trim() || null,
          place: place.trim(),
          type: type.trim(),
          originPeriod: originPeriod.trim(),
          history: history.trim(),
          culturalSignificance: culturalSignificance?.trim() || '',
          culturalBackground: culturalBackground?.trim() || '',
          materials: materials?.trim() || '',
          makingProcess: makingProcess?.trim() || '',
          traditionalProducts: traditionalProducts?.trim() || '',
          modernContext: modernContext?.trim() || '',
          coverImage: coverImage?.trim() || null,
          status: status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
        },
      });

      res.status(201).json({
        message: 'Art & Craft entry created successfully.',
        artCraft: created,
      });
    } catch (err: any) {
      console.error('Error creating art & craft:', err);
      res.status(500).json({ error: err.message || 'Failed to create art & craft entry.' });
    }
  }
);

// 5. Update existing Art & Craft entry (Admin Only)
artCraftRouter.put(
  '/:id',
  authenticateToken,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        name,
        localName,
        state,
        region,
        district,
        place,
        type,
        originPeriod,
        history,
        culturalSignificance,
        culturalBackground,
        materials,
        makingProcess,
        traditionalProducts,
        modernContext,
        coverImage,
        status,
      } = req.body;

      const existing = await prisma.artCraft.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: 'Art & Craft entry not found.' });
        return;
      }

      const updated = await prisma.artCraft.update({
        where: { id },
        data: {
          name: name !== undefined ? name.trim() : existing.name,
          localName: localName !== undefined ? localName?.trim() || null : existing.localName,
          state: state !== undefined ? state.trim() : existing.state,
          region: region !== undefined ? region?.trim() || null : existing.region,
          district: district !== undefined ? district?.trim() || null : existing.district,
          place: place !== undefined ? place.trim() : existing.place,
          type: type !== undefined ? type.trim() : existing.type,
          originPeriod: originPeriod !== undefined ? originPeriod.trim() : existing.originPeriod,
          history: history !== undefined ? history.trim() : existing.history,
          culturalSignificance:
            culturalSignificance !== undefined ? culturalSignificance.trim() : existing.culturalSignificance,
          culturalBackground:
            culturalBackground !== undefined ? culturalBackground.trim() : existing.culturalBackground,
          materials: materials !== undefined ? materials.trim() : existing.materials,
          makingProcess: makingProcess !== undefined ? makingProcess.trim() : existing.makingProcess,
          traditionalProducts:
            traditionalProducts !== undefined ? traditionalProducts.trim() : existing.traditionalProducts,
          modernContext: modernContext !== undefined ? modernContext.trim() : existing.modernContext,
          coverImage: coverImage !== undefined ? coverImage?.trim() || null : existing.coverImage,
          status: status !== undefined ? (status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED') : existing.status,
        },
      });

      res.json({
        message: 'Art & Craft entry updated successfully.',
        artCraft: updated,
      });
    } catch (err: any) {
      console.error('Error updating art & craft:', err);
      res.status(500).json({ error: err.message || 'Failed to update art & craft entry.' });
    }
  }
);

// 6. Delete Art & Craft entry (Admin Only)
artCraftRouter.delete(
  '/:id',
  authenticateToken,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const existing = await prisma.artCraft.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: 'Art & Craft entry not found.' });
        return;
      }

      await prisma.artCraft.delete({ where: { id } });
      res.json({ message: 'Art & Craft entry deleted successfully.' });
    } catch (err) {
      console.error('Error deleting art & craft:', err);
      res.status(500).json({ error: 'Failed to delete art & craft entry.' });
    }
  }
);
