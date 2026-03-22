import { asyncHandler, ok } from "../lib/http";
import { createCharity, deleteCharity, getCharityBySlug, listCharities, updateCharity } from "../services/charity.service";
import type { CharityInput, CharityListQuery, CharitySlugParam } from "../validators/charity.validator";
import type { IdParam } from "../validators/common.validator";
import { getAuthContext } from "../middlewares";

export const listCharitiesController = asyncHandler("charity.listCharitiesController", async (req, res) => {
  const query = req.query as CharityListQuery;
  ok(res, await listCharities(query.search));
});

export const charityDetailController = asyncHandler("charity.charityDetailController", async (req, res) => {
  const params = req.params as CharitySlugParam;
  ok(res, await getCharityBySlug(params.slug));
});

export const createCharityController = asyncHandler("charity.createCharityController", async (req, res) => {
  const { user } = getAuthContext(req);
  ok(res, await createCharity(req.body as CharityInput, user._id.toString()), 201);
});

export const updateCharityController = asyncHandler("charity.updateCharityController", async (req, res) => {
  const { user } = getAuthContext(req);
  const params = req.params as IdParam;
  ok(res, await updateCharity(params.id, req.body as CharityInput, user._id.toString()));
});

export const deleteCharityController = asyncHandler("charity.deleteCharityController", async (req, res) => {
  const { user } = getAuthContext(req);
  const params = req.params as IdParam;
  ok(res, await deleteCharity(params.id, user._id.toString()));
});
