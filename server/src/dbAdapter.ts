import { randomUUID } from 'crypto';
import { isUsingMemoryStore } from './dbMongo.js';
import { memoryStore } from './memoryStore.js';
import {
  UserModel,
  CreatorModel,
  CategoryModel,
  TagModel,
  LiteratureTagModel,
  LiteratureModel,
  RatingModel,
  SaveModel,
  CommentModel,
  LiteratureVoteModel,
  ArtCraftModel,
  ExternalSavedWorkModel,
} from './models/index.js';

// Helper to convert Prisma filter queries into MongoDB filter queries
function convertWhereClause(where: any = {}): any {
  if (!where || Object.keys(where).length === 0) return {};

  const mongoFilter: any = {};

  for (const [key, value] of Object.entries(where)) {
    if (key === 'AND') {
      if (Array.isArray(value)) {
        mongoFilter.$and = value.map((v) => convertWhereClause(v));
      }
    } else if (key === 'OR') {
      if (Array.isArray(value)) {
        mongoFilter.$or = value.map((v) => convertWhereClause(v));
      }
    } else if (key === 'NOT') {
      mongoFilter.$not = convertWhereClause(value);
    } else if (key.includes('_') && value && typeof value === 'object' && !Array.isArray(value)) {
      // Prisma compound unique keys like userId_literatureId: { userId, literatureId }
      Object.assign(mongoFilter, value);
    } else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      // Prisma operator mapping: { contains: '...', in: [...], gte: '...', lte: '...' }
      const subFilter: any = {};
      for (const [op, opVal] of Object.entries(value as Record<string, any>)) {
        if (op === 'contains') {
          subFilter.$regex = new RegExp(String(opVal), 'i');
        } else if (op === 'startsWith') {
          subFilter.$regex = new RegExp(`^${opVal}`, 'i');
        } else if (op === 'endsWith') {
          subFilter.$regex = new RegExp(`${opVal}$`, 'i');
        } else if (op === 'in') {
          subFilter.$in = opVal;
        } else if (op === 'notIn') {
          subFilter.$nin = opVal;
        } else if (op === 'gt') {
          subFilter.$gt = opVal;
        } else if (op === 'gte') {
          subFilter.$gte = opVal;
        } else if (op === 'lt') {
          subFilter.$lt = opVal;
        } else if (op === 'lte') {
          subFilter.$lte = opVal;
        } else if (op === 'not') {
          subFilter.$ne = opVal;
        } else {
          subFilter[op] = opVal;
        }
      }
      mongoFilter[key] = subFilter;
    } else {
      mongoFilter[key] = value;
    }
  }

  return mongoFilter;
}

// Convert Prisma orderBy to Mongo sort
function convertOrderBy(orderBy: any): any {
  if (!orderBy) return { createdAt: -1 };
  if (Array.isArray(orderBy)) {
    const sort: any = {};
    for (const item of orderBy) {
      for (const [k, v] of Object.entries(item)) {
        sort[k] = v === 'asc' ? 1 : -1;
      }
    }
    return sort;
  }
  const sort: any = {};
  for (const [k, v] of Object.entries(orderBy)) {
    sort[k] = v === 'asc' ? 1 : -1;
  }
  return sort;
}

// In-memory filter matching helper
function matchesFilter(item: any, where: any): boolean {
  if (!where || Object.keys(where).length === 0) return true;

  for (const [key, value] of Object.entries(where)) {
    if (key === 'AND' && Array.isArray(value)) {
      if (!value.every((sub) => matchesFilter(item, sub))) return false;
    } else if (key === 'OR' && Array.isArray(value)) {
      if (!value.some((sub) => matchesFilter(item, sub))) return false;
    } else if (key === 'NOT') {
      if (matchesFilter(item, value)) return false;
    } else if (key.includes('_') && value && typeof value === 'object' && !Array.isArray(value)) {
      // Prisma compound unique keys like userId_literatureId: { userId, literatureId }
      for (const [subKey, subVal] of Object.entries(value as Record<string, any>)) {
        if (item[subKey] !== subVal) return false;
      }
    } else if (value && typeof value === 'object' && !(value instanceof Date)) {
      const fieldVal = item[key];
      for (const [op, opVal] of Object.entries(value as Record<string, any>)) {
        if (op === 'contains') {
          if (!String(fieldVal || '').toLowerCase().includes(String(opVal).toLowerCase())) return false;
        } else if (op === 'equals') {
          if (fieldVal !== opVal) return false;
        } else if (op === 'in') {
          if (!Array.isArray(opVal) || !opVal.includes(fieldVal)) return false;
        } else if (op === 'notIn') {
          if (Array.isArray(opVal) && opVal.includes(fieldVal)) return false;
        } else if (op === 'gt') {
          if (!(fieldVal > opVal)) return false;
        } else if (op === 'gte') {
          if (!(fieldVal >= opVal)) return false;
        } else if (op === 'lt') {
          if (!(fieldVal < opVal)) return false;
        } else if (op === 'lte') {
          if (!(fieldVal <= opVal)) return false;
        } else if (op === 'not') {
          if (fieldVal === opVal) return false;
        }
      }
    } else {
      if (item[key] !== value) return false;
    }
  }
  return true;
}

export const prismaMongoAdapter = {
  $queryRawUnsafe: async (sql: string, ...params: any[]) => {
    // Graceful handler for any legacy raw queries
    return [];
  },
  $executeRawUnsafe: async (sql: string, ...params: any[]) => {
    return 1;
  },

  user: {
    findUnique: async ({ where, select }: { where: any; select?: any }) => {
      if (isUsingMemoryStore()) {
        const u = memoryStore.users.find((user) => matchesFilter(user, where));
        if (!u) return null;
        if (select) {
          const res: any = {};
          for (const [k, v] of Object.entries(select)) {
            if (v) res[k] = u[k];
          }
          return res;
        }
        return u;
      }
      let q = UserModel.findOne(convertWhereClause(where));
      if (select) {
        const projection: any = {};
        for (const [k, v] of Object.entries(select)) {
          if (v) projection[k] = 1;
        }
        q = q.select(projection);
      }
      const doc = await q.lean();
      return (doc as any) || null;
    },
    findFirst: async ({ where }: { where?: any } = {}) => {
      if (isUsingMemoryStore()) {
        return memoryStore.users.find((user) => matchesFilter(user, where)) || null;
      }
      const doc = await UserModel.findOne(convertWhereClause(where)).lean();
      return (doc as any) || null;
    },
    findMany: async ({ where, orderBy, take, skip, select }: any = {}) => {
      if (isUsingMemoryStore()) {
        let items = memoryStore.users.filter((user) => matchesFilter(user, where));
        if (skip) items = items.slice(skip);
        if (take) items = items.slice(0, take);
        if (select) {
          return items.map((u) => {
            const res: any = {};
            for (const [k, v] of Object.entries(select)) {
              if (v) res[k] = u[k];
            }
            return res;
          });
        }
        return items;
      }
      let q = UserModel.find(convertWhereClause(where));
      if (orderBy) q = q.sort(convertOrderBy(orderBy));
      if (skip) q = q.skip(skip);
      if (take) q = q.limit(take);
      return await q.lean();
    },
    create: async ({ data }: { data: any }) => {
      const id = data.id || randomUUID();
      if (isUsingMemoryStore()) {
        const user = { ...data, id, createdAt: new Date(), updatedAt: new Date() };
        memoryStore.users.push(user);
        return user;
      }
      const doc = await UserModel.create({ ...data, id });
      return doc.toJSON() as any;
    },
    update: async ({ where, data }: { where: any; data: any }) => {
      if (isUsingMemoryStore()) {
        const idx = memoryStore.users.findIndex((user) => matchesFilter(user, where));
        if (idx === -1) return null;
        Object.assign(memoryStore.users[idx], data);
        return memoryStore.users[idx];
      }
      const doc = await UserModel.findOneAndUpdate(convertWhereClause(where), data, { new: true }).lean();
      return (doc as any) || null;
    },
    delete: async ({ where }: { where: any }) => {
      if (isUsingMemoryStore()) {
        const idx = memoryStore.users.findIndex((user) => matchesFilter(user, where));
        if (idx === -1) return null;
        const [removed] = memoryStore.users.splice(idx, 1);
        return removed;
      }
      const doc = await UserModel.findOneAndDelete(convertWhereClause(where)).lean();
      return (doc as any) || null;
    },
    count: async ({ where }: any = {}) => {
      if (isUsingMemoryStore()) {
        return memoryStore.users.filter((user) => matchesFilter(user, where)).length;
      }
      return await UserModel.countDocuments(convertWhereClause(where));
    },
  },

  creator: {
    findUnique: async ({ where }: { where: any }) => {
      if (isUsingMemoryStore()) {
        return memoryStore.creators.find((c) => matchesFilter(c, where)) || null;
      }
      const doc = await CreatorModel.findOne(convertWhereClause(where)).lean();
      return (doc as any) || null;
    },
    findFirst: async ({ where }: { where?: any } = {}) => {
      if (isUsingMemoryStore()) {
        return memoryStore.creators.find((c) => matchesFilter(c, where)) || null;
      }
      const doc = await CreatorModel.findOne(convertWhereClause(where)).lean();
      return (doc as any) || null;
    },
    findMany: async ({ where, orderBy, take, skip }: any = {}) => {
      if (isUsingMemoryStore()) {
        let items = memoryStore.creators.filter((c) => matchesFilter(c, where));
        if (skip) items = items.slice(skip);
        if (take) items = items.slice(0, take);
        return items;
      }
      let q = CreatorModel.find(convertWhereClause(where));
      if (orderBy) q = q.sort(convertOrderBy(orderBy));
      if (skip) q = q.skip(skip);
      if (take) q = q.limit(take);
      return await q.lean();
    },
    create: async ({ data }: { data: any }) => {
      const id = data.id || randomUUID();
      if (isUsingMemoryStore()) {
        const creator = { ...data, id, createdAt: new Date(), updatedAt: new Date() };
        memoryStore.creators.push(creator);
        return creator;
      }
      const doc = await CreatorModel.create({ ...data, id });
      return doc.toJSON() as any;
    },
    update: async ({ where, data }: { where: any; data: any }) => {
      if (isUsingMemoryStore()) {
        const idx = memoryStore.creators.findIndex((c) => matchesFilter(c, where));
        if (idx === -1) return null;
        Object.assign(memoryStore.creators[idx], data);
        return memoryStore.creators[idx];
      }
      const doc = await CreatorModel.findOneAndUpdate(convertWhereClause(where), data, { new: true }).lean();
      return (doc as any) || null;
    },
    delete: async ({ where }: { where: any }) => {
      if (isUsingMemoryStore()) {
        const idx = memoryStore.creators.findIndex((c) => matchesFilter(c, where));
        if (idx === -1) return null;
        const [removed] = memoryStore.creators.splice(idx, 1);
        return removed;
      }
      const doc = await CreatorModel.findOneAndDelete(convertWhereClause(where)).lean();
      return (doc as any) || null;
    },
    count: async ({ where }: any = {}) => {
      if (isUsingMemoryStore()) {
        return memoryStore.creators.filter((c) => matchesFilter(c, where)).length;
      }
      return await CreatorModel.countDocuments(convertWhereClause(where));
    },
  },

  category: {
    findUnique: async ({ where }: { where: any }) => {
      if (isUsingMemoryStore()) {
        return memoryStore.categories.find((c) => matchesFilter(c, where)) || null;
      }
      const doc = await CategoryModel.findOne(convertWhereClause(where)).lean();
      return (doc as any) || null;
    },
    findFirst: async ({ where }: { where?: any } = {}) => {
      if (isUsingMemoryStore()) {
        return memoryStore.categories.find((c) => matchesFilter(c, where)) || null;
      }
      const doc = await CategoryModel.findOne(convertWhereClause(where)).lean();
      return (doc as any) || null;
    },
    findMany: async ({ where, include, orderBy, take, skip }: any = {}) => {
      if (isUsingMemoryStore()) {
        let items = memoryStore.categories.filter((c) => matchesFilter(c, where));
        if (skip) items = items.slice(skip);
        if (take) items = items.slice(0, take);
        if (include?._count) {
          items = items.map((c) => {
            const count = memoryStore.literatures.filter((l) => l.categoryId === c.id && l.publicationStatus === 'PUBLISHED').length;
            return { ...c, _count: { literatures: count } };
          });
        }
        return items;
      }
      let q = CategoryModel.find(convertWhereClause(where));
      if (orderBy) q = q.sort(convertOrderBy(orderBy));
      if (skip) q = q.skip(skip);
      if (take) q = q.limit(take);
      const docs = await q.lean();
      if (!include) return docs;

      return await Promise.all(
        docs.map(async (c: any) => {
          if (include._count) {
            const litCount = await LiteratureModel.countDocuments({
              categoryId: c.id,
              ...(include._count.select?.literatures?.where
                ? convertWhereClause(include._count.select.literatures.where)
                : {}),
            });
            c._count = { literatures: litCount };
          }
          return c;
        })
      );
    },
    create: async ({ data }: { data: any }) => {
      const id = data.id || randomUUID();
      if (isUsingMemoryStore()) {
        const cat = { ...data, id, createdAt: new Date(), updatedAt: new Date() };
        memoryStore.categories.push(cat);
        return cat;
      }
      const doc = await CategoryModel.create({ ...data, id });
      return doc.toJSON() as any;
    },
    update: async ({ where, data }: { where: any; data: any }) => {
      if (isUsingMemoryStore()) {
        const idx = memoryStore.categories.findIndex((c) => matchesFilter(c, where));
        if (idx === -1) return null;
        Object.assign(memoryStore.categories[idx], data);
        return memoryStore.categories[idx];
      }
      const doc = await CategoryModel.findOneAndUpdate(convertWhereClause(where), data, { new: true }).lean();
      return (doc as any) || null;
    },
    delete: async ({ where }: { where: any }) => {
      if (isUsingMemoryStore()) {
        const idx = memoryStore.categories.findIndex((c) => matchesFilter(c, where));
        if (idx === -1) return null;
        const [removed] = memoryStore.categories.splice(idx, 1);
        return removed;
      }
      const doc = await CategoryModel.findOneAndDelete(convertWhereClause(where)).lean();
      return (doc as any) || null;
    },
    count: async ({ where }: any = {}) => {
      if (isUsingMemoryStore()) {
        return memoryStore.categories.filter((c) => matchesFilter(c, where)).length;
      }
      return await CategoryModel.countDocuments(convertWhereClause(where));
    },
  },

  tag: {
    findUnique: async ({ where }: { where: any }) => {
      const doc = await TagModel.findOne(convertWhereClause(where)).lean();
      return doc || null;
    },
    findFirst: async ({ where }: { where?: any } = {}) => {
      const doc = await TagModel.findOne(convertWhereClause(where)).lean();
      return doc || null;
    },
    findMany: async ({ where }: any = {}) => {
      return await TagModel.find(convertWhereClause(where)).lean();
    },
    create: async ({ data }: { data: any }) => {
      const id = data.id || randomUUID();
      const doc = await TagModel.create({ ...data, id });
      return doc.toJSON();
    },
  },

  literatureTag: {
    findMany: async ({ where }: any = {}) => {
      return await LiteratureTagModel.find(convertWhereClause(where)).lean();
    },
    create: async ({ data }: { data: any }) => {
      const doc = await LiteratureTagModel.create(data);
      return doc.toJSON();
    },
    deleteMany: async ({ where }: any = {}) => {
      return await LiteratureTagModel.deleteMany(convertWhereClause(where));
    },
  },

  literature: {
    findUnique: async ({ where, include, select }: { where: any; include?: any; select?: any }) => {
      if (isUsingMemoryStore()) {
        const item = memoryStore.literatures.find((lit) => matchesFilter(lit, where));
        if (!item) return null;
        const populated = await populateLiterature(item, include);
        if (select && typeof select === 'object') {
          const filtered: any = {};
          for (const [key, val] of Object.entries(select)) {
            if (val) filtered[key] = (populated as any)[key];
          }
          return filtered;
        }
        return populated;
      }
      const doc = await LiteratureModel.findOne(convertWhereClause(where)).lean();
      if (!doc) return null;
      const populated = await populateLiterature(doc, include);
      if (select && typeof select === 'object') {
        const filtered: any = {};
        for (const [key, val] of Object.entries(select)) {
          if (val) filtered[key] = (populated as any)[key];
        }
        return filtered;
      }
      return populated;
    },
    findFirst: async ({ where, include, select }: { where?: any; include?: any; select?: any } = {}) => {
      if (isUsingMemoryStore()) {
        const item = memoryStore.literatures.find((lit) => matchesFilter(lit, where));
        if (!item) return null;
        const populated = await populateLiterature(item, include);
        if (select && typeof select === 'object') {
          const filtered: any = {};
          for (const [key, val] of Object.entries(select)) {
            if (val) filtered[key] = (populated as any)[key];
          }
          return filtered;
        }
        return populated;
      }
      const doc = await LiteratureModel.findOne(convertWhereClause(where)).lean();
      if (!doc) return null;
      const populated = await populateLiterature(doc, include);
      if (select && typeof select === 'object') {
        const filtered: any = {};
        for (const [key, val] of Object.entries(select)) {
          if (val) filtered[key] = (populated as any)[key];
        }
        return filtered;
      }
      return populated;
    },
    findMany: async ({ where, include, orderBy, take, skip }: any = {}) => {
      if (isUsingMemoryStore()) {
        let items = memoryStore.literatures.filter((lit) => matchesFilter(lit, where));
        if (orderBy) {
          items.sort((a, b) => {
            const dateA = new Date(a.publicationDate || a.createdAt || 0).getTime();
            const dateB = new Date(b.publicationDate || b.createdAt || 0).getTime();
            return dateB - dateA;
          });
        }
        if (skip) items = items.slice(skip);
        if (take) items = items.slice(0, take);
        if (!include) return items;
        return await Promise.all(items.map((d) => populateLiterature(d, include)));
      }
      let q = LiteratureModel.find(convertWhereClause(where));
      if (orderBy) q = q.sort(convertOrderBy(orderBy));
      if (skip) q = q.skip(skip);
      if (take) q = q.limit(take);
      const docs = await q.lean();
      if (!include) return docs;
      return await Promise.all(docs.map((d) => populateLiterature(d, include)));
    },
    create: async ({ data, include }: { data: any; include?: any }) => {
      const id = data.id || randomUUID();
      if (isUsingMemoryStore()) {
        const newItem = { ...data, id, createdAt: new Date(), updatedAt: new Date() };
        memoryStore.literatures.unshift(newItem);
        if (!include) return newItem;
        return await populateLiterature(newItem, include);
      }
      const doc = await LiteratureModel.create({ ...data, id });
      const plain = doc.toJSON();
      if (!include) return plain;
      return await populateLiterature(plain, include);
    },
    update: async ({ where, data, include }: { where: any; data: any; include?: any }) => {
      if (isUsingMemoryStore()) {
        const idx = memoryStore.literatures.findIndex((lit) => matchesFilter(lit, where));
        if (idx === -1) return null;
        Object.assign(memoryStore.literatures[idx], data, { updatedAt: new Date() });
        const updated = memoryStore.literatures[idx];
        if (!include) return updated;
        return await populateLiterature(updated, include);
      }
      const doc = await LiteratureModel.findOneAndUpdate(convertWhereClause(where), data, { new: true }).lean();
      if (!doc) return null;
      if (!include) return doc;
      return await populateLiterature(doc, include);
    },
    delete: async ({ where }: { where: any }) => {
      if (isUsingMemoryStore()) {
        const idx = memoryStore.literatures.findIndex((lit) => matchesFilter(lit, where));
        if (idx === -1) return null;
        const [removed] = memoryStore.literatures.splice(idx, 1);
        return removed;
      }
      const doc = await LiteratureModel.findOneAndDelete(convertWhereClause(where)).lean();
      if (doc) {
        // Cascade delete relations
        await RatingModel.deleteMany({ literatureId: doc.id });
        await SaveModel.deleteMany({ literatureId: doc.id });
        await CommentModel.deleteMany({ literatureId: doc.id });
        await LiteratureVoteModel.deleteMany({ literatureId: doc.id });
        await LiteratureTagModel.deleteMany({ literatureId: doc.id });
      }
      return doc || null;
    },
    count: async ({ where }: any = {}) => {
      if (isUsingMemoryStore()) {
        return memoryStore.literatures.filter((lit) => matchesFilter(lit, where)).length;
      }
      return await LiteratureModel.countDocuments(convertWhereClause(where));
    },
  },


  rating: {
    findUnique: async ({ where }: { where: any }) => {
      if (isUsingMemoryStore()) {
        return memoryStore.ratings.find((r) => matchesFilter(r, where)) || null;
      }
      const doc = await RatingModel.findOne(convertWhereClause(where)).lean();
      return doc || null;
    },
    findFirst: async ({ where }: { where?: any } = {}) => {
      if (isUsingMemoryStore()) {
        return memoryStore.ratings.find((r) => matchesFilter(r, where)) || null;
      }
      const doc = await RatingModel.findOne(convertWhereClause(where)).lean();
      return doc || null;
    },
    findMany: async ({ where, include, orderBy }: any = {}) => {
      if (isUsingMemoryStore()) {
        let list = memoryStore.ratings.filter((r) => matchesFilter(r, where));
        if (orderBy) {
          list = [...list].sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
          });
        }
        if (include) {
          list = list.map((r) => {
            const copy = { ...r };
            if (include.user) {
              copy.user = memoryStore.users.find((u) => u.id === r.userId) || null;
            }
            if (include.literature) {
              const lit = memoryStore.literatures.find((l) => l.id === r.literatureId) || null;
              copy.literature = lit ? { ...lit, creator: memoryStore.creators.find((c) => c.id === lit.creatorId) || null } : null;
            }
            return copy;
          });
        }
        return list;
      }
      let q = RatingModel.find(convertWhereClause(where));
      if (orderBy) q = q.sort(convertOrderBy(orderBy));
      const docs = await q.lean();
      if (!include) return docs;
      return await Promise.all(
        docs.map(async (r: any) => {
          if (include.user) {
            r.user = await UserModel.findOne({ id: r.userId }).lean();
          }
          if (include.literature) {
            const lit: any = await LiteratureModel.findOne({ id: r.literatureId }).lean();
            if (lit) {
              if (include.literature.include?.creator) {
                lit.creator = await CreatorModel.findOne({ id: lit.creatorId }).lean();
              }
              r.literature = lit;
            } else {
              r.literature = null;
            }
          }
          return r;
        })
      );
    },
    create: async ({ data }: { data: any }) => {
      const id = data.id || randomUUID();
      if (isUsingMemoryStore()) {
        const item = { ...data, id, createdAt: new Date(), updatedAt: new Date() };
        memoryStore.ratings.push(item);
        return item;
      }
      const doc = await RatingModel.create({ ...data, id });
      return doc.toJSON();
    },
    update: async ({ where, data }: { where: any; data: any }) => {
      if (isUsingMemoryStore()) {
        const idx = memoryStore.ratings.findIndex((r) => matchesFilter(r, where));
        if (idx === -1) return null;
        Object.assign(memoryStore.ratings[idx], data);
        return memoryStore.ratings[idx];
      }
      const doc = await RatingModel.findOneAndUpdate(convertWhereClause(where), data, { new: true }).lean();
      return doc || null;
    },
    upsert: async ({ where, update, create }: any) => {
      if (isUsingMemoryStore()) {
        const idx = memoryStore.ratings.findIndex((r) => matchesFilter(r, where));
        if (idx !== -1) {
          Object.assign(memoryStore.ratings[idx], update);
          return memoryStore.ratings[idx];
        }
        const id = create.id || randomUUID();
        const item = { ...create, id, createdAt: new Date(), updatedAt: new Date() };
        memoryStore.ratings.push(item);
        return item;
      }
      let doc = await RatingModel.findOne(convertWhereClause(where));
      if (doc) {
        Object.assign(doc, update);
        await doc.save();
        return doc.toJSON();
      }
      const id = create.id || randomUUID();
      const created = await RatingModel.create({ ...create, id });
      return created.toJSON();
    },
    delete: async ({ where }: { where: any }) => {
      if (isUsingMemoryStore()) {
        const idx = memoryStore.ratings.findIndex((r) => matchesFilter(r, where));
        if (idx === -1) return null;
        const [removed] = memoryStore.ratings.splice(idx, 1);
        return removed;
      }
      const doc = await RatingModel.findOneAndDelete(convertWhereClause(where)).lean();
      return doc || null;
    },
    count: async ({ where }: any = {}) => {
      if (isUsingMemoryStore()) {
        return memoryStore.ratings.filter((r) => matchesFilter(r, where)).length;
      }
      return await RatingModel.countDocuments(convertWhereClause(where));
    },
  },

  save: {
    findUnique: async ({ where }: { where: any }) => {
      if (isUsingMemoryStore()) {
        return memoryStore.saves.find((s) => matchesFilter(s, where)) || null;
      }
      const doc = await SaveModel.findOne(convertWhereClause(where)).lean();
      return doc || null;
    },
    findFirst: async ({ where }: { where?: any } = {}) => {
      if (isUsingMemoryStore()) {
        return memoryStore.saves.find((s) => matchesFilter(s, where)) || null;
      }
      const doc = await SaveModel.findOne(convertWhereClause(where)).lean();
      return doc || null;
    },
    findMany: async ({ where, include, orderBy }: any = {}) => {
      if (isUsingMemoryStore()) {
        let items = memoryStore.saves.filter((s) => matchesFilter(s, where));
        if (orderBy) {
          items = [...items].sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
          });
        }
        if (include) {
          items = items.map((s) => {
            const copy = { ...s };
            if (include.user) {
              copy.user = memoryStore.users.find((u) => u.id === s.userId) || null;
            }
            if (include.literature) {
              const lit = memoryStore.literatures.find((l) => l.id === s.literatureId);
              copy.literature = lit ? {
                ...lit,
                creator: memoryStore.creators.find((c) => c.id === lit.creatorId) || null,
                category: memoryStore.categories.find((c) => c.id === lit.categoryId) || null,
                ratings: memoryStore.ratings.filter((r) => r.literatureId === lit.id) || [],
              } : null;
            }
            return copy;
          });
        }
        return items;
      }
      let q = SaveModel.find(convertWhereClause(where));
      if (orderBy) q = q.sort(convertOrderBy(orderBy));
      const docs = await q.lean();
      if (!include) return docs;
      return await Promise.all(
        docs.map(async (s: any) => {
          if (include.user) {
            s.user = await UserModel.findOne({ id: s.userId }).lean();
          }
          if (include.literature) {
            const lit = await LiteratureModel.findOne({ id: s.literatureId }).lean();
            s.literature = lit ? await populateLiterature(lit, include.literature.include) : null;
          }
          return s;
        })
      );
    },
    create: async ({ data }: { data: any }) => {
      const id = data.id || randomUUID();
      if (isUsingMemoryStore()) {
        const item = { ...data, id, createdAt: new Date(), updatedAt: new Date() };
        memoryStore.saves.push(item);
        return item;
      }
      const doc = await SaveModel.create({ ...data, id });
      return doc.toJSON();
    },
    delete: async ({ where }: { where: any }) => {
      if (isUsingMemoryStore()) {
        const idx = memoryStore.saves.findIndex((s) => matchesFilter(s, where));
        if (idx === -1) return null;
        const [removed] = memoryStore.saves.splice(idx, 1);
        return removed;
      }
      const doc = await SaveModel.findOneAndDelete(convertWhereClause(where)).lean();
      return doc || null;
    },
    count: async ({ where }: any = {}) => {
      if (isUsingMemoryStore()) {
        return memoryStore.saves.filter((s) => matchesFilter(s, where)).length;
      }
      return await SaveModel.countDocuments(convertWhereClause(where));
    },
  },

  comment: {
    findUnique: async ({ where }: { where: any }) => {
      if (isUsingMemoryStore()) {
        return memoryStore.comments.find((c) => matchesFilter(c, where)) || null;
      }
      const doc = await CommentModel.findOne(convertWhereClause(where)).lean();
      return (doc as any) || null;
    },
    findFirst: async ({ where }: { where?: any } = {}) => {
      if (isUsingMemoryStore()) {
        return memoryStore.comments.find((c) => matchesFilter(c, where)) || null;
      }
      const doc = await CommentModel.findOne(convertWhereClause(where)).lean();
      return (doc as any) || null;
    },
    findMany: async ({ where, include, orderBy, take, skip }: any = {}) => {
      if (isUsingMemoryStore()) {
        let items = memoryStore.comments.filter((c) => matchesFilter(c, where));
        if (skip) items = items.slice(skip);
        if (take) items = items.slice(0, take);
        if (include) {
          items = items.map((c) => {
            const copy = { ...c };
            if (include.user) {
              copy.user = memoryStore.users.find((u) => u.id === c.userId) || null;
            }
            if (include.literature) {
              copy.literature = memoryStore.literatures.find((l) => l.id === c.literatureId) || null;
            }
            if (include.replies) {
              copy.replies = memoryStore.comments.filter((rep) => rep.parentId === c.id);
            }
            return copy;
          });
        }
        return items;
      }
      let q = CommentModel.find(convertWhereClause(where));
      if (orderBy) q = q.sort(convertOrderBy(orderBy));
      const docs = await q.lean();
      if (!include) return docs;
      return await Promise.all(
        docs.map(async (c: any) => {
          if (include.user) {
            c.user = await UserModel.findOne({ id: c.userId }).lean();
          }
          if (include.literature) {
            c.literature = await LiteratureModel.findOne({ id: c.literatureId }).lean();
          }
          if (include.replies) {
            c.replies = await CommentModel.find({ parentId: c.id }).lean();
          }
          return c;
        })
      );
    },
    create: async ({ data, include }: { data: any; include?: any }) => {
      const id = data.id || randomUUID();
      if (isUsingMemoryStore()) {
        const item = { ...data, id, createdAt: new Date(), updatedAt: new Date() };
        memoryStore.comments.push(item);
        if (!include) return item;
        const copy = { ...item };
        if (include.user) {
          copy.user = memoryStore.users.find((u) => u.id === item.userId) || null;
        }
        return copy;
      }
      const doc = await CommentModel.create({ ...data, id });
      const plain = doc.toJSON();
      if (!include) return plain;
      if (include.user) {
        (plain as any).user = await UserModel.findOne({ id: plain.userId }).lean();
      }
      return plain;
    },
    delete: async ({ where }: { where: any }) => {
      if (isUsingMemoryStore()) {
        const idx = memoryStore.comments.findIndex((c) => matchesFilter(c, where));
        if (idx === -1) return null;
        const [removed] = memoryStore.comments.splice(idx, 1);
        return removed;
      }
      const doc = await CommentModel.findOneAndDelete(convertWhereClause(where)).lean();
      if (doc) {
        await CommentModel.deleteMany({ parentId: doc.id });
      }
      return doc || null;
    },
    count: async ({ where }: any = {}) => {
      if (isUsingMemoryStore()) {
        return memoryStore.comments.filter((c) => matchesFilter(c, where)).length;
      }
      return await CommentModel.countDocuments(convertWhereClause(where));
    },
  },

  literatureVote: {
    findUnique: async ({ where }: { where: any }) => {
      if (isUsingMemoryStore()) {
        return memoryStore.votes.find((v) => matchesFilter(v, where)) || null;
      }
      const doc = await LiteratureVoteModel.findOne(convertWhereClause(where)).lean();
      return doc || null;
    },
    findFirst: async ({ where }: { where?: any } = {}) => {
      if (isUsingMemoryStore()) {
        return memoryStore.votes.find((v) => matchesFilter(v, where)) || null;
      }
      const doc = await LiteratureVoteModel.findOne(convertWhereClause(where)).lean();
      return doc || null;
    },
    findMany: async ({ where, orderBy, take, skip }: any = {}) => {
      if (isUsingMemoryStore()) {
        let items = memoryStore.votes.filter((v) => matchesFilter(v, where));
        if (skip) items = items.slice(skip);
        if (take) items = items.slice(0, take);
        return items;
      }
      let q = LiteratureVoteModel.find(convertWhereClause(where));
      if (orderBy) q = q.sort(convertOrderBy(orderBy));
      if (skip) q = q.skip(skip);
      if (take) q = q.limit(take);
      return await q.lean();
    },
    create: async ({ data }: { data: any }) => {
      const id = data.id || randomUUID();
      if (isUsingMemoryStore()) {
        const item = { ...data, id, createdAt: new Date(), updatedAt: new Date() };
        memoryStore.votes.push(item);
        return item;
      }
      const doc = await LiteratureVoteModel.create({ ...data, id });
      return doc.toJSON();
    },
    update: async ({ where, data }: { where: any; data: any }) => {
      if (isUsingMemoryStore()) {
        const idx = memoryStore.votes.findIndex((v) => matchesFilter(v, where));
        if (idx === -1) return null;
        Object.assign(memoryStore.votes[idx], data);
        return memoryStore.votes[idx];
      }
      const doc = await LiteratureVoteModel.findOneAndUpdate(convertWhereClause(where), data, { new: true }).lean();
      return doc || null;
    },
    upsert: async ({ where, update, create }: any) => {
      if (isUsingMemoryStore()) {
        const idx = memoryStore.votes.findIndex((v) => matchesFilter(v, where));
        if (idx !== -1) {
          Object.assign(memoryStore.votes[idx], update);
          return memoryStore.votes[idx];
        }
        const id = create.id || randomUUID();
        const item = { ...create, id, createdAt: new Date(), updatedAt: new Date() };
        memoryStore.votes.push(item);
        return item;
      }
      let doc = await LiteratureVoteModel.findOne(convertWhereClause(where));
      if (doc) {
        Object.assign(doc, update);
        await doc.save();
        return doc.toJSON();
      }
      const id = create.id || randomUUID();
      const created = await LiteratureVoteModel.create({ ...create, id });
      return created.toJSON();
    },
    delete: async ({ where }: { where: any }) => {
      if (isUsingMemoryStore()) {
        const idx = memoryStore.votes.findIndex((v) => matchesFilter(v, where));
        if (idx === -1) return null;
        const [removed] = memoryStore.votes.splice(idx, 1);
        return removed;
      }
      const doc = await LiteratureVoteModel.findOneAndDelete(convertWhereClause(where)).lean();
      return doc || null;
    },
    count: async ({ where }: any = {}) => {
      if (isUsingMemoryStore()) {
        return memoryStore.votes.filter((v) => matchesFilter(v, where)).length;
      }
      return await LiteratureVoteModel.countDocuments(convertWhereClause(where));
    },
  },

  artCraft: {
    findUnique: async ({ where }: { where: any }) => {
      if (isUsingMemoryStore()) {
        return memoryStore.artCrafts.find((c) => matchesFilter(c, where)) || null;
      }
      const doc = await ArtCraftModel.findOne(convertWhereClause(where)).lean();
      return doc || null;
    },
    findFirst: async ({ where }: { where?: any } = {}) => {
      if (isUsingMemoryStore()) {
        return memoryStore.artCrafts.find((c) => matchesFilter(c, where)) || null;
      }
      const doc = await ArtCraftModel.findOne(convertWhereClause(where)).lean();
      return doc || null;
    },
    findMany: async ({ where, orderBy, take, skip }: any = {}) => {
      if (isUsingMemoryStore()) {
        let items = memoryStore.artCrafts.filter((c) => matchesFilter(c, where));
        if (skip) items = items.slice(skip);
        if (take) items = items.slice(0, take);
        return items;
      }
      let q = ArtCraftModel.find(convertWhereClause(where));
      if (orderBy) q = q.sort(convertOrderBy(orderBy));
      if (skip) q = q.skip(skip);
      if (take) q = q.limit(take);
      return await q.lean();
    },
    create: async ({ data }: { data: any }) => {
      const id = data.id || randomUUID();
      if (isUsingMemoryStore()) {
        const item = { ...data, id, createdAt: new Date(), updatedAt: new Date() };
        memoryStore.artCrafts.push(item);
        return item;
      }
      const doc = await ArtCraftModel.create({ ...data, id });
      return doc.toJSON();
    },
    update: async ({ where, data }: { where: any; data: any }) => {
      if (isUsingMemoryStore()) {
        const idx = memoryStore.artCrafts.findIndex((c) => matchesFilter(c, where));
        if (idx === -1) return null;
        Object.assign(memoryStore.artCrafts[idx], data);
        return memoryStore.artCrafts[idx];
      }
      const doc = await ArtCraftModel.findOneAndUpdate(convertWhereClause(where), data, { new: true }).lean();
      return doc || null;
    },
    delete: async ({ where }: { where: any }) => {
      if (isUsingMemoryStore()) {
        const idx = memoryStore.artCrafts.findIndex((c) => matchesFilter(c, where));
        if (idx === -1) return null;
        const [removed] = memoryStore.artCrafts.splice(idx, 1);
        return removed;
      }
      const doc = await ArtCraftModel.findOneAndDelete(convertWhereClause(where)).lean();
      return doc || null;
    },
    count: async ({ where }: any = {}) => {
      if (isUsingMemoryStore()) {
        return memoryStore.artCrafts.filter((c) => matchesFilter(c, where)).length;
      }
      return await ArtCraftModel.countDocuments(convertWhereClause(where));
    },
  },

  externalSavedWork: {
    findUnique: async ({ where }: { where: any }) => {
      const doc = await ExternalSavedWorkModel.findOne(convertWhereClause(where)).lean();
      return doc || null;
    },
    findFirst: async ({ where }: { where?: any } = {}) => {
      const doc = await ExternalSavedWorkModel.findOne(convertWhereClause(where)).lean();
      return doc || null;
    },
    findMany: async ({ where, orderBy }: any = {}) => {
      let q = ExternalSavedWorkModel.find(convertWhereClause(where));
      if (orderBy) q = q.sort(convertOrderBy(orderBy));
      return await q.lean();
    },
    create: async ({ data }: { data: any }) => {
      const id = data.id || randomUUID();
      const doc = await ExternalSavedWorkModel.create({ ...data, id });
      return doc.toJSON();
    },
    delete: async ({ where }: { where: any }) => {
      const doc = await ExternalSavedWorkModel.findOneAndDelete(convertWhereClause(where)).lean();
      return doc || null;
    },
    count: async ({ where }: any = {}) => {
      return await ExternalSavedWorkModel.countDocuments(convertWhereClause(where));
    },
  },
};

async function populateLiterature(doc: any, include: any): Promise<any> {
  const result = { ...doc };
  if (!include) return result;

  if (isUsingMemoryStore()) {
    if (include.creator) {
      result.creator = memoryStore.creators.find((c) => c.id === doc.creatorId) || null;
    }
    if (include.category) {
      result.category = memoryStore.categories.find((c) => c.id === doc.categoryId) || null;
    }
    if (include.ratings) {
      result.ratings = memoryStore.ratings.filter((r) => r.literatureId === doc.id);
    }
    if (include.saves) {
      result.saves = memoryStore.saves.filter((s) => s.literatureId === doc.id);
    }
    if (include.votes) {
      result.votes = memoryStore.votes.filter((v) => v.literatureId === doc.id);
    }
    if (include.comments) {
      result.comments = memoryStore.comments.filter((c) => c.literatureId === doc.id);
    }
    if (include.tags) {
      const litTags = memoryStore.literatureTags.filter((lt) => lt.literatureId === doc.id);
      const tagIds = litTags.map((lt) => lt.tagId);
      const tags = memoryStore.tags.filter((t) => tagIds.includes(t.id));
      result.tags = tags.map((t) => ({ tag: t }));
    }
    return result;
  }

  if (include.creator) {
    result.creator = await CreatorModel.findOne({ id: doc.creatorId }).lean();
  }
  if (include.category) {
    result.category = await CategoryModel.findOne({ id: doc.categoryId }).lean();
  }
  if (include.ratings) {
    result.ratings = await RatingModel.find({ literatureId: doc.id }).lean();
  }
  if (include.saves) {
    result.saves = await SaveModel.find({ literatureId: doc.id }).lean();
  }
  if (include.votes) {
    result.votes = await LiteratureVoteModel.find({ literatureId: doc.id }).lean();
  }
  if (include.comments) {
    result.comments = await CommentModel.find({ literatureId: doc.id }).lean();
  }
  if (include.tags) {
    const litTags = await LiteratureTagModel.find({ literatureId: doc.id }).lean();
    const tagIds = litTags.map((lt) => lt.tagId);
    const tags = await TagModel.find({ id: { $in: tagIds } }).lean();
    result.tags = tags.map((t) => ({ tag: t }));
  }

  return result;
}
