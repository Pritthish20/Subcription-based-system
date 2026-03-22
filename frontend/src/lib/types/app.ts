export type Charity = {
  _id: string;
  name: string;
  slug: string;
  category: string;
  featured: boolean;
  imageUrl: string;
  description: string;
  events: Array<{ title: string; startsAt: string; location: string }>;
};

export type Plan = {
  _id: string;
  name: string;
  interval: string;
  amountInr: number;
};

export type SessionUser = {
  _id?: string;
  fullName?: string;
  role?: string;
  email?: string;
};
