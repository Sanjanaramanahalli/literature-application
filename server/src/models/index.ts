import mongoose, { Schema, Document, Model } from 'mongoose';

// 1. User Model
export interface IUser extends Document {
  id: string;
  name: string;
  email: string;
  passwordHash?: string | null;
  role: string;
  googleId?: string | null;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: null },
    role: { type: String, default: 'READER', enum: ['READER', 'ADMIN'] },
    googleId: { type: String, default: null },
    avatarUrl: { type: String, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// 2. Creator (Author / Playwright) Model
export interface ICreator extends Document {
  id: string;
  name: string;
  bio?: string | null;
  roleType: string;
  createdAt: Date;
  updatedAt: Date;
}

const CreatorSchema = new Schema<ICreator>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    bio: { type: String, default: null },
    roleType: { type: String, default: 'AUTHOR', enum: ['AUTHOR', 'PLAYWRIGHT', 'BOTH'] },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// 3. Category Model
export interface ICategory extends Document {
  id: string;
  name: string;
  description?: string | null;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: null },
    slug: { type: String, required: true, unique: true, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// 4. Tag Model
export interface ITag extends Document {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema = new Schema<ITag>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, unique: true, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// 5. Literature Tag Linking Model
export interface ILiteratureTag extends Document {
  literatureId: string;
  tagId: string;
  createdAt: Date;
}

const LiteratureTagSchema = new Schema<ILiteratureTag>(
  {
    literatureId: { type: String, required: true, index: true },
    tagId: { type: String, required: true, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);
LiteratureTagSchema.index({ literatureId: 1, tagId: 1 }, { unique: true });

// 6. Literature Model
export interface ILiterature extends Document {
  id: string;
  title: string;
  subheading?: string | null;
  brief: string;
  content: string;
  language: string;
  subject?: string | null;
  genre?: string | null;
  coverImage?: string | null;
  publicationStatus: string;
  publicationDate?: Date | null;
  creatorId: string;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

const LiteratureSchema = new Schema<ILiterature>(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, index: true },
    subheading: { type: String, default: null },
    brief: { type: String, required: true },
    content: { type: String, required: true },
    language: { type: String, default: 'English', index: true },
    subject: { type: String, default: null, index: true },
    genre: { type: String, default: null, index: true },
    coverImage: { type: String, default: null },
    publicationStatus: { type: String, default: 'DRAFT', enum: ['DRAFT', 'PUBLISHED', 'UNPUBLISHED'], index: true },
    publicationDate: { type: Date, default: null, index: true },
    creatorId: { type: String, required: true, index: true },
    categoryId: { type: String, required: true, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);
LiteratureSchema.index({ publicationStatus: 1, publicationDate: -1 });

// 7. Rating Model
export interface IRating extends Document {
  id: string;
  value: number;
  userId: string;
  literatureId: string;
  createdAt: Date;
  updatedAt: Date;
}

const RatingSchema = new Schema<IRating>(
  {
    id: { type: String, required: true, unique: true, index: true },
    value: { type: Number, required: true, min: 1, max: 5 },
    userId: { type: String, required: true, index: true },
    literatureId: { type: String, required: true, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);
RatingSchema.index({ userId: 1, literatureId: 1 }, { unique: true });

// 8. Save (Personal Sanctuary Bookmark) Model
export interface ISave extends Document {
  id: string;
  userId: string;
  literatureId: string;
  createdAt: Date;
}

const SaveSchema = new Schema<ISave>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    literatureId: { type: String, required: true, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);
SaveSchema.index({ userId: 1, literatureId: 1 }, { unique: true });

// 9. Comment Model
export interface IComment extends Document {
  id: string;
  content: string;
  userId: string;
  literatureId: string;
  parentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    id: { type: String, required: true, unique: true, index: true },
    content: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    literatureId: { type: String, required: true, index: true },
    parentId: { type: String, default: null, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// 10. LiteratureVote Model (Like / Downvote)
export interface ILiteratureVote extends Document {
  id: string;
  type: string; // 'LIKE' or 'DOWNVOTE'
  userId: string;
  literatureId: string;
  createdAt: Date;
  updatedAt: Date;
}

const LiteratureVoteSchema = new Schema<ILiteratureVote>(
  {
    id: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true, enum: ['LIKE', 'DOWNVOTE'] },
    userId: { type: String, required: true, index: true },
    literatureId: { type: String, required: true, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);
LiteratureVoteSchema.index({ userId: 1, literatureId: 1 }, { unique: true });

// 11. ArtCraft Model
export interface IArtCraft extends Document {
  id: string;
  name: string;
  localName?: string | null;
  state: string;
  region?: string | null;
  district?: string | null;
  place: string;
  type: string;
  originPeriod: string;
  history: string;
  culturalSignificance: string;
  culturalBackground: string;
  materials: string;
  makingProcess: string;
  traditionalProducts: string;
  modernContext: string;
  coverImage?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const ArtCraftSchema = new Schema<IArtCraft>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    localName: { type: String, default: null },
    state: { type: String, required: true, index: true },
    region: { type: String, default: null },
    district: { type: String, default: null },
    place: { type: String, required: true },
    type: { type: String, required: true, index: true },
    originPeriod: { type: String, required: true },
    history: { type: String, required: true },
    culturalSignificance: { type: String, required: true },
    culturalBackground: { type: String, required: true },
    materials: { type: String, required: true },
    makingProcess: { type: String, required: true },
    traditionalProducts: { type: String, required: true },
    modernContext: { type: String, required: true },
    coverImage: { type: String, default: null },
    status: { type: String, default: 'PUBLISHED', enum: ['DRAFT', 'PUBLISHED'] },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// 12. ExternalSavedWork Model (Wikimedia Indian literature bookmarks)
export interface IExternalSavedWork extends Document {
  id: string;
  externalId: string;
  userId: string;
  title: string;
  originalTitle?: string | null;
  author?: string | null;
  language: string;
  languageCode: string;
  excerpt?: string | null;
  thumbnailUrl?: string | null;
  sourceUrl: string;
  canonicalUrl?: string | null;
  isFullTextAvailable: boolean;
  fullTextSource?: string | null;
  fullTextUrl?: string | null;
  createdAt: Date;
}

const ExternalSavedWorkSchema = new Schema<IExternalSavedWork>(
  {
    id: { type: String, required: true, unique: true, index: true },
    externalId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    originalTitle: { type: String, default: null },
    author: { type: String, default: null },
    language: { type: String, required: true },
    languageCode: { type: String, required: true },
    excerpt: { type: String, default: null },
    thumbnailUrl: { type: String, default: null },
    sourceUrl: { type: String, required: true },
    canonicalUrl: { type: String, default: null },
    isFullTextAvailable: { type: Boolean, default: false },
    fullTextSource: { type: String, default: null },
    fullTextUrl: { type: String, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);
ExternalSavedWorkSchema.index({ userId: 1, externalId: 1 }, { unique: true });

// Exports
export const UserModel: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const CreatorModel: Model<ICreator> = mongoose.models.Creator || mongoose.model<ICreator>('Creator', CreatorSchema);
export const CategoryModel: Model<ICategory> = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
export const TagModel: Model<ITag> = mongoose.models.Tag || mongoose.model<ITag>('Tag', TagSchema);
export const LiteratureTagModel: Model<ILiteratureTag> = mongoose.models.LiteratureTag || mongoose.model<ILiteratureTag>('LiteratureTag', LiteratureTagSchema);
export const LiteratureModel: Model<ILiterature> = mongoose.models.Literature || mongoose.model<ILiterature>('Literature', LiteratureSchema);
export const RatingModel: Model<IRating> = mongoose.models.Rating || mongoose.model<IRating>('Rating', RatingSchema);
export const SaveModel: Model<ISave> = mongoose.models.Save || mongoose.model<ISave>('Save', SaveSchema);
export const CommentModel: Model<IComment> = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);
export const LiteratureVoteModel: Model<ILiteratureVote> = mongoose.models.LiteratureVote || mongoose.model<ILiteratureVote>('LiteratureVote', LiteratureVoteSchema);
export const ArtCraftModel: Model<IArtCraft> = mongoose.models.ArtCraft || mongoose.model<IArtCraft>('ArtCraft', ArtCraftSchema);
export const ExternalSavedWorkModel: Model<IExternalSavedWork> = mongoose.models.ExternalSavedWork || mongoose.model<IExternalSavedWork>('ExternalSavedWork', ExternalSavedWorkSchema);
