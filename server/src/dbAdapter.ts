import { v4 as uuidv4 } from 'uuid';
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
      const doc = await UserModel.findOne(convertWhereClause(where)).lean();
      return (doc as any) || null;
    },
    findMany: async ({ where, orderBy, take, skip }: any = {}) => {
      let q = UserModel.find(convertWhereClause(where));
      if (orderBy) q = q.sort(convertOrderBy(orderBy));
      if (skip) q = q.skip(skip);
      if (take) q = q.limit(take);
      return await q.lean();
    },
    create: async ({ data }: { data: any }) => {
      const id = data.id || uuidv4();
      const doc = await UserModel.create({ ...data, id });
      return doc.toJSON() as any;
    },
    update: async ({ where, data }: { where: any; data: any }) => {
      const doc = await UserModel.findOneAndUpdate(convertWhereClause(where), data, { new: true }).lean();
      return (doc as any) || null;
    },
    delete: async ({ where }: { where: any }) => {
      const doc = await UserModel.findOneAndDelete(convertWhereClause(where)).lean();
      return (doc as any) || null;
    },
    count: async ({ where }: any = {}) => {
      return await UserModel.countDocuments(convertWhereClause(where));
    },
  },

  creator: {
    findUnique: async ({ where }: { where: any }) => {
      const doc = await CreatorModel.findOne(convertWhereClause(where)).lean();
      return (doc as any) || null;
    },
    findFirst: async ({ where }: { where?: any } = {}) => {
      const doc = await CreatorModel.findOne(convertWhereClause(where)).lean();
      return (doc as any) || null;
    },
    findMany: async ({ where, orderBy, take, skip }: any = {}) => {
      let q = CreatorModel.find(convertWhereClause(where));
      if (orderBy) q = q.sort(convertOrderBy(orderBy));
      if (skip) q = q.skip(skip);
      if (take) q = q.limit(take);
      return await q.lean();
    },
    create: async ({ data }: { data: any }) => {
      const id = data.id || uuidv4();
      const doc = await CreatorModel.create({ ...data, id });
      return doc.toJSON() as any;
    },
    update: async ({ where, data }: { where: any; data: any }) => {
      const doc = await CreatorModel.findOneAndUpdate(convertWhereClause(where), data, { new: true }).lean();
      return (doc as any) || null;
    },
    delete: async ({ where }: { where: any }) => {
      const doc = await CreatorModel.findOneAndDelete(convertWhereClause(where)).lean();
      return (doc as any) || null;
    },
    count: async ({ where }: any = {}) => {
      return await CreatorModel.countDocuments(convertWhereClause(where));
    },
  },

  category: {
    findUnique: async ({ where }: { where: any }) => {
      const doc = await CategoryModel.findOne(convertWhereClause(where)).lean();
      return (doc as any) || null;
    },
    findFirst: async ({ where }: { where?: any } = {}) => {
      const doc = await CategoryModel.findOne(convertWhereClause(where)).lean();
      return (doc as any) || null;
    },
    findMany: async ({ where, include, orderBy, take, skip }: any = {}) => {
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
      const id = data.id || uuidv4();
      const doc = await CategoryModel.create({ ...data, id });
      return doc.toJSON() as any;
    },
    update: async ({ where, data }: { where: any; data: any }) => {
      const doc = await CategoryModel.findOneAndUpdate(convertWhereClause(where), data, { new: true }).lean();
      return (doc as any) || null;
    },
    delete: async ({ where }: { where: any }) => {
      const doc = await CategoryModel.findOneAndDelete(convertWhereClause(where)).lean();
      return (doc as any) || null;
    },
    count: async ({ where }: any = {}) => {
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
      const id = data.id || uuidv4();
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
      let q = LiteratureModel.find(convertWhereClause(where));
      if (orderBy) q = q.sort(convertOrderBy(orderBy));
      if (skip) q = q.skip(skip);
      if (take) q = q.limit(take);
      const docs = await q.lean();
      if (!include) return docs;
      return await Promise.all(docs.map((d) => populateLiterature(d, include)));
    },
    create: async ({ data, include }: { data: any; include?: any }) => {
      const id = data.id || uuidv4();
      const doc = await LiteratureModel.create({ ...data, id });
      const plain = doc.toJSON();
      if (!include) return plain;
      return await populateLiterature(plain, include);
    },
    update: async ({ where, data, include }: { where: any; data: any; include?: any }) => {
      const doc = await LiteratureModel.findOneAndUpdate(convertWhereClause(where), data, { new: true }).lean();
      if (!doc) return null;
      if (!include) return doc;
      return await populateLiterature(doc, include);
    },
    delete: async ({ where }: { where: any }) => {
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
      return await LiteratureModel.countDocuments(convertWhereClause(where));
    },
  },

  rating: {
    findUnique: async ({ where }: { where: any }) => {
      const doc = await RatingModel.findOne(convertWhereClause(where)).lean();
      return doc || null;
    },
    findFirst: async ({ where }: { where?: any } = {}) => {
      const doc = await RatingModel.findOne(convertWhereClause(where)).lean();
      return doc || null;
    },
    findMany: async ({ where }: any = {}) => {
      return await RatingModel.find(convertWhereClause(where)).lean();
    },
    create: async ({ data }: { data: any }) => {
      const id = data.id || uuidv4();
      const doc = await RatingModel.create({ ...data, id });
      return doc.toJSON();
    },
    update: async ({ where, data }: { where: any; data: any }) => {
      const doc = await RatingModel.findOneAndUpdate(convertWhereClause(where), data, { new: true }).lean();
      return doc || null;
    },
    upsert: async ({ where, update, create }: any) => {
      let doc = await RatingModel.findOne(convertWhereClause(where));
      if (doc) {
        Object.assign(doc, update);
        await doc.save();
        return doc.toJSON();
      }
      const id = create.id || uuidv4();
      const created = await RatingModel.create({ ...create, id });
      return created.toJSON();
    },
    delete: async ({ where }: { where: any }) => {
      const doc = await RatingModel.findOneAndDelete(convertWhereClause(where)).lean();
      return doc || null;
    },
    count: async ({ where }: any = {}) => {
      return await RatingModel.countDocuments(convertWhereClause(where));
    },
  },

  save: {
    findUnique: async ({ where }: { where: any }) => {
      const doc = await SaveModel.findOne(convertWhereClause(where)).lean();
      return doc || null;
    },
    findFirst: async ({ where }: { where?: any } = {}) => {
      const doc = await SaveModel.findOne(convertWhereClause(where)).lean();
      return doc || null;
    },
    findMany: async ({ where, include, orderBy }: any = {}) => {
      let q = SaveModel.find(convertWhereClause(where));
      if (orderBy) q = q.sort(convertOrderBy(orderBy));
      const docs = await q.lean();
      if (!include) return docs;
      return await Promise.all(
        docs.map(async (s: any) => {
          if (include.literature) {
            const lit = await LiteratureModel.findOne({ id: s.literatureId }).lean();
            s.literature = lit ? await populateLiterature(lit, include.literature.include) : null;
          }
          return s;
        })
      );
    },
    create: async ({ data }: { data: any }) => {
      const id = data.id || uuidv4();
      const doc = await SaveModel.create({ ...data, id });
      return doc.toJSON();
    },
    delete: async ({ where }: { where: any }) => {
      const doc = await SaveModel.findOneAndDelete(convertWhereClause(where)).lean();
      return doc || null;
    },
    count: async ({ where }: any = {}) => {
      return await SaveModel.countDocuments(convertWhereClause(where));
    },
  },

  comment: {
    findUnique: async ({ where }: { where: any }) => {
      const doc = await CommentModel.findOne(convertWhereClause(where)).lean();
      return (doc as any) || null;
    },
    findFirst: async ({ where }: { where?: any } = {}) => {
      const doc = await CommentModel.findOne(convertWhereClause(where)).lean();
      return (doc as any) || null;
    },
    findMany: async ({ where, include, orderBy }: any = {}) => {
      let q = CommentModel.find(convertWhereClause(where));
      if (orderBy) q = q.sort(convertOrderBy(orderBy));
      const docs = await q.lean();
      if (!include) return docs;
      return await Promise.all(
        docs.map(async (c: any) => {
          if (include.user) {
            c.user = await UserModel.findOne({ id: c.userId }).lean();
          }
          if (include.replies) {
            c.replies = await CommentModel.find({ parentId: c.id }).lean();
          }
          return c;
        })
      );
    },
    create: async ({ data, include }: { data: any; include?: any }) => {
      const id = data.id || uuidv4();
      const doc = await CommentModel.create({ ...data, id });
      const plain = doc.toJSON();
      if (!include) return plain;
      if (include.user) {
        (plain as any).user = await UserModel.findOne({ id: plain.userId }).lean();
      }
      return plain;
    },
    delete: async ({ where }: { where: any }) => {
      const doc = await CommentModel.findOneAndDelete(convertWhereClause(where)).lean();
      if (doc) {
        await CommentModel.deleteMany({ parentId: doc.id });
      }
      return doc || null;
    },
    count: async ({ where }: any = {}) => {
      return await CommentModel.countDocuments(convertWhereClause(where));
    },
  },

  literatureVote: {
    findUnique: async ({ where }: { where: any }) => {
      const doc = await LiteratureVoteModel.findOne(convertWhereClause(where)).lean();
      return doc || null;
    },
    findFirst: async ({ where }: { where?: any } = {}) => {
      const doc = await LiteratureVoteModel.findOne(convertWhereClause(where)).lean();
      return doc || null;
    },
    findMany: async ({ where }: any = {}) => {
      return await LiteratureVoteModel.find(convertWhereClause(where)).lean();
    },
    create: async ({ data }: { data: any }) => {
      const id = data.id || uuidv4();
      const doc = await LiteratureVoteModel.create({ ...data, id });
      return doc.toJSON();
    },
    update: async ({ where, data }: { where: any; data: any }) => {
      const doc = await LiteratureVoteModel.findOneAndUpdate(convertWhereClause(where), data, { new: true }).lean();
      return doc || null;
    },
    upsert: async ({ where, update, create }: any) => {
      let doc = await LiteratureVoteModel.findOne(convertWhereClause(where));
      if (doc) {
        Object.assign(doc, update);
        await doc.save();
        return doc.toJSON();
      }
      const id = create.id || uuidv4();
      const created = await LiteratureVoteModel.create({ ...create, id });
      return created.toJSON();
    },
    delete: async ({ where }: { where: any }) => {
      const doc = await LiteratureVoteModel.findOneAndDelete(convertWhereClause(where)).lean();
      return doc || null;
    },
    count: async ({ where }: any = {}) => {
      return await LiteratureVoteModel.countDocuments(convertWhereClause(where));
    },
  },

  artCraft: {
    findUnique: async ({ where }: { where: any }) => {
      const doc = await ArtCraftModel.findOne(convertWhereClause(where)).lean();
      return doc || null;
    },
    findFirst: async ({ where }: { where?: any } = {}) => {
      const doc = await ArtCraftModel.findOne(convertWhereClause(where)).lean();
      return doc || null;
    },
    findMany: async ({ where, orderBy, take, skip }: any = {}) => {
      let q = ArtCraftModel.find(convertWhereClause(where));
      if (orderBy) q = q.sort(convertOrderBy(orderBy));
      if (skip) q = q.skip(skip);
      if (take) q = q.limit(take);
      return await q.lean();
    },
    create: async ({ data }: { data: any }) => {
      const id = data.id || uuidv4();
      const doc = await ArtCraftModel.create({ ...data, id });
      return doc.toJSON();
    },
    update: async ({ where, data }: { where: any; data: any }) => {
      const doc = await ArtCraftModel.findOneAndUpdate(convertWhereClause(where), data, { new: true }).lean();
      return doc || null;
    },
    delete: async ({ where }: { where: any }) => {
      const doc = await ArtCraftModel.findOneAndDelete(convertWhereClause(where)).lean();
      return doc || null;
    },
    count: async ({ where }: any = {}) => {
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
      const id = data.id || uuidv4();
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
